// Purchased electronics + their plugs in the ASSEMBLED robot frame (otto_placed):
// z up from the ground, face toward -Y, mm. Hard-coded on purpose: these are
// independent envelopes, NOT calls to the cavity modules they check.
// Sizes: docs/reference/otto-fit.md (reported references, all UNMEASURED).
// Face plane y -31.75, back-cover inner face y 35.75. The z values below were written for the
// old 1 mm joint gaps and 38.5 mm leg (head top 142.5); LIFT raises them all for the real stack (head top 149.5).
export const LIFT = 7;   // ankle gap 4 + leg 42 + hip gap 1.5, instead of 1 + 38.5 + 1
// box: [x0,x1, y0,y1, z0,z1]; cyl (axis along Y): {x, z, r, y0, y1}; zcyl (axis along Z): {x, y, r, z0, z1}.
const box = (x0, x1, y0, y1, z0, z1) => ({ box: [x0, x1, y0, y1, z0, z1] });
const lift = s => s.box ? { box: [...s.box.slice(0, 4), s.box[4] + LIFT, s.box[5] + LIFT] }
  : s.cyl ? { cyl: { ...s.cyl, z: s.cyl.z + LIFT } } : { zcyl: { ...s.zcyl, z0: s.zcyl.z0 + LIFT, z1: s.zcyl.z1 + LIFT } };
const BODY_AND_HEAD = [
  // PCB 5 mm behind the face, rear parts inside its edges (where the snap guides reach over).
  { name: 'HC-SR04 board', shapes: [box(-22.5, 22.5, -24.75, -23.15, 117.5, 137.5), box(-19.5, 19.5, -23.15, -20.75, 118.5, 136.5)] },
  // Transducers D16 at 27.2 c-c (27.0 printed 0.1-0.2 too close) (PartReel hc_sr04 / Cytron drawing), 5 mm proud of the face.
  { name: 'HC-SR04 transducers', shapes: [-13.6, 13.6].map(x => ({ cyl: { x, z: 127.5, r: 8, y0: -36.75, y1: -24.75 } })) },
  // 4-pin header points down in the board plane; Dupont housings + wire bend.
  { name: 'HC-SR04 plugs', shapes: [box(-6, 6, -24.5, -19.5, 97.5, 117.5)] },
  // 0.96" OLED (user's YouKeyi: 24.8 x 27.05 measured), mounted upside down (header at the bottom):
  // glass on the face, PCB, rear parts inside its edges, flex cable at the top edge.
  { name: 'OLED module', shapes: [box(-12.3, 12.3, -29.75, -28.25, 94.97, 114.23), box(-12.4, 12.4, -28.25, -26.65, 91.08, 118.12),
    box(-10, 10, -26.65, -25.75, 92.1, 117.1), box(-7, 7, -29.75, -25.75, 114.23, 118.62)] },
  { name: 'OLED plugs', shapes: [box(-6, 6, -25.75, -3.25, 89.95, 94.45)] },
  // Blue Nano IO shield V3.0 (user's calipers: 53.2 x 54.8) upright on the cover clips, top edge
  // 6.25 below the head top (raised 3.5 mm, Nov 10): PCB, Nano + plugs in front (inside the 4.5 mm edge strips),
  // the DC jack and the Nano's USB-C sticking out of the top edge.
  { name: 'Shield PCB', shapes: [box(-26.6, 26.6, 27.4, 29, 81.45, 136.25)],   // minus its two top mounting holes (pegs)
    minus: [{ cyl: { x: -23.9, z: 133.45, r: 1.6, y0: 27, y1: 29.5 } }, { cyl: { x: 23.9, z: 132.25, r: 1.6, y0: 27, y1: 29.5 } }] },
  { name: 'Shield Nano + plugs', shapes: [box(-22.1, 22.1, -1, 27.4, 81.45, 136.25), box(-20.3, -10.4, 16, 27.4, 136.25, 139.45),
    box(-4.5, 4.5, 14.1, 17.3, 136.25, 139.25)] },
  { name: 'Shield solder side', shapes: [box(-25.1, 25.1, 29, 32, 81.45, 136.25)],   // tails inside the edge ledges, clear of the peg bases
    minus: [{ cyl: { x: -23.9, z: 133.45, r: 2.35, y0: 28.9, y1: 32.1 } }, { cyl: { x: 23.9, z: 132.25, r: 2.35, y0: 28.9, y1: 32.1 } }] },
  // Type-C plug boot (USB-C R2.1 max 12.35 x 6.5) from the port up through the head top.
  { name: 'Type-C plug', shapes: [box(-6.175, 6.175, 12.45, 18.95, 139.25, 175)] },
  ...[['L', -22], ['R', 22]].map(([s, x]) => ({ name: 'Hip servo ' + s, shapes: [
    box(x - 6.1, x + 6.1, -6.1, 17.1, 47.5, 72.9), box(x - 6.1, x + 6.1, -11.2, 22.2, 51.7, 54.4)] })),
  // 4xAA two-layer holder (LAMPVPATH B01CVJC8I4, 56 x 30 x 28) between the hip servos, leads out the rear end.
  { name: '4xAA holder', shapes: [box(-15, 15, -30.5, 25.5, 47.5, 75.5)] },
  { name: 'Holder leads', shapes: [box(-4, 4, 25.5, 31.5, 50, 72)] },
  // Four crush ribs press 0.15 mm into the nominal buzzer on purpose; those zones are excluded.
  { name: 'Buzzer', shapes: [{ zcyl: { x: -24.75, y: -22, r: 6, z0: 47.5, z1: 57 } }],
    minus: [box(-18.95, -18.65, -22.6, -21.4, 47, 58), box(-30.85, -30.55, -22.6, -21.4, 47, 58),
      box(-25.35, -24.15, -16.2, -15.9, 47, 58), box(-25.35, -24.15, -28.1, -27.8, 47, 58)] },
  // KCD11 rocker (cutout 13 x 8) through the floor, terminals inside, flange under the floor.
  { name: 'Switch', shapes: [box(18, 31, -29.5, -21.5, 43.5, 67.5), box(17, 32, -30.75, -20.25, 41.5, 45.5)] },
];
// Servo output stacks and joints, already in the real frame: sole top 5, leg bottom 9, ankle axis 20, leg top 51,
// body floor 52.5-54.5. The user's ASKY MG90S (calipers + seller drawing): case 23.2 x 12.2 x 24.2, boss dia 12.2
// (UNMEASURED) x 4.33 with a raised gear housing beside it, spline 4.0 more, ears 33.4 x 2.7 with their nearer
// face 3.17 below the flat top. Horn (listing drawing): hub dia 6.76 x 4.82, arm 2.08 thick, 17.9 from the centre
// to the tip, UNCUT. Layout as on Otto V13 (docs/reference/otto-fit.md).
const cyl = (x, z, r, y0, y1) => ({ cyl: { x, z, r, y0, y1 } });
const zcyl = (x, y, r, z0, z1) => ({ zcyl: { x, y, r, z0, z1 } });
const JOINTS = [['L', -22], ['R', 22]].flatMap(([s, x]) => [
  // The boss ends 1.3 under the floor and bears on the leg top (z 51).
  { name: 'Hip servo boss ' + s, shapes: [zcyl(x, 0, 6.1, 51.2, 54.5), zcyl(x, 5, 4.5, 51.2, 54.5)] },
  // Horn inside the leg under the 2.5 mm plate, hub up through the plate to the boss, arm toward the rear and out
  // through the rear wall, screw head below. Drawn from seated against the boss down to 0.8 lower.
  { name: 'Hip horn ' + s, shapes: [zcyl(x, 0, 3.4, 45.6, 51.2), box(x - 2.8, x + 2.8, 0, 9, 45.6, 48.46), box(x - 2.2, x + 2.2, 9, 17.9, 45.6, 48.46),
    zcyl(x, 0, 2.2, 44, 45.6)] },
  // Ankle servo in the leg's bay, shaft forward, far ear against the block (seat y -9): case, both ears, boss +
  // gear housing in the U-slot (the boss ends 1 mm inside the leg's front face, y -17.5).
  { name: 'Ankle servo ' + s, shapes: [box(x - 6.1, x + 6.1, -12.2, 12, 13.82, 36.98), box(x - 6.1, x + 6.1, -8.95, -6.25, 8.7, 42.1),
    cyl(x, 20, 6.1, -16.5, -12.2), cyl(x, 25, 4.5, -16.5, -12.2)] },
  // Horn in the front bracket's keyhole (inner face y -18, pocket floor -22): hub screwed down on the boss (outer
  // face -21.32) or standing up to 0.6 off it, uncut arm pointing down into the sole, screw head in the web.
  { name: 'Ankle horn ' + s, shapes: [cyl(x, 20, 3.4, -21.95, -16.5), box(x - 2.8, x + 2.8, -21.95, -19.24, 11, 20),
    box(x - 2.2, x + 2.2, -21.95, -19.24, 2.1, 11), cyl(x, 20, 2.2, -23.5, -21.95)] },
  // Tip of the pivot screw at its WORST case (7.74 thread, foot pushed fully forward): across the rear gap into
  // the bore in the leg's rear wall, ending inside the wall, 3.5 mm short of the servo.
  { name: 'Ankle pivot screw tip ' + s, shapes: [cyl(x, 20, 1, 15.36, 17.75)] },
]);
export const OTTO_ELECTRONICS = [
  ...BODY_AND_HEAD.map(c => ({ ...c, shapes: c.shapes.map(lift), ...(c.minus ? { minus: c.minus.map(lift) } : {}) })),
  ...JOINTS,
];
export function componentScad(c) {
  const add = c.shapes.map(shapeScad).join(' ');
  return c.minus ? `difference(){ union(){ ${add} } union(){ ${c.minus.map(shapeScad).join(' ')} } }` : add;
}
export function shapeScad(s) {
  if (s.box) { const [x0, x1, y0, y1, z0, z1] = s.box; return `translate([${x0},${y0},${z0}]) cube([${x1 - x0},${y1 - y0},${z1 - z0}]);`; }
  if (s.cyl) { const { x, z, r, y0, y1 } = s.cyl; return `translate([${x},${y0},${z}]) rotate([-90,0,0]) cylinder(r=${r},h=${y1 - y0},$fn=48);`; }
  const { x, y, r, z0, z1 } = s.zcyl; return `translate([${x},${y},${z0}]) cylinder(r=${r},h=${z1 - z0},$fn=48);`;
}
// Axis-aligned bounds (cylinders become their bounding boxes: conservative).
export function bounds(s) {
  if (s.box) return s.box;
  if (s.cyl) { const { x, z, r, y0, y1 } = s.cyl; return [x - r, x + r, y0, y1, z - r, z + r]; }
  const { x, y, r, z0, z1 } = s.zcyl; return [x - r, x + r, y - r, y + r, z0, z1];
}
