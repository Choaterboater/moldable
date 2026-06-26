// test/agent.test.mjs
// Tests the interpret -> route -> validate/repair orchestration.
//  - library route: real engine, no API key (keyword fallback)
//  - freeform route: mocked Claude (bad program -> repair -> good), real engine
//  - validate(): printability + bed-fit on real STL
import OpenSCAD from '../cad/openscad.js';
import { readFileSync } from 'node:fs';

// shim browser globals the LLM client expects
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const wasmBinary = readFileSync(new URL('../cad/openscad.wasm', import.meta.url));
function libContents(f) {
  if (f.contents != null) return f.contents;
  if (f.url) return readFileSync(new URL('../cad/' + f.url, import.meta.url), 'utf8');
  return '';
}
async function compile({ source, files }) {
  const inst = await OpenSCAD({ noInitialRun: true, wasmBinary, printErr: () => {} });
  for (const f of (files || [])) {
    const path = '/' + f.name;
    const dir = path.slice(0, path.lastIndexOf('/'));
    if (dir && inst.FS.mkdirTree) { try { inst.FS.mkdirTree(dir); } catch {} }
    inst.FS.writeFile(path, libContents(f));
  }
  inst.FS.writeFile('/in.scad', source);
  let rc; try { rc = inst.callMain(['/in.scad', '--backend=manifold', '--export-format=binstl', '-o', '/out.stl']); } catch { rc = -1; }
  let stl = null; try { stl = inst.FS.readFile('/out.stl'); } catch {}
  if (!(rc === 0 && stl && stl.length > 84)) throw new Error('compile failed rc=' + rc);
  return { stl, log: '' };
}

const { buildFromPrompt } = await import('../cad/agent.js');
const { validate } = await import('../cad/validate.js');
const { setApiKey } = await import('../cad/llm.js');

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { if (cond) { pass++; console.log('PASS', name, extra); } else { fail++; console.log('FAIL', name, extra); } };

// ---- validate() ----
{
  const { stl } = await compile({ source: 'cube([84,42,42]);' });
  const big = validate(stl, { bed: [256, 256] });
  ok('validate fits bed', big.ok && big.warnings.length === 0, JSON.stringify(big.size.map(Math.round)));
  const small = validate(stl, { bed: [50, 50] });
  ok('validate flags oversize', small.ok && small.warnings.some((w) => /exceeds/.test(w)), small.warnings[0] || '');
}

// ---- library route (no key -> keyword interpret -> real compile) ----
{
  store.clear(); // no API key
  const r = await buildFromPrompt('a 3x2 gridfinity bin with a label tab', { compile });
  ok('library route', r.route === 'library' && r.system === 'gridfinity', r.route + '/' + r.system);
  ok('library parsed grid', r.params.gx === 3 && r.params.gy === 2, 'gx=' + r.params.gx + ' gy=' + r.params.gy);
  ok('library produced STL', r.stl && r.stl.length > 84, (r.stl ? r.stl.length : 0) + ' bytes');
}

// ---- freeform route with mocked Claude (bad -> repair -> good) ----
{
  store.clear();
  setApiKey('sk-test');
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (_url, opts) => {
    const sys = JSON.parse(opts.body).system || '';
    let text;
    if (/fixing a failing/.test(sys)) text = 'cube([20,20,20]);';        // repair -> valid
    else if (/expert OpenSCAD author/.test(sys)) text = 'cube(0);';      // author -> empty (fails)
    else text = '{"system":null,"params":{},"freeform":true,"description":"a tiny dragon, ~40mm","confidence":0.6}';
    return { ok: true, json: async () => ({ content: [{ type: 'text', text }] }) };
  };
  try {
    const r = await buildFromPrompt('a tiny dragon figurine', { compile, maxRepairs: 2 });
    ok('freeform route', r.route === 'freeform', r.route);
    ok('freeform self-repaired', r.attempts === 2, 'attempts=' + r.attempts);
    ok('freeform produced STL', r.stl && r.stl.length > 84, (r.stl ? r.stl.length : 0) + ' bytes');
  } catch (e) {
    fail += 3; console.log('FAIL freeform route threw:', e.message);
  } finally { globalThis.fetch = realFetch; }
}

// ---- no key + unknown prompt: graceful fallback to a template (not an error) ----
{
  store.clear();
  const r = await buildFromPrompt('zzzqx nonsense novel shape', { compile });
  ok('no-key fallback to template', r.route === 'library' && r.recognized === false, r.route + ' recognized=' + r.recognized);
}

console.log('\n' + '='.repeat(50));
console.log(`${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
console.log('Agent orchestration verified ✓');
