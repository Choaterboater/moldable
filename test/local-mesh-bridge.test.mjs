import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { EventEmitter, once } from 'node:events';
import { spawn } from 'node:child_process';

// Run the real bridge against a synthetic upstream. It returns 503 so valid
// submissions exercise decoding without running a GPU job or the remesher.
test('local mesh bridge rejects malformed data URIs without crashing or queuing jobs', { timeout: 15000 }, async t => {
  const submissions = new EventEmitter();
  let submitted = 0;
  const upstream = http.createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    submitted++;
    submissions.emit('submit', JSON.parse(body));
    res.writeHead(503);
    res.end('synthetic upstream');
  });
  let child;
  t.after(async () => {
    if (child && child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await exited;
    }
    await new Promise(resolve => upstream.close(resolve));
  });
  upstream.listen(0, '127.0.0.1');
  await once(upstream, 'listening', { signal: t.signal });

  // Report the ephemeral port over IPC; no fixed ports or startup sleeps.
  const bootstrap = `
    import http from 'node:http';
    const listen = http.Server.prototype.listen;
    http.Server.prototype.listen = function (...args) {
      this.once('listening', () => process.send({ port: this.address().port }));
      return listen.apply(this, args);
    };
    await import(${JSON.stringify(new URL('../tools/local-mesh-bridge.mjs', import.meta.url).href)});
  `;
  child = spawn(process.execPath, ['--input-type=module', '--eval', bootstrap], {
    cwd: new URL('../', import.meta.url),
    env: { ...process.env, PORT: '0', HUNYUAN_URL: `http://127.0.0.1:${upstream.address().port}`, HUNYUAN_MODE: 'generate' },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });
  child.stdout.resume();
  child.stderr.resume();
  const [{ port }] = await once(child, 'message', { signal: t.signal });
  const base = `http://127.0.0.1:${port}`;
  const submit = image_url => fetch(base + '/openapi/v1/image-to-3d', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ image_url }), signal: t.signal,
  });

  for (const image of ['data:image/png,%', 'data:image/png,%ZZ', 'data:image/png,%C3%28', 'data:image/png,%E0%A4']) {
    const response = await submit(image);
    assert.equal(response.status, 400, image);
    assert.deepEqual(await response.json(), { error: 'image_url must be a base64 data URI' });
  }
  assert.equal(submitted, 0, 'invalid images must not reach the upstream');
  const missing = await fetch(base + '/openapi/v1/image-to-3d/lh1', { signal: t.signal });
  assert.equal(missing.status, 404, 'invalid images must not create a task');
  await missing.arrayBuffer();

  // A valid request after the malformed ones proves the process remains usable.
  for (const [index, image, expected] of [
    [1, 'data:image/png,hello%20world', 'aGVsbG8gd29ybGQ='],
    [2, 'data:image/png;base64,aGVsbG8=', 'aGVsbG8='],
  ]) {
    const received = once(submissions, 'submit', { signal: t.signal });
    const response = await submit(image);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { result: 'lh' + index });
    const [body] = await received;
    assert.equal(body.image, expected);
  }
  assert.equal(submitted, 2);
});
