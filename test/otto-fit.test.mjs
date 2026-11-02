import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generate } from '../cad/scad-gen.js';
import { compile } from './helpers/otto-engine.mjs';
const fixture={name:'otto-dummies.scad',contents:readFileSync(new URL('./fixtures/otto-dummies.scad',import.meta.url),'utf8')};
const settings=[];
for(const grow of [0,10]) for(let headStyle=0;headStyle<4;headStyle++) {
  for(let ears=0;ears<4;ears++) for(let hat=0;hat<4;hat++) settings.push({part:0,headStyle,grow,ears,hat,antenna:30,corner:12});
  for(const mouth of [1,2]) for(const part of [0,8]) settings.push({part,headStyle,grow,mouth,corner:12});
  for(const part of [1,2,3,4,5,8]) for(const feet of (part===4||part===5?[0,1,2]:[0])) settings.push({part,headStyle,grow,feet});
}
for(const clearance of [0.1,0.5]) for(const part of [0,1,2,3,4,5,8]) for(let headStyle=0;headStyle<4;headStyle++)
  settings.push({part,headStyle,clearance,grow:10,ears:3,hat:3,antenna:30,corner:12,mouth:1,feet:2});
const names={0:['I/O shield stack','Type-C plug','HC-SR04','OLED'],1:['hip L','hip R','battery','clip allowance','jack','switch','buzzer'],2:['ankle servo','hip horn'],3:['ankle servo','hip horn'],4:['ankle horn','pivot pin'],5:['ankle horn','pivot pin'],8:['I/O shield stack']};
for(const params of settings) for(const [id,name] of names[params.part].entries()) {
  test('Otto no component collision '+name+' '+JSON.stringify(params),async()=> {
    const g=generate('otto',params);
    const call=g.source.match(/otto_part\([^;]+;/)[0];
    const source=g.source.replace(call,`use <otto-dummies.scad>\nintersection(){ ${call} otto_dummy(${params.part},${id}); }`);
    const r=await compile(source,[...g.files,fixture]);
    // An empty intersection exits 1; do not mistake a parser/library error for success.
    assert.deepEqual({empty:r.stl===null,diagnostic:/Current top level object is empty/i.test(r.log),error:/ERROR:|WARNING:/i.test(r.log)},
      {empty:true,diagnostic:true,error:false},r.log);
  });
}
// Assembled parts touch but never overlap: head band inside the body, cover lip in
// the head, legs between the foot brackets and just under the body floor.
for(const params of [{},{headStyle:0},{headStyle:3,grow:10,corner:12},{clearance:0.1},{clearance:0.5}])
for(const [a,b] of [[0,1],[8,1],[0,8],[2,1],[3,1],[2,4],[3,5]]) test(`Otto assembled parts ${a}/${b} do not overlap ${JSON.stringify(params)}`,async()=> {
  const g=generate('otto',{...params,part:7});
  const call=g.source.match(/otto_part\(part,([^;]+)\);/);
  const source=g.source.replace(call[0],`intersection(){ otto_placed(${a},${call[1]}); otto_placed(${b},${call[1]}); }`);
  const r=await compile(source,g.files);
  assert.deepEqual({empty:r.stl===null,diagnostic:/Current top level object is empty/i.test(r.log),error:/ERROR:|WARNING:/i.test(r.log)},
    {empty:true,diagnostic:true,error:false},r.log);
});
// Fit-critical placements are read from the fixed file. No styling parameter is
// referenced in the core: geometric intersection tests above also exercise this.
const core=readFileSync(new URL('../cad/libraries/otto/otto_core.scad',import.meta.url),'utf8');
for(const key of ['headStyle','corner','grow','ears','antenna','hat','mouth','feet']) test('Otto core independent of '+key,()=> {
  assert.equal(new RegExp('\\b'+key+'\\b').test(core.replace(/\/\/[^\n]*/g,'')),false);
});
