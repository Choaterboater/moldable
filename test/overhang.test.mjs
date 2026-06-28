// test/overhang.test.mjs
// Unit tests for the overhang heat-map colour mapping (B1). No THREE needed.
//   node test/overhang.test.mjs
import { overhangColor, overhangColorsFromNormals, SIN45 } from '../cad/overhang.js';

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { if (cond) { pass++; console.log('PASS', name, extra); } else { fail++; console.log('FAIL', name, extra); } };
const isGreen = (c) => c[1] > c[0] && c[1] > c[2];        // green dominant
const isRed = (c) => c[0] > c[1] && c[0] > c[2];          // red dominant

// up-facing / vertical → green (safe)
ok('top face green', isGreen(overhangColor(1)), JSON.stringify(overhangColor(1)));
ok('vertical wall green', isGreen(overhangColor(0)), JSON.stringify(overhangColor(0)));
ok('mild downward (<45°) still greenish', isGreen(overhangColor(-0.3)), JSON.stringify(overhangColor(-0.3)));

// ceiling → red (needs support)
ok('ceiling red', isRed(overhangColor(-1)), JSON.stringify(overhangColor(-1)));
ok('steep overhang (>45°) red', isRed(overhangColor(-0.95)), JSON.stringify(overhangColor(-0.95)));

// exactly the 45° threshold → yellow boundary (R and G both high, B low)
{
  const y = overhangColor(-SIN45);
  ok('45° boundary is yellow', y[0] > 0.8 && y[1] > 0.7 && y[2] < 0.35, JSON.stringify(y.map(n => +n.toFixed(2))));
}

// "danger" (R - G) increases monotonically as the face tilts further down (green→yellow→red).
// (R alone isn't monotonic — yellow is brighter than red — but severity is.)
{
  let monotone = true, prev = -Infinity;
  for (let up = 0; up >= -1.0001; up -= 0.1) { const c = overhangColor(up); const sev = c[0] - c[1]; if (sev < prev - 1e-9) monotone = false; prev = sev; }
  ok('severity (R−G) increases monotonically 0→-1', monotone);
}

// clamps out-of-range input
ok('clamps up>1', isGreen(overhangColor(5)));
ok('clamps up<-1', isRed(overhangColor(-5)));

// overhangColorsFromNormals: identity matrix, up axis +Y
{
  // 2 verts: one pointing +Y (up→green), one pointing -Y (down→red)
  const normals = [0, 1, 0,  0, -1, 0];
  const cols = overhangColorsFromNormals(normals, 2, null, [0, 1, 0]);
  ok('colors len = count*3', cols.length === 6, '' + cols.length);
  ok('vert0 (+Y) green', cols[1] > cols[0] && cols[1] > cols[2]);
  ok('vert1 (-Y) red', cols[3] > cols[4] && cols[3] > cols[5]);
}
// normal matrix rotates a +Z local normal to +Y world (90° about X): elements column-major
{
  // R_x(-90°): maps (0,0,1)->(0,1,0). Matrix3 columns: [1,0,0, 0,0,-1, 0,1,0]
  const nm = [1, 0, 0,  0, 0, -1,  0, 1, 0];
  const cols = overhangColorsFromNormals([0, 0, 1], 1, nm, [0, 1, 0]);
  ok('normal matrix transforms +Z→+Y (green)', cols[1] > cols[0] && cols[1] > cols[2], JSON.stringify([...cols].map(n => +n.toFixed(2))));
}

console.log('\n' + '='.repeat(50));
console.log(`${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
console.log('Overhang heat-map mapping verified ✓');
