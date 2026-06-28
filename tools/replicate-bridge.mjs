#!/usr/bin/env node
// replicate-bridge.mjs — lets Moldable's "Sculpt with AI" use Replicate from the GUI.
// It speaks Meshy's API shape (so cad/mesh.js needs ~no changes), but internally:
//   GUI submit -> Replicate (Hunyuan3D / Trellis) -> raw GLB -> tools/mesh-print.py
//   (print-ready: watertight, scaled, on-bed) -> serves the cleaned GLB back to the GUI.
//
// The Replicate token is entered in Moldable Settings (AI mesh -> key) and arrives here in
// the Authorization header — it is never hard-coded. CORS is open so the browser can call it.
//
//   node tools/replicate-bridge.mjs            # port 8788, model tencent/hunyuan-3d-3.1
//   REPLICATE_MODEL=firtoz/trellis MESH_SIZE=90 node tools/replicate-bridge.mjs
import http from 'node:http';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { checkAccess } from './bridge-guard.mjs';

const PORT = Number(process.env.PORT || 8788);
const MODEL = process.env.REPLICATE_MODEL || 'firtoz/trellis';   // fallback when the GUI doesn't name a model
// friendly names the GUI sends -> Replicate slugs (so the GUI doesn't hard-code slugs)
const MODEL_ALIASES = { trellis: 'firtoz/trellis', hunyuan: 'tencent/hunyuan-3d-3.1', hunyuan3: 'tencent/hunyuan-3d-3.1' };
const slugFor = (k) => MODEL_ALIASES[k] || (k && k.includes('/') ? k : MODEL);
const REPL = (process.env.REPLICATE_API_BASE || 'https://api.replicate.com').replace(/\/+$/, '');
const SIZE = process.env.MESH_SIZE || '80';
// Trellis detail knobs — firtoz defaults (mesh_simplify 0.95, 12 steps) give a low-poly blob.
const TRELLIS_SIMPLIFY = Number(process.env.TRELLIS_SIMPLIFY || 0.9);  // lower = denser mesh (0.7–0.95)
const TRELLIS_STEPS = Number(process.env.TRELLIS_STEPS || 38);          // sampling steps (max useful ~50); higher = sharper shape (+cost)
const TMP = process.env.TMPDIR || '/tmp';
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, GET, OPTIONS', 'access-control-allow-headers': 'authorization, content-type' };
const tasks = new Map();
let seq = 0;

function findMeshUrl(o) {
  if (typeof o === 'string') return /\.(glb|obj|ply)(\?|$)/i.test(o) ? o : null;
  if (Array.isArray(o)) { for (const v of o) { const r = findMeshUrl(v); if (r) return r; } return null; }
  if (o && typeof o === 'object') { for (const v of Object.values(o)) { const r = findMeshUrl(v); if (r) return r; } }
  return null;
}
const json = (res, code, obj) => { res.writeHead(code, { ...CORS, 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); };
const log = (...a) => console.log('[replicate-bridge]', ...a);

// Resolve the model's latest version once (the /v1/predictions endpoint works for ALL models,
// unlike /v1/models/.../predictions which only works for Replicate's official models).
const versionCache = new Map();
async function resolveVersion(token, model) {
  if (versionCache.has(model)) return versionCache.get(model);
  const m = await fetch(`${REPL}/v1/models/${model}`, { headers: { Authorization: `Bearer ${token}` } });
  const info = await m.json();
  if (!m.ok) throw new Error('model "' + model + '" ' + m.status + ': ' + (info.detail || JSON.stringify(info).slice(0, 150)));
  const v = info.latest_version && info.latest_version.id;
  if (!v) throw new Error('model "' + model + '" has no runnable version');
  versionCache.set(model, v);
  return v;
}

async function startReplicate(token, input, model) {
  const version = await resolveVersion(token, model);
  const r = await fetch(`${REPL}/v1/predictions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ version, input }),
  });
  const pred = await r.json();
  if (!r.ok) throw new Error('Replicate ' + r.status + ': ' + JSON.stringify(pred).slice(0, 200));
  return pred;
}

function remesh(rawGlb, watertight) {
  return new Promise((resolve) => {
    const stamp = Date.now();
    const inP = `${TMP}/repl_raw_${stamp}.glb`, outP = `${TMP}/repl_print_${stamp}.glb`;
    writeFileSync(inP, rawGlb);
    const args = ['tools/mesh-print.py', inP, outP, '--size', SIZE];
    if (watertight) args.push('--voxel', '0.8');   // 'watertight' print style -> sealed voxel remesh
    log('remesh', watertight ? '(watertight / voxel)' : '(detail)');
    const py = spawn('python3', args, { stdio: 'inherit' });
    const finish = () => {
      if (existsSync(outP)) return resolve(outP);
      // never lose a paid-for generation: if mesh-print produced nothing, serve the RAW mesh
      writeFileSync(outP, rawGlb);
      log('mesh-print produced nothing — serving the RAW mesh (open in your slicer + auto-repair)');
      resolve(outP);
    };
    py.on('close', finish);
    py.on('error', (e) => { log('mesh-print spawn error:', e.message); finish(); });
  });
}

// advance a task: poll Replicate, and when it succeeds, fetch the GLB + remesh (once)
async function advance(t) {
  if (t.status === 'SUCCEEDED' || t.status === 'FAILED') return;
  const g = await fetch(t.pred.urls.get, { headers: { Authorization: `Bearer ${t.token}` } });
  const pred = await g.json();
  t.progress = pred.status === 'processing' ? 60 : 20;
  // capture Replicate's own failure reason (model crash / CUDA OOM on their side) — the most
  // common real failure; without t.err the UI would fall back to the generic message.
  if (pred.status === 'failed' || pred.status === 'canceled') { t.status = 'FAILED'; t.err = pred.error || ('Replicate prediction ' + pred.status); return; }
  if (pred.status !== 'succeeded') return;
  const url = findMeshUrl(pred.output);
  if (!url) { t.status = 'FAILED'; t.err = 'no mesh url'; return; }
  if (t.remeshing) return; t.remeshing = true;
  log('task', t.id, 'Replicate done -> remeshing for print');
  try {
    const raw = Buffer.from(await (await fetch(url)).arrayBuffer());
    t.glbPath = await remesh(raw, t.quality === 'watertight');
    t.status = 'SUCCEEDED'; t.progress = 100;
    log('task', t.id, 'print-ready GLB ready');
  } catch (e) { t.status = 'FAILED'; t.err = String(e.message || e); log('remesh error', t.err); }
}

const server = http.createServer((req, res) => {
  // gate cross-origin / DNS-rebinding callers before any token use (see bridge-guard.mjs).
  // ACAO stays '*' because only loopback-origin requests get this far and there are no cookies.
  const access = checkAccess(req);
  if (!access.ok) {
    if (req.method === 'OPTIONS') { res.writeHead(403); return res.end(); }
    res.writeHead(403, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ error: 'forbidden: non-local or cross-origin request blocked' }));
  }
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const u = req.url.split('?')[0];

  // serve a finished print-ready GLB
  if (req.method === 'GET' && u.startsWith('/mesh/')) {
    const t = tasks.get(u.slice('/mesh/'.length));
    if (!t || !t.glbPath || !existsSync(t.glbPath)) return json(res, 404, { error: 'not ready' });
    res.writeHead(200, { ...CORS, 'content-type': 'model/gltf-binary' }); return res.end(readFileSync(t.glbPath));
  }
  // submit (Meshy-shaped): text-to-3d or image-to-3d
  if (req.method === 'POST') {
    let body = ''; req.on('data', (c) => (body += c));
    req.on('end', async () => {
      if (!token) return json(res, 401, { error: 'no Replicate token (set it in Moldable Settings -> AI mesh)' });
      let b = {}; try { b = JSON.parse(body || '{}'); } catch {}
      // model-aware input: Trellis uses `images` (list) + needs generate_model:true for a GLB; others use `image`/`prompt`
      let input;
      const model = slugFor(b.model);   // per-request model (GUI picks Trellis vs Hunyuan); falls back to env default
      if (/trellis/i.test(model)) {
        if (!b.image_url) return json(res, 400, { error: 'Trellis is image-to-3D — use the Sculpt-from-photo tab' });
        input = { images: [b.image_url], generate_model: true, mesh_simplify: TRELLIS_SIMPLIFY, ss_sampling_steps: TRELLIS_STEPS, slat_sampling_steps: TRELLIS_STEPS };
      } else if (b.image_url) {
        input = { image: b.image_url };
      } else {
        input = { prompt: b.prompt };
      }
      try {
        const pred = await startReplicate(token, input, model);
        const id = 'rb' + (++seq);
        tasks.set(id, { id, token, pred, status: 'IN_PROGRESS', progress: 5, quality: b.quality, model });
        log('task', id, 'submitted to', model, b.image_url ? '(image, ' + Math.round((b.image_url.length * 0.75) / 1024) + 'KB)' : JSON.stringify(b.prompt));
        json(res, 200, { result: id });
      } catch (e) { log('SUBMIT FAILED:', String(e.message || e).slice(0, 400)); json(res, 502, { error: String(e.message || e) }); }
    });
    return;
  }
  // poll (Meshy-shaped)
  if (req.method === 'GET') {
    const id = u.split('/').pop();
    const t = tasks.get(id);
    if (!t) return json(res, 404, { error: 'unknown task' });
    advance(t).catch((e) => log('advance err', e.message));
    return json(res, 200, {
      status: t.status, progress: t.progress || 0,
      error: t.err,   // surface the real failure (e.g. mesh-print error) so the UI doesn't blame the prompt
      model_urls: t.status === 'SUCCEEDED' ? { glb: `http://localhost:${PORT}/mesh/${id}` } : {},
    });
  }
  json(res, 404, { error: 'not found' });
});
server.listen(PORT, '127.0.0.1', () => log(`ready on http://localhost:${PORT}  -> Replicate ${MODEL} -> mesh-print -> GLB`));   // loopback only — it forwards your Replicate token, never expose it to the LAN
