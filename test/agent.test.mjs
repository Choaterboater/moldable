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

// ---- caller printer bed overrides the interpreter's hardcoded 256×256 (#7) ----
{
  store.clear();
  // Deterministic proof the override reaches validate: the returned spec must carry the
  // caller's bed, not the interpreter's DEFAULT_CONSTRAINTS ([256,256]).
  const odd = await buildFromPrompt('a 3x2 gridfinity bin', { compile, constraints: { bed: [181, 181] } });
  ok('caller bed reaches spec.constraints', JSON.stringify(odd.spec.constraints.bed) === '[181,181]', JSON.stringify(odd.spec.constraints.bed));
  // and the overridden bed actually drives the outcome: a ~126×84mm bin FLAGS a 100×100 bed
  // (the 256 default would NOT — so a warning here can only come from the override taking effect).
  const small = await buildFromPrompt('a 3x2 gridfinity bin', { compile, constraints: { bed: [100, 100] } });
  ok('caller small bed flags oversize', small.warnings.some((w) => /exceeds/.test(w)), small.warnings.join('; ') || '(no warnings — bed ignored!)');
}

// ---- freeform route via JSON-IR (invalid IR -> repairIR -> valid IR -> real compile) ----
{
  store.clear();
  setApiKey('sk-test');
  const realFetch = globalThis.fetch;
  let authorModel = null;
  globalThis.fetch = async (_url, opts) => {
    const body = JSON.parse(opts.body); const sys = body.system || '';
    let text;
    if (/FIXING an IR/.test(sys)) text = '{"name":"Box","units":"mm","params":[{"key":"s","label":"Size","min":10,"max":40,"value":20,"step":1}],"root":{"type":"box","size":["s","s","s"]}}';  // repair -> valid IR
    else if (/STRUCTURED JSON tree/.test(sys)) { authorModel = body.model; text = '{"name":"Bad","params":[],"root":{"type":"frobnicate"}}'; }  // author -> invalid IR (triggers repair)
    else text = '{"system":null,"params":{},"freeform":true,"description":"a tiny box ~20mm","confidence":0.6}';  // interpret
    return { ok: true, json: async () => ({ content: [{ type: 'text', text }] }) };
  };
  try {
    const r = await buildFromPrompt('a tiny dragon figurine', { compile, maxRepairs: 2 });
    ok('freeform route (IR)', r.route === 'freeform', r.route);
    ok('IR self-repaired', r.attempts === 2, 'attempts=' + r.attempts);
    ok('IR produced STL', r.stl && r.stl.length > 84, (r.stl ? r.stl.length : 0) + ' bytes');
    ok('result carries ir + irParams (live sliders)', !!r.ir && Array.isArray(r.irParams) && r.irParams.length === 1, JSON.stringify(r.irParams));
    ok('authoring threaded the profile model', authorModel === 'claude-sonnet-4-6', authorModel);
  } catch (e) {
    fail += 5; console.log('FAIL freeform IR route threw:', e.message);
  } finally { globalThis.fetch = realFetch; }
}

// ---- IR path fails entirely -> MUST fall back to the legacy raw author (the "only ADDS reliability" invariant) ----
{
  store.clear();
  setApiKey('sk-test');
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (_url, opts) => {
    const sys = JSON.parse(opts.body).system || '';
    let text;
    if (/FIXING an IR/.test(sys)) text = '{"name":"Bad2","params":[],"root":{"type":"frobnicate"}}';     // IR repair stays invalid → IR path exhausts
    else if (/STRUCTURED JSON tree/.test(sys)) text = '{"name":"Bad","params":[],"root":{"type":"frobnicate"}}';   // IR author invalid
    else if (/expert OpenSCAD author/.test(sys)) text = 'cube([15,15,15]);';                              // raw author fallback → valid
    else text = '{"system":null,"params":{},"freeform":true,"description":"a box ~15mm","confidence":0.6}'; // interpret
    return { ok: true, json: async () => ({ content: [{ type: 'text', text }] }) };
  };
  try {
    const r = await buildFromPrompt('an organic blob', { compile, maxRepairs: 1 });
    ok('IR failure falls back to raw author', r.route === 'freeform' && !r.ir && r.stl && r.stl.length > 84, r.route + ' ir=' + !!r.ir);
  } catch (e) {
    fail++; console.log('FAIL IR-fallback threw:', e.message);
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
