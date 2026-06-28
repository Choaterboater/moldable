// tools/bridge-guard.mjs
// Access gate shared by every local bridge (replicate / local-mesh / mesh / claude).
//
// The bridges bind to 127.0.0.1, but loopback alone is NOT enough: any website open
// in the user's browser can POST to http://localhost:8788 / :8787 and drive these
// services (spend a Meshy/Tripo key, run the local `claude` CLI) — a classic
// confused-deputy / CSRF against a localhost service, and DNS-rebinding can even
// forge the target host. Browsers cannot forge the Origin or Host headers from JS,
// so two checks shut both vectors:
//   • Host  must be a loopback name  -> defeats DNS-rebinding (attacker page resolves
//     evil.com -> 127.0.0.1, but the browser still sends Host: evil.com).
//   • Origin (when present) must be loopback -> defeats cross-origin CSRF (a foreign
//     page's fetch carries Origin: http://evil.com).
// No shared secret is needed: a browser attacker can't get past these, and a non-browser
// attacker already has local code execution (out of scope).
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', '0:0:0:0:0:0:0:1']);

// Host/Origin host without the :port and without IPv6 brackets, lowercased.
export function hostnameOf(hostHeader) {
  if (!hostHeader) return '';
  let h = String(hostHeader).trim();
  if (h[0] === '[') { const e = h.indexOf(']'); h = e > -1 ? h.slice(1, e) : h.slice(1); }   // [::1]:8788 -> ::1
  else { const c = h.lastIndexOf(':'); if (c > -1 && /^\d+$/.test(h.slice(c + 1))) h = h.slice(0, c); }
  return h.toLowerCase();
}

export function isLocalHost(hostHeader) {
  return LOCAL_HOSTS.has(hostnameOf(hostHeader));
}

// Origin is absent on non-browser / same-origin-GET requests (allow), 'null' for file://
// (allow local file use), otherwise must resolve to a loopback host.
export function isAllowedOrigin(origin) {
  if (!origin || origin === 'null') return true;
  let host;
  try { host = new URL(origin).hostname.toLowerCase(); } catch { return false; }
  host = host.replace(/^\[|\]$/g, '');   // [::1] -> ::1
  return LOCAL_HOSTS.has(host);
}

// checkAccess(req) -> { ok, origin, reason }. reason is 'host' or 'origin' on rejection.
export function checkAccess(req) {
  const headers = (req && req.headers) || {};
  const origin = headers.origin || '';
  if (!isLocalHost(headers.host)) return { ok: false, origin, reason: 'host' };
  if (!isAllowedOrigin(origin)) return { ok: false, origin, reason: 'origin' };
  return { ok: true, origin };
}
