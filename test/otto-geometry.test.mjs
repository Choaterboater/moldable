import test from 'node:test';
import assert from 'node:assert/strict';
import { compiledPart, compile, contents, supportFaces } from './helpers/otto-engine.mjs';
import { generate } from '../cad/scad-gen.js';
import { standaloneOttoScad } from '../cad/otto.js';

// Full head-style × ear × hat matrix, both shell-growth endpoints. Antenna is
// tested at its maximum material extent; mouth variants are separate below.
const variants = [];
for(let headStyle=0;headStyle<4;headStyle++) {
  for(const part of [0,1,2,3,4,5,6,8]) variants.push({part,headStyle});
  for(const grow of [0,10]) for(let ears=0;ears<4;ears++) for(let hat=0;hat<4;hat++)
    variants.push({part:0,headStyle,grow,corner:12,ears,hat,antenna:30});
  for(const mouth of [0,1,2]) variants.push({part:0,headStyle,mouth});
  variants.push({part:0,headStyle,corner:0});
}
for(const part of [4,5]) for(const feet of [1,2]) variants.push({part,feet});
for(const p of variants) {
  const label=JSON.stringify(p);
  test('Otto compiles '+label, async()=> {
    const r=await compiledPart(p);
    assert.deepEqual({rc:r.rc,error:/ERROR:|WARNING:/i.test(r.log),mesh:!!r.info?.ok},{rc:0,error:false,mesh:true},r.log);
  });
  test('Otto watertight '+label, async()=> {
    const r=await compiledPart(p);
    assert.deepEqual([r.info?.openEdges,r.info?.nonManifoldEdges],[0,0],r.log);
  });
  test('Otto on Z=0 '+label, async()=> {
    const r=await compiledPart(p);
    assert.ok(Math.abs(r.info?.min[2])<0.001,r.log);
  });
  test((p.part===6?'Otto plate has seven components ':'Otto one connected part ')+label, async()=> {
    const r=await compiledPart(p);
    assert.equal(r.info?.components,p.part===6?7:1,r.log);
  });
}
// Assembled view must stack to Otto height: sole 5 + ankle gap 4 + leg 42 + hip gap 1.5 + body 38 - insert 3 + head 62.
for(let headStyle=0;headStyle<4;headStyle++) test('Otto assembled view compiles headStyle '+headStyle,async()=> {
  const r=await compiledPart({part:7,headStyle});
  assert.deepEqual({rc:r.rc,error:/ERROR:|WARNING:/i.test(r.log),mesh:!!r.info?.ok},{rc:0,error:false,mesh:true},r.log);
  assert.ok(Math.abs(r.info.min[2])<0.001 && Math.abs(r.info.max[2]-149.5)<0.01,r.log);
});
for(const p of [0,1,2,3,4,5,8].map(part=>({part})).concat([{part:0,mouth:1}])) test('Otto default support-free analysis '+JSON.stringify(p),async()=> {
  const r=await compiledPart(p);
  assert.equal(supportFaces(r.stl),0,'downward faces beyond 45 degrees above the bed');
});
for(let kind=0;kind<6;kind++) test('Otto fit-test print compiles '+kind,async()=> {
  const g=generate('otto');
  const source=g.source.replace('use <otto/otto_shells.scad>','use <otto/otto_core.scad>')
    .replace(/otto_part\([^;]+;/,`otto_coupon(${kind},clearance);`);
  const r=await compile(source,g.files);
  assert.deepEqual([r.rc,r.info?.openEdges,r.info?.nonManifoldEdges,r.info?.min[2]],[0,0,0,0],r.log);
  if(kind===5) assert.equal(supportFaces(r.stl),0,'drill guide must print without supports');
});
test('Otto standalone SCAD compiles without external libraries',async()=> {
  const g=generate('otto');
  const source=await standaloneOttoScad(g.source,g.files,contents);
  const r=await compile(source);
  assert.deepEqual([r.rc,/ERROR:|WARNING:/i.test(r.log),r.info?.openEdges],[0,false,0],r.log);
});

// Cut-away fit-test pieces come from the production parts and must print flat without supports.
for (const [kind, name, size] of [[0, 'half leg', [42, 35, 8.5]], [1, 'hip station', [18, 38, 6.2]]]) test('Otto cut-away fit test: ' + name, async () => {
  const g = generate('otto');
  const r = await compile(g.source.replace(/otto_part\([^;]+;/, `otto_fit_cut(${kind},clearance);`), g.files);
  assert.deepEqual([r.rc, r.info?.openEdges, r.info?.nonManifoldEdges, r.info?.components, +r.info?.min[2].toFixed(3)], [0, 0, 0, 1, 0], r.log);
  assert.equal(supportFaces(r.stl), 0, 'must print without supports');
  for (const k of [0, 1, 2]) assert.ok(Math.abs((r.info.max[k] - r.info.min[k]) - size[k]) < 0.06, 'size ' + k + ': ' + (r.info.max[k] - r.info.min[k]));
});
