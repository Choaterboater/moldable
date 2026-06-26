// test/catalog.test.mjs — every CATALOG design must compile to a watertight manifold STL
// that rests on Z=0 (minZ ~ 0) and fits a 220mm bed.   node test/catalog.test.mjs
import OpenSCAD from '../cad/openscad.js';
import { readFileSync } from 'node:fs';
import { CATALOG } from '../cad/catalog.js';
import { validate } from '../cad/validate.js';

const wasmBinary = readFileSync(new URL('../cad/openscad.wasm', import.meta.url));

async function compile(src) {
  const errs = [];
  const inst = await OpenSCAD({ noInitialRun: true, wasmBinary, printErr: (s) => errs.push(s) });
  inst.FS.writeFile('/in.scad', src);
  let rc; try { rc = inst.callMain(['/in.scad', '--backend=manifold', '--export-format=binstl', '-o', '/out.stl']); } catch { rc = -1; }
  let data = null; try { data = inst.FS.readFile('/out.stl'); } catch {}
  return { rc, data, hard: errs.some((l) => /ERROR:/.test(l)) };
}

let pass = 0; const fails = []; const t0 = Date.now();
const names = new Set();
for (const item of CATALOG) {
  if (names.has(item.name)) fails.push(item.name + ' -> DUPLICATE name');
  names.add(item.name);
  const r = await compile(item.scad);
  if (r.rc !== 0 || !r.data || r.hard) { fails.push(item.name + ' -> compile rc=' + r.rc + (r.hard ? ' manifold-error' : '')); console.log('FAIL', item.name); continue; }
  const v = validate(r.data, { bed: [220, 220] });
  const info = v.ok ? v : v;
  if (!v.ok) { fails.push(item.name + ' -> ' + v.reason); console.log('FAIL', item.name, v.reason.slice(0, 50)); continue; }
  // sits on bed?
  pass++;
  console.log('PASS', (item.cat + ' / ' + item.name).padEnd(46), v.tris + ' tris  ' + v.size.map((s) => s.toFixed(0)).join('×') + 'mm' + (v.warnings.length ? '  [' + v.warnings.length + ' warn]' : ''));
}
console.log('\n' + '='.repeat(60));
console.log(`${pass}/${CATALOG.length} catalog designs valid  (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
if (fails.length) { console.log('\nFAILURES:'); fails.forEach((f) => console.log('  - ' + f)); process.exit(1); }
console.log('All catalog designs compile to watertight manifold STL. ✓');
