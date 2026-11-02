import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const record=JSON.parse(readFileSync(new URL('../docs/reference/otto-acceptance.json',import.meta.url),'utf8'));
// Physical evidence cannot be fabricated by a software test. Each acceptance
// case remains explicitly TODO until its actual result and evidence are recorded.
for(const check of record.checks) {
  if(check.status==='pending') test.todo('PHYSICAL '+check.case+' — requires real hardware/print evidence');
  else test('PHYSICAL recorded evidence: '+check.case,()=> {
    assert.ok(check.status==='passed' && typeof check.evidence==='string' && check.evidence.trim().length>0,'A recorded result is not automated proof of physical fit');
  });
}
test('Otto unvalidated default is not reported as measured',()=> {
  if(record.checks.some(c=>c.status==='pending')) assert.equal(record.validatedClearanceMm,null);
  else assert.ok(record.validatedClearanceMm>=0.1 && record.validatedClearanceMm<=0.5);
});
