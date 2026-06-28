#!/usr/bin/env node
// mesh-bridge.mjs — CORS proxy for an AI-mesh API (default Meshy), so Moldable's
// browser "Sculpt with AI" can reach it (these APIs usually block direct browser
// calls / don't send CORS headers). It forwards every request to the upstream and
// injects your key, so the key never lives in the browser.
//
//   MESH_KEY=msy-xxxx node tools/mesh-bridge.mjs          # proxies https://api.meshy.ai
//   MESH_KEY=... MESH_UPSTREAM=https://api.tripo3d.ai PORT=8788 node tools/mesh-bridge.mjs
//
// Then in Moldable → Settings → AI mesh: provider "Custom / bridge",
// base URL http://localhost:8788  (the bridge is Meshy-shaped, matching cad/mesh.js).
import http from 'node:http';
import { checkAccess } from './bridge-guard.mjs';

const PORT = Number(process.env.PORT || 8788);
const UPSTREAM = (process.env.MESH_UPSTREAM || 'https://api.meshy.ai').replace(/\/+$/, '');
const KEY = process.env.MESH_KEY || '';
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, GET, OPTIONS',
  'access-control-allow-headers': 'authorization, content-type',
};
if (!KEY) console.warn('[mesh-bridge] warning: no MESH_KEY set — upstream calls will be unauthorized');

const server = http.createServer((req, res) => {
  // gate cross-origin / DNS-rebinding callers before forwarding upstream with the injected key.
  const access = checkAccess(req);
  if (!access.ok) {
    if (req.method === 'OPTIONS') { res.writeHead(403); return res.end(); }
    res.writeHead(403, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ error: { message: 'forbidden: non-local or cross-origin request blocked' } }));
  }
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
  let body = '';
  req.on('error', () => {});
  req.on('data', (c) => (body += c));
  req.on('end', async () => {
    const url = UPSTREAM + req.url;
    try {
      const headers = { 'content-type': 'application/json' };
      if (KEY) headers['authorization'] = 'Bearer ' + KEY;
      const up = await fetch(url, { method: req.method, headers, body: req.method === 'POST' ? body : undefined });
      const text = await up.text();
      console.log(`[mesh-bridge] ${req.method} ${req.url} -> ${up.status}`);
      res.writeHead(up.status, { ...CORS, 'content-type': up.headers.get('content-type') || 'application/json' });
      res.end(text);
    } catch (e) {
      console.error('[mesh-bridge] error:', e.message);
      res.writeHead(502, { ...CORS, 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'mesh-bridge upstream error: ' + e.message } }));
    }
  });
});
server.listen(PORT, '127.0.0.1', () => console.log(`mesh-bridge → proxying ${UPSTREAM} at http://localhost:${PORT}  (Meshy-shaped)`));   // loopback only — it injects your API key, never expose it to the LAN
