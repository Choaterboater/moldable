import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { MODELS, defaults, generate } from '../cad/scad-gen.js';
import { keywordMatch } from '../cad/interpret.js';
import { H2C_PROFILES } from '../cad/printers.js';
import { checkBuildVolume, validate, inspectStl } from '../cad/validate.js';
import { OTTO_PRESETS, OTTO_OVERFLOW, OTTO_FILES, OTTO_NOTICE, OTTO_STL_CREDIT, standaloneOttoScad, creditOttoStl } from '../cad/otto.js';
import { compiledPart, contents, compile } from './helpers/otto-engine.mjs';
import { createUi, html } from './helpers/otto-ui.mjs';

test('Otto gallery category is Robots',()=>assert.equal(MODELS.otto.cat,'Robots'));
test('Opening Robots displays only Otto presets with thumbnails',async()=> {
  const {ui}=await createUi();ui.openGallery();
  ui.renderVals().galleryCategories.find(c=>c.label==='Robots').onClick();
  assert.deepEqual(ui.renderVals().filteredGalleryItems.map(g=>({label:g.sub,thumbnail:g.tile.includes('.svg')})),
    Array.from({length:3},()=>({label:'Otto Robot',thumbnail:true})));
});
test('Robots hides unrelated catalog prints and All templates restores them',async()=> {
  const {ui}=await createUi();ui.openGallery();
  const all=ui.renderVals();
  assert.ok(all.catalogItems.length>0);
  assert.equal(all.hasCatalog,true);
  all.galleryCategories.find(c=>c.label==='Robots').onClick();
  assert.equal(ui.renderVals().hasCatalog,false);
  ui.renderVals().galleryCategories.find(c=>c.label==='All templates').onClick();
  const restored=ui.renderVals();
  assert.equal(restored.hasCatalog,true);
  assert.deepEqual(restored.catalogItems.map(c=>c.name),all.catalogItems.map(c=>c.name));
  assert.ok(restored.filteredGalleryItems.some(g=>g.cat!=='Robots'));
});
test('Otto gallery displays label and thumbnail',async()=> {
  const {ui}=await createUi();
  const item=ui.renderVals().galleryItems.find(g=>g.name==='Classic Otto');
  assert.deepEqual({label:item?.sub,thumbnail:item?.tile.includes('g-classic-otto.svg')},{label:'Otto Robot',thumbnail:true});
});
for(const preset of OTTO_PRESETS) {
  test('Otto preset '+preset.name+' loads exactly its settings',async()=> {
    const {ui}=await createUi();
    ui.renderVals().galleryItems.find(g=>g.name===preset.name).onClick();
    assert.deepEqual(ui.state.modelParams.otto,{...defaults('otto'),...preset.params});
  });
  test('Otto thumbnail exists '+preset.name,()=> {
    const slug=preset.name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
    assert.equal(existsSync(new URL('../thumbs/g-'+slug+'.svg',import.meta.url)),true);
  });
}
for(const prompt of ['otto robot','make me a dancing robot','lego otto']) test('Otto route '+prompt,()=>assert.equal(keywordMatch(prompt),'otto'));
test('Otto runtime registry is the generator registry',async()=> {
  const {ui}=await createUi();
  assert.equal(ui.MODELS,MODELS);
});
test('Otto runtime initializes missing parameter state',async()=> {
  const {ui}=await createUi();
  assert.deepEqual(ui.state.modelParams.otto,defaults('otto'));
});
test('Otto customizer exposes only the requested controls',()=>assert.deepEqual(MODELS.otto.params.map(p=>p.key),['part','headStyle','corner','grow','ears','antenna','hat','mouth','feet','clearance']));
test('Otto clearance defaults and range',()=>assert.deepEqual(MODELS.otto.params.find(p=>p.key==='clearance'),{key:'clearance',label:'Fit clearance (extra room around hardware)',min:0.1,max:0.5,step:0.05,def:0.25,unit:'mm'}));
test('Otto generation uses separate library files',()=>assert.deepEqual(generate('otto').files,OTTO_FILES));
for(const profile of H2C_PROFILES) {
  test('H2C profile '+profile.name+' accepts its bounds',()=>assert.equal(checkBuildVolume(profile.volume,profile.volume).fits,true));
  for(let axis=0;axis<3;axis++) test('H2C profile '+profile.name+' rejects overflow axis '+axis,()=> {
    const size=[...profile.volume];size[axis]+=1;
    assert.deepEqual(checkBuildVolume(size,profile.volume),{fits:false,message:OTTO_OVERFLOW});
  });
  test('H2C UI selector '+profile.name,async()=> {
    const {ui}=await createUi();
    ui.renderVals().printerList.find(p=>p.spec===profile.spec).onClick();
    assert.deepEqual(ui._buildVolume(),profile.volume);
  });
}
test('H2C dual nozzle excludes combined 330mm width',()=>assert.equal(checkBuildVolume([330,320,320],H2C_PROFILES[2].volume).fits,false));
test('H2C default selected for a new local session',async()=> {
  const {ui}=await createUi();
  assert.equal(ui.state.bedSpec,'300x320x320');
});
test('Otto oversized plate warning reaches UI',async()=> {
  const {ui}=await createUi();
  ui.loadGallery({model:'otto',name:'Otto Robot',params:{part:6}});
  ui.state.printEst={fits:false,dims:[400,200,54],bed:[300,320,320],grams:1,cost:1,timeLow:1,timeHigh:2};
  assert.equal(ui.renderVals().printFit,OTTO_OVERFLOW);
});
test('Otto oversized plate warning reaches validation',async()=> {
  const r=await compiledPart({part:6});
  assert.ok(validate(r.stl,{buildVolume:[100,100,100],model:'otto',part:6}).warnings.includes(OTTO_OVERFLOW));
});
test('Otto intended plate is not warned as broken disconnected geometry',async()=> {
  const {stl}=await compiledPart({part:6});
  assert.equal(validate(stl,{model:'otto',part:6}).warnings.some(w=>w.includes('disconnected pieces')),false);
});
test('Otto assembled preview is not warned as broken disconnected geometry',async()=> {
  const {stl}=await compiledPart({part:7});
  assert.equal(validate(stl,{model:'otto',part:7}).warnings.some(w=>w.includes('disconnected pieces')),false);
});
test('Otto default plate stays seven separate printable components',async()=>assert.equal((await compiledPart({part:6})).info.components,7));
test('Otto assembled view is Otto height; the head rests on the body rim',async()=> {
  const i=(await compiledPart({part:7})).info;
  assert.deepEqual([+(i.max[2]-i.min[2]).toFixed(1),i.components],[146,5]);
});
test('Otto fit notice appears in both view templates',()=>assert.equal((html.match(/\{\{ ottoNotice \}\}/g)||[]).length,2));
test('Otto fit status is visible in view bindings',async()=> {
  const {ui}=await createUi();ui.loadGallery(OTTO_PRESETS[0]);
  assert.match(ui.renderVals().ottoNotice,/unverified/);
});
const headPreset={...OTTO_PRESETS[0],params:{...OTTO_PRESETS[0].params,part:0}};   // default view (Assembled) is not downloadable
test('Otto STL export includes license and credit',async()=> {
  const {ui,downloads}=await createUi();ui.loadGallery(headPreset);
  ui._lastStl=(await compiledPart({part:0})).stl;ui._stlSource=ui.state.codeText;ui.downloadSTL();
  const bytes=new Uint8Array(await downloads[0].blob.arrayBuffer());
  assert.equal(new TextDecoder().decode(bytes.slice(0,80)).replace(/\0+$/,''),OTTO_STL_CREDIT);
});
test('Otto cannot download a stale mesh from another template',async()=> {
  const {ui,downloads}=await createUi();ui.loadGallery(headPreset);
  ui._lastStl=(await compiledPart({part:0})).stl;ui._stlSource='previous model';ui.downloadSTL();
  assert.equal(downloads.length,0);
});
test('Otto STL credits do not alter geometry',async()=> {
  const {stl}=await compiledPart({});
  assert.deepEqual(creditOttoStl(stl).slice(80),stl.slice(80));
});
test('Otto publish dialog uses the share-alike license',async()=> {
  const {ui}=await createUi();ui.loadGallery(OTTO_PRESETS[0]);ui.openPublish();
  assert.equal(ui.renderVals().publishLicense,'CC BY-SA 4.0');
  assert.match(html,/\{\{ publishLicense \}\}/);
});
test('Other templates and freeform designs keep their existing publish license',async()=> {
  const {ui}=await createUi();
  assert.equal(ui.renderVals().publishLicense,'CC BY 4.0');
  ui.loadGallery(OTTO_PRESETS[0]);ui.setState({freeform:true});
  assert.equal(ui.renderVals().publishLicense,'CC BY 4.0');
  ui.setState({freeform:false,meshMode:true});
  assert.equal(ui.renderVals().publishLicense,'CC BY 4.0');
});
test('Otto SCAD export includes license and credit',async()=> {
  const {ui,downloads}=await createUi();ui.loadGallery(OTTO_PRESETS[0]);
  ui.state.codeText=generate('otto').source;await ui.downloadSCAD();
  assert.match(await downloads[0].blob.text(),/SPDX-License-Identifier: CC-BY-SA-4.0/);
});
test('Otto SCAD export has no unresolved library directives',async()=> {
  const g=generate('otto');
  assert.doesNotMatch(await standaloneOttoScad(g.source,g.files,contents),/^\s*(use|include)\s*</m);
});
for(let kind=0;kind<5;kind++) test('Otto fit-test STL download '+kind+' is a print-ready mesh',async()=> {
  const {ui,downloads}=await createUi();
  ui._runner={compile:({source,files})=>compile(source,files)};
  await ui.downloadOttoFitTest(kind);
  assert.match(downloads[0].name,/^Otto_fit_\w+\.stl$/);
  const bytes=new Uint8Array(await downloads[0].blob.arrayBuffer());
  assert.equal(new TextDecoder().decode(bytes.slice(0,80)).replace(/\0+$/,''),OTTO_STL_CREDIT);
  const info=inspectStl(bytes);
  assert.deepEqual([info.openEdges,info.nonManifoldEdges,info.components,Math.abs(info.min[2])<0.001],[0,0,1,true]);
});
for(let kind=0;kind<5;kind++) test('Otto fit-test download '+kind+' is portable',async()=> {
  const {ui,downloads}=await createUi();await ui.downloadOttoFitTest(kind,'scad');
  const r=await compile(await downloads[0].blob.text());
  assert.equal(r.rc,0,r.log);
});
test('Otto license notice credits upstream and changes',()=>assert.match(OTTO_NOTICE,/Otto DIY[\s\S]*Moldable remix[\s\S]*Martin Perdeaux[\s\S]*creativecommons.org\/licenses\/by-sa\/4.0/));
test('Otto library attribution includes verified upstream license source',()=>assert.match(readFileSync(new URL('../cad/libraries/otto/README.md',import.meta.url),'utf8'),/f384c00a641e11c8741487320c6f1d82ad72e6d5/));
test('Otto assembled view refuses STL download',async()=> {
  const {ui,downloads}=await createUi();ui.loadGallery(OTTO_PRESETS[0]);
  ui._lastStl=(await compiledPart({part:7})).stl;ui._stlSource=ui.state.codeText;ui.downloadSTL();
  assert.deepEqual([downloads.length,/preview/.test(ui.state.toast)],[0,true]);
});
test('Otto paint targets colour one part group without touching the rest',async()=> {
  const {ui}=await createUi();ui.loadGallery(OTTO_PRESETS[0]);
  const base=ui.state.color;
  ui.setPaintTarget('head');ui.setColor('#3a3a3a');
  assert.deepEqual([ui._groupColor('head'),ui._groupColor('body'),ui.state.color],['#3a3a3a',base,base]);
  assert.equal(ui.renderVals().paintTargets.length,6);
  ui.setPaintTarget('all');ui.setColor('#5b8fb0');
  assert.deepEqual([ui._groupColor('head'),ui.state.color],['#5b8fb0','#5b8fb0']);
});
test('Otto assembled colour groups recombine into the full robot',async()=> {
  const {ui}=await createUi();
  const g=generate('otto',{part:7});const call=g.source.match(/otto_part\(part,([^;]+)\);/);
  const pieces=[];
  for(const parts of [[0],[8],[1],[2,3],[4,5]]) pieces.push((await compile(g.source.replace(call[0],parts.map(i=>`otto_placed(${i},${call[1]});`).join('\n')),g.files)).stl);
  const stl=ui._concatStl(pieces);
  const tris=b=>new DataView(b.buffer,b.byteOffset,b.byteLength).getUint32(80,true);
  assert.equal(stl.length,84+50*pieces.reduce((n,b)=>n+tris(b),0));
  assert.ok(Math.abs(ui._printEstimate(stl).dims[2]-146)<0.1);
});
test('Otto Show and Paint chips have distinct accessible names',async()=> {
  const {ui}=await createUi();ui.loadGallery(OTTO_PRESETS[0]);
  const v=ui.renderVals();
  const names=[...v.ottoParts,...v.paintTargets].map(c=>c.aria);
  assert.equal(new Set(names).size,names.length);
  assert.ok(v.ottoParts.every(c=>c.aria.startsWith('Show ')) && v.paintTargets.every(c=>c.aria.startsWith('Paint ')));
  for(const tpl of ['op','pt']) assert.equal((html.match(new RegExp('aria-label="\\{\\{ '+tpl+'\\.aria \\}\\}"','g'))||[]).length,2);
});
test('Otto Paint chips show each part colour as a swatch',async()=> {
  const {ui}=await createUi();ui.loadGallery(OTTO_PRESETS[0]);
  ui.setPaintTarget('head');ui.setColor('#3a3a3a');
  const chips=Object.fromEntries(ui.renderVals().paintTargets.map(c=>[c.aria,c]));
  assert.match(chips['Paint head'].swatch,/background:#3a3a3a/);
  assert.match(chips['Paint body'].swatch,new RegExp('background:'+ui.state.color));
  assert.deepEqual([chips['Paint head'].pressed,chips['Paint body'].pressed],[true,false]);
  assert.equal((html.match(/\{\{ pt\.swatch \}\}/g)||[]).length,2);
});
test('Otto choice slider labels name the selected option and follow the slider',async()=> {
  const {ui}=await createUi();ui.loadGallery(OTTO_PRESETS[0]);
  const head=()=>ui.renderVals().paramList.find(p=>p.key==='headStyle');
  assert.deepEqual([head().value,head().display],[0,'0 · Cube']);
  ui.setParam('headStyle',2);
  assert.deepEqual([head().value,head().display],[2,'2 · Bevel']);
  assert.equal(ui.renderVals().paramList.find(p=>p.key==='clearance').display,'0.25 mm');
});
