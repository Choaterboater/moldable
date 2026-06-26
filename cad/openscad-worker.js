// cad/openscad-worker.js
// Module Web Worker: runs the OpenSCAD WASM engine off the main thread so slider
// drags, the auto-rotating viewer, and the repair loop never freeze the UI.
//
// Protocol (postMessage):
//   in : { id, source, files?: [{name, contents}], args?: [string] }
//   out: { id, ok, stl?: Uint8Array (transferred), log, error? }
import OpenSCAD from './openscad.js';

// The wasm binary is fetched once and reused for every compile, so a slider drag
// doesn't re-download ~9.6MB (python's http.server sends no cache headers).
let wasmBinaryPromise = null;
function getWasmBinary() {
  if (!wasmBinaryPromise) {
    wasmBinaryPromise = fetch(new URL('./openscad.wasm', import.meta.url))
      .then((r) => { if (!r.ok) throw new Error('wasm fetch HTTP ' + r.status); return r.arrayBuffer(); })
      .catch((e) => { wasmBinaryPromise = null; throw e; }); // don't cache a failed fetch — allow retry
  }
  return wasmBinaryPromise;
}

const DEFAULT_ARGS = ['--backend=manifold', '--export-format=binstl'];

// Library files are referenced by { name (FS path), url (relative to cad/) } and
// fetched once, cached — so a slider drag doesn't re-download a 400KB .scad each time.
const libCache = new Map();
async function getLibFile(f) {
  if (f.contents != null) return f.contents;
  if (f.url) {
    if (!libCache.has(f.url)) {
      const r = await fetch(new URL(f.url, import.meta.url));
      if (!r.ok) throw new Error('library fetch HTTP ' + r.status + ' for ' + f.url);
      libCache.set(f.url, await r.text());
    }
    return libCache.get(f.url);
  }
  return '';
}

// Serialize compiles: concurrent OpenSCAD() instantiations sharing one wasm
// buffer deadlock, so each job waits for the previous to finish.
let chain = Promise.resolve();
self.onmessage = (e) => { chain = chain.then(() => handle(e.data)); };

async function handle(e) {
  const { id, source, files, args } = e || {};
  const log = [];
  try {
    const wasmBinary = await getWasmBinary();
    // Fresh instance per compile → clean FS and no callMain re-entrancy worries.
    const inst = await OpenSCAD({
      noInitialRun: true,
      wasmBinary,
      print: (s) => log.push(s),
      printErr: (s) => log.push(s),
    });
    for (const f of (files || [])) {
      const path = '/' + f.name;
      const dir = path.slice(0, path.lastIndexOf('/'));
      if (dir && inst.FS.mkdirTree) { try { inst.FS.mkdirTree(dir); } catch {} }   // nested library paths (use <src/core/...>)
      inst.FS.writeFile(path, await getLibFile(f));
    }
    inst.FS.writeFile('/in.scad', source);
    const argv = ['/in.scad', ...(args || DEFAULT_ARGS), '-o', '/out.stl'];
    let rc;
    try { rc = inst.callMain(argv); } catch (err) { log.push('callMain: ' + (err && err.message || err)); rc = -1; }
    let stl = null;
    try { stl = inst.FS.readFile('/out.stl'); } catch { /* no output produced */ }
    const ok = rc === 0 && stl && stl.length > 84;
    const text = log.join('\n');
    if (ok) self.postMessage({ id, ok: true, stl, log: text }, [stl.buffer]);
    else self.postMessage({ id, ok: false, log: text, error: extractError(text) || ('compile failed (rc=' + rc + ')') });
  } catch (err) {
    self.postMessage({ id, ok: false, log: log.join('\n'), error: String(err && err.message || err) });
  }
}

function extractError(text) {
  const line = (text || '').split('\n').find((l) => /^ERROR:/i.test(l));
  return line || null;
}
