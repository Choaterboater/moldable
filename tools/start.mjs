#!/usr/bin/env node
// start.mjs — one command brings up everything Moldable needs: the web server (to serve the
// app) AND the mesh bridge (so "Sculpt" can reach a backend). Stops both cleanly on Ctrl+C.
// Cross-platform (Node, no bash); run from the repo root.
//
//   node tools/start.mjs              # Replicate bridge (cloud; paste your token in Settings)
//   node tools/start.mjs local        # local Hunyuan bridge (free; needs your Hunyuan3D server up)
//   node tools/start.mjs meshy        # generic Meshy/Tripo CORS proxy (set MESH_KEY=...)
//   node tools/start.mjs --with-ai    # ALSO start the local Claude CLI bridge (free OpenSCAD authoring)
//   PORT=8765 node tools/start.mjs    # change the web port
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

// flags (--with-ai) are parsed separately from the positional mesh backend, so
// `node tools/start.mjs --with-ai` is NOT mistaken for an unknown backend name.
const argv = process.argv.slice(2);
const withAI = argv.includes('--with-ai') || /^(1|true|yes)$/i.test(process.env.WITH_AI || '');
const positional = argv.filter((a) => !a.startsWith('--'));
const which = (positional[0] || process.env.MESH || 'replicate').toLowerCase();
const BRIDGES = { replicate: 'tools/replicate-bridge.mjs', local: 'tools/local-mesh-bridge.mjs', meshy: 'tools/mesh-bridge.mjs', tripo: 'tools/mesh-bridge.mjs' };
const bridge = BRIDGES[which];
const PORT = process.env.PORT || '8765';            // web server (serves Moldable.dc.html)
const BRIDGE_PORT = process.env.BRIDGE_PORT || '8788';   // mesh bridge — kept separate so changing PORT can't collide it
const AI_PORT = process.env.AI_PORT || '8787';      // Claude-CLI bridge — its own port too
const PY = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');

if (!existsSync('Moldable.dc.html')) { console.error('start.mjs: run this from the Moldable repo root (Moldable.dc.html not found here).'); process.exit(1); }
if (!bridge) { console.error('start.mjs: unknown backend "' + which + '" — use one of: replicate, local, meshy, tripo'); process.exit(1); }
if (!existsSync(bridge)) { console.error('start.mjs: ' + bridge + ' not found.'); process.exit(1); }

const procs = [];
function run(label, cmd, args, opts = {}) {
  const p = spawn(cmd, args, { stdio: 'inherit', ...opts });
  p.on('error', (e) => console.error('[start] ' + label + ' failed to launch: ' + e.message + (label === 'web' ? ' — is ' + PY + ' installed?' : '')));
  p.on('exit', (code) => { if (code && !shuttingDown) console.error('[start] ' + label + ' exited (code ' + code + ')'); });
  procs.push(p);
  return p;
}

console.log('\n  Moldable launcher  ·  backend: ' + which);
console.log('  ' + '─'.repeat(36));
run('web', PY, ['-m', 'http.server', PORT, '--bind', '127.0.0.1']);   // loopback only — match the bridges' posture
// Give the bridge its OWN PORT. Inheriting the web PORT (e.g. PORT=8765 node tools/start.mjs)
// would make the bridge try to bind 8765 too → EADDRINUSE → Sculpt silently has no backend.
run('bridge', process.execPath, [bridge], { env: { ...process.env, PORT: BRIDGE_PORT } });
// optional: the Claude CLI bridge (free local OpenSCAD authoring) on its own port
if (withAI) {
  if (existsSync('tools/claude-bridge.mjs')) run('claude-bridge', process.execPath, ['tools/claude-bridge.mjs'], { env: { ...process.env, PORT: AI_PORT } });
  else console.error('start.mjs: --with-ai set but tools/claude-bridge.mjs not found.');
}

const url = 'http://127.0.0.1:' + PORT + '/Moldable.dc.html';
setTimeout(() => {
  console.log('\n  ▶ Open in your browser:  ' + url);
  console.log('  ▶ Mesh bridge:           ' + which + ' on http://127.0.0.1:' + BRIDGE_PORT);
  if (withAI) console.log('  ▶ Claude CLI bridge:     http://127.0.0.1:' + AI_PORT + '/v1  (pick provider "Claude CLI · free" in Settings)');
  if (which === 'local') console.log('  ▶ Local also needs your Hunyuan3D server running (see DESKTOP_SETUP.md)');
  if (which === 'meshy' || which === 'tripo') console.log('  ▶ Set MESH_KEY=... for the ' + which + ' proxy, and pick provider "Custom" in Settings');
  console.log('  ▶ Stop everything:       Ctrl+C\n');
}, 600);

let shuttingDown = false;
function stop() {
  if (shuttingDown) return; shuttingDown = true;
  console.log('\n  stopping…');
  for (const p of procs) { try { p.kill(); } catch {} }
  setTimeout(() => process.exit(0), 200);
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
