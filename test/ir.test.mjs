// test/ir.test.mjs
// Verify the JSON-IR → OpenSCAD transpiler: a battery of IRs must compile to watertight,
// manifold STL (reusing the vendored OpenSCAD WASM), plus epsilon through-holes, Z-lift,
// param extraction, the raw escape, refinement deltas, and irValidate negatives.
//   node test/ir.test.mjs
import OpenSCAD from '../cad/openscad.js';
import { readFileSync } from 'node:fs';
import { irToScad, irParams, irValidate, applyIRDelta, irBBox, evalExpr } from '../cad/ir.js';
import { inspectStl, validate } from '../cad/validate.js';

const wasmBinary = readFileSync(new URL('../cad/openscad.wasm', import.meta.url));
async function compile(source) {
  const errs = [];
  const inst = await OpenSCAD({ noInitialRun: true, wasmBinary, printErr: (s) => errs.push(s) });
  inst.FS.writeFile('/in.scad', source);
  let rc, threw = null;
  try { rc = inst.callMain(['/in.scad', '--backend=manifold', '--export-format=binstl', '-o', '/out.stl']); }
  catch (e) { threw = e.message || String(e); }
  let data = null; try { data = inst.FS.readFile('/out.stl'); } catch {}
  return { rc, threw, data, log: errs.join('\n') };
}

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { if (cond) { pass++; console.log('PASS', name, extra); } else { fail++; console.log('FAIL', name, extra); } };

// ---- fixtures: each must transpile + compile to a clean watertight manifold solid ----
const FIXTURES = {
  cup: { name: 'Cup', units: 'mm',
    params: [{ key: 'dia', min: 40, max: 120, value: 74, step: 1 }, { key: 'height', min: 50, max: 180, value: 100, step: 1 }, { key: 'wall', min: 1.6, max: 5, value: 2.4, step: 0.2 }, { key: 'vents', min: 0, max: 16, value: 8, step: 1 }],
    root: { type: 'difference', children: [
      { type: 'cylinder', d: 'dia', h: 'height' },
      { type: 'translate', v: [0, 0, 'wall'], child: { type: 'cylinder', d: 'dia - 2*wall', h: 'height' } },
      { type: 'pattern', kind: 'polar', count: 'vents', radius: '(dia - wall)/2', child: { type: 'translate', v: [0, 0, 'height*0.5'], child: { type: 'cylinder', d: 5, h: 'height' } } },
    ] } },
  rounded_box: { name: 'Rounded box', units: 'mm', params: [{ key: 'w', min: 20, max: 120, value: 60, step: 1 }],
    root: { type: 'box', size: ['w', 'w*0.7', 'w*0.4'], round: 5 } },
  box_hole: { name: 'Box hole (eps)', units: 'mm', params: [{ key: 's', min: 20, max: 60, value: 30, step: 1 }],
    // cutter h EXACTLY equals box height — only the auto eps-extension keeps it a clean through-hole
    root: { type: 'difference', children: [{ type: 'box', size: ['s', 's', 's'] }, { type: 'cylinder', d: 's*0.5', h: 's' }] } },
  pegs: { name: 'Pegs', units: 'mm', params: [{ key: 'n', min: 1, max: 6, value: 4, step: 1 }],
    root: { type: 'union', children: [
      { type: 'box', size: [80, 20, 4] },
      { type: 'translate', v: [-30, 0, 0], child: { type: 'pattern', kind: 'linear', count: 'n', spacing: [20, 0, 0], child: { type: 'cylinder', d: 8, h: 16 } } },
    ] } },
  revolve: { name: 'Revolve', units: 'mm', params: [{ key: 'r', min: 10, max: 50, value: 24, step: 1 }],
    root: { type: 'rotate_extrude', angle: 360, child: { type: 'polygon', points: [[8, 0], [14, 0], [11, 30], [9, 30]] } } },
  prism: { name: 'Hex prism', units: 'mm', params: [{ key: 'd', min: 16, max: 60, value: 30, step: 1 }],
    root: { type: 'difference', children: [{ type: 'regular_prism', sides: 6, d: 'd', h: 12 }, { type: 'cylinder', d: 'd*0.4', h: 12 }] } },
  capsule: { name: 'Capsule', units: 'mm', params: [{ key: 'len', min: 20, max: 80, value: 50, step: 1 }],
    root: { type: 'hull', children: [{ type: 'cylinder', d: 16, h: 8 }, { type: 'translate', v: ['len', 0, 0], child: { type: 'cylinder', d: 16, h: 8 } }] } },
  // an EXTRUDED cutter flush with the solid's top — must be eps-extended or it leaves a coplanar (non-manifold) face
  extrude_cut: { name: 'Extruded slot', units: 'mm', params: [{ key: 's', min: 20, max: 60, value: 40, step: 1 }],
    root: { type: 'difference', children: [{ type: 'box', size: ['s', 's', 's'] }, { type: 'linear_extrude', height: 's', child: { type: 'circle', d: 's*0.4' } }] } },
};

for (const [key, ir] of Object.entries(FIXTURES)) {
  const v = irValidate(ir);
  if (!v.ok) { fail++; console.log('FAIL', 'validate ' + key, JSON.stringify(v.errors)); continue; }
  let src, res, info;
  try { src = irToScad(ir); } catch (e) { fail++; console.log('FAIL', 'transpile ' + key, e.message); continue; }
  res = await compile(src);
  info = res.data ? inspectStl(res.data) : { ok: false, reason: 'no STL' };
  const clean = info.ok && info.openEdges <= 2 && info.nonManifoldEdges === 0 && info.signedVolume > 0 && info.min[2] >= -0.05;
  ok('compile watertight: ' + key, clean, info.ok ? `tris=${info.tris} open=${info.openEdges} nm=${info.nonManifoldEdges} minZ=${info.min ? info.min[2].toFixed(2) : '?'}` : info.reason + (res.log ? ' | ' + res.log.split('\n').find((l) => /error/i.test(l)) : ''));
}

// ---- epsilon through-hole specifically (box_hole) ----
{
  const info = inspectStl((await compile(irToScad(FIXTURES.box_hole))).data);
  ok('eps auto-extends a flush cutter (clean through-hole)', info.ok && info.openEdges <= 2, 'openEdges=' + (info.openEdges));
}

// ---- Z-normalization: a centered sphere root must be lifted onto Z=0 ----
{
  const ball = { name: 'Ball', units: 'mm', params: [{ key: 'd', min: 20, max: 60, value: 40, step: 1 }], root: { type: 'sphere', d: 'd' } };
  const src = irToScad(ball);
  // sphere rests on Z=0 via its radius EXPRESSION (param-correct under sliders), not a baked constant
  ok('sphere rests on Z=0 via param expression', /translate\(\[0, 0, [^\]]*d[^\]]*\]\) sphere/.test(src), (src.match(/translate\([^)]*\) sphere/) || [''])[0]);
  const info = inspectStl((await compile(src)).data);
  ok('Z-lift: STL rests on Z=0', info.ok && info.min[2] >= -0.05, 'minZ=' + (info.min ? info.min[2].toFixed(2) : '?'));
}

// ---- param extraction (slider descriptors) ----
{
  const ps = irParams(FIXTURES.cup);
  ok('irParams shape', ps.length === 4 && ps[0].key === 'dia' && ps[0].min === 40 && ps[0].max === 120 && ps[0].value === 74);
  ok('irParams clamps out-of-range value', irParams({ params: [{ key: 'x', min: 0, max: 10, value: 99 }] })[0].value === 10);
  // emitted source carries the // [min:max] customizer comments _parseScadParams reads
  ok('source has customizer slider comments', /dia = 74; \/\/ \[40:120\]/.test(irToScad(FIXTURES.cup)));
}

// ---- raw escape: top-level + embedded node both compile + watertight ----
{
  const rawTop = { name: 'Raw cup', units: 'mm', params: [{ key: 'r', min: 10, max: 40, value: 20, step: 1 }], raw: 'difference(){ cylinder(h=24, d=2*r); translate([0,0,2]) cylinder(h=24, d=2*r-6); }' };
  ok('raw top-level validates', irValidate(rawTop).ok);
  let info = inspectStl((await compile(irToScad(rawTop))).data);
  ok('raw top-level compiles watertight', info.ok && info.openEdges <= 2, info.ok ? 'open=' + info.openEdges : info.reason);
  const embed = { name: 'Embedded raw', units: 'mm', params: [], root: { type: 'union', children: [{ type: 'cylinder', d: 20, h: 10 }, { type: 'translate', v: [0, 0, 10], child: { type: 'raw', scad: 'sphere(d=20)' } }] } };
  info = inspectStl((await compile(irToScad(embed))).data);
  ok('embedded raw node compiles watertight', info.ok && info.openEdges <= 2, info.ok ? 'open=' + info.openEdges : info.reason);
}

// ---- refinement delta round-trip ----
{
  const ir2 = applyIRDelta(FIXTURES.cup, { params: { height: 140 } });
  ok('delta updates a param value', ir2.params.find((p) => p.key === 'height').value === 140);
  ok('delta source carries new value', /height = 140;/.test(irToScad(ir2)));
  ok('delta does not mutate the original', FIXTURES.cup.params.find((p) => p.key === 'height').value === 100);
  // structural delta: add a cutter, must still compile watertight
  const ir3 = applyIRDelta(FIXTURES.rounded_box, { addCutter: { type: 'cylinder', d: 12, h: 'w' } });
  const info = inspectStl((await compile(irToScad(ir3))).data);
  ok('addCutter delta compiles watertight', info.ok && info.openEdges <= 2, info.ok ? 'open=' + info.openEdges : info.reason);
}

// ---- evalExpr (safe arithmetic) ----
ok('evalExpr arithmetic', evalExpr('dia - 2*wall', { dia: 74, wall: 2.4 }) === 74 - 2 * 2.4);
ok('evalExpr functions + degrees', Math.abs(evalExpr('max(1, sin(90))', {}) - 1) < 1e-9);

// ---- irValidate negatives ----
const neg = (ir, code) => { const r = irValidate(ir); return !r.ok && r.errors.some((e) => e.code === code); };
ok('reject unknown type', neg({ params: [], root: { type: 'frobnicate' } }, 'UNKNOWN_TYPE'));
ok('reject 2D under union', neg({ params: [], root: { type: 'union', children: [{ type: 'square', size: [10, 10] }] } }, '2D_IN_3D'));
ok('reject undeclared identifier', neg({ params: [{ key: 'a', min: 0, max: 9, value: 1 }], root: { type: 'cylinder', d: 'bogus', h: 'a' } }, 'UNDECLARED_IDENT'));
ok('reject min>=max param', neg({ params: [{ key: 'x', min: 9, max: 1, value: 5 }], root: { type: 'sphere', d: 'x' } }, 'BAD_PARAM'));
ok('reject neither root nor raw', neg({ params: [] }, 'NO_ROOT'));
ok('reject cylinder missing diameter (one-of)', neg({ params: [], root: { type: 'cylinder', h: 10 } }, 'MISSING_FIELD'));
ok('reject box with wrong size arity', neg({ params: [], root: { type: 'box', size: [10, 10] } }, 'MISSING_FIELD'));

// ---- vector-valued fields emit a SCAD vector, not parens (#2) ----
ok('linear_extrude vector scale → SCAD vector', /scale=\[2, 1\]/.test(irToScad({ name: 'x', units: 'mm', params: [], root: { type: 'linear_extrude', height: 10, scale: [2, 1], child: { type: 'square', size: [10, 10] } } })), 'scale emit');

console.log('\n' + '='.repeat(56));
console.log(`${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
console.log('JSON-IR transpiler verified ✓');
