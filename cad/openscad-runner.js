// cad/openscad-runner.js
// Main-thread API around the OpenSCAD worker. Re-exports the SCAD authoring so the
// app has a single CAD entry point: `import { generate, MODELS, createRunner }`.
export { generate, defaults, MODELS } from './scad-gen.js';

export function createRunner() {
  let worker = null;
  let seq = 0;
  const pending = new Map();

  function ensureWorker() {
    if (worker) return worker;
    worker = new Worker(new URL('./openscad-worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      const { id, ok, stl, log, error } = e.data || {};
      const p = pending.get(id);
      if (!p) return;
      pending.delete(id);
      if (ok) p.resolve({ stl, log });
      else p.reject(Object.assign(new Error(error || 'compile failed'), { log }));
    };
    worker.onerror = (e) => {
      const msg = 'worker error: ' + (e.message || e.filename || 'unknown');
      for (const [, p] of pending) p.reject(new Error(msg));
      pending.clear();
      try { worker.terminate(); } catch {}
      worker = null;            // drop the dead worker so the next compile() respawns
    };
    return worker;
  }

  return {
    // compile({source, files?, args?}) -> Promise<{ stl: Uint8Array, log: string }>
    compile({ source, files, args } = {}) {
      const w = ensureWorker();
      const id = ++seq;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        w.postMessage({ id, source, files, args });
      });
    },
    dispose() {
      for (const [, p] of pending) p.reject(new Error('runner disposed'));
      pending.clear();
      if (worker) { worker.terminate(); worker = null; }
    },
  };
}
