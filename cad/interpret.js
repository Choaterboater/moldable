// cad/interpret.js
// Stage 2 (Interpret) + the freeform authoring/repair prompts.
// Everything degrades gracefully: with no API key, interpret() uses the keyword
// matcher and freeform is unavailable.
import { MODELS, defaults } from './scad-gen.js';
import { callClaude, extractJson, extractScad, NoKeyError } from './llm.js';

const DEFAULT_CONSTRAINTS = { bed: [256, 256], material: 'PLA' };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ---------- keyword fallback (no key, or Claude failed) ----------
export function keywordMatch(t) {
  t = (t || '').toLowerCase();
  if (/base.?plate/.test(t)) return 'baseplate';
  if (/grid.?fin/.test(t)) return 'gridfinity';
  if (/coaster|drink mat/.test(t)) return 'coaster';
  if (/cable|cord clip|wire clip|cable.?manage/.test(t)) return 'cableclip';
  if (/\bknob\b|\bdial\b/.test(t)) return 'knob';
  if (/\blego\b|lego.?compat|building brick|\bbrick\b|\d\s*[x×]\s*\d\s*(plate|tile|brick|stud)/.test(t)) return 'brick';
  if (/l.?bracket|angle bracket|corner brace|\bbracket\b/.test(t)) return 'bracket';
  if (/\bbox\b|container|\bcase\b/.test(t)) return 'box';
  if (/aruba|ap.?515|access.?point/.test(t)) return 'apmount';
  if (/funnel/.test(t)) return 'funnel';
  if (/soap/.test(t)) return 'soapdish';
  if (/peg.?board|peg.?hook/.test(t)) return 'peghook';
  if (/(wall|coat|screw|key).{0,6}hook/.test(t)) return 'wallhook';
  if (/hook/.test(t)) return 'hook';
  if (/car.?cup|cup.?holder.{0,8}adapter|cupholder.{0,8}adapter|(cup|mug|coffee).{0,14}adapter|adapter.{0,14}(cup|mug|coffee|cupholder)/.test(t)) return 'cupadapter';
  if (/(wall|hsw).{0,12}(dock|device|phone|tablet)|device (holder|dock|mount)/.test(t)) return 'walldock';
  if (/(wall|hsw).{0,10}bin|parts bin/.test(t)) return 'wallbin';
  if (/(phone|dock|tablet|\bprop\b|cradle)/.test(t) || /\bstand\b/.test(t)) return 'stand'; // before shelf so "display stand" wins (\bprop\b, not "propeller")
  if (/(display|shelf)/.test(t)) return 'shelf';
  if (/(hsw|honeycomb|multiboard|wall.?mount|tool.?holder|screwdriver|plier|drill|wall.?organi|peg)/.test(t)) return 'holder';
  if (/(organi[sz]|\btray\b|\bbox\b|\bcaddy\b|\bbin\b|\bslot\b|\bdrawer\b|\bdesk\b)/.test(t)) return 'organizer'; // organi[sz] matches organize/organizer, NOT "organic"; \b… avoids cabinet/boxes mis-hits
  if (/(holder|cup|tube|vessel|brush|pencil)/.test(t)) return 'holder';
  if (/(vase|planter|\bpot\b|\bplant|flower|spiral)/.test(t)) return 'vase'; // \bpot\b (not "teapot"), \bplant (not "transplant")
  return null;
}

export function keywordPreset(model, t) {
  t = (t || '').toLowerCase();
  const p = { ...defaults(model) };
  if (model === 'vase') {
    if (/hex/.test(t)) p.sides = 6; else if (/oct/.test(t)) p.sides = 8;
    else if (/(triang|three.?sid)/.test(t)) p.sides = 3; else if (/pent/.test(t)) p.sides = 5;
    const sm = t.match(/(\d+)\s*side/); if (sm) p.sides = clamp(+sm[1], 3, 16);
    if (/tall|spiral/.test(t)) { p.height = 210; p.twist = 280; }
    if (/squat|wide|bowl/.test(t)) { p.height = 90; p.radius = 70; }
  } else if (model === 'organizer') {
    const m = t.match(/(\d+)\s*(slot|compartment|section|cup|hole|pocket)/);
    if (m) p.slots = clamp(+m[1], 1, 5);
    if (/tall|deep/.test(t)) p.height = 78;
  } else if (model === 'holder') {
    const dm = t.match(/(\d+)\s*mm/); if (dm) p.dia = clamp(+dm[1], 12, 70);
    if (/screwdriver|pen|pencil|marker|brush|stylus/.test(t)) { p.dia = 18; p.depth = 94; }
    if (/drill|spray|bottle|caulk/.test(t)) { p.dia = 52; p.depth = 70; }
    const tm = t.match(/(\d+)\s*(tile|wide)/); if (tm) p.tiles = clamp(+tm[1], 1, 4);
  } else if (model === 'hook') {
    if (/heavy|big|large|long/.test(t)) { p.rod = 14; p.length = 64; }
    const hm = t.match(/(\d+)\s*tile/); if (hm) p.tiles = clamp(+hm[1], 1, 3);
  } else if (model === 'shelf') {
    if (/large|wide|big/.test(t)) { p.tiles = 4; p.depth = 95; }
    const sm = t.match(/(\d+)\s*tile/); if (sm) p.tiles = clamp(+sm[1], 2, 5);
    if (/deep/.test(t)) p.depth = 108;
  } else if (model === 'gridfinity') {
    const gm = t.match(/(\d+)\s*[x×]\s*(\d+)/); if (gm) { p.gx = clamp(+gm[1], 1, 6); p.gy = clamp(+gm[2], 1, 6); }
    if (/tall|deep/.test(t)) p.height = 9;
    if (/shallow|low|flat/.test(t)) p.height = 3;
    const cm = t.match(/(\d+)\s*(compartment|division|slot)/); if (cm) p.compartments = clamp(+cm[1], 1, 6);
  } else if (model === 'baseplate') {
    const bm = t.match(/(\d+)\s*[x×]\s*(\d+)/); if (bm) { p.gx = clamp(+bm[1], 1, 8); p.gy = clamp(+bm[2], 1, 8); }
    if (/magnet/.test(t)) p.magnets = 1;
  } else if (model === 'stand') {
    if (/tablet|ipad/.test(t)) { p.width = 120; p.height = 150; p.baseDepth = 112; }
  } else if (model === 'box') {
    const dm = t.match(/(\d+)\s*[x×]\s*(\d+)(?:\s*[x×]\s*(\d+))?/);
    if (dm) { p.width = clamp(+dm[1], 30, 220); p.depth = clamp(+dm[2], 30, 220); if (dm[3]) p.height = clamp(+dm[3], 15, 150); }
    if (/tall|deep/.test(t)) p.height = 90;
    if (/sharp|square/.test(t)) p.fillet = 0;
  } else if (model === 'coaster') {
    const dm = t.match(/(\d+)\s*mm/); if (dm) p.dia = clamp(+dm[1], 70, 140);
    if (/hex/.test(t)) p.sides = 6; else if (/oct/.test(t)) p.sides = 8; else if (/square/.test(t)) p.sides = 4;
    if (/flat|no rim/.test(t)) p.rim = 0;
  } else if (model === 'bracket') {
    const lm = t.match(/(\d+)\s*mm/); if (lm) { p.legA = clamp(+lm[1], 20, 120); p.legB = p.legA; }
    if (/heavy|thick/.test(t)) p.thick = 6;
  } else if (model === 'cableclip') {
    const cm = t.match(/(\d+)\s*(cable|cord|wire)/); if (cm) p.cables = clamp(+cm[1], 1, 6);
    const dm = t.match(/(\d+)\s*mm/); if (dm) p.dia = clamp(+dm[1], 3, 14);
  } else if (model === 'knob') {
    const dm = t.match(/(\d+)\s*mm/); if (dm) p.dia = clamp(+dm[1], 18, 60);
    if (/smooth|plain/.test(t)) p.grips = 0;
  } else if (model === 'wallbin') {
    const sm = t.match(/(\d+)\s*(section|compartment|slot|division)/); if (sm) p.sections = clamp(+sm[1], 1, 6);
    if (/wide/.test(t)) p.width = 160; if (/deep/.test(t)) p.depth = 55;
  } else if (model === 'walldock') {
    if (/tablet|ipad/.test(t)) { p.width = 185; p.height = 140; p.shelfDepth = 60; p.lip = 24; }
    if (/phone/.test(t)) { p.width = 82; p.height = 95; p.shelfDepth = 38; }
    if (/no charger|no slot/.test(t)) p.slot = 0;
  } else if (model === 'brick') {
    const bm = t.match(/(\d+)\s*[x×]\s*(\d+)/); if (bm) { p.studsX = clamp(+bm[1], 1, 8); p.studsY = clamp(+bm[2], 1, 12); }
    if (/plate/.test(t)) p.layers = 1; if (/tile|smooth|no stud/.test(t)) p.studs = 0;
  } else if (model === 'cupadapter') {
    // "fits a 90mm mug into a 74mm cupholder" — first number = mug, "holder/cupholder" number = holder
    const mm = t.match(/(\d+)\s*mm\s*(mug|cup|coffee|tumbler)/) || t.match(/(mug|cup)\D{0,8}(\d+)\s*mm/);
    if (mm) p.mug = clamp(+(mm[1].match(/\d+/) ? mm[1] : mm[2]), 45, 115);
    const hm = t.match(/(\d+)\s*mm\s*(cup.?holder|holder)/) || t.match(/(cup.?holder|holder)\D{0,8}(\d+)\s*mm/);
    if (hm) p.holder = clamp(+((hm[1].match(/\d+/) || [])[0] || (hm[2].match(/\d+/) || [])[0]), 55, 100);
    if (/no handle|handleless|no slot/.test(t)) p.handle = 0;
    if (/travel|tumbler|tall/.test(t)) { p.cradleH = 95; p.handle = 0; }
  }
  return p;
}

export function keywordInterpret(text) {
  const system = keywordMatch(text);
  if (!system) return { system: 'vase', params: defaults('vase'), recognized: false, confidence: 0.2, constraints: DEFAULT_CONSTRAINTS, source: 'keyword' };
  return { system, params: keywordPreset(system, text), recognized: true, confidence: 0.6, constraints: DEFAULT_CONSTRAINTS, source: 'keyword' };
}

// ---------- Claude interpret ----------
function schemaText() {
  return Object.entries(MODELS).map(([k, m]) =>
    `- ${k} (${m.label}): ${m.params.map((p) => `${p.key}[${p.min}..${p.max}${p.unit ? p.unit : ''}]`).join(', ')}`
  ).join('\n');
}

const INTERPRET_HEAD = `You convert a maker's plain-language request into a structured spec for a 3D-printable model.

Known parametric systems and their parameters (with ranges):
{SCHEMA}

Return ONLY a JSON object:
{
  "system": "<one of the known keys, or null if none fits>",
  "params": { <only keys for that system, numbers within range; booleans as 0/1> },
  "constraints": { "bed": [256,256], "material": "PLA" },
  "confidence": 0.0-1.0,
  "freeform": <true only if no known system fits and the shape must be authored from scratch>,
  "description": "<if freeform: a precise, buildable description incl. approximate dimensions in mm>"
}
Pick the closest system when reasonable. Only set freeform=true for genuinely novel shapes.`;

export async function interpret(text, { signal } = {}) {
  // Fast path: a confident keyword match routes instantly without a (possibly slow)
  // LLM round-trip. The LLM is only consulted when keywords don't recognize the prompt
  // (where it decides a known system or freeform).
  const kw = keywordMatch(text);
  if (kw) return { system: kw, params: keywordPreset(kw, text), recognized: true, confidence: 0.7, constraints: DEFAULT_CONSTRAINTS, source: 'keyword' };
  try {
    const reply = await callClaude({
      system: INTERPRET_HEAD.replace('{SCHEMA}', schemaText()),
      messages: [{ role: 'user', content: 'Request: ' + text }],
      maxTokens: 700, signal,
    });
    const spec = extractJson(reply);
    spec.constraints = spec.constraints || DEFAULT_CONSTRAINTS;
    spec.source = 'claude';
    if (spec.system && MODELS[spec.system]) {
      spec.params = { ...defaults(spec.system), ...(spec.params || {}) };
      spec.recognized = true;
    } else if (spec.freeform) {
      spec.recognized = true;
    } else {
      return keywordInterpret(text); // model returned nothing usable
    }
    return spec;
  } catch (e) {
    if (e instanceof NoKeyError) return keywordInterpret(text);
    const fb = keywordInterpret(text);
    fb.warning = 'Claude unavailable (' + (e.message || e) + ') — used keyword match';
    return fb;
  }
}

// ---------- freeform authoring + repair ----------
// Printability rules distilled from swh/openscad-skill + EdwinjJ1/3d-print-skill.
const AUTHOR_SYSTEM = `You are an expert OpenSCAD author. Write a COMPLETE, self-contained OpenSCAD program for a 3D-printable FDM part.

DESIGN FIRST — reason about FUNCTION → dimensions before writing code (the user gives a goal, not a spec; you derive the geometry):
- List the parts and how they physically relate: what inserts INTO what, what rests ON what, what holds/cradles what.
- Honor real fits — this is the #1 mistake to avoid:
  * a part that inserts into a hole/holder must be SMALLER than it (subtract ~1–2mm clearance per side).
  * a socket/cradle/sleeve that holds an object must be LARGER than the object (add ~2–3mm per side).
  * NEVER make the insert and the opening the same diameter.
- Add a STOP where something must not fall through or sink (a flange/lip wider than the hole, or a floor to rest on).
- For "holders/cradles/cups": give real WALLS tall enough to retain the object so it can't tip, and a floor it sits on.
- Add functional openings the use implies (e.g. a slot for a handle, a drain hole, finger cutouts).
- Derive every dimension from the real-world sizes named in the request; if a size is missing, pick a sensible real default and comment it. State the key dimensions as named parameters.

OUTPUT RULES
- Output ONLY valid OpenSCAD code. No prose, no markdown fences.
- No use<>/include<> of external libraries (no BOSL2 etc.).
- The top-level result must be a single, watertight (2-manifold) solid.
- ALWAYS instantiate geometry at the top level — CALL your main module at the end
  (e.g. end the file with "part();"). Never output only module/function definitions:
  that yields "top level object is empty" and renders nothing.
- The model must rest flat on the Z=0 plane — no geometry below Z=0.
- All dimensions in millimetres.

REQUIRED PREAMBLE (start the file with these)
  epsilon      = 0.01;   // extend difference() cutters to prevent z-fighting
  layer_height = 0.2;    // snap Z features to multiples of this
  $fn          = 64;     // global curve resolution (128 for cosmetic circles)
Then declare every design parameter as a named variable with a comment; derive
secondary values from primaries (e.g. inner_r = outer_r - wall).

MAKERWORLD CUSTOMIZER: make the model customizable on MakerWorld. Put the user-facing
parameters first under a "/* [Adjust] */" section, each annotated with a magic comment
range: "thickness = 3; // [1:10]" (slider) or "// [1:0.5:10]" (with step) or
"mode = \\"a\\"; // [a, b, c]" (dropdown). Put $fn, epsilon and derived constants AFTER a
"/* [Hidden] */" line so they don't show as controls.

MATH (critical OpenSCAD gotcha)
- sin(), cos(), tan() take DEGREES, not radians. NEVER convert to radians (no "*PI/180").
  Spherical placement: x=r*cos(lat)*cos(lon); y=r*cos(lat)*sin(lon); z=r*sin(lat); with lat,lon in degrees.
- To distribute features evenly over a sphere, sweep latitude -90..90 and scale the per-row
  count by cos(lat) so they don't cluster at the poles.

BOOLEAN RULES (non-negotiable)
- A difference() cutter must be INSET from the solid in the dimensions you KEEP. A cutter the
  same size (or larger) in every dimension ERASES the whole part — the #1 way models come out
  empty or "missing a roof/floor/wall". To hollow/shell, inset the cutter by the wall thickness
  on each retained face (e.g. inner = cube(size - 2*wall); a floor stays if the cutter starts at z=wall).
- A cutout/hole/slot must be REMOVED inside difference() — never union() a "slot" (that ADDS a
  solid block). Structure the whole part as: difference() { union(){ ...solids... } ...all cutters... }.
- In every difference(), translate the cutter by epsilon past the face it exits
  so no coplanar faces remain (e.g. a through-hole: h = depth + 2*epsilon, start at -epsilon).
- In every union(), overlap mating faces by >= epsilon. Wrap final geometry in union().
- FEATURE-TREE ORDER: build additive geometry first, CUT holes/slots LAST —
  difference(){ union(){ body(); additive_features(); } all_cutters(); } — so added
  material can never cover a hole you already cut.

PROVEN PATTERNS (reach for these first):
- Rounded/filleted prism: linear_extrude(h) offset(r = fillet) square([w - 2*fillet, d - 2*fillet], center = true);
- Hollow shell / container: difference(){ outer; translate by wall, inner inset by wall on every KEPT face (leave a floor by starting the inner cut at z = floor); }
- Axially-symmetric part (bottle, knob, funnel, nozzle, vase): rotate_extrude() polygon([...profile...]); — NEVER stack cylinders.
- ORGANIC / curved / tapered forms (banana, fruit, horn, animal body or limb, handle, teardrop, bone, claw): sweep a chain of spheres along a path and hull CONSECUTIVE pairs — this is the go-to for organic shapes and stays manifold:
    $fn=40; segs=48;
    function prof(t) = max(0.8, rmax * pow(sin(t*180), 0.6));   // taper: thin pointed ends, fat belly
    function path(t) = [Rbend*sin(arc*(t-0.5)), 0, Rbend*cos(arc*(t-0.5))];  // curve along an arc (or any [x,y,z] of t)
    for (i=[0:segs-1]) hull() for (k=[i,i+1]) { t=k/segs; translate(path(t)) scale([1,0.82,1]) sphere(r=prof(t)); }
  Vary prof(t) for thickness, path(t) for the bend; scale() the sphere for a non-round cross-section. Build several such swept limbs and union() them for a creature/figure (body + legs + head as separate sweeps that overlap).
- STRUCTURES / BUILDINGS (house, cottage, shed, cabin, barn, garage, birdhouse, dollhouse, tower, or any boxy object with a roof): build a HOLLOW-SHELL body + a real PITCHED roof, then CUT door/window openings LAST. A house is NOT two stacked solid boxes — give it walls, a peaked roof, and openings, or it reads as a featureless block.
    wall = 3; W = 90; D = 70; H = 70; roofH = 38;        // derive from the request (mm)
    module walls() difference() {                         // four walls + floor, open top (the roof caps it)
      cube([W, D, H]);
      translate([wall, wall, wall]) cube([W - 2*wall, D - 2*wall, H]);   // hollow interior; floor stays z=0..wall
    }
    module roof() translate([0, D, H]) rotate([90, 0, 0])  // GABLE roof = a triangular prism spanning the depth
      linear_extrude(D) polygon([[0, 0], [W, 0], [W/2, roofH]]);
    difference() {
      union() { walls(); roof(); }                         // additive first
      translate([W/2 - 9, -1, 0]) cube([18, wall + 2, 36]);            // door — cut FULLY through the front wall
      for (x = [W*0.16, W*0.64]) translate([x, -1, 40]) cube([16, wall + 2, 16]);  // windows
    }
  Always model the roof with this triangular-prism extrude (or two of them for a hip roof) — approximating a roof with a flat cube is exactly what makes a house come out looking like two stacked boxes. Add a chimney (a small cube) or a door step if the request implies it.
- Countersunk hole: union(){ cylinder(d = hole, h = depth); translate([0,0,depth-cs]) cylinder(d1 = hole, d2 = head, h = cs); }
- Repeated features: for (i = [0:n-1]) place by formula (rotate/translate); never copy-paste.

hull()/minkowski() NOTE: hull() of a FEW CONVEX primitives (spheres, cylinders) is reliable and manifold — it is the correct tool for organic/curved forms above. Only avoid hull() of many shapes at once or of non-convex shapes, and avoid minkowski() (slow). Hull CONSECUTIVE pairs along a sweep, not the whole chain at once.

DESIGN DISCIPLINE: derive positions from named edges, not magic numbers (hole_x = width - margin, not 45). Cascade every fit from ONE clearance var (hole = nominal + clr; peg = nominal - clr).

FEATURE SIZES (0.4mm nozzle)
- Min wall 1.2mm (prefer 1.6mm; structural 2.4mm). Min hole dia 1.5mm. Min pin 1.0mm.
- Min gap/slot 0.4mm. Min text height 3.0mm. Holes print ~0.2mm undersized — oversize clearance holes by +0.15mm radius.

FITS: sliding +0.2mm/side; press 0 to -0.1mm; snap engage 0.3–0.5mm, tab >=1.5mm.

OVERHANGS: keep <=45deg from vertical. For horizontal holes use a teardrop top so no bridging is needed. Bridges <=50mm (PLA).

ELEPHANT FOOT: any part wider than ~30mm at Z=0 should chamfer its bottom edges 0.3–0.5mm.

STRENGTH: FDM is weakest along Z (layer bonds). Orient tensile load paths in XY; a hook that pulls up should print lying on its side. Add a comment noting intended print orientation.

NEVER: zero-thickness walls; floating disconnected islands; minkowski() or hull() of many/non-convex shapes (hull of a few convex primitives is fine — see ORGANIC pattern); >500k triangles; units other than mm; geometry below Z=0.

SELF-CHECK before you output (silently fix any that fail — this is what keeps the model from coming out broken):
1. Is the whole part one difference(){ union(){ solids } cutters }? Is every cutout/slot/hole a SUBTRACTED cutter, not a union'd solid?
2. Is every difference() cutter INSET from its solid in the kept dimensions (not the same size, which erases the part)? A "clean-up cut" the size of the panel deletes the panel.
3. Does a CALL to the main geometry exist at the top level (not just module defs)?
4. Slots in a CURVED wall: does the cutter start from the centre/inside so it clears the full wall thickness across the whole slot width (not just at the middle)?
5. Are sin/cos in DEGREES (no radian conversion)? Is every requested feature actually present in the output?
6. Does the part rest on Z=0 and stay within ~250mm on each axis?

DO NOT include any reasoning, explanation, <think> tags, or prose. Respond with ONLY the OpenSCAD program.

Match this STRUCTURE and formatting ONLY — this is a skeleton, NOT the object. Design the
REQUESTED object; never output this template verbatim (a plain cylinder/cup is almost never the answer):
/* [Adjust] */
<each user-facing dimension> = <value>; // [min:max]
/* [Hidden] */
$fn = 64; epsilon = 0.01;
// derived constants here
module part() {
  difference() {
    union() {
      // every positive solid that makes up the requested object
    }
    // every cutter: holes, slots, hollows — each inset or passing fully through
  }
}
part();`;

export async function authorFreeform(prompt, spec, { signal } = {}) {
  const desc = (spec && spec.description) || prompt;
  const reply = await callClaude({
    system: AUTHOR_SYSTEM,
    messages: [{ role: 'user', content: 'Design this and output OpenSCAD only:\n' + desc }],
    maxTokens: 8000, signal,
  });
  return extractScad(reply);
}

// map a failure diagnostic to a concrete root-cause hint for the repair pass
function classifyDiagnostic(diag) {
  const d = (diag || '').toLowerCase();
  // --- common HARD compile failures (these used to fall through to null) ---
  if (/syntax error|parse error|parser error|unexpected|expected '/.test(d)) return 'Syntax error — a missing semicolon, unbalanced {}/()/[], or a stray token. Re-emit a complete, syntactically valid program.';
  if (/unknown module|unknown function|ignoring unknown/.test(d)) return 'You called a module/function that is not defined (a typo, or an external-library call). Define it inline or remove it — no external libraries (BOSL2 etc.).';
  if (/can't open|cannot open|include file|use file/.test(d)) return 'Remove every use<>/include<> and inline ALL geometry — external libraries are not available here.';
  if (/cgal|self.?intersect/.test(d)) return 'CGAL/self-intersection — geometry overlaps itself illegally (often hull()/minkowski(), or coincident coplanar faces). Use primitive solids; overlap unions by >= epsilon without self-intersecting.';
  if (/not a 3d object|mixing 2d|2d and 3d/.test(d)) return 'A 2D shape was left unextruded or mixed with 3D in a boolean. Wrap every 2D primitive (square/circle/polygon/text) in linear_extrude() or rotate_extrude() so all operands are 3D.';
  // --- empty / erased geometry (boolean-erase is the more common cause) ---
  if (/top.?level.*empty|object is empty/.test(d)) return 'NO top-level geometry. Two equally likely causes: (1) a difference()/intersection() removed ALL material because a cutter was as large as (or larger than) the kept solid — INSET every cutter so material remains; (2) you defined modules but never called the main one — add e.g. part(); at the end. Check BOTH.';
  if (/fills only|sliver|removed almost all/.test(d)) return 'A difference() cutter erased almost the whole solid, leaving a sliver. Make each cutter SMALLER than the solid in the dimensions you keep (inset by the wall thickness); a cutter the same size as the part deletes it.';
  if (/inside-out|inverted/.test(d)) return 'Inverted normals — the subtracted body is acting as the outer shape. In difference(), the FIRST operand must be the solid and the rest the cutters.';
  if (/no geometry|degenerate|0 triangles|empty/.test(d)) return 'The model produced no solid. Either a difference() cutter is larger than the base (leave material after booleans) or you forgot to call your main module at the end.';
  if (/non-finite|\bnan\b|\binf(?:inity)?\b/.test(d)) return 'A vertex is non-finite. Check for division by zero in a parameter expression (e.g. a radius derived from a value that can be 0).';
  if (/manifold|watertight|open edge/.test(d)) return 'Non-manifold / not watertight. Extend every difference() cutter by epsilon past the exit face; overlap every union() by >= epsilon; never leave a 2D face or a zero-thickness wall.';
  if (/below z|z=0|rest flat|base sits/.test(d)) return 'Geometry is below Z=0. Translate the whole model up so its lowest point is exactly Z=0.';
  if (/bed|footprint|exceeds/.test(d)) return 'Part exceeds the print bed — scale it down to fit within the bed footprint.';
  if (/thin|1.2mm|wall/.test(d)) return 'A wall is under 1.2mm. Increase the wall variable or shrink the subtracted body.';
  return null;
}

export async function repairFreeform(source, diagnostic, attempt = 1, { signal } = {}) {
  const hint = classifyDiagnostic(diagnostic);
  const escalate = attempt > 1 ? `\nThis is repair attempt ${attempt}; the previous fix did not work — try a fundamentally different approach.` : '';
  const reply = await callClaude({
    system: AUTHOR_SYSTEM + '\nYou are fixing a failing OpenSCAD program. Return ONLY the corrected complete program.' + escalate,
    messages: [{ role: 'user', content: 'This program failed:\n```\n' + source + '\n```\nDiagnostic:\n' + diagnostic + '\n' + (hint ? 'Likely root cause and fix: ' + hint + '\n' : '') + 'Return a corrected, complete OpenSCAD program.' }],
    maxTokens: 8000, signal,
  });
  return extractScad(reply);
}

// ---------- conversational refinement ("make the base wider", "add a keychain hole") ----------
// Parametric: ask for a param delta (cheap, exact, always-valid — values are clamped to range).
export async function refineParams(model, params, request, { signal } = {}) {
  const m = MODELS[model];
  if (!m) throw new Error('refineParams: unknown model ' + model);
  const schema = m.params.map((p) => `- ${p.key}: ${p.label}${p.unit ? ' (' + p.unit + ')' : ''}, range ${p.min}..${p.max}, currently ${params[p.key]}`).join('\n');
  const reply = await callClaude({
    system: `You tune a 3D-printable ${m.label}'s parameters to satisfy a plain-language change request.\nReturn ONLY a JSON object containing the parameters to CHANGE — keys from the list, numeric values within range (booleans as 0 or 1). Omit anything the request doesn't touch. No prose.`,
    messages: [{ role: 'user', content: `Parameters:\n${schema}\n\nChange request: "${request}"\n\nJSON of changed parameters:` }],
    maxTokens: 400, signal,
  });
  const delta = extractJson(reply);
  const out = {};   // keep only known keys, clamped to range
  for (const p of m.params) {
    if (delta[p.key] === undefined) continue;
    const v = Number(delta[p.key]);
    if (isFinite(v)) out[p.key] = Math.max(p.min, Math.min(p.max, v));
  }
  return out;
}

// Expand a terse request ("a bracket") into a precise, buildable one-paragraph spec so the
// freeform author has dimensions + parts to work from. ~one short call; used by the forceAI path
// (the normal interpret() path already returns an enriched `description`).
export async function expandPrompt(text, { signal } = {}) {
  try {
    const reply = await callClaude({
      system: `Rewrite a maker's short request into ONE precise, buildable paragraph describing a single 3D-printable object: name its parts, give key dimensions in mm (pick sensible real defaults), say how the parts connect, and list functional features (holes, walls, lip, slot). No preamble or markdown — just the description.`,
      messages: [{ role: 'user', content: 'Request: ' + text }],
      maxTokens: 350, signal,
    });
    const out = (reply || '').trim();
    return out.length > text.length ? out : text;   // never return something shorter/empty than the input
  } catch (e) { return text; }                       // any failure → fall back to the raw prompt
}

// Freeform: surgically edit the existing OpenSCAD program.
export async function refineFreeform(source, request, { signal } = {}) {
  const reply = await callClaude({
    system: AUTHOR_SYSTEM + '\nYou are EDITING an existing OpenSCAD program to satisfy a change request. Keep everything that already works; change ONLY what the request asks (and keep the /* [Adjust] */ // [min:max] customizer comments so sliders keep working). Return ONLY the complete updated program.',
    messages: [{ role: 'user', content: 'Current program:\n```\n' + source + '\n```\nChange request: "' + request + '"\nReturn the full updated OpenSCAD program.' }],
    maxTokens: 8000, signal,
  });
  return extractScad(reply);
}
