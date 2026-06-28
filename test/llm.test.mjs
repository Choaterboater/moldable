// test/llm.test.mjs — verify provider dispatch builds the right request per provider.
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
const llm = await import('../cad/llm.js');

let last = null;
globalThis.fetch = async (url, opts) => {
  const u = String(url);
  if (/\/v1\/models$/.test(u)) return { ok: true, json: async () => ({ object: 'list', data: [{ id: 'sonnet' }, { id: 'opus' }, { id: 'haiku' }] }) };  // detectBridge ping
  last = { url: u, headers: opts && opts.headers, body: (opts && opts.body) ? JSON.parse(opts.body) : null };
  if (u.includes('anthropic.com')) return { ok: true, json: async () => ({ content: [{ type: 'text', text: 'AOK' }] }) };
  return { ok: true, json: async () => ({ choices: [{ message: { content: 'OOK' } }] }) };
};

let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('PASS', n, x); } else { fail++; console.log('FAIL', n, x); } };
const call = () => llm.callClaude({ system: 'SYS', messages: [{ role: 'user', content: 'hi' }] });

// anthropic
store.clear(); llm.setProvider('anthropic'); llm.setApiKey('sk-ant-x');
let t = await call();
ok('anthropic url', /api\.anthropic\.com\/v1\/messages/.test(last.url));
ok('anthropic key header', last.headers['x-api-key'] === 'sk-ant-x');
ok('anthropic browser header', last.headers['anthropic-dangerous-direct-browser-access'] === 'true');
ok('anthropic body has top-level system', last.body.system === 'SYS' && Array.isArray(last.body.messages));
ok('anthropic reply parsed', t === 'AOK', t);

// openrouter
store.clear(); llm.setProvider('openrouter'); llm.setApiKey('sk-or-x'); llm.setModel('anthropic/claude-sonnet-4.6');
t = await call();
ok('openrouter url', /openrouter\.ai\/api\/v1\/chat\/completions/.test(last.url), last.url);
ok('openrouter bearer', last.headers['authorization'] === 'Bearer sk-or-x');
ok('openrouter model', last.body.model === 'anthropic/claude-sonnet-4.6');
ok('openrouter OpenAI shape (system as message[0])', last.body.messages[0].role === 'system' && last.body.messages[1].role === 'user');
ok('openrouter reply parsed', t === 'OOK', t);

// custom / local (Claude CLI bridge)
store.clear(); llm.setProvider('custom'); llm.setBaseUrl('http://localhost:8787/v1'); llm.setModel('sonnet');
t = await call();
ok('custom url', last.url === 'http://localhost:8787/v1/chat/completions', last.url);
ok('custom reply parsed', t === 'OOK', t);
ok('custom configured w/o key', llm.isConfigured() === true);

// claude-cli (first-class local bridge: no key, no base URL needed)
store.clear(); llm.setProvider('claude-cli');
ok('claude-cli configured w/o key', llm.isConfigured() === true);
t = await call();
ok('claude-cli url defaults to bridge', last.url === 'http://localhost:8787/v1/chat/completions', last.url);
ok('claude-cli sends no auth header', !(last.headers && last.headers['authorization']));
ok('claude-cli reply parsed', t === 'OOK', t);
{
  const det = await llm.detectBridge();
  ok('detectBridge ok + lists models', det.ok === true && det.models.includes('opus'), JSON.stringify(det));
  const prof = llm.authorProfile();
  ok('authorProfile routes claude-cli → opus/16000', prof.provider === 'claude-cli' && prof.model === 'opus' && prof.maxTokens === 16000, JSON.stringify(prof));
}
// anthropic authorProfile keeps the chosen model + the standard budget
store.clear(); llm.setProvider('anthropic'); llm.setApiKey('sk-ant-x'); llm.setModel('claude-opus-4-8');
{
  const prof2 = llm.authorProfile();
  ok('authorProfile anthropic → chosen model/8000', prof2.provider === 'anthropic' && prof2.model === 'claude-opus-4-8' && prof2.maxTokens === 8000, JSON.stringify(prof2));
}

// not configured -> NoKeyError
store.clear(); llm.setProvider('anthropic');
try { await call(); ok('unconfigured throws', false); }
catch (e) { ok('unconfigured throws', e.code === 'no-api-key', e.code); }

console.log('\n' + '='.repeat(40));
console.log(`${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
console.log('LLM provider dispatch verified ✓');
