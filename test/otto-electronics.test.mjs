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
  , ['Shield snap ridge reaches in front of the PCB', near(26.33, 26.55, 26.2, 26.6, 115, 119)]
  , ['Shield ledge holds the PCB off the cover', near(25.6, 26.4, 29, 29.4, 100, 110)]
  , ['Shield snap ridge reaches 0.8 over the PCB edge', near(25.85, 26.1, 25.75, 26.0, 115, 119)]
  , ['Shield peg pin passes through the top hole', near(23.5, 24.3, 27.6, 28.8, 131.9, 132.6)]
  , ['Shield peg base holds the PCB off the cover', near(22, 23, 29, 29.4, 132, 132.5)],
]) test('Otto face mount: ' + name, async () => assert.notEqual(await hits({ headStyle: 2, mouth: 1 }, probe), null));
// Retention: crush ribs touch the buzzer at all four zones.
const buzzer = OTTO_ELECTRONICS.find(c => c.name === 'Buzzer');
for (let i = 0; i < 4; i++) test('Otto buzzer crush rib grips at zone ' + i, async () =>
  assert.notEqual(await hits({}, [{ shapes: [buzzer.minus[i]] }]), null));
// Ankle servo, in the leg's own frame (z = 0 leg top, ankle axis z 31, case end z 13.9, ear hole z 11.5, seat y -9).
async function legHits(box) {
  const g = generate('otto', { part: 2 });
  const call = g.source.match(/otto_part\([^;]+;/)[0];
  const r = await compile(g.source.replace(call, `intersection(){ ${call} translate([${box[0]},${box[2]},${box[4]}]) cube([${box[1] - box[0]},${box[3] - box[2]},${box[5] - box[4]}]); }`), g.files);
  assert.doesNotMatch(r.log, /ERROR:|WARNING:/i, r.log);
  return r.stl !== null;
}
test('Otto ankle servo ear is backed by the block', async () => assert.equal(await legHits([2, 3, -10, -9.5, 11, 12]), true));
test('Otto ankle ear seat leaves room for the servo ear', async () => assert.equal(await legHits([-6, 6, -8.95, -6, 5.5, 13.5]), false));
test('Otto ankle ear block has a screw slot on the hole line', async () => assert.equal(await legHits([-0.5, 0.5, -15.5, -9.2, 10.7, 13.5]), false));
test('Otto ankle ear screw slot is only a pilot (plastic beside it)', async () => assert.equal(await legHits([1.1, 1.6, -15, -10, 11, 12]), true));
test('Otto ankle ear screw slot is blind (front wall whole)', async () => assert.equal(await legHits([-0.5, 0.5, -17.4, -16.2, 11, 12]), true));
test('Otto ankle ear block carries the far end of the case', async () => assert.equal(await legHits([3, 5, -12, -9.5, 13.2, 13.6]), true));
// The bay is the V13 leg's: 13 wide and open from the front wall back, so the flat top may sit up to 6.4 in front of the ear.
test('Otto leg bay is clear above the block', async () => assert.equal(await legHits([-6.4, 6.4, -13.4, 15.4, 14.1, 41.9]), false));
test('Otto leg front wall is doubled under the U-slot', async () => assert.equal(await legHits([-5, 5, -15.3, -13.7, 14.5, 20.2]), true));
test('Otto leg bay is 13 mm wide, not more', async () => assert.equal(await legHits([6.6, 6.8, -10, 10, 20, 30]), true));
// Each hip servo case (23.16 long, plus the clearance) must drop between its two ear posts.
test('Otto hip servo case fits between the ear posts', async () =>
  assert.equal(await hits({}, [{ shapes: [{ box: [22 - 6.1, 22 + 6.1, 5.5 - 11.8, 5.5 + 11.8, 55.6, 58.6] }] }], [1]), null));
// The ankle servo's cable leaves at the top rear of the leg: its 3-pin plug (7.7 x 2.6) must pass the rear window,
// and the screwdriver for the ear screw goes in through the same window on the hole line.
test('Otto leg rear window passes a 3-pin servo plug', async () => assert.equal(await legHits([-3.9, 3.9, 15.6, 17.4, 5.6, 8.4]), false));
test('Otto leg rear window is open on the ear screw line', async () => assert.equal(await legHits([-1.5, 1.5, 15.4, 17.6, 10, 13]), false));
test('Otto leg rear window leaves the rear wall whole beside it', async () => assert.equal(await legHits([5, 6, 15.7, 17.3, 6, 9]), true));
// Hip horn pocket inside the leg (V13): hub hole through the plate, arm pocket above it running out through the
// rear wall for an UNCUT 17.9 mm arm, plate left under the arm.
test('Otto leg plate has the horn hub hole', async () => assert.equal(await legHits([-2.5, 2.5, -2.5, 2.5, 0.1, 4.9]), false));
test('Otto leg horn pocket takes an uncut arm', async () => assert.equal(await legHits([-2, 2, 4, 18.4, 2.6, 4.9]), false));
test('Otto leg plate is whole under the horn arm', async () => assert.equal(await legHits([-2, 2, 5, 15, 0.2, 2.3]), true));
// The rocker flange sits under the floor, in the plane the legs swing through: keep it
// outside the circle a leg corner sweeps around each hip axis.
test('Otto switch flange clears the leg swing', () => {
  const [lw, ll, ch] = [17, 35, 0.88], sweep = Math.max(Math.hypot(lw / 2 - ch, ll / 2), Math.hypot(lw / 2, ll / 2 - ch));   // chamfered corners
  const flange = OTTO_ELECTRONICS.find(c => c.name === 'Switch').shapes[1].box;
  for (const hx of [-22, 22]) {
    const nx = Math.min(Math.max(hx, flange[0]), flange[1]), ny = Math.min(Math.max(0, flange[2]), flange[3]);
    assert.ok(Math.hypot(nx - hx, ny) > sweep + 1, `hip ${hx}: ${Math.hypot(nx - hx, ny).toFixed(2)} <= ${sweep.toFixed(2)} + 1`);
  }
});
test('Otto battery holder is stopped at the rear by a post', async () =>
  assert.notEqual(await hits({}, [{ shapes: [{ box: [9, 11, 25.6, 26.2, 48 + LIFT, 52 + LIFT] }] }]), null));
// Joints and latch, probed in the assembled frame (ankle axis z 20, leg top 51, body floor z 52.5-54.5, head top
// 149.5). The body, head and cover probes below were written when the head top was 147: RAISE moves them up.
const RAISE = 2.5;
const raised = b => [...b.slice(0, 4), b[4] + RAISE, b[5] + RAISE];
const probe = (...b) => [{ shapes: [{ box: b }] }];
for (const [name, box, solid, parts] of [
  // Back-cover cross screws: axis along x at assembled y 23.75, z 111 (36 below the head top, 14 in from the cover's outside).
  ['Cover screw post stands between the shield rail and the head wall', [28.6, 29.4, 19.5, 23.0, 106, 116], true, [8]],   // outside the rail, above its top and the lip
  ['Cover screw post has its pilot on the screw axis', [26.9, 29.45, 23.45, 24.05, 110.7, 111.3], false, [8]],
  ['Cover post pilot is only a pilot', [27, 29.4, 23.55, 23.95, 109.85, 110.05], true, [8]],
  ['Cover post is solid above the pilot', [27, 28.4, 19.4, 22.2, 110.5, 111.5], true, [8]],
  ['Shield snap ridge is interrupted at the screw post', [25.6, 26.84, 24.5, 27.1, 104.2, 117.8], false, [8]],
  ['Cover has no ridge left on its lip', [29.55, 30.4, 33.5, 34.6, 105, 125], false, [8]],
  ['Cover edge carries the screw-height notch', [31.0, 31.7, 35.9, 37.6, 110.8, 111.2], false, [8]],
  ['Head side wall has the cover screw pilot', [29.8, 31.7, 23.45, 24.05, 110.7, 111.3], false, [0]],
  ['Head wall pilot is only a pilot', [29.8, 31.7, 23.55, 23.95, 109.85, 110.05], true, [0]],
  ['Head side wall is whole where the old groove was', [29.85, 30.1, 33.95, 34.15, 111, 121], true, [0]],
  ['Cover screw core passes the head wall and the post', [23.75, 31.75, 23.15, 24.35, 110.4, 111.6], false],
  ['Foot keyhole is open to the bracket top', [-23, -21, -21.9, -18.1, 23.5, 24.9], false],
  ['Foot bracket web backs the horn pocket', [-18.8, -18.2, -23.5, -22.1, 19.5, 20.5], true],
  ['Foot horn screw hole passes the screw head', [-23.5, -20.5, -23.7, -22.1, 19, 21], false],
  ['Foot horn pocket takes an uncut arm down into the sole', [-24, -20, -21.9, -18.1, 1.5, 19], false],
  ['Foot sole is whole under the horn pocket', [-24, -20, -21.9, -18.5, 0.1, 0.8], true],
  ['Rear bracket dimple takes the leg knob on the ankle axis', [-22.3, -21.7, 18, 19.3, 19.7, 20.3], false, [4]],
  ['Rear bracket is whole behind the dimple (no hole a screw could go through)', [-22.3, -21.7, 20.2, 23.6, 19.7, 20.3], true, [4]],
  ['Rear bracket lead-in starts the knob at the bracket top', [-23.5, -20.5, 17.95, 18.3, 26.2, 26.9], false, [4]],
  ['Rear bracket rim is whole above the dimple (the knob snaps in)', [-24.5, -19.5, 17.95, 18.3, 23.9, 24.1], true, [4]],
  ['Leg knob is a full round pin, upper side included', [-22.2, -21.8, 17.6, 18.4, 21.9, 22.3], true, [2]],
  ['Leg knob stands 2.5 out with a flat tip', [-22.6, -21.4, 19.8, 19.95, 19.5, 20.5], true, [2]],
  ['Leg knob edge is rounded', [-22.2, -21.8, 19.7, 19.98, 22.2, 22.48], false, [2]],
  ['Rear bracket stands 7 above the ankle axis', [-23.5, -20.5, 19.5, 23, 25.2, 26.9], true, [4]],
  ['Leg front bottom edge is cut away as on V13', [-30, -14, -17.4, -16.4, 9.1, 10], false, [2]],
  ['Leg front wall is whole above the cut', [-30.3, -29.5, -17.4, -16.6, 15.2, 18], true, [2]],
  ['Leg side walls have a finger window under the plate', [-31, -13, -7.5, 13.5, 38.5, 45.5], false, [2]],
  ['Leg side wall is whole below the finger window', [-30.9, -30.1, 0, 6, 12, 24], true, [2]],
  ['Leg top plate has the slot for the arm screw', [-22.3, -21.7, 7.5, 12, 48.4, 51.2], false, [2]],
  ['Arm screw slot is 2.2 wide on the plate underside (plate left beside it)', [-20.75, -20.65, 8, 11.5, 48.52, 48.6], true, [2]],
  ['Arm screw head recess is 4.6 wide and 1.25 deep', [-24.2, -19.8, 8, 11.5, 49.8, 51.2], false, [2]],
  ['Arm screw head recess is no wider than 4.6 (a small head seats in it)', [-19.6, -19.3, 8, 11.5, 49.9, 50.9], true, [2]],
  ['Cable way is open from the bay to the opening in the leg top', [-25.9, -18.1, -9.5, -8.5, 43.2, 45.8], false, [2]],
  ['Cable way is cut back under the plate so a plug can turn the corner', [-27, -17, -8.8, -5.8, 46.2, 48.3], false, [2]],
  ['Leg plate is whole above that cut', [-27, -17, -8.8, -5.8, 48.7, 50.9], true, [2]],
  ['Ear-screw slot keeps a skin over the cable way', [-22.5, -21.5, -9.6, -9.4, 40.6, 40.9], true, [2]],
  ['Front hip ear post is not cut by the cable window', [21.5, 22.5, -10.7, -10.5, 50.2, 51.8], true, [1]],
  ['Foot arm-screw slot is only a pilot (plastic beside a 1.8 slot)', [-23.2, -23.0, -23.4, -22.2, 9, 11.5], true, [4]],
  ['Leg top has the cable opening in front of the ear seat', [-27.5, -16.5, -15.3, -9.2, 47.9, 51.2], false, [2]],
  ['Leg shelf above the cable way carries the servo end', [-27, -17, -15, -9.6, 37.2, 39.9], true, [2]],
  ['Body floor has a cable window in front of each hip servo', [15.9, 30.3, -16.8, -11.2, 50.2, 51.8], false, [1]],
  ['Body floor cable window (left)', [-30.3, -15.9, -16.8, -11.2, 50.2, 51.8], false, [1]],
  ['Front hip ear post keeps its floor behind the cable window', [19.9, 24.1, -10.7, -6.4, 50.2, 51.8], true, [1]],
  ['Leg top plate is whole between the hub hole and the arm slot', [-22.3, -21.7, 4.3, 5.1, 48.7, 50.9], true, [2]],
  ['Front bracket has the slot for the arm screw, through the web', [-22.3, -21.7, -24, -22.2, 9, 11.5], false, [4]],
  ['Front bracket has no pad on its outside (the arm screw is a short one)', [-25, -19, -25.6, -23.8, 5.5, 14], false, [4]],
  ['Leg rear wall is whole on the ankle axis (nothing can reach the cable)', [-22.3, -21.7, 15.6, 17.4, 19.7, 20.3], true, [2]],
  ['Leg plate lies between the servo boss and the horn arm', [-24, -20, 5, 10, 48.6, 50.9], true, [2]],
  ['Body floor passes a 3-pin servo plug', [18.1, 25.9, 25.7, 28.3, 50.2, 51.8], false],
  ['Body floor boss hole covers the raised gear housing', [20, 24, 4, 9, 50.2, 51.8], false],
  ['Hip ear screw pilot runs through the floor', [21.7, 22.3, 19.2, 19.8, 50.2, 51.8], false],
  // Head-to-body clip (V13 style): barb crest 6 below the body rim (z 84.5), reaching x 33.3; body inner wall x 32.
  ['Head clip barb reaches 1.3 into the body wall', [33.1, 33.25, -5, 5, 81.8, 82.2], true, [0]],
  ['Head clip tab hangs 5 below the insert band', [30, 31.5, -5, 5, 80.1, 80.4], true, [0]],
  ['Head clip tab ends 8 below the body rim', [29.5, 33.5, -5, 5, 79.2, 79.9], false, [0]],
  ['Body side wall has the groove for the clip barb', [32.05, 33.5, -5, 5, 81.7, 82.3], false, [1]],
  ['Body bump keeps plastic behind the clip groove', [34.2, 35.1, -5, 5, 81.5, 82.5], true, [1]],
  ['Body has a seat under each front corner of the head', [29.5, 31.5, -31.8, -30.5, 84.6, 84.95], true, [1]],
  ['Head top passes a chunky Type-C boot (14 x 8)', [-6.9, 6.9, 11.8, 19.6, 145.1, 146.9], false],
]) test('Otto joint: ' + name, async () => {
  const hit = await hits({ headStyle: 2, mouth: 1 }, probe(...(box[4] >= 50 ? raised(box) : box)), parts);
  if (solid) assert.notEqual(hit, null); else assert.equal(hit, null);
});
// The body wall must be WHOLE from 0.4 above the clip groove's mouth to the rim: the barb has to click past it.
// A solid probe passes on any overlap, so this one subtracts the body from the slab and expects nothing left.
for (const sx of [-1, 1]) test(`Otto body wall is whole above the clip groove (${sx < 0 ? 'left' : 'right'})`, async () => {
  const g = generate('otto', { headStyle: 2, mouth: 1, part: 7 });
  const call = g.source.match(/otto_part\(part,([^;]+)\);/);
  const slab = `translate([${sx < 0 ? -33.6 : 32},-5,86.9]) cube([1.6,10,3.5]);`;
  const r = await compile(g.source.replace(call[0], `difference(){ ${slab} otto_placed(1,${call[1]}); }`), g.files);
  assert.doesNotMatch(r.log, /ERROR:|WARNING:/i, r.log);
  assert.match(r.log, /Current top level object is empty/i, 'the wall above the groove is cut');
});
// Clip features on both sides (the table above probes the right side only).
for (const [name, box, solid, parts] of [
  ['Head clip barb (left)', [-33.25, -33.1, -5, 5, 84.3, 84.7], true, [0]],
  ['Body groove for the clip barb (left)', [-33.5, -32.05, -5, 5, 84.2, 84.8], false, [1]],
  ['Wall left behind the clip groove', [33.65, 33.75, -5, 5, 84.3, 84.7], true, [1]],
  ['Clip bump stands 1.2 out of the body wall', [35.05, 35.15, -5, 5, 84.3, 84.7], true, [1]],
  ['Clip tab is as long as the groove needs (front end)', [30, 31.5, -10.4, -10.2, 83, 87], true, [0]],
  ['Clip tab is as long as the groove needs (rear end)', [30, 31.5, 10.7, 10.9, 83, 87], true, [0]],
  ['Seat under the left front corner of the head', [-31.5, -29.5, -31.8, -30.5, 87.1, 87.45], true, [1]],
]) test('Otto clip: ' + name, async () => {
  const hit = await hits({ headStyle: 2, mouth: 1 }, probe(...box), parts);
  if (solid) assert.notEqual(hit, null); else assert.equal(hit, null);
});
// The clip is for the standard shell only: a grown shell has neither tabs nor grooves nor bumps.
test('Otto grown shell has no clip on head or body', async () => {
  assert.equal(await hits({ grow: 1 }, probe(30, 33.5, -5, 5, 84 + 0, 87.3), [0]), null);
  assert.notEqual(await hits({ grow: 1 }, probe(32.05, 32.9, -5, 5, 84.2, 84.8), [1]), null);
});
// The leg may roll 30 degrees either way on the foot without touching the sole or brackets.
for (const side of [2, 3]) for (const roll of [-30, 30]) test(`Otto leg ${side} rolls ${roll} degrees clear of its foot`, async () => {
  const g = generate('otto', { part: 7 });
  const call = g.source.match(/otto_part\(part,([^;]+)\);/);
  const x = side === 2 ? -22 : 22;
  const source = g.source.replace(call[0], `intersection(){ translate([${x},0,20]) rotate([0,${roll},0]) translate([${-x},0,-20]) otto_placed(${side},${call[1]}); otto_placed(${side + 2},${call[1]}); }`);
  const r = await compile(source, g.files);
  assert.deepEqual({ empty: r.stl === null, error: /ERROR:|WARNING:/i.test(r.log) }, { empty: true, error: false }, r.log);
});

// The two cover screws (2 mm thread, at most 9.5 long, 4.2 head) as steel pins on their axis.
const coverScrews = r => [-1, 1].map(s => `translate([${s * 23.75},23.75,113.5]) rotate([0,${s * 90},0]) cylinder(r=${r},h=8,$fn=24);`).join(' ');
for (const [d, blocked] of [[0, false], [1, true], [5, true]]) test(`Otto back cover ${blocked ? 'cannot slide out past' : 'sits free on'} its screws (pulled back ${d} mm)`, async () => {
  const g = generate('otto', { part: 7 });
  const call = g.source.match(/otto_part\(part,([^;]+)\);/);
  const r = await compile(g.source.replace(call[0], `intersection(){ translate([0,${d},0]) otto_placed(8,${call[1]}); union(){ ${coverScrews(0.7)} } }`), g.files);
  assert.doesNotMatch(r.log, /ERROR:|WARNING:/i, r.log);
  assert.equal(r.stl !== null, blocked, r.log);
});
// A 9.5 mm screw with its head must clear every component for every head style; a 12 mm one must not (control).
test('Otto cover screw envelope clears every component', () => {
  for (const s of [-1, 1]) {
    const env = s > 0 ? [22.25, 33.4, 22.65, 24.85, 112.4, 114.6] : [-33.4, -22.25, 22.65, 24.85, 112.4, 114.6];
    for (const c of OTTO_ELECTRONICS) for (const sh of c.shapes) {
      const q = bounds(sh);
      assert.ok(![0, 2, 4].every(k => Math.min(env[k + 1], q[k + 1]) - Math.max(env[k], q[k]) > 0), c.name + ' ' + JSON.stringify(q));
    }
  }
  const long = [19.75, 33.4, 22.65, 24.85, 112.4, 114.6];
  assert.ok(OTTO_ELECTRONICS.some(c => c.shapes.some(sh => { const q = bounds(sh); return [0, 2, 4].every(k => Math.min(long[k + 1], q[k + 1]) - Math.max(long[k], q[k]) > 0); })));
});

// The raised shield's corners must keep 0.3 mm from the head in every corner style (bevel capped at 8, dome 13 / 11).
{
  const pcb = OTTO_ELECTRONICS.find(c => c.name === 'Shield PCB').shapes[0].box;
  for (const p of [{ headStyle: 0 }, { headStyle: 1, corner: 12 }, { headStyle: 2, corner: 12 }, { headStyle: 3 }, { headStyle: 3, grow: 10, corner: 12 }])
    test('Otto shield PCB corners keep 0.3 mm from the head ' + JSON.stringify(p), async () =>
      assert.equal(await hits({ ...p, mouth: 1 }, probe(pcb[0] - 0.3, pcb[1] + 0.3, pcb[2], pcb[3], pcb[4], pcb[5] + 0.3), [0]), null));
}
// Drill guide for an already printed head, placed as the builder's guide says: flat on the outside of a side wall,
// hook over the cover's outside face, tooth in the notch on the cover's edge. Its hole must land on the pilot axis.
const JIG = (dx = 0, dy = 0, dz = 0) => `multmatrix([[0,0,-1,${35.75 + dx}],[-1,0,0,${37.75 + dy}],[0,1,0,${113.5 + dz}],[0,0,0,1]]) cover_jig();`;
const drillPin = dz => `translate([20,23.75,${113.5 + dz}]) rotate([0,90,0]) cylinder(r=0.8,h=20,$fn=24);`;
for (const [name, body, empty] of [
  ['seats on the side wall, the cover face and the notch', a => `intersection(){ ${JIG()} union(){ otto_placed(0,${a}); otto_placed(8,${a}); } }`, true],
  ['plate lies on the wall (0.3 closer collides)', a => `intersection(){ ${JIG(-0.3)} otto_placed(0,${a}); }`, false],
  ['hook bears on the cover outside face (0.3 forward collides)', a => `intersection(){ ${JIG(0, -0.3)} otto_placed(8,${a}); }`, false],
  ['tooth is in the notch (0.5 up collides)', a => `intersection(){ ${JIG(0, 0, 0.5)} otto_placed(8,${a}); }`, false],
  ['tooth is in the notch (0.5 down collides)', a => `intersection(){ ${JIG(0, 0, -0.5)} otto_placed(8,${a}); }`, false],
  ['hole is on the pilot axis of the wall and the post', a => `intersection(){ ${drillPin(0)} union(){ ${JIG()} otto_placed(0,${a}); otto_placed(8,${a}); } }`, true],
  ['hole check sees a 0.5 mm error (control)', a => `intersection(){ ${drillPin(0.5)} ${JIG()} }`, false],
]) test('Otto cover drill guide ' + name, async () => {
  const g = generate('otto', { part: 7 });
  const call = g.source.match(/otto_part\(part,([^;]+)\);/);
  const r = await compile(g.source.replace('use <otto/otto_shells.scad>', 'use <otto/otto_shells.scad>\nuse <otto/otto_core.scad>').replace(call[0], body(call[1])), g.files);
  assert.doesNotMatch(r.log, /ERROR:|WARNING:/i, r.log);
  assert.equal(r.stl === null, empty, r.log);
});
