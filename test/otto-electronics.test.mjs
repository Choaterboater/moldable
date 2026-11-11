import test from 'node:test';
import assert from 'node:assert/strict';
import { generate } from '../cad/scad-gen.js';
import { compile } from './helpers/otto-engine.mjs';
import { OTTO_ELECTRONICS, LIFT, componentScad, bounds } from './fixtures/otto-electronics.mjs';

// Every purchased component + its plugs, placed in the assembled robot, must clear
// every printed part for every head style, mouth and shell extreme, and must not
// overlap another component. Passing proves only that the coded envelopes fit;
// the hardware itself is unmeasured (docs/reference/otto-fit.md).
const PARTS = [0, 1, 2, 3, 4, 5, 8];
async function hits(params, components, parts = PARTS) {
  const g = generate('otto', { ...params, part: 7 });
  const call = g.source.match(/otto_part\(part,([^;]+)\);/);
  const placed = parts.map(i => `otto_placed(${i},${call[1]});`).join(' ');
  const r = await compile(g.source.replace(call[0], `intersection(){ union(){ ${placed} } union(){ ${components.map(componentScad).join(' ')} } }`), g.files);
  // An empty intersection exits 1; do not mistake a parser/library error for success.
  assert.doesNotMatch(r.log, /ERROR:|WARNING:/i, r.log);
  if (r.stl) return { min: r.info.min.map(v => +v.toFixed(2)), max: r.info.max.map(v => +v.toFixed(2)) };
  assert.match(r.log, /Current top level object is empty/i, r.log);
  return null;
}

test('Otto electronics check detects a real collision (control)', async () => {
  assert.notEqual(await hits({}, [{ shapes: [{ box: [-5, 5, -33, -30, 100 + LIFT, 105 + LIFT] }] }]), null);   // crosses the face plate
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
// The face holds both modules by their edges (no screw holes): pads touch the HC-SR04 PCB,
// snap ridges reach behind both PCBs, and two stops sit under the OLED's bottom corners.
const near = (x0, x1, y0, y1, z0, z1) => [{ shapes: [{ box: [x0, x1, y0, y1, z0 + LIFT, z1 + LIFT] }] }];   // z as written for the old frame
for (const [name, probe] of [
  ['HC-SR04 corner pad touches the PCB front', near(20.5, 21.5, -24.8, -24.76, 135.5, 136.5)],
  ['HC-SR04 side guide sits beside the PCB', near(22.8, 23.2, -24.2, -23.4, 126, 128)],
  ['OLED snap ridge reaches behind the PCB', near(12.15, 12.35, -25.85, -25.6, 104, 105)],
  ['OLED bottom stop sits under the PCB', near(9, 11, -28, -27, 89.4, 90.3)]
  , ['Shield snap ridge reaches in front of the PCB', near(26.33, 26.55, 26.2, 26.6, 100, 110)]
  , ['Shield ledge holds the PCB off the cover', near(25.6, 26.4, 29, 29.4, 100, 110)]
  , ['Shield snap ridge reaches 0.8 over the PCB edge', near(25.85, 26.1, 25.75, 26.0, 100, 110)]
  , ['Shield peg pin passes through the top hole', near(23.5, 24.3, 27.6, 28.8, 128.4, 129.1)]
  , ['Shield peg base holds the PCB off the cover', near(22, 23, 29, 29.4, 128.5, 129)],
]) test('Otto face mount: ' + name, async () => assert.notEqual(await hits({ headStyle: 2, mouth: 1 }, probe), null));
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
test('Otto ankle servo ear is backed by a screw seat', async () => assert.equal(await legHits([2, 3, -11.6, -11.1, 7.5, 8.5]), true));
// The measured ear starts 3.17 mm behind the shaft face (y -8.93): nothing may stand in its way, with 0.4 to spare.
test('Otto ankle ear seat leaves room for the servo ear', async () => assert.equal(await legHits([-6, 6, -9.3, -6.2, 5.5, 10]), false));
test('Otto ankle ear seat has a screw pilot', async () => assert.equal(await legHits([-0.5, 0.5, -12.3, -9.5, 7.6, 8.4]), false));
// The ear screw is driven from the leg's front face: its pilot must be open all the way from that face to the ear.
test('Otto ankle ear screw pilot is open on the leg front face', async () => assert.equal(await legHits([-0.5, 0.5, -14.6, -9.4, 7.6, 8.4]), false));
test('Otto ankle ear screw pilot is only a pilot (plastic around it)', async () => assert.equal(await legHits([1.1, 1.6, -14.4, -12.5, 7.6, 8.4]), true));
// Each hip servo case (23.16 long, plus the clearance) must drop between its two ear posts.
test('Otto hip servo case fits between the ear posts', async () =>
  assert.equal(await hits({}, [{ shapes: [{ box: [22 - 6.1, 22 + 6.1, 5.5 - 11.8, 5.5 + 11.8, 53.1, 56.1] }] }], [1]), null));
// The ankle servo's cable leaves at the top rear of the leg: its 3-pin plug (7.7 x 2.6) must pass the window.
test('Otto leg lead window passes a 3-pin servo plug', async () => assert.equal(await legHits([-3.9, 3.9, 12.5, 14.6, 5.6, 8.4]), false));
test('Otto leg lead window leaves the rear wall whole beside it', async () => assert.equal(await legHits([5, 6, 12.6, 14.4, 6, 9]), true));
test('Otto leg lead notch, wall +x', async () => assert.equal(await legHits([6.5, 8.1, 7.6, 12, 34, 38.4]), false));
test('Otto leg lead notch, wall -x', async () => assert.equal(await legHits([-8.1, -6.5, 7.6, 12, 34, 38.4]), false));
// Crush ribs in the hip pocket: each probe lies inside the nominal horn arm, where only a rib can be.
for (const [i, b] of [[2.57, 2.65, 4.1, 4.7], [-2.65, -2.57, 4.1, 4.7], [2.31, 2.39, 7.95, 8.55], [-2.39, -2.31, 7.95, 8.55]].entries())
  test('Otto hip horn crush rib grips the arm at zone ' + i, async () => assert.equal(await legHits([...b, 0.6, 1.9]), true));
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
  assert.notEqual(await hits({}, [{ shapes: [{ box: [9, 11, 25.6, 26.2, 48 + LIFT, 52 + LIFT] }] }]), null));
// Joints and latch (Nov 10), probed in the assembled frame (head top 147, ankle axis z 18.5, body floor z 50-52).
const probe = (...b) => [{ shapes: [{ box: b }] }];
for (const [name, box, solid, parts] of [
  ['Cover snap ridge stands on the cover lip', [29.85, 30.1, 33.95, 34.15, 111, 121], true, [8]],
  ['Head side wall has the groove for the cover ridge', [29.85, 30.1, 33.95, 34.15, 111, 121], false, [0]],
  ['Foot keyhole is open to the bracket top', [-23, -21, -21, -18, 23, 24.9], false],
  ['Foot bracket web backs the horn pocket', [-18.8, -18.2, -22.8, -21.8, 18, 19], true],
  ['Foot horn screw hole passes the screw head', [-23.5, -20.5, -23.0, -21.6, 17.5, 19.5], false],
  ['Rear bracket pilot is open on the ankle axis', [-22.3, -21.7, 16.2, 20.8, 18.2, 18.8], false],
  ['Rear bracket pilot is only a pilot (plastic just under a dia 1.8 hole)', [-22.2, -21.8, 16.2, 20.8, 17.3, 17.5], true],
  ['Body floor passes a 3-pin servo plug', [18.1, 25.9, 25.7, 28.3, 50.2, 51.8], false],
  ['Body floor boss hole covers the raised gear housing', [20, 24, 4, 9, 50.2, 51.8], false],
  ['Hip ear screw pilot runs through the floor', [21.7, 22.3, 19.2, 19.8, 50.2, 51.8], false],
  ['Head snap ridge stands on the insert band', [32.1, 32.35, -5, 5, 86.4, 86.6], true, [0]],
  ['Body side wall has the groove for the head ridge', [32.1, 32.35, -5, 5, 86.4, 86.6], false, [1]],
  ['Head top passes a chunky Type-C boot (14 x 8)', [-6.9, 6.9, 11.8, 19.6, 145.1, 146.9], false],
]) test('Otto joint: ' + name, async () => {
  const hit = await hits({ headStyle: 2, mouth: 1 }, probe(...box), parts);
  if (solid) assert.notEqual(hit, null); else assert.equal(hit, null);
});
// The leg may roll 30 degrees either way on the foot without touching the sole or brackets.
for (const side of [2, 3]) for (const roll of [-30, 30]) test(`Otto leg ${side} rolls ${roll} degrees clear of its foot`, async () => {
  const g = generate('otto', { part: 7 });
  const call = g.source.match(/otto_part\(part,([^;]+)\);/);
  const x = side === 2 ? -22 : 22;
  const source = g.source.replace(call[0], `intersection(){ translate([${x},0,18.5]) rotate([0,${roll},0]) translate([${-x},0,-18.5]) otto_placed(${side},${call[1]}); otto_placed(${side + 2},${call[1]}); }`);
  const r = await compile(source, g.files);
  assert.deepEqual({ empty: r.stl === null, error: /ERROR:|WARNING:/i.test(r.log) }, { empty: true, error: false }, r.log);
});
