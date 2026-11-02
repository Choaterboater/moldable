import test from 'node:test';
import assert from 'node:assert/strict';
import { MODELS, defaults, generate } from '../cad/scad-gen.js';
import { compile } from './helpers/otto-engine.mjs';
import { createUi } from './helpers/otto-ui.mjs';

function solid(result, components = 1, onBed = true) {
  assert.equal(result.rc, 0, result.log);
  assert.ok(result.info?.ok, result.log);
  assert.doesNotMatch(result.log, /ERROR:|not a valid 2-manifold/i);
  assert.equal(result.info.openEdges, 0, 'open mesh edges');
  assert.equal(result.info.nonManifoldEdges, 0, 'non-manifold mesh edges');
  assert.equal(result.info.components, components, 'unexpected disconnected parts');
  if (onBed) assert.ok(Math.abs(result.info.min[2]) < 0.05, 'not resting on the bed');
  return result.info;
}
// Otto plate has 7 pieces; assembled = head+cover, body, 2 legs, 2 feet (a grown head rests on the body rim).
function components(model, p) {
  if (model !== 'otto') return 1;
  return p.part === 6 ? 7 : p.part === 7 ? (p.grow > 0 ? 5 : 6) : 1;
}
async function modelSolid(model, params) {
  const g = generate(model, params);
  const p = { ...defaults(model), ...params };
  return solid(await compile(g.source, g.files), components(model, p));
}

const { ui: galleryUi } = await createUi();
for (const item of galleryUi.GALLERY) {
  test('template preset: ' + item.name, async () => {
    for (const key of Object.keys(item.params)) {
      assert.ok(MODELS[item.model].params.some(p => p.key === key), 'unknown preset parameter: ' + key);
    }
    await modelSolid(item.model, item.params);
  });
}
for (const [model, schema] of Object.entries(MODELS)) {
  for (const param of schema.params) {
    for (const edge of ['min', 'max']) {
      test(`template limit: ${model}.${param.key} ${edge}`, async () => {
        await modelSolid(model, { [param.key]: param[edge] });
      });
    }
  }
  for (const edge of ['min', 'max']) {
    test(`template combined limits: ${model} ${edge}`, async () => {
      await modelSolid(model, Object.fromEntries(schema.params.map(p => [p.key, p[edge]])));
    });
  }
  test('standalone SCAD download: ' + model, async () => {
    const { ui, downloads } = await createUi();
    ui.loadGallery({ model, params: defaults(model), name: schema.label });
    await ui.downloadSCAD();
    assert.equal(downloads.length, 1, ui.state.toast);
    const source = await downloads[0].blob.text();
    assert.doesNotMatch(source, /^\s*(?:use|include)\s*</m, 'unbundled library');
    if (model === 'gridfinity' || model === 'baseplate') {
      assert.match(source, /Library license: GNU GPL v3/);
      assert.match(source, /https:\/\/github.com\/ostat\/gridfinity_extended_openscad/);
    }
    solid(await compile(source), components(model, defaults(model)));
  });
}

for (const params of [
  {},
  { sides: 3, twist: 300, height: 220 },
  { sides: 3, radius: 25, height: 60, twist: 360, bulge: 0 },
  { sides: 3, radius: 25, height: 60, twist: 360, bulge: 60 },
]) {
  test('vase retains its floor and open cavity: ' + JSON.stringify(params), async () => {
    const g = generate('vase', params), p = { ...defaults('vase'), ...params };
    const subject = `module subject(){\n${g.source}\n}\n`;
    const floor = await compile(subject + 'intersection(){subject();cylinder(r=1,h=1,$fn=16);}');
    solid(floor);
    const cavity = await compile(subject + `intersection(){subject();translate([0,0,1.7])cylinder(r=1,h=${p.height},$fn=16);}`);
    assert.equal(cavity.info, null, 'the cavity must remain open through the top');
    assert.doesNotMatch(cavity.log, /ERROR:/);
  });
  for (const fraction of [0.25, 0.5, 0.75]) {
    test(`vase continuous wall: ${JSON.stringify(params)} at ${fraction}`, async () => {
      const g = generate('vase', params), p = { ...defaults('vase'), ...params };
      const source = `module subject(){\n${g.source}\n}\nintersection(){subject();translate([-500,-500,${p.height * fraction}])cube([1000,1000,0.1]);}`;
      // A horizontal section of a sound vase wall is one annular component,
      // not several separated corner strips, even when the whole vase is manifold.
      solid(await compile(source), 1, false);
    });
  }
}
test('vase radius control is accurately labeled', () => {
  assert.equal(MODELS.vase.params.find(p => p.key === 'radius').label, 'Radius');
});

for (const params of [{}, { width: 50, height: 20, depth: 20, sections: 1 }, { width: 200, height: 90, depth: 70, sections: 6 }]) {
  test('honeycomb bin changes geometry without detaching parts: ' + JSON.stringify(params), async () => {
    const plain = await modelSolid('wallbin', { ...params, honeycomb: 0 });
    const perforated = await modelSolid('wallbin', { ...params, honeycomb: 1 });
    assert.ok(perforated.volume < plain.volume - 1, 'honeycomb must remove material');
    for (let axis = 0; axis < 3; axis++) {
      assert.ok(Math.abs(perforated.size[axis] - plain.size[axis]) < 0.01, 'honeycomb must preserve the footprint');
    }
  });
}
test('SCAD export keeps its source and filename if the selected model changes', async () => {
  const { ui, downloads } = await createUi();
  ui.loadGallery({ model: 'gridfinity', params: { gx: 3 }, name: 'Gridfinity Original' });
  const exporting = ui.downloadSCAD();
  ui.loadGallery({ model: 'vase', params: {}, name: 'New Vase' });
  await exporting;
  assert.equal(downloads.length, 1);
  assert.equal(downloads[0].name, 'Gridfinity_Original.scad');
  const result = await compile(await downloads[0].blob.text());
  solid(result);
  assert.ok(Math.abs(result.info.size[0] - 125.5) < 0.1);
});
test('failed library bundling does not download broken SCAD', async () => {
  const { ui, downloads } = await createUi();
  ui.loadGallery({ model: 'gridfinity', params: {}, name: 'Gridfinity Bin' });
  const cad = ui._cad;
  ui._loadCad = async () => ({ ...cad, standaloneScad: async () => { throw new Error('Missing test library'); } });
  await ui.downloadSCAD();
  assert.equal(downloads.length, 0);
  assert.match(ui.state.toast, /SCAD export failed: Missing test library/);
});
