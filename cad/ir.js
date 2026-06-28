// cad/ir.js
// JSON intermediate representation → OpenSCAD. The LLM emits a structured IR (a tree of
// parametric primitives + ops) and this transpiler produces MANIFOLD-BY-CONSTRUCTION SCAD:
// it owns the error-prone rules the LLM used to get wrong — epsilon-extended difference
// cutters, Z≥0 normalization, a single called main module, and customizer sliders from the
// declared params (so a freeform part is parametric, like a template).
//
// Pure: no DOM, no engine. Tested headlessly in test/ir.test.mjs (compiles to watertight STL).
//
// Schema (v1):
//   { name, units:"mm", params:[{key,label,min,max,value,step?}], root:<node> }
//   or, escape hatch: { name, units, params, raw:"<openscad program body>" }
// Every numeric field is a number OR a string expression over param keys (e.g. "dia - 2*wall"),
// passed verbatim to OpenSCAD so sliders stay live.

export const IR_VERSION = 1;

export class IRError extends Error {
  constructor(errors) {
    super('IR invalid: ' + (errors || []).map((e) => (e.code || '') + ' ' + (e.msg || '')).join('; '));
    this.code = 'ir-invalid';
    this.errors = errors || [];
  }
}

// ---- node taxonomy ----
const PRIM_3D = new Set(['box', 'cylinder', 'sphere', 'regular_prism', 'linear_extrude', 'rotate_extrude', 'text']);
const PRIM_2D = new Set(['square', 'circle', 'polygon']);
const OPS = new Set(['union', 'difference', 'intersection', 'translate', 'rotate', 'mirror', 'scale', 'hull', 'pattern']);
const REQUIRED = {
  box: ['size'], cylinder: ['h'], sphere: [], regular_prism: ['sides', 'h'],
  linear_extrude: ['height', 'child'], rotate_extrude: ['child'], text: ['text'],
  square: ['size'], circle: [], polygon: ['points'],
  translate: ['v', 'child'], rotate: ['a', 'child'], mirror: ['v', 'child'], scale: ['v', 'child'],
  pattern: ['kind', 'count', 'child'],
};

// ---- number formatting (kept independent of scad-gen so this module stands alone) ----
const num = (x) => { const v = Number(x); if (!isFinite(v)) return '0'; return Number.isInteger(v) ? String(v) : (Math.round(v * 1e4) / 1e4).toString(); };
// emit a value: number → formatted; string expression → wrapped in parens (precedence-safe).
const S = (x) => (typeof x === 'number' ? num(x) : '(' + String(x) + ')');
// emit a value that may be a vector (e.g. linear_extrude scale=[2,1]) as a SCAD vector.
const vec = (x) => (Array.isArray(x) ? '[' + x.map(S).join(', ') + ']' : S(x));
const clampVal = (p) => Math.max(Number(p.min), Math.min(Number(p.max), Number(p.value)));

// ======================= safe expression evaluator (no eval/Function) =======================
// Recursive descent over + - * / ( ), unary ±, identifiers (param keys), and a whitelist of
// functions. sin/cos/tan are in DEGREES to match OpenSCAD. Used only for the numeric Z-lift bbox.
const FUNCS = {
  max: Math.max, min: Math.min, abs: Math.abs, sqrt: Math.sqrt, pow: Math.pow,
  floor: Math.floor, ceil: Math.ceil, round: Math.round,
  sin: (d) => Math.sin(d * Math.PI / 180), cos: (d) => Math.cos(d * Math.PI / 180), tan: (d) => Math.tan(d * Math.PI / 180),
};
export function evalExpr(expr, env) {
  if (typeof expr === 'number') return expr;
  const s = String(expr); let i = 0;
  const err = (m) => new IRError([{ code: 'EXPR', msg: m + ' in "' + s + '"' }]);
  const ws = () => { while (i < s.length && /\s/.test(s[i])) i++; };
  function parseExpr() { return parseAdd(); }
  function parseAdd() { let v = parseMul(); for (;;) { ws(); const c = s[i]; if (c === '+') { i++; v += parseMul(); } else if (c === '-') { i++; v -= parseMul(); } else break; } return v; }
  function parseMul() { let v = parseUnary(); for (;;) { ws(); const c = s[i]; if (c === '*') { i++; v *= parseUnary(); } else if (c === '/') { i++; v /= parseUnary(); } else if (c === '%') { i++; v %= parseUnary(); } else break; } return v; }
  function parseUnary() { ws(); if (s[i] === '-') { i++; return -parseUnary(); } if (s[i] === '+') { i++; return parseUnary(); } return parsePrimary(); }
  function parsePrimary() {
    ws();
    if (s[i] === '(') { i++; const v = parseExpr(); ws(); if (s[i] !== ')') throw err('unbalanced parens'); i++; return v; }
    const n = /^[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?/.exec(s.slice(i));
    if (n) { i += n[0].length; return parseFloat(n[0]); }
    const id = /^[A-Za-z_$][\w$]*/.exec(s.slice(i));
    if (id) {
      i += id[0].length; const name = id[0]; ws();
      if (s[i] === '(') {
        i++; const args = []; ws();
        if (s[i] !== ')') { args.push(parseExpr()); ws(); while (s[i] === ',') { i++; args.push(parseExpr()); ws(); } }
        if (s[i] !== ')') throw err('unbalanced fn parens'); i++;
        const fn = FUNCS[name]; if (!fn) throw err('unknown function ' + name);
        return fn(...args);
      }
      if (name === 'PI') return Math.PI;
      if (name === 'eps') return 0.01;
      if (Object.prototype.hasOwnProperty.call(env, name)) return Number(env[name]);
      throw err('undeclared identifier ' + name);
    }
    throw err('unexpected token');
  }
  const v = parseExpr(); ws();
  if (i < s.length) throw err('trailing token');
  return v;
}

// identifiers referenced by an expression (for validation)
function identsIn(expr) {
  if (typeof expr !== 'string') return [];
  const out = [];
  const re = /[A-Za-z_$][\w$]*/g; let m;
  while ((m = re.exec(expr))) { const tok = expr.slice(m.index + m[0].length).match(/^\s*\(/); if (!tok) out.push(m[0]); }  // skip function names (followed by "(")
  return out;
}

// ======================= validation (schema-shape, not geometry) =======================
export function irValidate(ir) {
  const errors = [];
  if (!ir || typeof ir !== 'object') return { ok: false, errors: [{ code: 'NO_ROOT', msg: 'IR is not an object' }] };
  const keys = new Set();
  for (const p of (ir.params || [])) {
    if (!p || !p.key) { errors.push({ code: 'BAD_PARAM', msg: 'param missing key' }); continue; }
    keys.add(p.key);
    if (!(Number(p.min) < Number(p.max))) errors.push({ code: 'BAD_PARAM', msg: `param ${p.key}: min must be < max` });
  }
  const allowedIdent = (id) => keys.has(id) || id === 'PI' || id === 'eps' || id in FUNCS;
  const checkExpr = (val, path) => { for (const id of identsIn(val)) if (!allowedIdent(id)) errors.push({ code: 'UNDECLARED_IDENT', msg: `${path}: "${id}" is not a declared param` }); };

  if (ir.raw != null) {
    if (typeof ir.raw !== 'string') errors.push({ code: 'RAW_NOT_STRING', msg: 'raw must be a string' });
    return { ok: errors.length === 0, errors };
  }
  if (!ir.root) errors.push({ code: 'NO_ROOT', msg: 'IR has neither root nor raw' });

  const walk = (node, want, path) => {
    if (!node || typeof node !== 'object') { errors.push({ code: 'MISSING_FIELD', msg: `${path}: empty node` }); return; }
    if (node.type === 'raw') { if (typeof node.scad !== 'string') errors.push({ code: 'RAW_NOT_STRING', msg: `${path}: raw node needs scad string` }); return; }
    const t = node.type;
    const isP2 = PRIM_2D.has(t), isP3 = PRIM_3D.has(t), isOp = OPS.has(t);   // ops (transforms/booleans) are dimension-neutral
    if (!isP2 && !isP3 && !isOp) { errors.push({ code: 'UNKNOWN_TYPE', msg: `${path}: unknown type "${t}"` }); return; }
    if (want === '3d' && isP2) errors.push({ code: '2D_IN_3D', msg: `${path}: ${t} is 2D — wrap it in a linear_extrude/rotate_extrude` });
    if (want === '2d' && isP3) errors.push({ code: '3D_IN_2D', msg: `${path}: ${t} is 3D but a 2D shape is required here` });
    for (const f of (REQUIRED[t] || [])) if (node[f] == null) errors.push({ code: 'MISSING_FIELD', msg: `${path}: ${t} requires "${f}"` });
    // "one-of" + arity checks: catch a primitive missing its diameter/size as a SCHEMA fault (fast
    // repair, no compile) instead of emitting invalid `(undefined)` SCAD.
    const has = (k) => node[k] != null;
    if (t === 'cylinder' && !has('d') && !(has('d1') && has('d2'))) errors.push({ code: 'MISSING_FIELD', msg: `${path}: cylinder needs "d" or ("d1" and "d2")` });
    if ((t === 'regular_prism' || t === 'sphere' || t === 'circle') && !has('d') && !has('r')) errors.push({ code: 'MISSING_FIELD', msg: `${path}: ${t} needs "d" or "r"` });
    if (t === 'pattern' && node.kind === 'polar' && !has('radius')) errors.push({ code: 'MISSING_FIELD', msg: `${path}: polar pattern needs "radius"` });
    if (t === 'pattern' && node.kind === 'linear' && !has('spacing')) errors.push({ code: 'MISSING_FIELD', msg: `${path}: linear pattern needs "spacing"` });
    if (t === 'box' && (!Array.isArray(node.size) || node.size.length !== 3)) errors.push({ code: 'MISSING_FIELD', msg: `${path}: box "size" must be [w,d,h]` });
    if (t === 'square' && (!Array.isArray(node.size) || node.size.length !== 2)) errors.push({ code: 'MISSING_FIELD', msg: `${path}: square "size" must be [w,h]` });
    // numeric-ish fields → expression identifier check
    for (const f of ['h', 'height', 'd', 'd1', 'd2', 'r', 'sides', 'angle', 'twist', 'scale', 'count', 'radius', 'round', 'size', 'v', 'a', 'spacing']) {
      const val = node[f]; if (val == null) continue;
      if (Array.isArray(val)) val.forEach((x) => checkExpr(x, `${path}.${f}`)); else checkExpr(val, `${path}.${f}`);
    }
    // recurse
    if (t === 'union' || t === 'intersection' || t === 'hull') {
      if (!Array.isArray(node.children) || node.children.length < 1) errors.push({ code: 'EMPTY_BOOLEAN', msg: `${path}: ${t} needs children` });
      else node.children.forEach((c, k) => walk(c, want, `${path}.${t}[${k}]`));   // booleans inherit the context dimension
    } else if (t === 'difference') {
      if (!Array.isArray(node.children) || node.children.length < 1) errors.push({ code: 'EMPTY_BOOLEAN', msg: `${path}: difference needs children` });
      else node.children.forEach((c, k) => walk(c, want, `${path}.difference[${k}]`));
    } else if (t === 'translate' || t === 'rotate' || t === 'mirror' || t === 'scale') {
      walk(node.child, want, `${path}.${t}`);   // transforms are dimension-neutral
    } else if (t === 'pattern') {
      if (node.kind !== 'linear' && node.kind !== 'polar') errors.push({ code: 'MISSING_FIELD', msg: `${path}: pattern.kind must be "linear" or "polar"` });
      walk(node.child, want, `${path}.pattern`);
    } else if (t === 'linear_extrude' || t === 'rotate_extrude') {
      walk(node.child, '2d', `${path}.${t}`);
    }
  };
  if (ir.root) walk(ir.root, '3d', 'root');
  return { ok: errors.length === 0, errors };
}

// ======================= emit =======================
function emit(node, ctx) {
  ctx = ctx || { inDiff: false };
  const t = node.type;
  const cut = ctx.inDiff;                         // this node is a difference cutter → eps-extend primitives
  const zlift = cut ? 'translate([0, 0, -eps]) ' : '';
  const ext = cut ? ' + 2*eps' : '';
  switch (t) {
    case 'box': {
      const [w, d, h] = node.size; const r = node.round;
      const sq = (Number(r) > 0 || typeof r === 'string')
        ? `offset(r=${S(r)}) square([${S(w)} - 2*${S(r)}, ${S(d)} - 2*${S(r)}], center=true)`
        : `square([${S(w)}, ${S(d)}], center=true)`;
      return `${zlift}linear_extrude(${S(h)}${ext}) ${sq}`;
    }
    case 'cylinder': {
      const dp = node.d != null ? `d=${S(node.d)}` : `d1=${S(node.d1)}, d2=${S(node.d2)}`;
      return `${zlift}cylinder(h=${S(node.h)}${ext}, ${dp})`;
    }
    case 'regular_prism':
      return `${zlift}cylinder(h=${S(node.h)}${ext}, ${node.d != null ? 'd=' + S(node.d) : 'r=' + S(node.r)}, $fn=${S(node.sides)})`;
    case 'sphere': {
      const args = node.d != null ? 'd=' + S(node.d) : 'r=' + S(node.r);
      if (cut) return `sphere(${args})`;                                   // cutter: stays where placed (centered)
      const r = node.d != null ? '(' + S(node.d) + ')/2' : S(node.r);
      return `translate([0, 0, ${r}]) sphere(${args})`;                    // rest on Z=0 via the radius EXPRESSION (param-correct under sliders)
    }
    case 'linear_extrude': {
      const o = [`height=${S(node.height)}${ext}`];                         // ext when used as a difference cutter
      if (node.twist != null) o.push(`twist=${S(node.twist)}`);
      if (node.scale != null) o.push(`scale=${vec(node.scale)}`);          // scale may be a 2-vector
      if (node.slices != null) o.push(`slices=${S(node.slices)}`);
      return `${zlift}linear_extrude(${o.join(', ')}) ${emit(node.child, { inDiff: false })}`;
    }
    case 'rotate_extrude':
      return `${zlift}rotate_extrude(${node.angle != null ? 'angle=' + S(node.angle) : ''}) ${emit(node.child, { inDiff: false })}`;
    case 'text': {
      const p = [JSON.stringify(String(node.text || ''))];
      if (node.size != null) p.push(`size=${S(node.size)}`);
      if (node.font) p.push(`font=${JSON.stringify(String(node.font))}`);
      if (node.halign) p.push(`halign=${JSON.stringify(String(node.halign))}`);
      if (node.valign) p.push(`valign=${JSON.stringify(String(node.valign))}`);
      return `${zlift}linear_extrude(${S(node.height != null ? node.height : 2)}${ext}) text(${p.join(', ')})`;
    }
    // 2D
    case 'square': {
      const r = node.round;
      return (Number(r) > 0 || typeof r === 'string')
        ? `offset(r=${S(r)}) square([${S(node.size[0])} - 2*${S(r)}, ${S(node.size[1])} - 2*${S(r)}], center=true)`
        : `square([${S(node.size[0])}, ${S(node.size[1])}], center=${node.center === false ? 'false' : 'true'})`;
    }
    case 'circle':
      return `circle(${node.d != null ? 'd=' + S(node.d) : 'r=' + S(node.r)})`;
    case 'polygon':
      return `polygon(points=${JSON.stringify(node.points)}${node.paths ? ', paths=' + JSON.stringify(node.paths) : ''})`;
    // ops
    case 'union': return `union() {\n${emitKids(node.children, ctx)}\n}`;
    case 'intersection': return `intersection() {\n${emitKids(node.children, ctx)}\n}`;
    case 'difference': {
      const head = emit(node.children[0], { inDiff: false });
      const cutters = node.children.slice(1).map((c) => '  ' + emit(c, { inDiff: true }) + ';').join('\n');
      return `difference() {\n  ${head};\n${cutters}\n}`;
    }
    case 'translate': return `translate([${S(node.v[0])}, ${S(node.v[1])}, ${S(node.v[2])}]) ${emit(node.child, ctx)}`;
    case 'rotate': return `rotate([${S(node.a[0])}, ${S(node.a[1])}, ${S(node.a[2])}]) ${emit(node.child, ctx)}`;
    case 'mirror': return `mirror([${S(node.v[0])}, ${S(node.v[1])}, ${S(node.v[2])}]) ${emit(node.child, ctx)}`;
    case 'scale': return `scale([${S(node.v[0])}, ${S(node.v[1])}, ${S(node.v[2])}]) ${emit(node.child, ctx)}`;
    case 'hull': return `hull() {\n${emitKids(node.children, ctx)}\n}`;
    case 'pattern': {
      if (node.kind === 'polar')
        return `for (i = [0 : ${S(node.count)} - 1]) rotate([0, 0, i*360/${S(node.count)}]) translate([${S(node.radius)}, 0, 0]) ${emit(node.child, ctx)}`;
      const sp = node.spacing || [0, 0, 0];
      return `for (i = [0 : ${S(node.count)} - 1]) translate([i*${S(sp[0])}, i*${S(sp[1])}, i*${S(sp[2])}]) ${emit(node.child, ctx)}`;
    }
    case 'raw': return String(node.scad || '');
    default: return '';
  }
}
function emitKids(kids, ctx) { return (kids || []).map((c) => '  ' + emit(c, ctx) + ';').join('\n'); }

// ======================= numeric bbox (for the Z-lift) =======================
const M = {
  I: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0],
  mul(a, b) { const r = new Array(12); for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 3; k++) s += a[i * 4 + k] * b[k * 4 + j]; if (j === 3) s += a[i * 4 + 3]; r[i * 4 + j] = s; } return r; },
  translate(x, y, z) { return [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z]; },
  scale(x, y, z) { return [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0]; },
  rotX(d) { const r = d * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return [1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0]; },
  rotY(d) { const r = d * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0]; },
  rotZ(d) { const r = d * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return [c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0]; },
  apply(m, p) { return [m[0] * p[0] + m[1] * p[1] + m[2] * p[2] + m[3], m[4] * p[0] + m[5] * p[1] + m[6] * p[2] + m[7], m[8] * p[0] + m[9] * p[1] + m[10] * p[2] + m[11]]; },
};
const unionBoxes = (boxes) => { const bs = boxes.filter(Boolean); if (!bs.length) return null; const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity]; for (const b of bs) for (let k = 0; k < 3; k++) { if (b.min[k] < mn[k]) mn[k] = b.min[k]; if (b.max[k] > mx[k]) mx[k] = b.max[k]; } return { min: mn, max: mx }; };
function transformBox(local, m) {
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (let xi = 0; xi < 2; xi++) for (let yi = 0; yi < 2; yi++) for (let zi = 0; zi < 2; zi++) {
    const p = M.apply(m, [local[xi][0], local[yi][1], local[zi][2]]);
    for (let k = 0; k < 3; k++) { if (p[k] < mn[k]) mn[k] = p[k]; if (p[k] > mx[k]) mx[k] = p[k]; }
  }
  return { min: mn, max: mx };
}
function localAABB2d(node, env) {
  const ev = (x) => evalExpr(x, env);
  switch (node.type) {
    case 'square': { const w = ev(node.size[0]), h = ev(node.size[1]); return node.center === false ? [[0, 0], [w, h]] : [[-w / 2, -h / 2], [w / 2, h / 2]]; }
    case 'circle': { const r = node.d != null ? ev(node.d) / 2 : ev(node.r); return [[-r, -r], [r, r]]; }
    case 'polygon': { const xs = node.points.map((p) => p[0]), ys = node.points.map((p) => p[1]); return [[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]]; }
    default: return null;
  }
}
function bboxNode(node, env, m) {
  if (!node || typeof node !== 'object') return null;
  const ev = (x) => evalExpr(x, env); const t = node.type;
  if (t === 'union' || t === 'hull' || t === 'intersection') return unionBoxes((node.children || []).map((c) => bboxNode(c, env, m)));
  if (t === 'difference') return bboxNode(node.children[0], env, m);
  if (t === 'translate') return bboxNode(node.child, env, M.mul(m, M.translate(ev(node.v[0]), ev(node.v[1]), ev(node.v[2]))));
  if (t === 'scale') return bboxNode(node.child, env, M.mul(m, M.scale(ev(node.v[0]), ev(node.v[1]), ev(node.v[2]))));
  if (t === 'rotate') { const rm = M.mul(M.mul(M.rotZ(ev(node.a[2])), M.rotY(ev(node.a[1]))), M.rotX(ev(node.a[0]))); return bboxNode(node.child, env, M.mul(m, rm)); }
  if (t === 'mirror') { const v = node.v.map(ev); const ax = Math.abs(v[0]) >= Math.abs(v[1]) && Math.abs(v[0]) >= Math.abs(v[2]) ? 0 : (Math.abs(v[1]) >= Math.abs(v[2]) ? 1 : 2); const sc = [1, 1, 1]; sc[ax] = -1; return bboxNode(node.child, env, M.mul(m, M.scale(sc[0], sc[1], sc[2]))); }
  if (t === 'pattern') { const n = Math.max(0, Math.round(ev(node.count))); const out = []; for (let i = 0; i < n; i++) { let mm; if (node.kind === 'polar') mm = M.mul(M.mul(m, M.rotZ(i * 360 / Math.max(1, ev(node.count)))), M.translate(ev(node.radius), 0, 0)); else { const sp = node.spacing || [0, 0, 0]; mm = M.mul(m, M.translate(i * ev(sp[0]), i * ev(sp[1]), i * ev(sp[2]))); } out.push(bboxNode(node.child, env, mm)); } return unionBoxes(out); }
  if (t === 'raw') return null;
  // leaf primitives
  let local = null;
  if (t === 'box') { const w = ev(node.size[0]), d = ev(node.size[1]), h = ev(node.size[2]); local = [[-w / 2, -d / 2, 0], [w / 2, d / 2, h]]; }
  else if (t === 'cylinder' || t === 'regular_prism') { const h = ev(node.h); const r = node.d != null ? ev(node.d) / 2 : (node.d1 != null ? Math.max(ev(node.d1), ev(node.d2)) / 2 : ev(node.r)); local = [[-r, -r, 0], [r, r, h]]; }
  else if (t === 'sphere') { const r = node.d != null ? ev(node.d) / 2 : ev(node.r); local = [[-r, -r, 0], [r, r, 2 * r]]; }   // emitted resting on Z=0
  else if (t === 'linear_extrude') { const a = localAABB2d(node.child, env); if (!a) return null; const h = ev(node.height); local = [[a[0][0], a[0][1], 0], [a[1][0], a[1][1], h]]; }
  else if (t === 'rotate_extrude') { const a = localAABB2d(node.child, env); if (!a) return null; const R = Math.max(Math.abs(a[0][0]), Math.abs(a[1][0])); local = [[-R, -R, a[0][1]], [R, R, a[1][1]]]; }
  else if (t === 'text') { const h = ev(node.height != null ? node.height : 2), sz = ev(node.size != null ? node.size : 10); const w = sz * Math.max(1, String(node.text || '').length) * 0.7; local = [[-w / 2, -sz / 2, 0], [w / 2, sz / 2, h]]; }
  if (!local) return null;
  return transformBox(local, m);
}
export function irBBox(ir) {
  if (!ir || ir.raw != null || !ir.root) return null;
  const env = {}; for (const p of (ir.params || [])) env[p.key] = clampVal(p);
  return bboxNode(ir.root, env, M.I);
}

// ======================= public: header, params, transpile, delta =======================
function header(ir) {
  const lines = [`// ${ir.name || 'Custom model'} — Moldable (JSON-IR → OpenSCAD, MakerWorld-customizable)`, '', '/* [Adjust your model] */'];
  for (const p of (ir.params || [])) {
    const min = Number(p.min), max = Number(p.max), val = clampVal(p);
    const step = p.step != null ? Number(p.step) : (Number.isInteger(min) && Number.isInteger(max) ? 1 : 0.1);
    const range = (step && step !== 1) ? `[${num(min)}:${num(step)}:${num(max)}]` : `[${num(min)}:${num(max)}]`;
    lines.push(`// ${p.label || p.key}`);
    lines.push(`${p.key} = ${num(val)}; // ${range}`);
  }
  lines.push('', '/* [Hidden] */', '$fn = 64;', 'eps = 0.01;');
  return lines.join('\n');
}

// irParams(ir) -> slider descriptors (same shape _parseScadParams returns in the app).
export function irParams(ir) {
  return (ir && ir.params || []).map((p) => {
    const min = Number(p.min), max = Number(p.max);
    return { key: p.key, label: p.label || String(p.key).replace(/_/g, ' '), min, max, step: p.step != null ? Number(p.step) : (Number.isInteger(min) && Number.isInteger(max) ? 1 : 0.1), value: clampVal(p) };
  });
}

// irToScad(ir) -> complete .scad program. Throws IRError on schema faults.
export function irToScad(ir) {
  const v = irValidate(ir);
  if (!v.ok) throw new IRError(v.errors);
  const head = header(ir);
  if (ir.raw != null) return head + '\n' + String(ir.raw) + '\n';
  const body = emit(ir.root, { inDiff: false });
  let lift = '';
  try { const bb = irBBox(ir); if (bb && bb.min[2] < -1e-4) lift = `translate([0, 0, ${num(-bb.min[2])}]) `; } catch { /* lift is best-effort; validate's below-Z gate + repair backstop */ }
  return `${head}\nmodule part() {\n  ${body};\n}\n${lift}part();\n`;
}

// applyIRDelta(ir, delta) -> new IR (refinement; pure). Supports param value changes, rename,
// root replacement, and adding a cutter/part to the root.
export function applyIRDelta(ir, delta) {
  if (!delta) return ir;
  const out = { name: ir.name, units: ir.units, params: (ir.params || []).map((p) => ({ ...p })), root: ir.root, raw: ir.raw };
  if (delta.params) for (const p of out.params) if (delta.params[p.key] != null) p.value = Math.max(Number(p.min), Math.min(Number(p.max), Number(delta.params[p.key])));
  if (Array.isArray(delta.addParams)) out.params = [...out.params, ...delta.addParams];
  if (delta.name) out.name = delta.name;
  if (delta.root) out.root = delta.root;
  if (delta.raw != null) { out.raw = delta.raw; out.root = undefined; }
  if (delta.addCutter && out.root) out.root = out.root.type === 'difference' ? { ...out.root, children: [...out.root.children, delta.addCutter] } : { type: 'difference', children: [out.root, delta.addCutter] };
  if (delta.addPart && out.root) out.root = out.root.type === 'union' ? { ...out.root, children: [...out.root.children, delta.addPart] } : { type: 'union', children: [out.root, delta.addPart] };
  return out;
}
