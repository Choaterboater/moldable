#!/usr/bin/env node
// local-mesh-bridge.mjs — lets Moldable's "Sculpt from photo" use a LOCAL Hunyuan3D
// server (free, no token) from the GUI. Speaks the SAME Meshy-shaped contract as
// tools/replicate-bridge.mjs (so cad/mesh.js needs ZERO changes), but internally:
//   GUI submit -> local Hunyuan3D server (image dataURI -> raw GLB)
//   -> tools/mesh-print.py (scale/seal/on-bed) -> serves the print-ready GLB back.
//
// Contract (identical to replicate-bridge.mjs / Meshy):
//   POST /openapi/v1/image-to-3d        {image_url, quality, model} -> {result: taskId}
//   GET  /openapi/v1/image-to-3d/:id    -> {status, progress, model_urls:{glb}}
//   GET  /mesh/:id                      -> the print-ready GLB bytes
//
// Unlike Replicate there is NO token — the Authorization header is ignored. The only
// dependency is a running Hunyuan3D api_server.py (RTX 3080, 10-12GB) on HUNYUAN_URL.
//
//   node tools/local-mesh-bridge.mjs                 # bridge :8788 -> Hunyuan :8080
//   HUNYUAN_URL=http://127.0.0.1:8080 HUNYUAN_MODE=async MESH_SIZE=90 node tools/local-mesh-bridge.mjs
import http from 'node:http';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import os from 'node:os';
import { checkAccess } from './bridge-guard.mjs';

const PORT = Number(process.env.PORT || 8788);
// Hunyuan3D's api_server.py — http://host:8080 by default. No auth, no slug, one model.
const HY = (process.env.HUNYUAN_URL || 'http://127.0.0.1:8080').replace(/\/+$/, '');
// 'generate' = stock synchronous endpoint (we run it in the background); 'async' = /send + /status.
const MODE = (process.env.HUNYUAN_MODE || 'generate').toLowerCase();
const SIZE = process.env.MESH_SIZE || '80';
const STEPS = Number(process.env.HUNYUAN_STEPS || 30);      // num_inference_steps — 20-30 is plenty on a 3080
const OCTREE = Number(process.env.HUNYUAN_OCTREE || 256);   // octree_resolution — 256 fits 10-12GB; 384 risks OOM
const TEXTURE = /^(1|true|yes)$/i.test(process.env.HUNYUAN_TEXTURE || '');  // skip texturing -> faster + less VRAM
const TMP = process.env.TMPDIR || os.tmpdir();                                    // cross-platform (Windows %TEMP%)
const PY = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');  // stock Windows python.org has no 'python3'
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, GET, OPTIONS', 'access-control-allow-headers': 'authorization, content-type' };
const tasks = new Map();
let seq = 0;
let gpuQueue = Promise.resolve();   // serialize generations: one GPU job at a time (a 10GB 3080 can't run two at once)

const json = (res, code, obj) => { res.writeHead(code, { ...CORS, 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); };
const log = (...a) => console.log('[local-mesh-bridge]', ...a);

// Moldable sends a data URI ("data:image/png;base64,AAAA..."). Hunyuan3D wants the RAW
// base64 (no prefix) in the `image` field — so strip the "data:...;base64," header.
function dataUriToBase64(dataUri) {
  const m = /^data:[^;,]*(;base64)?,(.*)$/s.exec(dataUri || '');
  if (!m) return null;
  return m[1] ? m[2] : Buffer.from(decodeURIComponent(m[2]), 'utf8').toString('base64');
}

function hyBody(imageB64) {
  return JSON.stringify({
    image: imageB64,
    num_inference_steps: STEPS,
    octree_resolution: OCTREE,
    texture: TEXTURE,
    type: 'glb',
  });
}

// --- talk to Hunyuan3D, return raw GLB bytes (Buffer) ---
// /generate is SYNCHRONOUS: it blocks for the whole gen (~30-120s on a 3080) and streams
// the GLB file back. /send returns {uid} immediately and /status/:uid yields base64 when done.
async function hyGenerate(imageB64) {
  const r = await fetch(`${HY}/generate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: hyBody(imageB64) });
  if (!r.ok) throw new Error('Hunyuan /generate ' + r.status + ': ' + (await r.text()).slice(0, 200));
  return Buffer.from(await r.arrayBuffer());            // GLB bytes, straight back
}
async function hySend(imageB64) {
  const r = await fetch(`${HY}/send`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: hyBody(imageB64) });
  const j = await r.json();
  if (!r.ok || !j.uid) throw new Error('Hunyuan /send ' + r.status + ': ' + JSON.stringify(j).slice(0, 200));
  return j.uid;
}
async function hyStatus(uid) {
  const r = await fetch(`${HY}/status/${uid}`);
  const j = await r.json();                              // {status:'processing'} | {status:'completed', model_base64}
  if (!r.ok) throw new Error('Hunyuan /status ' + r.status + ': ' + JSON.stringify(j).slice(0, 200));
  return j;
}

// identical to replicate-bridge.mjs — turn raw GLB into a print-ready GLB via mesh-print.py
function remesh(rawGlb, watertight) {
  return new Promise((resolve) => {
    const stamp = Date.now();
    const inP = `${TMP}/hy_raw_${stamp}.glb`, outP = `${TMP}/hy_print_${stamp}.glb`;
    writeFileSync(inP, rawGlb);
    const args = ['tools/mesh-print.py', inP, outP, '--size', SIZE];
    if (watertight) args.push('--voxel', '0.8');        // 'watertight' style -> sealed voxel remesh
    log('remesh', watertight ? '(watertight / voxel)' : '(detail)');
    const py = spawn(PY, args, { stdio: 'inherit' });
    const finish = () => {
      if (existsSync(outP)) return resolve(outP);
      writeFileSync(outP, rawGlb);                       // never lose a generation: serve RAW on failure
      log('mesh-print produced nothing — serving the RAW mesh (auto-repair in your slicer)');
      resolve(outP);
    };
    py.on('close', finish);
    py.on('error', (e) => { log('mesh-print spawn error:', e.message); finish(); });
  });
}

// Run the whole local pipeline for a task in the background. Because Hunyuan is local and
// (in 'generate' mode) blocking, we DON'T poll a remote job — we just await the bytes here
// and flip the task to SUCCEEDED. The GUI's poll loop reads t.status/t.progress meanwhile.
async function runTask(t, imageB64) {
  try {
    let raw;
    if (MODE === 'async') {
      const uid = await hySend(imageB64);
      t.progress = 20;
      for (;;) {                                        // poll the local server until completed
        const s = await hyStatus(uid);
        if (s.status === 'completed') { raw = Buffer.from(s.model_base64, 'base64'); break; }
        if (s.status === 'error' || s.status === 'failed') throw new Error('Hunyuan job ' + s.status);
        t.progress = Math.min(60, (t.progress || 20) + 5);
        await new Promise((r) => setTimeout(r, 2000));
      }
    } else {
      raw = await hyGenerate(imageB64);                 // blocks here; bytes returned directly
    }
    t.progress = 70;
    log('task', t.id, 'Hunyuan done -> remeshing for print');
    t.glbPath = await remesh(raw, t.quality === 'watertight');
    t.status = 'SUCCEEDED'; t.progress = 100;
    log('task', t.id, 'print-ready GLB ready');
  } catch (e) {
    t.status = 'FAILED'; t.err = String(e.message || e);
    log('task', t.id, 'FAILED:', t.err);
  }
}

const server = http.createServer((req, res) => {
  // gate cross-origin / DNS-rebinding callers (see bridge-guard.mjs) before running any GPU job.
  const access = checkAccess(req);
  if (!access.ok) {
    if (req.method === 'OPTIONS') { res.writeHead(403); return res.end(); }
    res.writeHead(403, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ error: 'forbidden: non-local or cross-origin request blocked' }));
  }
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
  const u = req.url.split('?')[0];

  // serve a finished print-ready GLB
  if (req.method === 'GET' && u.startsWith('/mesh/')) {
    const t = tasks.get(u.slice('/mesh/'.length));
    if (!t || !t.glbPath || !existsSync(t.glbPath)) return json(res, 404, { error: 'not ready' });
    res.writeHead(200, { ...CORS, 'content-type': 'model/gltf-binary' }); return res.end(readFileSync(t.glbPath));
  }
  // submit (Meshy-shaped). image-to-3d only — Hunyuan3D is image-driven, no token needed.
  if (req.method === 'POST') {
    let body = ''; req.on('data', (c) => (body += c));
    req.on('end', () => {
      let b = {}; try { b = JSON.parse(body || '{}'); } catch {}
      if (!b.image_url) return json(res, 400, { error: 'local Hunyuan bridge is image-to-3D — use the Sculpt-from-photo tab' });
      const imageB64 = dataUriToBase64(b.image_url);
      if (!imageB64) return json(res, 400, { error: 'image_url must be a base64 data URI' });
      const id = 'lh' + (++seq);
      const t = { id, status: 'IN_PROGRESS', progress: 5, quality: b.quality };
      tasks.set(id, t);
      log('task', id, 'queued for local Hunyuan (image, ' + Math.round((imageB64.length * 0.75) / 1024) + 'KB,', MODE + ' mode)');
      gpuQueue = gpuQueue.then(() => runTask(t, imageB64)).catch(() => {});   // one GPU job at a time; reply now so the submit fetch doesn't hang
      json(res, 200, { result: id });
    });
    return;
  }
  // poll (Meshy-shaped). No remote call here — runTask() already drives the task in the background.
  if (req.method === 'GET') {
    const id = u.split('/').pop();
    const t = tasks.get(id);
    if (!t) return json(res, 404, { error: 'unknown task' });
    return json(res, 200, {
      status: t.status, progress: t.progress || 0,
      error: t.err,   // surface the real failure (e.g. Hunyuan OOM) so the UI doesn't blame the prompt
      model_urls: t.status === 'SUCCEEDED' ? { glb: `http://localhost:${PORT}/mesh/${id}` } : {},
    });
  }
  json(res, 404, { error: 'not found' });
});
server.listen(PORT, '127.0.0.1', () => {   // loopback only — runs GPU jobs with no token, never expose it to the LAN
  log(`ready on http://localhost:${PORT}  -> Hunyuan3D ${HY} (${MODE}) -> mesh-print -> GLB`);
  if (!existsSync('tools/mesh-print.py')) log('WARNING: tools/mesh-print.py not found in cwd — launch this from the Moldable repo root, or remesh is skipped (raw mesh served).');
});
