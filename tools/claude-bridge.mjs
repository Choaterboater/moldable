#!/usr/bin/env node
// claude-bridge.mjs — expose the local Claude CLI as an OpenAI-compatible endpoint
// so Moldable's "Custom / Local" provider can drive interpretation + freeform
// authoring through your installed `claude` CLI (no API key needed).
//
//   node tools/claude-bridge.mjs            # listens on http://localhost:8787/v1
//   PORT=9000 node tools/claude-bridge.mjs  # custom port
//
// Then in Moldable → Settings: provider "Custom / Local", base URL
// http://localhost:8787/v1, model "sonnet" (or opus / haiku / a full id).
import http from 'node:http';
import { spawn } from 'node:child_process';
import { checkAccess } from './bridge-guard.mjs';

const PORT = Number(process.env.PORT || 8787);
const CLAUDE = process.env.CLAUDE_BIN || 'claude';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, GET, OPTIONS',
  'access-control-allow-headers': 'authorization, content-type',
};

// CLI accepts aliases reliably; map common API ids to them.
function toCliModel(m) {
  const s = (m || '').toLowerCase();
  if (s.includes('opus')) return 'opus';
  if (s.includes('haiku')) return 'haiku';
  if (s.includes('sonnet') || !s) return 'sonnet';
  return m; // pass through a full id the CLI might know
}

const TIMEOUT_MS = Number(process.env.CLAUDE_TIMEOUT_MS || 150000);

function spawnClaude({ system, prompt, model, signal }) {
  return new Promise((resolve, reject) => {
    if (signal && signal.aborted) return reject(new Error('client disconnected'));
    // --strict-mcp-config (with no --mcp-config): ignore the user's configured MCP
    // servers, whose startup otherwise dominates the call (150s+ → a few s). NOTE: do
    // NOT add --max-turns 1 — it makes `claude -p` exit 1 on a full authoring generation.
    const args = ['-p', '--output-format', 'text', '--strict-mcp-config'];
    if (system) args.push('--append-system-prompt', system);
    args.push('--model', toCliModel(model));
    const child = spawn(CLAUDE, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '', err = '', settled = false;
    const finish = (fn, v) => { if (settled) return; settled = true; clearTimeout(timer); fn(v); };
    const timer = setTimeout(() => { try { child.kill('SIGKILL'); } catch {} finish(reject, new Error('claude timed out after ' + Math.round(TIMEOUT_MS / 1000) + 's')); }, TIMEOUT_MS);
    // client gave up (browser cancelled / disconnected) — don't keep churning on dead work
    if (signal) signal.addEventListener('abort', () => { try { child.kill('SIGKILL'); } catch {} finish(reject, new Error('client disconnected')); }, { once: true });
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', (e) => finish(reject, e));
    child.on('close', (code) => (code === 0 ? finish(resolve, out.trim()) : finish(reject, new Error('claude exited ' + code + ': ' + err.slice(0, 300)))));
    child.stdin.on('error', (e) => finish(reject, e));  // EPIPE if claude exits early — don't crash the bridge
    child.stdin.write(prompt);
    child.stdin.end();
  });
}

// the claude CLI can deadlock on concurrent invocations — run one at a time.
// If the client already gave up while queued, skip the spawn entirely.
let chain = Promise.resolve();
function runClaude(req) {
  const run = () => (req.signal && req.signal.aborted) ? Promise.reject(new Error('client disconnected')) : spawnClaude(req);
  const next = chain.then(run, run);
  chain = next.catch(() => {});
  return next;
}

const server = http.createServer((req, res) => {
  // gate cross-origin / DNS-rebinding callers before spawning the local Claude CLI.
  // Without this, any open web page could run `claude` with arbitrary prompts.
  const access = checkAccess(req);
  if (!access.ok) {
    if (req.method === 'OPTIONS') { res.writeHead(403); return res.end(); }
    res.writeHead(403, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ error: { message: 'forbidden: non-local or cross-origin request blocked' } }));
  }
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
  if (req.method === 'GET' && req.url.startsWith('/v1/models')) {
    res.writeHead(200, { ...CORS, 'content-type': 'application/json' });
    return res.end(JSON.stringify({ object: 'list', data: ['sonnet', 'opus', 'haiku'].map((id) => ({ id, object: 'model' })) }));
  }
  if (req.method !== 'POST' || !req.url.startsWith('/v1/chat/completions')) {
    res.writeHead(404, CORS); return res.end('not found');
  }
  let body = '';
  const ctrl = new AbortController();
  req.on('error', () => {});   // client disconnect mid-body must not crash the process
  res.on('close', () => ctrl.abort());   // browser cancelled/disconnected → kill the in-flight (or queued) claude
  req.on('data', (c) => (body += c));
  req.on('end', async () => {
    try {
      const { messages = [], model } = JSON.parse(body || '{}');
      const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
      const prompt = messages.filter((m) => m.role !== 'system').map((m) => m.content).join('\n\n');
      const t0 = Date.now();
      const text = await runClaude({ system, prompt, model, signal: ctrl.signal });
      console.log(`[claude-bridge] ${model || 'sonnet'} -> ${text.length} chars in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
      res.writeHead(200, { ...CORS, 'content-type': 'application/json' });
      res.end(JSON.stringify({
        id: 'claude-cli', object: 'chat.completion', model: model || 'sonnet',
        choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: 'stop' }],
      }));
    } catch (e) {
      console.error('[claude-bridge] error:', e.message);
      res.writeHead(500, { ...CORS, 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: { message: String(e.message || e) } }));
    }
  });
});

server.listen(PORT, '127.0.0.1', () => console.log(`claude-bridge → OpenAI-compatible at http://localhost:${PORT}/v1  (using "${CLAUDE}")`));   // loopback only — this runs your local CLI, never expose it to the LAN
