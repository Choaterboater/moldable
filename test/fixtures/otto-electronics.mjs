// Purchased electronics + their plugs in the ASSEMBLED robot frame (otto_placed):
// z up from the ground, face toward -Y, mm. Hard-coded on purpose: these are
// independent envelopes, NOT calls to the cavity modules they check.
// Sizes: docs/reference/otto-fit.md (reported references, all UNMEASURED).
// Head top 141.5, face plane y -31.75, back-cover inner face y 35.75.
// box: [x0,x1, y0,y1, z0,z1]; cyl (axis along Y): {x, z, r, y0, y1}; zcyl (axis along Z): {x, y, r, z0, z1}.
const box = (x0, x1, y0, y1, z0, z1) => ({ box: [x0, x1, y0, y1, z0, z1] });
export const OTTO_ELECTRONICS = [
  { name: 'HC-SR04 board', shapes: [box(-22.5, 22.5, -19.75, -15.75, 116.5, 136.5)] },
  { name: 'HC-SR04 transducers', shapes: [-13.25, 13.25].map(x => ({ cyl: { x, z: 126.5, r: 8, y0: -31.75, y1: -19.75 } })) },
  // 4-pin header points down in the board plane; Dupont housings + wire bend.
  { name: 'HC-SR04 plugs', shapes: [box(-6, 6, -19.5, -14.5, 96.5, 116.5)] },
  { name: 'OLED module', shapes: [box(-13.5, 13.5, -29.75, -25.75, 88, 115)] },
  // OLED mounted upside down: header at the BOTTOM edge, plugs straight back.
  { name: 'OLED plugs', shapes: [box(-6, 6, -25.75, -3.25, 88, 92.5)] },
  // I/O shield 42 x 60 upright, PCB back at y 29; Nano + Dupont plugs in front.
  { name: 'Shield PCB + Nano + plugs', shapes: [box(-21, 21, -1, 29, 78, 138)] },
  // Solder joints behind the PCB, except around the two top screw holes.
  { name: 'Shield solder side', shapes: [box(-21, 21, 29, 31, 78, 131.4), box(-14.5, 14.5, 29, 31, 131.4, 138)] },
  // Type-C plug boot (USB-C R2.1 max 12.35 x 6.5) from the port up through the head top.
  { name: 'Type-C plug', shapes: [box(-6.175, 6.175, 12.45, 18.95, 138, 170)] },
  ...[['L', -22], ['R', 22]].map(([s, x]) => ({ name: 'Hip servo ' + s, shapes: [
    box(x - 6.1, x + 6.1, -5.9, 16.9, 47.5, 70.2), box(x - 6.1, x + 6.1, -10.75, 21.75, 53.7, 56.2)] })),
  { name: '9V battery', shapes: [box(-8.75, 8.75, -28, 20.5, 47.5, 74)] },
  { name: '9V clip', shapes: [box(-9, 9, 20.5, 28.5, 47.5, 67.5)] },
  { name: 'Buzzer', shapes: [{ zcyl: { x: -21, y: -22, r: 6, z0: 47.5, z1: 57 } }] },
  { name: 'DC jack', shapes: [{ zcyl: { x: -18, y: 27, r: 4, z0: 45.5, z1: 55.5 } }] },
  { name: 'Switch', shapes: [box(10.5, 23.5, 22.5, 31.5, 45.5, 55.5)] },
];
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
