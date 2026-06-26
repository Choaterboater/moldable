// test/mesh.test.mjs — mesh-provider client (submit -> poll -> fetch GLB) with mocked fetch.
//   node test/mesh.test.mjs
const store = new Map();
globalThis.localStorage = { getItem: (k) => store.has(k) ? store.get(k) : null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log('  FAIL:', m); } };

// route mocked fetch by URL + method
function mockFetch(routes) {
  globalThis.fetch = async (url, opts = {}) => {
    const method = (opts.method || 'GET').toUpperCase();
    for (const r of routes) {
      if (r.test(url, method)) return r.reply(url, opts);
    }
    throw Object.assign(new TypeError('Failed to fetch ' + url), { name: 'TypeError' });
  };
}
const json = (o) => ({ ok: true, status: 200, json: async () => o, text: async () => JSON.stringify(o) });
const bytes = (n) => ({ ok: true, status: 200, arrayBuffer: async () => new Uint8Array(n).fill(7).buffer });

const mesh = await import('../cad/mesh.js');

// ---- meshy text-to-3d: submit -> poll(in progress) -> poll(succeeded) -> glb ----
{
  store.clear(); mesh.setMeshProvider('meshy'); mesh.setMeshKey('msy-key');
  let polls = 0;
  mockFetch([
    { test: (u, m) => u.includes('/openapi/v2/text-to-3d') && m === 'POST', reply: () => json({ result: 'task-1' }) },
    { test: (u, m) => u.includes('/openapi/v2/text-to-3d/task-1') && m === 'GET', reply: () => json(polls++ === 0 ? { status: 'IN_PROGRESS', progress: 40 } : { status: 'SUCCEEDED', progress: 100, model_urls: { glb: 'https://cdn/x.glb' } }) },
    { test: (u) => u === 'https://cdn/x.glb', reply: () => bytes(2048) },
  ]);
  let st = [];
  const out = await mesh.generateMesh({ prompt: 'a dragon', pollMs: 5, onStatus: (s) => st.push(s) });
  ok(out.glb instanceof Uint8Array && out.glb.length === 2048, 'meshy returns GLB bytes');
  ok(polls >= 2, 'meshy polled until SUCCEEDED');
  ok(st.some((s) => /Sculpting/.test(s)), 'meshy reported progress');
}

// ---- tripo text_to_model ----
{
  store.clear(); mesh.setMeshProvider('tripo'); mesh.setMeshKey('tripo-key');
  mockFetch([
    { test: (u, m) => u.includes('/v2/openapi/task') && m === 'POST', reply: () => json({ data: { task_id: 't-9' } }) },
    { test: (u, m) => u.includes('/v2/openapi/task/t-9') && m === 'GET', reply: () => json({ data: { status: 'success', progress: 100, output: { model: 'https://cdn/t.glb' } } }) },
    { test: (u) => u === 'https://cdn/t.glb', reply: () => bytes(512) },
  ]);
  const out = await mesh.generateMesh({ prompt: 'a cat', pollMs: 5 });
  ok(out.glb.length === 512, 'tripo returns GLB bytes');
}

// ---- failure: provider says FAILED ----
{
  store.clear(); mesh.setMeshProvider('meshy'); mesh.setMeshKey('k');
  mockFetch([
    { test: (u, m) => m === 'POST', reply: () => json({ result: 'f-1' }) },
    { test: (u, m) => m === 'GET', reply: () => json({ status: 'FAILED' }) },
  ]);
  let threw = null; try { await mesh.generateMesh({ prompt: 'x', pollMs: 5 }); } catch (e) { threw = e; }
  ok(threw && threw.code === 'gen-failed', 'surfaces provider FAILED status');
}

// ---- not configured ----
{
  store.clear(); mesh.setMeshProvider('meshy'); // no key
  let threw = null; try { await mesh.generateMesh({ prompt: 'x' }); } catch (e) { threw = e; }
  ok(threw && threw.code === 'no-key', 'errors when no key set');
  ok(!mesh.hasMesh(), 'hasMesh() false without key');
}

// ---- CORS / network error is mapped to a helpful message ----
{
  store.clear(); mesh.setMeshProvider('meshy'); mesh.setMeshKey('k');
  globalThis.fetch = async () => { throw Object.assign(new TypeError('Failed to fetch'), { name: 'TypeError' }); };
  let threw = null; try { await mesh.generateMesh({ prompt: 'x', pollMs: 5 }); } catch (e) { threw = e; }
  ok(threw && threw.code === 'network' && /CORS|bridge/i.test(threw.message), 'maps CORS/network to bridge hint');
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
console.log('Mesh provider client verified ✓');
