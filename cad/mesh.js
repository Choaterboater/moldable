// cad/mesh.js
// Browser-side AI MESH generation (text/image -> 3D mesh), for organic/arbitrary
// shapes OpenSCAD can't author (characters, figurines, sculptures). Pluggable
// providers, no backend — keys live in localStorage. Async: submit a task, poll
// until done, then fetch the resulting GLB bytes.
//
// Providers:
//   meshy  : api.meshy.ai  (Bearer key) — text-to-3d v2 / image-to-3d v1
//   tripo  : api.tripo3d.ai (Bearer key) — v2/openapi text_to_model / image_to_model
//   custom : any base URL exposing the SAME shape as meshy (e.g. the local
//            tools/mesh-bridge.mjs, which proxies a provider to dodge browser CORS)
//
// CORS: meshy/tripo do not reliably allow browser calls. If a direct call fails
// with a network/CORS error, point the "custom" provider at the local mesh-bridge.

const K = {
  provider: 'moldable_mesh_provider',
  key: 'moldable_mesh_key',
  base: 'moldable_mesh_base',
  quality: 'moldable_mesh_quality',   // 'detail' (keep detail, slicer repairs) | 'watertight' (voxel-sealed)
  model: 'moldable_mesh_model',       // bridge model: 'trellis' (cheap/clean) | 'hunyuan' (detailed/pricier)
};
const ls = {
  get: (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } },
  set: (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch {} },
};

export function getMeshProvider() { return ls.get(K.provider) || 'meshy'; }
export function setMeshProvider(p) { ls.set(K.provider, p); }
export function getMeshKey() { return ls.get(K.key); }
export function setMeshKey(v) { ls.set(K.key, (v || '').trim()); }
export function getMeshBase() { return ls.get(K.base); }
export function setMeshBase(v) { ls.set(K.base, (v || '').trim()); }
export function getMeshQuality() { return ls.get(K.quality) || 'detail'; }
export function setMeshQuality(v) { ls.set(K.quality, v); }
export function getMeshModel() { return ls.get(K.model) || 'hunyuan'; }
export function setMeshModel(v) { ls.set(K.model, v); }
export function hasMesh() {
  const p = getMeshProvider();
  if (p === 'local') return true;                 // free local bridge needs no token
  return p === 'custom' ? !!getMeshBase() : !!getMeshKey();
}

const DEFAULT_BASE = {
  meshy: 'https://api.meshy.ai',
  tripo: 'https://api.tripo3d.ai',
  replicate: 'http://localhost:8788',   // the local replicate-bridge (Replicate -> mesh-print -> GLB)
  local: 'http://localhost:8788',       // the local-mesh-bridge (your own GPU Hunyuan3D, no token)
  custom: '',
};

// bridge providers speak the local Meshy-shaped bridge contract (replicate/local-mesh-bridge);
// they accept the model/quality knobs and an optional text hint. Direct cloud APIs (meshy/tripo) don't.
const isBridge = (p) => p === 'local' || p === 'replicate' || p === 'custom';
// image-to-3D ONLY backends. The local Hunyuan bridge requires a photo, and Replicate's
// Trellis is image-only — BUT Replicate's Hunyuan3D-3.1 accepts a typed prompt (text→3D),
// which is what worked originally, so text is allowed there. (Meshy/Tripo do text-to-3D;
// a user "custom" bridge is assumed flexible.)
const imageOnly = (p) => p === 'local' || (p === 'replicate' && getMeshModel() === 'trellis');

class MeshError extends Error { constructor(m, code) { super(m); this.code = code; } }

const sleep = (ms, signal) => new Promise((res, rej) => {
  const t = setTimeout(res, ms);
  if (signal) signal.addEventListener('abort', () => { clearTimeout(t); rej(new MeshError('cancelled', 'cancelled')); }, { once: true });
});

async function jget(url, headers, signal) {
  const r = await fetch(url, { headers, signal });
  if (!r.ok) throw new MeshError('Mesh API ' + r.status + ': ' + (await r.text()).slice(0, 200), 'http');
  return r.json();
}
async function jpost(url, headers, body, signal) {
  const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body), signal });
  if (!r.ok) throw new MeshError('Mesh API ' + r.status + ': ' + (await r.text()).slice(0, 200), 'http');
  return r.json();
}

// Provider adapters return { submit(input)->taskId, poll(taskId)->{done, progress, glbUrl, failed} }
function adapter(provider, base, key) {
  const auth = { authorization: 'Bearer ' + key };
  if (provider === 'tripo') {
    return {
      async submit({ prompt, imageDataUrl }) {
        const body = imageDataUrl
          ? { type: 'image_to_model', file: { type: 'jpg', url: imageDataUrl } }
          : { type: 'text_to_model', prompt };
        const d = await jpost(base + '/v2/openapi/task', auth, body);
        return d.data && d.data.task_id;
      },
      async poll(id) {
        const d = await jget(base + '/v2/openapi/task/' + id, auth);
        const t = d.data || {};
        const st = (t.status || '').toLowerCase();
        return {
          done: st === 'success', failed: st === 'failed' || st === 'cancelled' || st === 'unknown',
          progress: t.progress || 0,
          error: t.message || t.error || d.message,
          glbUrl: t.output && (t.output.pbr_model || t.output.model || t.output.base_model),
        };
      },
    };
  }
  // meshy (and custom, which mirrors meshy's shape)
  return {
    async submit({ prompt, imageDataUrl }) {
      // model/quality are bridge-only knobs (Trellis vs Hunyuan, detail vs watertight). Sending
      // them to the real Meshy/Tripo API would be rejected, so only include them for bridges.
      const extra = isBridge(provider) ? { quality: getMeshQuality(), model: getMeshModel() } : {};
      if (imageDataUrl) {
        const body = { image_url: imageDataUrl, enable_pbr: false, ...extra };
        // optional text hint alongside the photo — only to bridge providers (the real Meshy/Tripo
        // image-to-3D APIs have no such field and may 400 on an unknown key).
        if (prompt && isBridge(provider)) body.prompt = prompt;
        const d = await jpost(base + '/openapi/v1/image-to-3d', auth, body);
        return d.result;
      }
      const d = await jpost(base + '/openapi/v2/text-to-3d', auth, { mode: 'preview', prompt, art_style: 'realistic', ...extra });
      return d.result;
    },
    async poll(id, imageMode) {
      const path = imageMode ? '/openapi/v1/image-to-3d/' : '/openapi/v2/text-to-3d/';
      const d = await jget(base + path + id, auth);
      const st = (d.status || '').toUpperCase();
      return {
        done: st === 'SUCCEEDED', failed: st === 'FAILED' || st === 'EXPIRED' || st === 'CANCELED',
        progress: d.progress || 0,
        error: d.error || (d.task_error && d.task_error.message),
        glbUrl: d.model_urls && d.model_urls.glb,
      };
    },
  };
}

// generateMesh({prompt?, imageDataUrl?, signal?, onStatus?, pollMs?, timeoutMs?}) -> { glb: Uint8Array }
export async function generateMesh({ prompt, imageDataUrl, signal, onStatus, pollMs = 4000, timeoutMs = 600000 } = {}) {
  const provider = getMeshProvider();
  const base = ((isBridge(provider) ? (getMeshBase() || DEFAULT_BASE[provider]) : DEFAULT_BASE[provider]) || '').replace(/\/+$/, '');
  const key = getMeshKey();
  if (!base) throw new MeshError('mesh provider not configured', 'no-key');
  if (provider !== 'custom' && provider !== 'local' && !key) throw new MeshError('mesh provider not configured', 'no-key');
  if (!prompt && !imageDataUrl) throw new MeshError('need a prompt or an image', 'bad-input');
  // image-to-3D backends can't turn words into a shape on their own — guide the user to a photo or a text-capable cloud provider.
  if (!imageDataUrl && imageOnly(provider))
    throw new MeshError('This sculpt model builds from a photo. Switch the Model to Hunyuan3D (it accepts typed text), upload a photo, or turn OFF 🪑 Sculpt to build it in OpenSCAD.', 'needs-photo');

  const a = adapter(provider, base, key);
  onStatus && onStatus('Submitting to the mesh model…');
  let taskId;
  try { taskId = await a.submit({ prompt, imageDataUrl }); }
  catch (e) { throw netGuard(e, provider, base); }
  if (!taskId) throw new MeshError('mesh provider did not return a task id', 'bad-response');

  const t0 = Date.now();
  for (;;) {
    if (signal && signal.aborted) throw new MeshError('cancelled', 'cancelled');
    if (Date.now() - t0 > timeoutMs) throw new MeshError('mesh generation timed out', 'timeout');
    let s;
    try { s = await a.poll(taskId, !!imageDataUrl); }
    catch (e) { throw netGuard(e, provider, base); }
    // Prefer the backend's real error (CUDA OOM, bad model, server crash) — blaming the
    // prompt sends users to reword forever when the fix is e.g. a smaller octree.
    if (s.failed) throw new MeshError(s.error || 'the mesh model failed — try again, simplify the prompt, or (local/Replicate) lower the octree', 'gen-failed');
    if (s.done) {
      if (!s.glbUrl) throw new MeshError('mesh finished but returned no GLB', 'bad-response');
      onStatus && onStatus('Downloading mesh…');
      const r = await fetch(s.glbUrl, { signal });
      if (!r.ok) throw new MeshError('could not download the GLB (' + r.status + ')', 'http');
      return { glb: new Uint8Array(await r.arrayBuffer()) };
    }
    onStatus && onStatus('Sculpting… ' + Math.round(s.progress) + '%');
    await sleep(pollMs, signal);
  }
}

function netGuard(e, provider, base) {
  if (e instanceof MeshError) return e;
  if (e && (e.name === 'TypeError' || /failed to fetch|networkerror|load failed|cors/i.test(e.message || ''))) {
    const hint = provider === 'local'
      ? 'Start the local bridge in a terminal — `node tools/local-mesh-bridge.mjs` (and your Hunyuan3D server) — then try again.'
      : provider === 'replicate'
      ? 'Start the bridge in a terminal — `node tools/replicate-bridge.mjs` — then try again.'
      : 'It may block browser calls (CORS) — run `node tools/mesh-bridge.mjs` and pick the Custom provider.';
    return new MeshError("Couldn't reach the mesh service at " + base + '. ' + hint, 'network');
  }
  return e;
}
