#!/usr/bin/env node
// replicate-generate.mjs — text or image -> Replicate 3D model (Hunyuan3D / Trellis) -> GLB
//                          -> print-ready STL (via tools/mesh-print.py). Runs on any machine
//                          (no GPU — Replicate does the GPU work in the cloud).
//
// SETUP (this is "where you add the Replicate API key"):
//   1. Get a token: https://replicate.com/account/api-tokens   (starts with r8_)
//   2. export REPLICATE_API_TOKEN=r8_xxxxxxxx
//
// USE:
//   node tools/replicate-generate.mjs "a ripe banana" --size 90              # text -> 3D
//   node tools/replicate-generate.mjs --image photo.jpg --size 90            # image -> 3D
//   node tools/replicate-generate.mjs "a frog" --model firtoz/trellis        # different model
//   node tools/replicate-generate.mjs "a frog" --dry-run                     # show the request, send nothing
//
// Output: <name>.glb (raw) + <name>_print.stl (watertight, scaled, on-bed).
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { extname, basename } from 'node:path';

const args = process.argv.slice(2);
const opt = { model: 'tencent/hunyuan-3d-3.1', size: 80, out: 'sculpt', dryRun: false, image: null, prompt: null };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--model') opt.model = args[++i];
  else if (a === '--size') opt.size = Number(args[++i]);
  else if (a === '--out') opt.out = args[++i];
  else if (a === '--image') opt.image = args[++i];
  else if (a === '--dry-run') opt.dryRun = true;
  else if (!a.startsWith('--')) opt.prompt = a;
}

const TOKEN = process.env.REPLICATE_API_TOKEN;
if (!TOKEN && !opt.dryRun) {
  console.error('No REPLICATE_API_TOKEN set.\n  Get one at https://replicate.com/account/api-tokens then:\n  export REPLICATE_API_TOKEN=r8_xxxx');
  process.exit(1);
}
if (!opt.prompt && !opt.image) { console.error('Give a text prompt or --image <file>.'); process.exit(1); }

// Build the model input. Hunyuan3D-3.1 takes EITHER prompt OR image; image models take image.
const input = {};
if (opt.image) {
  const buf = readFileSync(opt.image);
  const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }[extname(opt.image).toLowerCase()] || 'image/png';
  input.image = `data:${mime};base64,${buf.toString('base64')}`;
} else {
  input.prompt = opt.prompt;       // text -> 3D (Hunyuan3D-3.1)
}

const BASE = process.env.REPLICATE_API_BASE || 'https://api.replicate.com';   // override for testing
const url = `${BASE}/v1/models/${opt.model}/predictions`;
const body = { input };
if (opt.dryRun) {
  console.log('POST', url);
  console.log('headers: Authorization: Bearer <token>, Prefer: wait');
  console.log('body:', JSON.stringify({ input: opt.image ? { image: `data:...(${input.image.length} chars)` } : input }, null, 2));
  process.exit(0);
}

// recursively find the first mesh URL in any output shape
function findMeshUrl(o) {
  if (typeof o === 'string') return /\.(glb|obj|ply|stl)(\?|$)/i.test(o) ? o : null;
  if (Array.isArray(o)) { for (const v of o) { const r = findMeshUrl(v); if (r) return r; } return null; }
  if (o && typeof o === 'object') { for (const v of Object.values(o)) { const r = findMeshUrl(v); if (r) return r; } }
  return null;
}

async function main() {
  console.log(`Replicate ${opt.model}: ${opt.image ? 'image' : JSON.stringify(opt.prompt)} -> 3D ...`);
  let r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', Prefer: 'wait' },
    body: JSON.stringify(body),
  });
  let pred = await r.json();
  if (!r.ok) { console.error('Replicate error:', JSON.stringify(pred).slice(0, 400)); process.exit(1); }

  // poll until terminal (Prefer: wait usually returns done, but be safe)
  while (pred.status && !['succeeded', 'failed', 'canceled'].includes(pred.status)) {
    await new Promise((s) => setTimeout(s, 2000));
    const g = await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${TOKEN}` } });
    pred = await g.json();
    process.stdout.write('.');
  }
  if (pred.status !== 'succeeded') { console.error('\ngeneration', pred.status, '-', JSON.stringify(pred.error || '').slice(0, 300)); process.exit(1); }

  const mesh = findMeshUrl(pred.output);
  if (!mesh) { console.error('\nno mesh URL in output:', JSON.stringify(pred.output).slice(0, 300)); process.exit(1); }
  console.log('\ngot mesh:', mesh.slice(0, 80));

  const glbPath = `${opt.out}.glb`;
  const mb = await fetch(mesh);
  writeFileSync(glbPath, Buffer.from(await mb.arrayBuffer()));
  console.log('downloaded', glbPath, '(Replicate URLs expire in ~1h — saved locally)');

  // remesh -> printable STL
  const stlPath = `${opt.out}_print.stl`;
  console.log('remeshing for print ->', stlPath);
  const py = spawnSync('python3', ['tools/mesh-print.py', glbPath, stlPath, '--size', String(opt.size)], { stdio: 'inherit' });
  process.exit(py.status || 0);
}
main();
