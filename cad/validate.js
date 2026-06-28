// cad/validate.js
// Printability + geometry-sanity checks on a compiled binary STL. Pure + Node-testable.
// Returns { ok, reason?, size:[x,y,z], tris, warnings:[] }.
//
// CRITICAL: validate() must return ok:false for geometry that COMPILES but is
// functionally broken (a difference() cutter erased the solid into a sliver,
// inverted normals, non-manifold). Those ok:false reasons are what fires the
// self-repair loop in agent.js — without them, broken-but-compiling models are
// returned to the user as "done". (Root cause found by the freeform-debug team.)
export function inspectStl(stl) {
  if (!stl || stl.length < 84) return { ok: false, reason: 'no geometry produced' };
  const dv = new DataView(stl.buffer, stl.byteOffset, stl.byteLength);
  const tris = dv.getUint32(80, true);
  if (stl.length !== 84 + tris * 50) return { ok: false, reason: 'corrupt STL (size mismatch)' };
  if (tris < 4) return { ok: false, reason: 'degenerate result (' + tris + ' triangles)' };

  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  const tri = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  let vol6 = 0, area = 0;                    // 6× signed mesh volume (divergence theorem) + surface area
  const edges = new Map(), verts = new Map();
  const parent = [];                          // union-find over welded vertices → count connected components (shells)
  const find = (x) => { let r = x; while (parent[r] !== r) r = parent[r]; while (parent[x] !== r) { const n = parent[x]; parent[x] = r; x = n; } return r; };
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; };
  const q = 1e-4;                            // weld quantum (mm); OpenSCAD emits shared verts bit-identical
  const intern = (x, y, z) => {
    const k = Math.round(x / q) + ',' + Math.round(y / q) + ',' + Math.round(z / q);
    let i = verts.get(k); if (i === undefined) { i = verts.size; verts.set(k, i); parent[i] = i; } return i;
  };
  const bump = (a, b) => { const e = a < b ? a + '_' + b : b + '_' + a; edges.set(e, (edges.get(e) || 0) + 1); };

  let off = 84;
  for (let t = 0; t < tris; t++) {
    off += 12; // skip normal
    for (let v = 0; v < 3; v++) {
      for (let c = 0; c < 3; c++) {
        const f = dv.getFloat32(off, true); off += 4;
        if (!isFinite(f)) return { ok: false, reason: 'non-finite vertex' };
        tri[v][c] = f;
        if (f < min[c]) min[c] = f;
        if (f > max[c]) max[c] = f;
      }
    }
    off += 2; // attr byte count
    const [a, b, c] = tri;
    vol6 += a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
    const ux = b[0]-a[0], uy = b[1]-a[1], uz = b[2]-a[2], vx = c[0]-a[0], vy = c[1]-a[1], vz = c[2]-a[2];
    const wx = uy*vz - uz*vy, wy = uz*vx - ux*vz, wz = ux*vy - uy*vx;
    area += 0.5 * Math.sqrt(wx*wx + wy*wy + wz*wz);   // for approx wall thickness = 2*volume/area
    const ia = intern(a[0], a[1], a[2]), ib = intern(b[0], b[1], b[2]), ic = intern(c[0], c[1], c[2]);
    if (ia !== ib && ib !== ic && ia !== ic) { bump(ia, ib); bump(ib, ic); bump(ic, ia); union(ia, ib); union(ib, ic); } // edges + connectivity (skip degenerate)
  }
  let openEdges = 0, nonManifoldEdges = 0;
  for (const n of edges.values()) { if (n === 1) openEdges++; else if (n > 2) nonManifoldEdges++; }

  let components = 0; { const roots = new Set(); for (let i = 0; i < verts.size; i++) roots.add(find(i)); components = roots.size; }
  const size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  const bboxVol = size[0] * size[1] * size[2];
  const volume = Math.abs(vol6) / 6;
  return {
    ok: true, tris, size, min, max,
    signedVolume: vol6 / 6, volume, area,
    volRatio: bboxVol > 0 ? volume / bboxVol : 0,
    openEdges, nonManifoldEdges, components,
  };
}

// validate(stl, constraints) — constraints: { bed:[x,y], material }
export function validate(stl, constraints = {}) {
  const info = inspectStl(stl);
  if (!info.ok) return info;

  // ---- HARD GATES: compiles + parses, but the geometry is functionally broken.
  // These ok:false reasons drive the freeform self-repair loop (agent.js). They are
  // tuned conservatively — OpenSCAD's manifold backend emits positive-volume,
  // watertight, 2-manifold meshes, so a real part trips none of these.
  // effective wall thickness ≈ 2·volume/area — distinguishes a true erased sliver (~0mm)
  // from a legitimate thin-walled shell (a funnel/vase wall is 1.2–3mm but fills <1% of its bbox).
  const approxWall = info.area > 0 ? 2 * info.volume / info.area : 0;
  if (info.volRatio < 0.005 && approxWall < 0.3)
    return { ok: false, reason: `the solid is a sliver (${(info.volRatio * 100).toFixed(2)}% of its bounding box, ~${approxWall.toFixed(2)}mm effective thickness) — a difference() cutter removed almost all of it. Inset cutters so material remains.`, info };
  if (info.signedVolume < 0)
    return { ok: false, reason: 'the mesh is inside-out (inverted normals / negative volume) — check boolean order and that the outer solid is the first operand.', info };
  if (info.nonManifoldEdges > 0)
    return { ok: false, reason: `non-manifold geometry: ${info.nonManifoldEdges} edge(s) shared by >2 faces — avoid coincident/overlapping coplanar faces; overlap unions by >= epsilon.`, info };
  // any boundary edge means a face is missing (not watertight). OpenSCAD's manifold backend
  // emits 0 for real solids (verified across all templates/catalog); >2 catches a missing
  // triangle/face while tolerating a stray weld-precision edge.
  if (info.openEdges > 2)
    return { ok: false, reason: `the mesh is not watertight (${info.openEdges} open edges) — a face is missing or a 2D shape was left unextruded; wrap 2D in linear_extrude()/rotate_extrude().`, info };
  // must rest ON the bed: any geometry below Z=0 (e.g. a freeform-authored centered sphere/
  // cylinder) is clipped or errors in the slicer. Verified safe for the catalog — every template
  // rests exactly on Z=0 — so this only ever fires on freeform, where it re-activates the
  // 'below z' repair hint in interpret.js classifyDiagnostic().
  if (info.min && info.min[2] < -0.05)
    return { ok: false, reason: `geometry sits ${(-info.min[2]).toFixed(2)}mm below the build plate (Z=0) — translate the whole model up so its lowest point rests on Z=0.`, info };

  const warnings = [];
  // the #1 freeform failure: parts placed at uncoordinated positions come out as separate floating
  // solids ("random pieces"). Each is independently watertight so the hard gates above pass — flag it
  // here so the freeform repair loop reconnects them (the library route ignores warnings).
  if (info.components > 1) warnings.push(`the model is in ${info.components} disconnected pieces — they must overlap/connect into a single solid`);
  const bed = constraints.bed;
  const [sx, sy, sz] = info.size;
  if (bed && bed.length === 2) {
    // allow the part to be rotated 90° to fit the bed
    const fits = (sx <= bed[0] && sy <= bed[1]) || (sx <= bed[1] && sy <= bed[0]);
    if (!fits) warnings.push(`footprint ${sx.toFixed(0)}×${sy.toFixed(0)}mm exceeds the ${bed[0]}×${bed[1]}mm bed`);
  }
  // printability heuristics (computable from the STL we already parsed)
  const maxDim = Math.max(sx, sy, sz), minDim = Math.min(sx, sy, sz);
  if (info.tris > 500000) warnings.push(`high triangle count (${info.tris.toLocaleString()}) — slicing will be slow`);
  if (maxDim > 2000) warnings.push(`largest dimension ${maxDim.toFixed(0)}mm is unusually large — check units (m? inches?)`);
  if (minDim < 1.2 && minDim > 0) warnings.push(`narrowest dimension ${minDim.toFixed(2)}mm < 1.2mm — wall may be too thin to print`);
  if (sz < 5 && Math.max(sx, sy) > 40) warnings.push(`wide and short — chamfer the bottom edges 0.3–0.5mm to avoid elephant foot`);
  if (info.min && info.min[2] > 0.05) warnings.push(`base sits ${info.min[2].toFixed(2)}mm above Z=0 — won't rest flat on the bed`);
  return { ok: true, size: info.size, tris: info.tris, warnings };
}
