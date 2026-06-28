// test/bridge-guard.test.mjs
// Unit tests for the local-bridge access gate (the #15 security fix).
//   node test/bridge-guard.test.mjs
import { checkAccess, isLocalHost, isAllowedOrigin, hostnameOf } from '../tools/bridge-guard.mjs';

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { if (cond) { pass++; console.log('PASS', name, extra); } else { fail++; console.log('FAIL', name, extra); } };
const req = (host, origin) => ({ headers: { host, ...(origin !== undefined ? { origin } : {}) } });

// ---- hostnameOf: strips :port and IPv6 brackets ----
ok('host strips port', hostnameOf('127.0.0.1:8788') === '127.0.0.1', hostnameOf('127.0.0.1:8788'));
ok('host ipv6 bracket', hostnameOf('[::1]:8788') === '::1', hostnameOf('[::1]:8788'));
ok('host bare localhost', hostnameOf('localhost') === 'localhost');

// ---- isLocalHost ----
ok('localhost host ok', isLocalHost('127.0.0.1:8788') && isLocalHost('localhost:8765') && isLocalHost('[::1]:8788'));
ok('foreign host blocked', !isLocalHost('evil.com:8788') && !isLocalHost('attacker.example'));

// ---- isAllowedOrigin ----
ok('no origin allowed (non-browser/GET)', isAllowedOrigin('') && isAllowedOrigin(undefined));
ok('null origin allowed (file://)', isAllowedOrigin('null'));
ok('loopback origins allowed', isAllowedOrigin('http://127.0.0.1:8765') && isAllowedOrigin('http://localhost:8765') && isAllowedOrigin('http://localhost'));
ok('foreign origin blocked', !isAllowedOrigin('http://evil.com') && !isAllowedOrigin('https://attacker.example:8765'));
ok('garbage origin blocked', !isAllowedOrigin('not a url'));

// ---- checkAccess: the real gate the bridges call ----
ok('legit local page passes', checkAccess(req('127.0.0.1:8788', 'http://127.0.0.1:8765')).ok);
ok('legit cross-port page passes', checkAccess(req('localhost:8788', 'http://localhost:8765')).ok);
ok('curl/no-origin passes (host local)', checkAccess(req('127.0.0.1:8788')).ok);
{
  const r = checkAccess(req('127.0.0.1:8788', 'http://evil.com'));
  ok('CSRF: foreign origin rejected', !r.ok && r.reason === 'origin', JSON.stringify(r));
}
{
  const r = checkAccess(req('evil.com:8788', 'http://evil.com'));   // DNS-rebinding: Host is the attacker domain
  ok('rebind: foreign host rejected', !r.ok && r.reason === 'host', JSON.stringify(r));
}
{
  const r = checkAccess(req('evil.com'));   // rebind with no Origin
  ok('rebind no-origin rejected', !r.ok && r.reason === 'host', JSON.stringify(r));
}

console.log('\n' + '='.repeat(50));
console.log(`${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
console.log('Bridge access gate verified ✓');
