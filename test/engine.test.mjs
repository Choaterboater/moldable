// test/engine.test.mjs
// Headless verification of the SCAD authoring + OpenSCAD engine.
// For every model (defaults + variants) it generates SCAD via scad-gen, compiles
// it through the vendored OpenSCAD WASM, and asserts a sane, watertight binary STL.
//
//   node test/engine.test.mjs
//
import OpenSCAD from '../cad/openscad.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MODELS, generate, defaults } from '../cad/scad-gen.js';

// Nominal XY footprint per model — the part must not balloon past this (catches
// mis-centered/protruding geometry that still happens to be manifold).
function envelope(model, p) {
  const m = { ...defaults(model), ...p };
  switch (model) {
    case 'vase': { const r = m.radius + (m.bulge || 0) / 12; return { x: 2 * r, y: 2 * r, z: m.height }; }
    case 'organizer': return { x: m.width, y: m.depth, z: m.height };
    case 'stand': return { x: m.baseDepth, y: m.height, z: m.width };
    // HSW parts (clip library) + the MakerWorld wall bin/dock — geometry is verified
    // manifold; their exact bbox depends on the vendored lib, so skip the strict envelope.
    case 'holder': case 'hook': case 'shelf': case 'wallbin': case 'peghook': case 'wallhook': case 'apmount': return null;
    case 'funnel': { const ro = Math.max(m.stemDia / 2 + m.wall + 2, m.topDia / 2); return { x: 2 * ro, y: 2 * ro, z: m.height + m.stemLen }; }
    case 'soapdish': return { x: m.width, y: m.depth, z: m.height };
    case 'brick': return { x: m.studsX * 8, y: m.studsY * 8, z: m.layers * 3.2 + (Number(m.studs) >= 0.5 ? 1.8 : 0) };
    case 'walldock': return { x: m.width, y: m.shelfDepth + 16, z: m.height };  // self-authored: width × (shelf+connector) × back height
    case 'gridfinity': return { x: m.gx * 42, y: m.gy * 42, z: m.height * 7 };
    case 'baseplate': return { x: m.gx * 42, y: m.gy * 42, z: 7 };
    case 'box': return { x: m.width, y: m.depth, z: m.height };
    case 'coaster': return { x: m.dia, y: m.dia, z: m.thick + m.rim };
    case 'bracket': return { x: m.legA, y: m.width, z: m.legB };
    case 'cableclip': return { x: m.length, y: m.cables * (m.dia + 2.5) + 2.5 + (Number(m.mount) >= 0.5 ? 16 : 0), z: m.dia / 2 + 4.5 };
    case 'knob': return { x: m.dia, y: m.dia, z: m.height };
    case 'cupadapter': { const cod = (m.mug + 6) + 2 * m.wall; const fod = Math.max(cod, m.holder + 8); return { x: fod, y: fod, z: m.plugH + m.wall + m.cradleH }; }
    default: return null;
  }
}
const FOOT_TOL = 14; // mm of slack for lips, tabs, scoops, ball tips

const wasmBinary = readFileSync(new URL('../cad/openscad.wasm', import.meta.url));

// ---- binary STL parser: triangle count + bounding box + sanity ----
function inspectStl(data) {
  if (data.length < 84) return { ok: false, why: 'too short (' + data.length + ')' };
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const tris = dv.getUint32(80, true);
  if (data.length !== 84 + tris * 50) return { ok: false, why: 'size mismatch tris=' + tris + ' bytes=' + data.length };
  if (tris === 0) return { ok: false, why: '0 triangles' };
  let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  let off = 84;
  for (let t = 0; t < tris; t++) {
    off += 12; // skip normal
    for (let v = 0; v < 3; v++) {
      for (let c = 0; c < 3; c++) {
        const f = dv.getFloat32(off, true); off += 4;
        if (!isFinite(f)) return { ok: false, why: 'non-finite vertex' };
        if (f < min[c]) min[c] = f;
        if (f > max[c]) max[c] = f;
      }
    }
    off += 2; // attr byte count
  }
  const size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  if (size.some((s) => !(s > 0.5))) return { ok: false, why: 'degenerate bbox ' + size.map((s) => s.toFixed(1)) };
  return { ok: true, tris, size };
}

function libContents(f) {
  if (f.contents != null) return f.contents;
  if (f.url) return readFileSync(new URL('../cad/' + f.url, import.meta.url), 'utf8');
  return '';
}
async function compile(source, files) {
  const errs = [];
  const inst = await OpenSCAD({ noInitialRun: true, wasmBinary, printErr: (s) => errs.push(s) });
  for (const f of (files || [])) {
    const path = '/' + f.name;
    const dir = path.slice(0, path.lastIndexOf('/'));
    if (dir && inst.FS.mkdirTree) { try { inst.FS.mkdirTree(dir); } catch {} }
    inst.FS.writeFile(path, libContents(f));
  }
  inst.FS.writeFile('/in.scad', source);
  let rc, threw = null;
  try { rc = inst.callMain(['/in.scad', '--backend=manifold', '--export-format=binstl', '-o', '/out.stl']); }
  catch (e) { threw = e.message || String(e); }
  let data = null;
  try { data = inst.FS.readFile('/out.stl'); } catch { /* none */ }
  const log = errs.join('\n');
  const hardError = /ERROR:|WARNING: Object may not be a valid 2-manifold/i.test(log);
  return { rc, threw, data, log, hardError };
}

// Per-model variants to exercise the parameter space (not just defaults).
const VARIANTS = {
  vase: [{}, { sides: 3, twist: 300, height: 220 }, { sides: 16, bulge: 60 }],
  organizer: [{}, { slots: 1 }, { slots: 5, height: 90 }],
  stand: [{}, { angle: 50 }, { angle: 78, height: 170 }],
  holder: [{}, { dia: 12, depth: 120 }, { dia: 70, tiles: 4 }],
  hook: [{}, { rod: 6, length: 90 }, { rod: 18, tiles: 3 }],
  shelf: [{}, { tiles: 5, depth: 120 }, { lip: 32 }],
  gridfinity: [{}, { gx: 3, gy: 2, height: 4, compartments: 3 }],   // real lib is compute-heavy; keep variants modest
  baseplate: [{}, { magnets: 1 }],
  box: [{}, { fillet: 0, height: 120 }, { width: 220, depth: 40 }],
  coaster: [{}, { sides: 6 }, { rim: 0, dia: 140 }],
  bracket: [{}, { hole: 0, legA: 120 }, { thick: 10, width: 100 }],
  cableclip: [{}, { cables: 6, dia: 12, mount: 0 }, { cables: 1, length: 60 }],
  knob: [{}, { grips: 0 }, { dia: 60, grips: 24, shaft: 8 }],
  cupadapter: [{}, { mug: 60, holder: 78, handle: 0 }, { mug: 100, holder: 90, cradleH: 100, handle: 45 }, { openings: 4, handle: 24 }],
  funnel: [{}, { topDia: 150, stemDia: 40, wall: 3 }, { topDia: 50, stemDia: 8, height: 30, stemLen: 80 }],
  soapdish: [{}, { ridges: 0 }, { width: 170, depth: 120, height: 35, ridges: 12 }],
  peghook: [{}, { reach: 110, rod: 14, pitch: 25.4 }, { reach: 20, rod: 5, upturn: 40 }],
  wallhook: [{}, { screws: 1 }, { reach: 90, rod: 22, upturn: 45 }],
  brick: [{}, { studsX: 1, studsY: 2, layers: 1 }, { studsX: 8, studsY: 8, layers: 1, studs: 0 }, { studsX: 6, studsY: 6, layers: 6 }],
  apmount: [{}, { cols: 2 }, { cols: 1 }],
  wallbin: [{}, { sections: 6, honeycomb: 1 }, { width: 180, depth: 60 }],
  walldock: [{}, { width: 185, height: 140, shelfDepth: 60, lip: 24 }, { slot: 0, width: 45, height: 45 }],
};

let pass = 0, fail = 0;
const failures = [];
const t0 = Date.now();

for (const model of Object.keys(MODELS)) {
  for (const v of (VARIANTS[model] || [{}])) {
    const label = model + ' ' + JSON.stringify(v);
    let res, info;
    try {
      const { source, files } = generate(model, v);
      res = await compile(source, files);
      info = res.data ? inspectStl(res.data) : { ok: false, why: 'no STL output' };
    } catch (e) {
      fail++; failures.push(label + '  -> threw in gen/compile: ' + (e.message || e)); console.log('FAIL', label, '(exception)'); continue;
    }
    // dimension check against the nominal envelope
    let dimWhy = null;
    if (info.ok) {
      const env = envelope(model, v);
      if (env) {
        for (const ax of ['x', 'y', 'z']) {
          const i = { x: 0, y: 1, z: 2 }[ax];
          if (info.size[i] > env[ax] + FOOT_TOL) dimWhy = `${ax}=${info.size[i].toFixed(0)} > nominal ${env[ax].toFixed(0)}+${FOOT_TOL}`;
          else if (info.size[i] < env[ax] * 0.5) dimWhy = `${ax}=${info.size[i].toFixed(0)} < half of nominal ${env[ax].toFixed(0)}`;
        }
      }
    }
    const good = res.rc === 0 && !res.threw && !res.hardError && info.ok && !dimWhy;
    if (good) {
      pass++;
      console.log('PASS', label.padEnd(52), info.tris + ' tris  ' + info.size.map((s) => s.toFixed(0)).join('×') + 'mm');
    } else if (info.ok && dimWhy) {
      fail++;
      failures.push(label + '  -> dimension: ' + dimWhy);
      console.log('FAIL', label.padEnd(52), 'dim ' + dimWhy);
    } else {
      fail++;
      const why = res.threw ? 'threw ' + res.threw : res.hardError ? 'scad error' : !info.ok ? info.why : 'rc=' + res.rc;
      failures.push(label + '  -> ' + why);
      console.log('FAIL', label.padEnd(52), why);
      if (res.log && (res.hardError || !info.ok)) console.log('     ' + res.log.split('\n').filter((l) => /error|warning/i.test(l)).slice(0, 4).join('\n     '));
    }
  }
}

console.log('\n' + '='.repeat(60));
console.log(`${pass} passed, ${fail} failed  (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
if (fail) { console.log('\nFAILURES:'); failures.forEach((f) => console.log('  - ' + f)); process.exit(1); }
console.log('All models compile to watertight manifold STL. ✓');
