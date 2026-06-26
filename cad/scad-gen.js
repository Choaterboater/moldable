// cad/scad-gen.js
// Pure spec -> OpenSCAD authoring. No DOM, no engine. Imported by BOTH the
// browser app (Moldable.dc.html) and the headless Node test (test/engine.test.mjs)
// so every shape's source is verifiable in CI, not just in the viewer.
//
// generate(model, params) -> { source: string, files?: {name:string, contents:string}[] }
//   `source` is a complete .scad program.
//   `files` are extra library files to drop into the OpenSCAD FS for `use <...>`
//   (empty for the self-contained shapes; populated by the library route).
//
// MODELS is the single source of truth for the parameter schema (label/min/max/
// step/def/unit) and is also consumed by the UI.

import { AP515_BRACKET } from './ap515-bracket.js';   // self-contained polyhedron of RevK's AP-515 bracket
import { HSW_CONNECTOR } from './hsw-connector.js';   // the user's REAL wall connector (test-print verified)

export const MODELS = {
  vase: { label: 'Vase / Planter', cat: 'Home Decor', tags: ['planter', 'vase', 'parametric', 'decor'], params: [
    { key: 'height', label: 'Height', min: 60, max: 240, step: 1, def: 150, unit: 'mm' },
    { key: 'radius', label: 'Width', min: 25, max: 90, step: 1, def: 50, unit: 'mm' },
    { key: 'sides', label: 'Sides', min: 3, max: 16, step: 1, def: 6, unit: '' },
    { key: 'twist', label: 'Twist', min: 0, max: 360, step: 5, def: 120, unit: '°' },
    { key: 'bulge', label: 'Belly', min: 0, max: 60, step: 1, def: 24, unit: '%' },
  ] },
  organizer: { label: 'Desk Organizer', cat: 'Office', tags: ['organizer', 'desk', 'storage', 'parametric'], params: [
    { key: 'width', label: 'Width', min: 60, max: 260, step: 2, def: 160, unit: 'mm' },
    { key: 'depth', label: 'Depth', min: 50, max: 180, step: 2, def: 90, unit: 'mm' },
    { key: 'height', label: 'Height', min: 25, max: 90, step: 1, def: 48, unit: 'mm' },
    { key: 'wall', label: 'Wall', min: 2, max: 8, step: 1, def: 3, unit: 'mm' },
    { key: 'slots', label: 'Compartments', min: 1, max: 5, step: 1, def: 3, unit: '' },
  ] },
  stand: { label: 'Phone Stand', cat: 'Gadgets', tags: ['phone-stand', 'desk', 'parametric', 'accessory'], params: [
    { key: 'width', label: 'Width', min: 60, max: 140, step: 1, def: 82, unit: 'mm' },
    { key: 'height', label: 'Back height', min: 70, max: 170, step: 1, def: 115, unit: 'mm' },
    { key: 'angle', label: 'Recline', min: 50, max: 78, step: 1, def: 64, unit: '°' },
    { key: 'baseDepth', label: 'Base depth', min: 60, max: 130, step: 1, def: 92, unit: 'mm' },
  ] },
  holder: { label: 'HSW Tool Holder', cat: 'Workshop', tags: ['hsw', 'honeycomb-storage-wall', 'tool-holder', 'parametric'], params: [
    { key: 'dia', label: 'Tool slot ⌀', min: 12, max: 70, step: 1, def: 32, unit: 'mm' },
    { key: 'depth', label: 'Cup depth', min: 25, max: 120, step: 1, def: 64, unit: 'mm' },
    { key: 'wall', label: 'Wall', min: 2, max: 6, step: 1, def: 3, unit: 'mm' },
    { key: 'tiles', label: 'Mount width', min: 1, max: 4, step: 1, def: 1, unit: 'tiles' },
  ] },
  hook: { label: 'HSW Hook', cat: 'Workshop', tags: ['hsw', 'honeycomb-storage-wall', 'hook', 'parametric'], params: [
    { key: 'rod', label: 'Rod ⌀', min: 6, max: 18, step: 1, def: 10, unit: 'mm' },
    { key: 'length', label: 'Reach', min: 25, max: 90, step: 1, def: 48, unit: 'mm' },
    { key: 'tip', label: 'Up-turn', min: 8, max: 45, step: 1, def: 24, unit: 'mm' },
    { key: 'tiles', label: 'Mount width', min: 1, max: 3, step: 1, def: 1, unit: 'tiles' },
  ] },
  shelf: { label: 'HSW Display Shelf', cat: 'Workshop', tags: ['hsw', 'honeycomb-storage-wall', 'shelf', 'display-stand', 'parametric'], params: [
    { key: 'tiles', label: 'Mount width', min: 2, max: 5, step: 1, def: 3, unit: 'tiles' },
    { key: 'depth', label: 'Shelf depth', min: 40, max: 120, step: 2, def: 72, unit: 'mm' },
    { key: 'lip', label: 'Front lip', min: 4, max: 32, step: 1, def: 14, unit: 'mm' },
  ] },
  gridfinity: { label: 'Gridfinity Bin', cat: 'Storage', tags: ['gridfinity', '42mm-grid', 'bin', 'parametric'], params: [
    { key: 'gx', label: 'Grid X', min: 1, max: 6, step: 1, def: 2, unit: 'u' },
    { key: 'gy', label: 'Grid Y', min: 1, max: 6, step: 1, def: 1, unit: 'u' },
    { key: 'height', label: 'Height', min: 2, max: 12, step: 1, def: 6, unit: 'u' },
    { key: 'compartments', label: 'Compartments', min: 1, max: 6, step: 1, def: 1, unit: '' },
    { key: 'labelTab', label: 'Label tab', min: 0, max: 1, step: 1, def: 1, unit: '' },
    { key: 'scoop', label: 'Scoop', min: 0, max: 1, step: 1, def: 1, unit: '' },
  ] },
  baseplate: { label: 'Gridfinity Baseplate', cat: 'Storage', tags: ['gridfinity', 'baseplate', '42mm-grid', 'parametric'], params: [
    { key: 'gx', label: 'Grid X', min: 1, max: 8, step: 1, def: 3, unit: 'u' },
    { key: 'gy', label: 'Grid Y', min: 1, max: 8, step: 1, def: 2, unit: 'u' },
    { key: 'magnets', label: 'Magnet holes', min: 0, max: 1, step: 1, def: 0, unit: '' },
  ] },
  box: { label: 'Box', cat: 'Storage', tags: ['box', 'container', 'storage', 'parametric'], params: [
    { key: 'width', label: 'Width', min: 30, max: 220, step: 1, def: 100, unit: 'mm' },
    { key: 'depth', label: 'Depth', min: 30, max: 220, step: 1, def: 70, unit: 'mm' },
    { key: 'height', label: 'Height', min: 15, max: 150, step: 1, def: 45, unit: 'mm' },
    { key: 'wall', label: 'Wall', min: 1.2, max: 5, step: 0.2, def: 2.4, unit: 'mm' },
    { key: 'fillet', label: 'Corner radius', min: 0, max: 24, step: 1, def: 5, unit: 'mm' },
  ] },
  coaster: { label: 'Coaster', cat: 'Home Decor', tags: ['coaster', 'drinks', 'home', 'parametric'], params: [
    { key: 'dia', label: 'Diameter', min: 70, max: 140, step: 1, def: 96, unit: 'mm' },
    { key: 'thick', label: 'Base', min: 2, max: 6, step: 0.5, def: 3, unit: 'mm' },
    { key: 'rim', label: 'Rim height', min: 0, max: 10, step: 1, def: 4, unit: 'mm' },
    { key: 'sides', label: 'Sides', min: 3, max: 64, step: 1, def: 64, unit: '' },
  ] },
  bracket: { label: 'L-Bracket', cat: 'Workshop', tags: ['bracket', 'mount', 'l-bracket', 'parametric'], params: [
    { key: 'legA', label: 'Leg A', min: 20, max: 120, step: 1, def: 50, unit: 'mm' },
    { key: 'legB', label: 'Leg B', min: 20, max: 120, step: 1, def: 50, unit: 'mm' },
    { key: 'width', label: 'Width', min: 15, max: 100, step: 1, def: 30, unit: 'mm' },
    { key: 'thick', label: 'Thickness', min: 2, max: 10, step: 1, def: 4, unit: 'mm' },
    { key: 'hole', label: 'Screw ⌀', min: 0, max: 8, step: 1, def: 4, unit: 'mm' },
  ] },
  cableclip: { label: 'Cable Clip', cat: 'Workshop', tags: ['cable', 'cord', 'management', 'parametric'], params: [
    { key: 'cables', label: 'Cables', min: 1, max: 6, step: 1, def: 3, unit: '' },
    { key: 'dia', label: 'Cable ⌀', min: 3, max: 14, step: 1, def: 6, unit: 'mm' },
    { key: 'length', label: 'Length', min: 16, max: 60, step: 1, def: 32, unit: 'mm' },
    { key: 'mount', label: 'Screw holes', min: 0, max: 1, step: 1, def: 1, unit: '' },
  ] },
  knob: { label: 'Knob', cat: 'Gadgets', tags: ['knob', 'dial', 'control', 'parametric'], params: [
    { key: 'dia', label: 'Diameter', min: 18, max: 60, step: 1, def: 32, unit: 'mm' },
    { key: 'height', label: 'Height', min: 10, max: 30, step: 1, def: 16, unit: 'mm' },
    { key: 'shaft', label: 'Shaft ⌀', min: 3, max: 10, step: 0.5, def: 6, unit: 'mm' },
    { key: 'grips', label: 'Grips', min: 0, max: 30, step: 1, def: 14, unit: '' },
  ] },
  cupadapter: { label: 'Cupholder Adapter', cat: 'Auto', tags: ['car', 'cupholder', 'mug', 'adapter', 'insert', 'parametric'], params: [
    { key: 'holder', label: 'Cupholder diameter', min: 55, max: 100, step: 1, def: 74, unit: 'mm' },
    { key: 'mug', label: 'Mug/cup diameter', min: 45, max: 115, step: 1, def: 80, unit: 'mm' },
    { key: 'cradleH', label: 'Cradle height', min: 25, max: 120, step: 1, def: 70, unit: 'mm' },
    { key: 'plugH', label: 'Insert depth', min: 12, max: 60, step: 1, def: 35, unit: 'mm' },
    { key: 'handle', label: 'Opening width', min: 0, max: 60, step: 1, def: 30, unit: 'mm' },
    { key: 'openings', label: 'Openings', min: 1, max: 6, step: 1, def: 1, unit: '' },
    { key: 'wall', label: 'Wall', min: 2, max: 6, step: 0.5, def: 2.5, unit: 'mm' },
  ] },
  funnel: { label: 'Funnel', cat: 'Kitchen', tags: ['funnel', 'pour', 'oil', 'parametric'], params: [
    { key: 'topDia', label: 'Mouth ⌀', min: 40, max: 160, step: 2, def: 90, unit: 'mm' },
    { key: 'stemDia', label: 'Spout ⌀', min: 5, max: 30, step: 1, def: 14, unit: 'mm' },
    { key: 'height', label: 'Cone height', min: 25, max: 120, step: 1, def: 58, unit: 'mm' },
    { key: 'stemLen', label: 'Spout length', min: 15, max: 90, step: 1, def: 34, unit: 'mm' },
    { key: 'wall', label: 'Wall', min: 1.2, max: 3, step: 0.2, def: 1.6, unit: 'mm' },
  ] },
  soapdish: { label: 'Soap Dish', cat: 'Bathroom', tags: ['soap', 'dish', 'drain', 'tray', 'parametric'], params: [
    { key: 'width', label: 'Width', min: 80, max: 170, step: 2, def: 110, unit: 'mm' },
    { key: 'depth', label: 'Depth', min: 55, max: 120, step: 2, def: 85, unit: 'mm' },
    { key: 'height', label: 'Height', min: 10, max: 35, step: 1, def: 18, unit: 'mm' },
    { key: 'ridges', label: 'Drain ridges', min: 0, max: 12, step: 1, def: 6, unit: '' },
  ] },
  peghook: { label: 'Pegboard Hook', cat: 'Workshop', tags: ['pegboard', 'hook', 'tool', 'parametric'], params: [
    { key: 'reach', label: 'Reach', min: 20, max: 110, step: 1, def: 45, unit: 'mm' },
    { key: 'rod', label: 'Rod ⌀', min: 5, max: 14, step: 1, def: 8, unit: 'mm' },
    { key: 'pitch', label: 'Hole spacing', min: 20, max: 40, step: 0.5, def: 25.4, unit: 'mm' },
    { key: 'upturn', label: 'Up-turn', min: 6, max: 40, step: 1, def: 16, unit: 'mm' },
  ] },
  wallhook: { label: 'Wall Hook', cat: 'Home', tags: ['hook', 'wall', 'coat', 'screw-mount', 'parametric'], params: [
    { key: 'reach', label: 'Reach', min: 25, max: 90, step: 1, def: 42, unit: 'mm' },
    { key: 'rod', label: 'Rod ⌀', min: 8, max: 22, step: 1, def: 12, unit: 'mm' },
    { key: 'upturn', label: 'Up-turn', min: 8, max: 45, step: 1, def: 20, unit: 'mm' },
    { key: 'screws', label: 'Screw holes', min: 1, max: 2, step: 1, def: 2, unit: '' },
  ] },
  brick: { label: 'Building Brick', cat: 'Toys', tags: ['lego-compatible', 'brick', 'plate', 'tile', 'parametric'], params: [
    { key: 'studsX', label: 'Studs wide', min: 1, max: 8, step: 1, def: 2, unit: '' },
    { key: 'studsY', label: 'Studs long', min: 1, max: 12, step: 1, def: 4, unit: '' },
    { key: 'layers', label: 'Height (plates)', min: 1, max: 6, step: 1, def: 3, unit: '' },
    { key: 'studs', label: 'Studs (0=tile)', min: 0, max: 1, step: 1, def: 1, unit: '' },
  ] },
  apmount: { label: 'Aruba AP-515 HSW Mount', cat: 'Network', tags: ['aruba', 'ap-515', 'access-point', 'hsw', 'honeycomb-storage-wall'], params: [
    { key: 'cols', label: 'Connectors', min: 1, max: 4, step: 1, def: 4, unit: '' },
  ] },
  wallbin: { label: 'Wall Bin', cat: 'Workshop', tags: ['hsw', 'honeycomb-storage-wall', 'bin', 'parts', 'parametric'], params: [
    { key: 'width', label: 'Width', min: 50, max: 200, step: 2, def: 100, unit: 'mm' },
    { key: 'height', label: 'Back height', min: 20, max: 90, step: 1, def: 45, unit: 'mm' },
    { key: 'depth', label: 'Depth', min: 20, max: 70, step: 1, def: 35, unit: 'mm' },
    { key: 'sections', label: 'Compartments', min: 1, max: 6, step: 1, def: 3, unit: '' },
    { key: 'honeycomb', label: 'Honeycomb walls', min: 0, max: 1, step: 1, def: 1, unit: '' },
  ] },
  walldock: { label: 'Wall Dock', cat: 'Gadgets', tags: ['hsw', 'honeycomb-storage-wall', 'phone', 'tablet', 'dock', 'parametric'], params: [
    { key: 'width', label: 'Width', min: 45, max: 220, step: 1, def: 82, unit: 'mm' },
    { key: 'height', label: 'Back height', min: 45, max: 170, step: 1, def: 95, unit: 'mm' },
    { key: 'shelfDepth', label: 'Shelf depth', min: 15, max: 90, step: 1, def: 38, unit: 'mm' },
    { key: 'lip', label: 'Front lip', min: 3, max: 35, step: 1, def: 18, unit: 'mm' },
    { key: 'slot', label: 'Charger slot', min: 0, max: 50, step: 1, def: 18, unit: 'mm' },
    { key: 'wall', label: 'Wall', min: 2, max: 5, step: 0.5, def: 3, unit: 'mm' },
  ] },
};

export function defaults(model) {
  const o = {};
  (MODELS[model]?.params || []).forEach((p) => { o[p.key] = p.def; });
  return o;
}

// ---- number formatting: trim float noise, keep SCAD readable ----
const n = (x) => {
  const v = Number(x);
  if (!isFinite(v)) return '0';
  return Number.isInteger(v) ? String(v) : (Math.round(v * 1000) / 1000).toString();
};
const b = (x) => (Number(x) >= 0.5 ? 'true' : 'false');
const clampInt = (x, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(x) || 0)));

// ---- MakerWorld / OpenSCAD Customizer header ----
// Emits each param as a top-level variable with a magic comment so the generated
// .scad is a drop-in customizer on MakerWorld (upload the .scad → "Customize" button).
// Param keys ARE the SCAD variable names; bodies reference them directly.
function customizerHeader(model, params, title) {
  const ps = MODELS[model].params;
  const lines = ['// ' + (title || MODELS[model].label) + ' — Moldable / OpenSCAD (MakerWorld-customizable)', '', '/* [Adjust your model] */'];
  for (const pm of ps) {
    let v = Number(params[pm.key]);
    if (!isFinite(v)) v = pm.def;
    v = Math.max(pm.min, Math.min(pm.max, v));
    const range = (pm.step && pm.step !== 1) ? `[${n(pm.min)}:${n(pm.step)}:${n(pm.max)}]` : `[${n(pm.min)}:${n(pm.max)}]`;
    lines.push(`// ${pm.label}${pm.unit ? ' (' + pm.unit + ')' : ''}`);
    lines.push(`${pm.key} = ${n(v)}; // ${range}`);
  }
  lines.push('', '/* [Hidden] */');
  return lines.join('\n') + '\n';
}

// ========================= self-contained shapes =========================

function vase(p) {
  const source = customizerHeader('vase', p) + `$fn = 120;
twist_deg = twist;
round_r   = bulge / 12;          // "belly" rounds the profile
wall      = 1.6;                  // 4 perimeters @0.4mm nozzle — watertight planter shell (was 2.4, ~33% heavier)
slices    = max(40, ceil(height));

module prof(r) { offset(r = round_r) circle(r = r, $fn = max(3, sides)); }
module body(r) { linear_extrude(height = height, twist = twist_deg, slices = slices, convexity = 10) prof(r); }

difference() {
  body(radius);
  translate([0, 0, wall]) body(radius - wall);   // hollow, leaving a floor
}
`;
  return { source, files: [] };
}

function organizer(p) {
  const source = customizerHeader('organizer', p) + `module organizer() {
  floor = 2;                                   // base only needs ~2mm (was tied to the wall slider, 3mm+)
  difference() {
    cube([width, depth, height]);
    for (i = [0 : slots - 1])
      translate([wall + i * (width - wall) / slots, wall, floor])
        cube([(width - wall) / slots - wall, depth - 2 * wall, height]);  // open-top pockets
  }
}
organizer();
`;
  return { source, files: [] };
}

function stand(p) {
  const source = customizerHeader('stand', p) + `thick = 8; lip_h = 14; lip_w = 8;
recline = angle; base_d = baseDepth; back_h = height;

module stand() {
  union() {
    cube([base_d, thick, width]);                                   // base plate
    translate([3, 0, 0]) cube([lip_w, lip_h, width]);               // front lip
    translate([base_d - thick, thick - 0.01, 0])
      rotate([0, 0, 90 - recline])
        cube([thick, back_h, width]);                               // reclined back
  }
}
stand();
`;
  return { source, files: [] };
}

// Shared HSW honeycomb-wall mount — the SAME connector geometry as the Wall Bin/Dock,
// so every HSW type (cup/hook/shelf/bin/dock) clips to the identical wall. Self-contained
// (no library include), which also makes these MakerWorld-customizable.
//   backplate: X-Z plane, back face at y=0, thickness t; body projects +Y (out from wall);
//   connectors project -Y (into the wall) in a row at height rz.
const HSW_MOUNT = HSW_CONNECTOR + `
// Real wall connector (test-print verified): 26w x 22.5h x 10.5deep. Aliases keep the
// existing part formulas (which size off connector_size / hex_pitch) working.
conn_depth = 10.5; conn_w = 26; conn_h = 22.5;
connector_size = conn_h; connector_depth = conn_depth; hex_pitch = 52;   // 2 cells — leave a blank cell between connectors (honeycomb)
// oriented so the flange sits at y=0 (backplate) and the barb projects -Y into the wall
module hsw_post() rotate([-90, 0, 0]) translate([0, 0, -conn_depth]) hsw_connector();
module hsw_backplate(pw, ph, t, rz) {
  band_h = conn_h + 8; border = max(4, t);   // keep a perimeter frame + a solid band at the connector row
  difference() {
    cube([pw, t, ph]);
    for (seg = [[border, rz - band_h/2 - border], [rz + band_h/2 + border, ph - border]])
      if (seg[1] - seg[0] > 5 && pw - 2*border > 5)
        translate([border, -1, seg[0]]) cube([pw - 2*border, t + 2, seg[1] - seg[0]]);   // remove the dead interior field
  }
  n = max(1, round(pw / hex_pitch));
  x0 = (pw - (n - 1) * hex_pitch) / 2;
  for (i = [0 : n - 1]) translate([x0 + i * hex_pitch, 2, rz]) hsw_post();   // flange embedded 2mm into the plate
}
`;

function holder(p) {
  const source = customizerHeader('holder', p) + HSW_MOUNT + `$fn = 64; eps = 0.05;
R = dia / 2 + wall;                         // cup outer radius
pw = max(2 * R, tiles * hex_pitch);
ph = depth;                                 // backplate as tall as the cup
union() {
  hsw_backplate(pw, ph, wall, max(connector_size, ph - connector_size));
  // cup opens up (+Z), projects forward (+Y); back embeds in the plate to weld solid
  translate([pw / 2, R, 0])
    difference() {
      cylinder(h = depth, r = R);
      translate([0, 0, wall]) cylinder(h = depth + eps, r = R - wall);   // open top, floor = wall
    }
}
`;
  return { source, files: [] };
}

function hook(p) {
  const source = customizerHeader('hook', p) + HSW_MOUNT + `$fn = 48; eps = 0.05;
t = max(3.6, rod * 0.45);
pw = (tiles > 1) ? tiles * hex_pitch : max(rod + 12, connector_size + 12);   // single tile hugs the one connector
arm_z = rod + 4;                            // arm sits low so things hang from the up-turn
ph = arm_z + rod + 14;
union() {
  hsw_backplate(pw, ph, t, max(connector_size, ph - connector_size));
  translate([pw / 2, 0, arm_z]) {
    rotate([-90, 0, 0]) cylinder(h = length, r = rod / 2);            // arm forward (+Y), embeds through plate
    translate([0, length, 0]) sphere(r = rod / 2 * 1.05);            // elbow
    translate([0, length, 0]) cylinder(h = tip, r = rod / 2);        // up-turn (+Z)
    translate([0, length, tip]) sphere(r = rod / 2 * 1.18);          // tip ball (keeps items on)
  }
}
`;
  return { source, files: [] };
}

function shelf(p) {
  const source = customizerHeader('shelf', p) + HSW_MOUNT + `$fn = 32; eps = 0.05;
th = 5;                                     // shelf/bracket thickness
pw = tiles * hex_pitch;
seat = depth * 0.55;                        // shelf sits partway up so a gusset fits below
ph = seat + th + connector_size + 10;
module gusset() {                           // triangular brace under the shelf (Y-out × Z-up)
  rotate([90, 0, 90]) linear_extrude(th)
    polygon([[0, 0], [depth, seat + th], [0, seat + th]]);
}
union() {
  hsw_backplate(pw, ph, th, ph - connector_size);
  translate([0, th - eps, seat]) cube([pw, depth, th]);              // shelf platform
  translate([0, th + depth - th, seat]) cube([pw, th, lip + th]);    // front lip
  translate([0, th - eps, 0]) gusset();                              // left brace
  translate([pw - th, th - eps, 0]) gusset();                        // right brace
}
`;
  return { source, files: [] };
}

// Gridfinity — self-authored phase-1 bin/baseplate (correct 42mm pitch, 7mm Z
// units, chamfered feet, stacking lip). Phase 2 swaps in gridfinity-rebuilt.
// Gridfinity — real gridfinity_extended_openscad library (ostat). The combined/
// single-file builds are self-contained; we override their customizer variables
// (last-assignment-wins) after the include.
const GF_BIN_LIB = { name: 'gridfinity/gridfinity_basic_cup.scad', url: 'libraries/gridfinity/gridfinity_basic_cup.scad' };
const GF_BASE_LIB = { name: 'gridfinity/gridfinity_baseplate.scad', url: 'libraries/gridfinity/gridfinity_baseplate.scad' };

function gridfinity(p) {
  const gx = clampInt(p.gx, 1, 6), gy = clampInt(p.gy, 1, 6);
  const uH = clampInt(p.height, 2, 12), comp = clampInt(p.compartments, 1, 6);
  const labelTab = Number(p.labelTab) >= 0.5, scoop = Number(p.scoop) >= 0.5;
  const source = `// Gridfinity Bin — gridfinity_extended_openscad (ostat)
include <gridfinity/gridfinity_basic_cup.scad>
width             = [${gx}, 0];     // grid units X
depth             = [${gy}, 0];     // grid units Y
height            = [${uH}, 0];     // height in 7mm units
vertical_chambers = ${comp};
label_style       = "${labelTab ? 'normal' : 'disabled'}";
fingerslide       = "${scoop ? 'rounded' : 'none'}";
efficient_floor   = "rounded";      // dish the floor into the feet: 20-49% less plastic; footprint/lip/clutch unchanged
`;
  return { source, files: [GF_BIN_LIB] };
}

function baseplate(p) {
  const gx = clampInt(p.gx, 1, 8), gy = clampInt(p.gy, 1, 8);
  const mag = Number(p.magnets) >= 0.5;
  const source = `// Gridfinity Baseplate — gridfinity_extended_openscad (ostat)
include <gridfinity/gridfinity_baseplate.scad>
Width          = [${gx}, 0];
Depth          = [${gy}, 0];
Enable_Magnets = ${mag ? 'true' : 'false'};
`;
  return { source, files: [GF_BASE_LIB] };
}

// ---- additional self-contained parametric types ----
function box(p) {
  const source = customizerHeader('box', p) + `$fn = 48; eps = 0.02;
fil = max(0, min(fillet, min(width, depth) / 2 - 1));
floor = min(wall, 2);                 // base needs ~2mm, independent of wall thickness
module rr(w, d, r) { offset(r = r) square([max(0.1, w - 2 * r), max(0.1, d - 2 * r)], center = true); }
difference() {
  linear_extrude(height) rr(width, depth, fil);
  translate([0, 0, floor]) linear_extrude(height) rr(width - 2 * wall, depth - 2 * wall, max(0.4, fil - wall)); // open top
}
`;
  return { source, files: [] };
}

function coaster(p) {
  const source = customizerHeader('coaster', p) + `$fn = max(3, sides); eps = 0.02;
wall = 2.5; deck = 1.6; rib = 2;          // top deck + perimeter foot ring + cross ribs (hollow underside)
difference() {
  union() {
    cylinder(h = thick, d = dia);
    if (rim > 0)
      translate([0, 0, thick - eps]) difference() {
        cylinder(h = rim, d = dia);
        translate([0, 0, -1]) cylinder(h = rim + 2, d = dia - 2 * wall);
      }
  }
  // recess the underside, leaving the top deck, a perimeter wall, and a cross of ribs for rigidity
  difference() {
    translate([0, 0, -eps]) cylinder(h = thick - deck + eps, d = dia - 2 * wall);
    for (a = [0, 90]) rotate([0, 0, a]) translate([-dia/2, -rib/2, -1]) cube([dia, rib, thick]);
  }
}
`;
  return { source, files: [] };
}

function bracket(p) {
  const source = customizerHeader('bracket', p) + `$fn = 40; eps = 0.05;
difference() {
  union() {
    cube([legA, width, thick]);   // base leg
    cube([thick, width, legB]);   // upright leg (welds to base at the corner)
  }
  if (hole > 0) {
    translate([legA * 0.62, width / 2, -eps]) cylinder(h = thick + 2 * eps, d = hole);            // base screw hole
    translate([-eps, width / 2, legB * 0.62]) rotate([0, 90, 0]) cylinder(h = thick + 2 * eps, d = hole); // upright screw hole
  }
}
`;
  return { source, files: [] };
}

function cableclip(p) {
  const source = customizerHeader('cableclip', p) + `$fn = 40; eps = 0.05;
cd = dia; L = length;
wall = 2.5; pitch = cd + wall; slot = cd * 0.62;
W = cables * pitch + wall;                 // cable-band width
ear = (mount > 0) ? 8 : 0;                 // mounting tabs to the SIDE so screws miss the channels
BW = W + 2 * ear;                          // full body width incl. ears
H = wall + cd + 1;                         // body wraps the full cable so the clip retains it
difference() {
  union() {
    translate([-L / 2, -W / 2, 0]) cube([L, W, H]);                          // cable band
    if (mount > 0) translate([-L / 2, -BW / 2, 0]) cube([L, BW, wall + 1]);  // flat mounting base with ears
  }
  for (i = [0 : cables - 1]) {
    y = -W / 2 + wall + cd / 2 + i * pitch;
    translate([-L / 2 - eps, y, wall + cd / 2]) rotate([0, 90, 0]) cylinder(h = L + 2 * eps, r = cd / 2); // channel
    translate([-L / 2 - eps, y - slot / 2, wall + cd / 2]) cube([L + 2 * eps, slot, H]);                  // snap-in slot
  }
  if (mount > 0) for (sx = [-L / 2 + 5, L / 2 - 5]) for (sy = [-(W / 2 + ear / 2), W / 2 + ear / 2])
    translate([sx, sy, -eps]) cylinder(h = wall + 1 + 2 * eps, d = 4);       // screw holes in the ears, clear of channels
}
`;
  return { source, files: [] };
}

function knob(p) {
  const source = customizerHeader('knob', p) + `$fn = 72; eps = 0.05;
h = height; roof = 2.4; rimw = 2.6; hub_d = shaft + 5; spokes = 4; spk_w = 2.4;
difference() {
  cylinder(h = h, d = dia);
  for (i = [0 : grips - 1]) rotate([0, 0, 360 / grips * i]) translate([dia / 2, 0, -eps]) cylinder(h = h + 2 * eps, d = dia * 0.16); // flutes (empty when grips=0)
  translate([0, 0, -eps]) difference() {                 // lightening pocket, open to the bed (prints support-free, solid roof on top)
    cylinder(h = h - roof + eps, d = dia - 2 * rimw);
    cylinder(h = h - roof + eps, d = hub_d);             // keep a central hub around the shaft
    for (i = [0 : spokes - 1]) rotate([0, 0, 360 / spokes * i]) translate([-spk_w / 2, 0, 0]) cube([spk_w, dia / 2, h]); // keep spokes (hub→rim)
  }
  translate([0, 0, -eps]) cylinder(h = h + 2 * eps, d = shaft);                        // shaft bore
  translate([shaft / 2 - shaft * 0.18, -shaft, -eps]) cube([shaft, shaft * 2, h + 2 * eps]); // D-flat
}
`;
  return { source, files: [] };
}

// Car cupholder adapter — works whether the mug is BIGGER or SMALLER than the holder:
// a plug sized to the holder always inserts, a flange catches the rim, and a walled
// cradle sized to the mug holds it above. Handle slot is adjustable (0 = solid wall).
function cupadapter(p) {
  const source = customizerHeader('cupadapter', p) + `$fn = 96; eps = 0.05;
clr_mug    = 3;                         // gap so the mug drops into the cradle
clr_holder = 1.5;                       // gap so the plug slips into the cupholder
cradle_id  = mug + 2 * clr_mug;         // inner well (always LARGER than the mug)
cradle_od  = cradle_id + 2 * wall;
plug_od    = holder - 2 * clr_holder;   // plug (always SMALLER than the holder)
flange_od  = max(cradle_od, holder + 8); // overhangs the rim so it can't sink

module body() {
  union() {
    // plug: hollow tube that inserts into the cupholder
    difference() {
      cylinder(d = plug_od, h = plugH + eps);
      translate([0, 0, -eps]) cylinder(d = max(4, plug_od - 2 * wall), h = plugH + 3 * eps);
    }
    // flange (rests on the rim) + cradle walls + floor, all on top of the plug
    translate([0, 0, plugH]) difference() {
      union() {
        cylinder(d = flange_od, h = wall);            // flange = also the mug's floor
        cylinder(d = cradle_od, h = wall + cradleH);  // cradle walls
      }
      translate([0, 0, wall]) cylinder(d = cradle_id, h = cradleH + eps);   // the well
    }
  }
}

slot_z0 = plugH + wall + min(12, cradleH * 0.2);   // keep a solid band above the floor
// clamp opening width so pillars between openings stay positive (never cut the whole wall away)
max_slot = (openings < 2) ? cradle_od - 2 * wall : cradle_od * sin(180 / openings) - wall;
slot_w   = max(0, min(handle, max_slot));

difference() {
  body();
  // openings: 'openings' evenly-spaced windows/handle slots, open at the top.
  // Each cutter starts at the centre (x=0) so it clears the FULL curved wall thickness
  // across the whole slot width — starting at the inner radius leaves uncut slivers at the edges.
  if (slot_w > 0)
    for (i = [0 : openings - 1])
      rotate([0, 0, i * 360 / openings])
        translate([0, -slot_w / 2, slot_z0])
          cube([flange_od, slot_w, cradleH + wall]);   // tall enough to break through the rim (open top)
  // drain hole straight down through the floor
  translate([0, 0, plugH - eps]) cylinder(d = 12, h = wall + 2 * eps);
}
`;
  return { source, files: [] };
}

// HSW Wall Bin / Wall Dock — real MakerWorld parametric .scad (self-contained),
// driven via include + last-assignment-wins overrides (like the gridfinity library).
const HSW_BIN_LIB = { name: 'hsw/hsw_bin.scad', url: 'libraries/hsw/hsw_bin.scad' };

function wallbin(p) {
  // self-contained parts bin with the user's REAL wall connector (the hsw_bin library baked
  // in the wrong connector at top-level, with no disable flag, so we rebuild it cleanly).
  const source = customizerHeader('wallbin', p) + HSW_CONNECTOR + `$fn = 32; eps = 0.05;
wall = 2.5; connector_size = 22.5; connector_depth = 10.5; hex_pitch = 52;   // 2 cells (blank between, honeycomb)
module hsw_post() rotate([-90, 0, 0]) translate([0, 0, -connector_depth]) hsw_connector();   // flange y=0, barb -Y
module connectors() {
  count = max(1, round(width / hex_pitch));
  x0 = (width - (count - 1) * hex_pitch) / 2;
  zrow = max(connector_size, height - connector_size);          // a row near the top so it hangs
  for (i = [0 : count - 1]) translate([x0 + i * hex_pitch, 2, zrow]) hsw_post();
}
union() {
  cube([width, wall, height]);                                  // back mount plate (connectors clip to the wall)
  connectors();
  difference() {                                                // the bin: open-top box projecting +Y
    cube([width, depth, height]);
    translate([wall, wall, wall]) cube([width - 2 * wall, depth - 2 * wall, height]);  // cavity (walls + floor + back, open top)
  }
  for (i = [1 : sections - 1])                                  // dividers
    translate([i * width / sections - wall / 2, wall, wall]) cube([wall, depth - 2 * wall, height - wall]);
}
`;
  return { source, files: [] };
}

// Wall Dock — self-authored single-piece phone/tablet dock. Reuses the EXACT HSW
// connector geometry from the Wall Bin (hsw_bin) so it clips to the same honeycomb wall.
// (The vendored MakerWorld device holder is a multi-clip design → scattered as one STL.)
function walldock(p) {
  const source = customizerHeader('walldock', p) + HSW_CONNECTOR + `$fn = 48; eps = 0.05;
// --- real HSW wall connector (test-print verified): flange at y=0, barb projects -Y into the wall ---
connector_size = 22.5; connector_depth = 10.5; hex_pitch = 52;   // 2 cells (blank between, honeycomb)
module hsw_post() rotate([-90, 0, 0]) translate([0, 0, -connector_depth]) hsw_connector();
module connectors() {
  count = max(1, round(width / hex_pitch));
  x0 = (width - (count - 1) * hex_pitch) / 2;
  zrow = max(connector_size, height - connector_size);     // a row near the top so it hangs
  for (i = [0 : count - 1]) translate([x0 + i * hex_pitch, 2, zrow]) hsw_post();  // flange embedded 2mm into the plate
}
module dock() {
  front = wall + shelfDepth;
  difference() {
    union() {
      // backplate (back face at y=0) — framed: perimeter + a solid band at the connector row, interior hollowed
      zrowB = max(connector_size, height - connector_size);
      bandH = connector_size + 6; bd = max(4, wall);
      difference() {
        cube([width, wall, height]);
        for (seg = [[bd, zrowB - bandH/2 - bd], [zrowB + bandH/2 + bd, height - bd]])
          if (seg[1]-seg[0] > 5 && width - 2*bd > 5)
            translate([bd, -1, seg[0]]) cube([width - 2*bd, wall + 2, seg[1]-seg[0]]);
      }
      connectors();
      translate([0, wall - eps, 0]) cube([width, shelfDepth + eps, wall]);        // cradle floor
      translate([0, front - wall, 0]) cube([width, wall, lip]);                   // front lip
      for (sx = [0, width - wall]) translate([sx, wall - eps, 0]) cube([wall, shelfDepth + eps, lip]); // side rails
    }
    sw = min(slot, width - 4 * wall);   // never cut the whole shelf away
  if (sw > 0) translate([width / 2 - sw / 2, wall - 1, -eps]) cube([sw, shelfDepth + 2, wall + 2 * eps]); // charger slot
  }
}
dock();
`;
  return { source, files: [] };
}

function funnel(p) {
  const source = customizerHeader('funnel', p) + `$fn = 96; eps = 0.05;
H  = height + stemLen;
si = stemDia / 2;                 // spout inner radius
ri = si + wall;                   // spout outer radius
ro = max(ri + 2, topDia / 2);     // mouth outer radius (always wider than the spout)
// rotate a funnel-wall cross-section (spout tube + cone), one closed loop in (r, z)
rotate_extrude()
  polygon([[si, 0], [ri, 0], [ri, stemLen], [ro, H], [ro - wall, H], [si, stemLen]]);
`;
  return { source, files: [] };
}

function soapdish(p) {
  const source = customizerHeader('soapdish', p) + `$fn = 40; eps = 0.05;
wall = 2; floor = 2; fil = 7;             // light bathroom drain tray (was 3/3, ~30% heavier)
iw = width - 2 * wall; id = depth - 2 * wall;
module rbox(w, d, h, r) linear_extrude(h) offset(r = max(0.6, r)) square([max(1, w - 2 * r), max(1, d - 2 * r)], center = true);
union() {
  difference() {
    rbox(width, depth, height, fil);
    translate([0, 0, floor]) rbox(iw, id, height, fil - wall);                       // cavity
    translate([0, -depth / 2, height - 2]) cube([width * 0.34, wall * 3, 8], center = true); // drain notch in the front rim
  }
  if (ridges > 0) for (i = [0 : ridges - 1]) {
    x = -iw / 2 + iw * (i + 0.5) / ridges;
    translate([x - 1.2, -(id - 6) / 2, floor - eps]) cube([2.4, id - 6, 3]);          // drainage ridge the soap rests on
  }
}
`;
  return { source, files: [] };
}

function peghook(p) {
  const source = customizerHeader('peghook', p) + `$fn = 32; eps = 0.05;
pd = 5.6;                          // peg ⌀ to fit a 1/4" pegboard hole with clearance
peg_depth = 11;
z_arm = max(pd / 2 + 3, rod / 2 + 1.5);   // keep the arm (radius rod/2) above Z=0
back_h = z_arm + pitch + pd;
union() {
  translate([-rod / 2, 0, 0]) cube([rod, rod, back_h]);                 // flat back bar against the board
  for (z = [z_arm, z_arm + pitch])
    translate([0, eps, z]) rotate([90, 0, 0]) cylinder(h = peg_depth, d = pd);  // pegs into two holes (-Y)
  translate([0, rod - eps, z_arm]) {                                    // hook arm (+Y) then up-turn
    rotate([-90, 0, 0]) cylinder(h = reach, r = rod / 2);
    translate([0, reach, 0]) sphere(r = rod / 2 * 1.04);
    translate([0, reach, 0]) cylinder(h = upturn, r = rod / 2);
    translate([0, reach, upturn]) sphere(r = rod / 2 * 1.15);
  }
}
`;
  return { source, files: [] };
}

function wallhook(p) {
  const source = customizerHeader('wallhook', p) + `$fn = 48; eps = 0.05;
t = 5;
bw = max(rod + 16, 30);
bh = reach * 0.45 + rod + 26;
zlo = 9; zhi = bh - 9;
difference() {
  union() {
    cube([bw, t, bh]);                                                  // backplate (flat to wall)
    translate([bw / 2, 0, zlo + rod / 2 + 2]) {                          // hook arm + up-turn
      rotate([-90, 0, 0]) cylinder(h = reach, r = rod / 2);
      translate([0, reach, 0]) sphere(r = rod / 2 * 1.05);
      translate([0, reach, 0]) cylinder(h = upturn, r = rod / 2);
      translate([0, reach, upturn]) sphere(r = rod / 2 * 1.12);
    }
  }
  for (i = [0 : screws - 1]) {
    zz = (screws == 1) ? bh / 2 : (i == 0 ? zlo : zhi);
    translate([bw / 2, -eps, zz]) rotate([-90, 0, 0]) cylinder(h = t + 2 * eps, d = 4.5);     // screw shaft
    translate([bw / 2, t - 2.4, zz]) rotate([-90, 0, 0]) cylinder(h = 2.5 + eps, d1 = 4.5, d2 = 9); // countersink at the front
  }
}
`;
  return { source, files: [] };
}

// LEGO-compatible building brick (clutch dimensions: 8mm pitch, Ø4.85 studs, Ø6.51/4.8 tubes).
// 1 layer = a plate (3.2mm); 3 layers = a standard brick. studs=0 makes a smooth tile.
function brick(p) {
  const source = customizerHeader('brick', p) + `$fn = 32; eps = 0.05;
P = 8.0; gap = 0.2; sd = 4.85; sh = 1.8; ph = 3.2; wall = 1.2; roof = 1.0; to = 6.51; ti = 4.8;
nx = studsX; ny = studsY; H = layers * ph;
L = nx * P - gap; W = ny * P - gap;
module body() difference() {
  translate([-L/2, -W/2, 0]) cube([L, W, H]);
  translate([-L/2 + wall, -W/2 + wall, -eps]) cube([L - 2*wall, W - 2*wall, H - roof]);   // hollow underside
}
union() {
  body();
  if (studs) for (i = [0:nx-1]) for (j = [0:ny-1])
    translate([(i - (nx-1)/2) * P, (j - (ny-1)/2) * P, H - eps]) cylinder(d = sd, h = sh + eps);   // studs
  if (nx > 1 && ny > 1) for (i = [0:nx-2]) for (j = [0:ny-2])                                       // anti-stud tubes (clutch)
    translate([(i - (nx-2)/2) * P, (j - (ny-2)/2) * P, 0]) difference() {
      cylinder(d = to, h = H - roof); translate([0,0,-eps]) cylinder(d = ti, h = H - roof + 2*eps);
    }
  else for (k = [0 : max(nx, ny) - 2])                                                              // 1xN: clutch pins
    translate([nx == 1 ? 0 : (k - (nx-2)/2) * P, ny == 1 ? 0 : (k - (ny-2)/2) * P, 0]) cylinder(d = 3.2, h = H - roof);
}
`;
  return { source, files: [] };
}

// Aruba AP-515 mount: RevK's slide-on bracket (thing:3483247) embedded as a self-contained,
// repaired polyhedron (no external import → works on download/MakerWorld), FLIPPED so the
// flat screw-hole face is the wall side (connectors) and the V-rail faces out (AP slides on),
// + a single honeycomb-spaced connector row on a thin backing strip.
function apmount(p) {
  const source = customizerHeader('apmount', p) + AP515_BRACKET + HSW_CONNECTOR + `
$fn = 32;
conn_depth = 10.5;   // real connector: tip (barb) at Z=0 -> into wall; flange at Z=conn_depth -> bonds to part
pad_t = 4; pitch = 52;   // 2 cells — blank between connectors (honeycomb); confirm against your wall
ncx = min(cols, max(1, floor(120 / pitch) + 1));
gx = (ncx - 1) * pitch;                                  // connector-row span (along the rail / X)
// REAL wall connector (test-print verified). Bracket flat face sits on the flanges; V-rail up (AP slides on).
union() {
  for (i = [0:ncx-1]) translate([(i-(ncx-1)/2)*pitch, 0, 0]) hsw_connector();
  translate([-(gx/2 + 16), -13, conn_depth - pad_t]) cube([gx + 32, 26, pad_t + 1]);   // back plate bonds flanges to bracket
  translate([0, 0, conn_depth - 0.5]) ap515_bracket();
}
`;
  return { source, files: [] };   // self-contained — no external STL
}

const GEN = { vase, organizer, stand, holder, hook, shelf, gridfinity, baseplate, box, coaster, bracket, cableclip, knob, cupadapter, funnel, soapdish, peghook, wallhook, brick, apmount, wallbin, walldock };

export function generate(model, params) {
  const gen = GEN[model];
  if (!gen) throw new Error('scad-gen: unknown model "' + model + '"');
  const p = { ...defaults(model), ...(params || {}) };
  return gen(p);
}
