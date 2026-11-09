import test from 'node:test';
import assert from 'node:assert/strict';
import { generate } from '../cad/scad-gen.js';
import { compile } from './helpers/otto-engine.mjs';
import { OTTO_ELECTRONICS, componentScad, bounds } from './fixtures/otto-electronics.mjs';

// Every purchased component + its plugs, placed in the assembled robot, must clear
// every printed part for every head style, mouth and shell extreme, and must not
// overlap another component. Passing proves only that the coded envelopes fit;
// the hardware itself is unmeasured (docs/reference/otto-fit.md).
const PARTS = [0, 1, 2, 3, 4, 5, 8];
async function hits(params, components) {
  const g = generate('otto', { ...params, part: 7 });
  const call = g.source.match(/otto_part\(part,([^;]+)\);/);
  const parts = PARTS.map(i => `otto_placed(${i},${call[1]});`).join(' ');
  const r = await compile(g.source.replace(call[0], `intersection(){ union(){ ${parts} } union(){ ${components.map(componentScad).join(' ')} } }`), g.files);
  // An empty intersection exits 1; do not mistake a parser/library error for success.
  assert.doesNotMatch(r.log, /ERROR:|WARNING:/i, r.log);
  if (r.stl) return { min: r.info.min.map(v => +v.toFixed(2)), max: r.info.max.map(v => +v.toFixed(2)) };
  assert.match(r.log, /Current top level object is empty/i, r.log);
  return null;
}

test('Otto electronics check detects a real collision (control)', async () => {
  assert.notEqual(await hits({}, [{ shapes: [{ box: [-5, 5, -33, -30, 100, 105] }] }]), null);   // crosses the face plate
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
  assert.equal(await hits({ headStyle: 2, mouth: 1 }, [c]), null);
});
const settings = [];
for (let headStyle = 0; headStyle < 4; headStyle++) for (let mouth = 0; mouth < 3; mouth++) {
  settings.push({ headStyle, mouth });
  settings.push({ headStyle, mouth, grow: 10, corner: 12, ears: mouth + 1, hat: mouth + 1, antenna: 30 });
}
for (const clearance of [0.1, 0.5]) settings.push({ headStyle: 2, mouth: 1, clearance });
for (const params of settings) test('Otto electronics fit, all components ' + JSON.stringify(params), async () => {
  assert.equal(await hits(params, OTTO_ELECTRONICS), null);
});
// The face holds both modules: printed pins fill every HC-SR04 corner hole, and the
// OLED posts reach its PCB behind the glass at all four holes (OLED mouth only).
const hole = (c, i) => [{ shapes: [c.minus[i]] }];
const sensor = OTTO_ELECTRONICS.find(c => c.name === 'HC-SR04 board');
const oled = OTTO_ELECTRONICS.find(c => c.name === 'OLED module');
for (let i = 0; i < 4; i++) {
  test('Otto face peg enters HC-SR04 hole ' + i, async () => assert.notEqual(await hits({ headStyle: 2, mouth: 1 }, hole(sensor, i)), null));
  test('Otto face post reaches OLED hole ' + i, async () => {
    const { x, z } = oled.minus[i].cyl;
    const r = await hits({ headStyle: 2, mouth: 1 }, [{ shapes: [{ box: [x - 1, x + 1, -28.3, -28.25, z - 1, z + 1] }] }]);
    assert.notEqual(r, null);   // post material within 0.05 mm of the PCB front
  });
}
// Retention: crush ribs touch the buzzer at all four zones.
const buzzer = OTTO_ELECTRONICS.find(c => c.name === 'Buzzer');
for (let i = 0; i < 4; i++) test('Otto buzzer crush rib grips at zone ' + i, async () =>
  assert.notEqual(await hits({}, [{ shapes: [buzzer.minus[i]] }]), null));
// Ankle servo: in the leg's own frame, plastic backs the top ear's screw hole and a
// pilot runs into that seat; the rear wall has a screwdriver opening on the same line.
async function legHits(box) {
  const g = generate('otto', { part: 2 });
  const call = g.source.match(/otto_part\([^;]+;/)[0];
  const r = await compile(g.source.replace(call, `intersection(){ ${call} translate([${box[0]},${box[2]},${box[4]}]) cube([${box[1] - box[0]},${box[3] - box[2]},${box[5] - box[4]}]); }`), g.files);
  assert.doesNotMatch(r.log, /ERROR:|WARNING:/i, r.log);
  return r.stl !== null;
}
test('Otto ankle servo ear is backed by a screw seat', async () => assert.equal(await legHits([2, 3, -8, -7.5, 7.5, 8.5]), true));
test('Otto ankle ear seat has a screw pilot', async () => assert.equal(await legHits([-0.5, 0.5, -10, -7.5, 7.6, 8.4]), false));
test('Otto ankle ear screw is reachable through the rear wall', async () => assert.equal(await legHits([-1, 1, 11, 16, 7, 9]), false));
// The rocker flange sits under the floor, in the plane the legs swing through: keep it
// outside the circle a leg corner sweeps around each hip axis.
test('Otto switch flange clears the leg swing', () => {
  const [lw, ll] = [16.5, 29], sweep = Math.hypot(lw / 2, ll / 2);
  const flange = OTTO_ELECTRONICS.find(c => c.name === 'Switch').shapes[1].box;
  for (const hx of [-22, 22]) {
    const nx = Math.min(Math.max(hx, flange[0]), flange[1]), ny = Math.min(Math.max(0, flange[2]), flange[3]);
    assert.ok(Math.hypot(nx - hx, ny) > sweep + 1, `hip ${hx}: ${Math.hypot(nx - hx, ny).toFixed(2)} <= ${sweep.toFixed(2)} + 1`);
  }
});
test('Otto battery holder is stopped at the rear by a post', async () =>
  assert.notEqual(await hits({}, [{ shapes: [{ box: [9, 11, 25.6, 26.2, 48, 52] }] }]), null));
