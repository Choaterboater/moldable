import test from 'node:test';
import assert from 'node:assert/strict';
import { generate } from '../cad/scad-gen.js';
import { compile } from './helpers/otto-engine.mjs';
import { OTTO_ELECTRONICS, shapeScad, bounds } from './fixtures/otto-electronics.mjs';

// Every purchased component + its plugs, placed in the assembled robot, must clear
// every printed part for every head style, mouth and shell extreme, and must not
// overlap another component. Passing proves only that the coded envelopes fit;
// the hardware itself is unmeasured (docs/reference/otto-fit.md).
const PARTS = [0, 1, 2, 3, 4, 5, 8];
async function hits(params, shapes) {
  const g = generate('otto', { ...params, part: 7 });
  const call = g.source.match(/otto_part\(part,([^;]+)\);/);
  const parts = PARTS.map(i => `otto_placed(${i},${call[1]});`).join(' ');
  const r = await compile(g.source.replace(call[0], `intersection(){ union(){ ${parts} } union(){ ${shapes.map(shapeScad).join(' ')} } }`), g.files);
  // An empty intersection exits 1; do not mistake a parser/library error for success.
  assert.doesNotMatch(r.log, /ERROR:|WARNING:/i, r.log);
  if (r.stl) return { min: r.info.min.map(v => +v.toFixed(2)), max: r.info.max.map(v => +v.toFixed(2)) };
  assert.match(r.log, /Current top level object is empty/i, r.log);
  return null;
}
const ALL = OTTO_ELECTRONICS.flatMap(c => c.shapes);

test('Otto electronics check detects a real collision (control)', async () => {
  assert.notEqual(await hits({}, [{ box: [-5, 5, -33, -30, 100, 105] }]), null);   // crosses the face plate
});
for (let i = 0; i < OTTO_ELECTRONICS.length; i++) for (let j = i + 1; j < OTTO_ELECTRONICS.length; j++) {
  const [a, b] = [OTTO_ELECTRONICS[i], OTTO_ELECTRONICS[j]];
  test(`Otto electronics ${a.name} and ${b.name} do not overlap`, () => {
    for (const sa of a.shapes) for (const sb of b.shapes) {
      const [p, q] = [bounds(sa), bounds(sb)];
      assert.ok(![0, 2, 4].every(k => Math.min(p[k + 1], q[k + 1]) - Math.max(p[k], q[k]) > 0), JSON.stringify([p, q]));
    }
  });
}
// The user's build: bevel head, OLED mouth. One case per component for clear reports.
for (const c of OTTO_ELECTRONICS) test('Otto electronics fit, bevel head + OLED mouth: ' + c.name, async () => {
  assert.equal(await hits({ headStyle: 2, mouth: 1 }, c.shapes), null);
});
const settings = [];
for (let headStyle = 0; headStyle < 4; headStyle++) for (let mouth = 0; mouth < 3; mouth++) {
  settings.push({ headStyle, mouth });
  settings.push({ headStyle, mouth, grow: 10, corner: 12, ears: mouth + 1, hat: mouth + 1, antenna: 30 });
}
for (const clearance of [0.1, 0.5]) settings.push({ headStyle: 2, mouth: 1, clearance });
for (const params of settings) test('Otto electronics fit, all components ' + JSON.stringify(params), async () => {
  assert.equal(await hits(params, ALL), null);
});
