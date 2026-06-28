// cad/llm.js
// Browser-side LLM client with pluggable providers (no backend):
//   - anthropic : api.anthropic.com  (x-api-key, direct-browser-access)
//   - openrouter: openrouter.ai/api/v1  (OpenAI-compatible, Bearer key)
//   - custom    : any OpenAI-compatible base URL — e.g. a LOCAL bridge that
//                 exposes the Claude CLI / LiteLLM / Ollama / LM Studio.
// All keys/config live in localStorage. Not configured -> callers fall back to
// the keyword matcher.
const K = {
  provider: 'moldable_provider',
  key: 'moldable_api_key',
  legacyKey: 'moldable_anthropic_key', // migrate older builds
  base: 'moldable_base_url',
  model: 'moldable_model',
};
const ls = {
  get: (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } },
  set: (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch {} },
};

export const BRIDGE_URL = 'http://localhost:8787/v1';   // the local Claude-CLI bridge (tools/claude-bridge.mjs)

export function getProvider() { return ls.get(K.provider) || 'anthropic'; }
export function setProvider(p) { ls.set(K.provider, p); }
export function getApiKey() { return ls.get(K.key) || ls.get(K.legacyKey); }
export function setApiKey(v) { ls.set(K.key, (v || '').trim()); }
// claude-cli falls back to the known bridge URL so the user types nothing.
export function getBaseUrl() { return ls.get(K.base) || (getProvider() === 'claude-cli' ? BRIDGE_URL : ''); }
export function setBaseUrl(v) { ls.set(K.base, (v || '').trim()); }
export function getModel() { return ls.get(K.model) || DEFAULT_MODEL[getProvider()] || 'claude-sonnet-4-6'; }
export function setModel(m) { ls.set(K.model, (m || '').trim()); }

export const DEFAULT_MODEL = {
  anthropic: 'claude-sonnet-4-6',
  openrouter: 'anthropic/claude-sonnet-4.6',
  custom: 'claude-sonnet-4-6',
  'claude-cli': 'sonnet',
};

// usable = enough config to make a call
export function isConfigured() {
  const p = getProvider();
  if (p === 'claude-cli') return true;                 // the local bridge needs no key
  return p === 'custom' ? !!getBaseUrl() : !!getApiKey();
}
export function hasApiKey() { return isConfigured(); } // back-compat name used by the app

// detectBridge(base?) -> { ok, models? } — a quick ping so the UI can confirm the CLI bridge is up.
export async function detectBridge(base = BRIDGE_URL, timeoutMs = 1500) {
  try {
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const t = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
    const r = await fetch(base.replace(/\/+$/, '') + '/models', { signal: ctrl && ctrl.signal });
    if (t) clearTimeout(t);
    if (!r.ok) return { ok: false };
    const d = await r.json().catch(() => null);
    return { ok: true, models: ((d && d.data) || []).map((m) => m.id).filter(Boolean) };
  } catch { return { ok: false }; }
}

// authorProfile() -> { provider, model, maxTokens } for the heavy authoring/repair step.
// Uses the CONFIGURED provider + model (the CLI defaults to sonnet). We previously forced opus
// on the CLI, but opus via `claude -p` routinely blows past the bridge timeout — and the JSON-IR
// offloads the spatial reasoning so a faster model is plenty. Pick opus in Settings if you want it.
export function authorProfile() {
  return { provider: getProvider(), model: getModel(), maxTokens: 8000 };
}

export class NoKeyError extends Error { constructor() { super('llm-not-configured'); this.code = 'no-api-key'; } }

// callClaude({system, messages, maxTokens, model, signal, timeoutMs}) -> assistant text
export async function callClaude({ system, messages, maxTokens = 2048, model, signal, timeoutMs, provider: providerOverride } = {}) {
  const provider = providerOverride || getProvider();   // a single call can be routed (e.g. authoring → claude-cli) without flipping global state
  const key = getApiKey();
  const mdl = model || getModel();
  const isLocalBridge = provider === 'custom' || provider === 'claude-cli';
  // the local CLI bridge runs the full agent; free opus-via-CLI is slow, so give it room (≥ the bridge's).
  const tmo = timeoutMs || (provider === 'claude-cli' ? 600000 : provider === 'custom' ? 320000 : 180000);

  // never hang forever on a slow/stuck provider — the timeout always applies,
  // composed with any caller-supplied cancel signal.
  let timer = null, sig = signal, timedOut = false;
  if (typeof AbortController !== 'undefined') {
    const ctrl = new AbortController();
    sig = ctrl.signal;
    timer = setTimeout(() => { timedOut = true; ctrl.abort(); }, tmo);
    if (signal) {
      if (signal.aborted) ctrl.abort();
      else signal.addEventListener('abort', () => ctrl.abort(), { once: true });
    }
  }
  const done = () => { if (timer) clearTimeout(timer); };
  const guard = (e) => {
    if (e instanceof NoKeyError) return e;
    if (e && e.name === 'AbortError') return new Error(timedOut ? 'LLM request timed out after ' + Math.round(tmo / 1000) + 's' : 'LLM request cancelled');
    // network failure (connection refused / CORS / DNS) surfaces as a TypeError
    if (e && (e.name === 'TypeError' || /failed to fetch|networkerror|load failed/i.test(e.message || ''))) {
      const where = isLocalBridge ? 'the bridge at ' + (getBaseUrl() || BRIDGE_URL) : provider;
      return new Error("Couldn't reach " + where + '. ' + (isLocalBridge ? 'Start it with `node tools/start.mjs --with-ai`.' : 'Check your network/key.'));
    }
    return e;
  };

  try {
    if (provider === 'anthropic') {
      if (!key) throw new NoKeyError();
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: mdl, max_tokens: maxTokens, system, messages }),
        signal: sig,
      });
      if (!res.ok) throw await httpError(res);
      const data = await res.json();
      if (data.stop_reason === 'max_tokens') throw new Error('Model output hit the token limit — try a simpler description.');
      if (data.stop_reason === 'refusal') throw new Error('The model declined this request — try rephrasing it.');
      return (data.content || []).map((b) => b.text || '').join('').trim();
    }

    // OpenAI-compatible (openrouter / custom / claude-cli)
    const base = provider === 'openrouter' ? 'https://openrouter.ai/api/v1'
               : provider === 'claude-cli' ? (getBaseUrl() || BRIDGE_URL)   // no key required — the local CLI bridge
               : getBaseUrl();
    if (!base) throw new NoKeyError();
    if (provider === 'openrouter' && !key) throw new NoKeyError();
    const headers = { 'content-type': 'application/json' };
    if (key) headers['authorization'] = 'Bearer ' + key;
    if (provider === 'openrouter') { headers['HTTP-Referer'] = 'https://moldable.app'; headers['X-Title'] = 'Moldable'; }
    const res = await fetch(base.replace(/\/+$/, '') + '/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({ model: mdl, max_tokens: maxTokens, messages: [{ role: 'system', content: system }, ...messages] }),
      signal: sig,
    });
    if (!res.ok) throw await httpError(res);
    const data = await res.json();
    if (data.choices?.[0]?.finish_reason === 'length') throw new Error('Model output hit the token limit — try a simpler description.');
    if (data.choices?.[0]?.finish_reason === 'content_filter') throw new Error('The model declined this request — try rephrasing it.');
    return (data.choices?.[0]?.message?.content || '').trim();
  } catch (e) {
    throw guard(e);
  } finally {
    done();
  }
}

async function httpError(res) {
  let detail = '';
  try { detail = (await res.json())?.error?.message || ''; } catch {}
  return new Error('LLM ' + res.status + (detail ? ': ' + detail : ''));
}

export function extractJson(text) {
  if (!text) throw new Error('empty model reply');
  // strip reasoning-model traces first (their nested braces corrupt the slice)
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<\/?think>/gi, '');
  // if there are multiple fenced blocks, take the LONGEST (the real payload, not a snippet)
  const blocks = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)].map((m) => m[1]);
  const body = blocks.length ? blocks.sort((a, b) => b.length - a.length)[0] : text;
  const s = body.indexOf('{'), e = body.lastIndexOf('}');
  if (s === -1 || e === -1) throw new Error('no JSON object in reply');
  return JSON.parse(body.slice(s, e + 1));
}

export function extractScad(text) {
  if (!text) throw new Error('empty model reply');
  // strip reasoning-model traces (DeepSeek/R1 etc.) before looking for code
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<\/?think>/gi, '');
  // accept any fenced block (```scad, ```openscad, ```cpp, ```c, ``` …); if several,
  // take the LONGEST (models sometimes emit a tiny example fence before the real program)
  const blocks = [...text.matchAll(/```[a-zA-Z]*\n?([\s\S]*?)```/g)].map((m) => m[1]);
  if (blocks.length) return blocks.sort((a, b) => b.length - a.length)[0].trim();
  return text.trim();
}
