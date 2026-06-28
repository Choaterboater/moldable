// cad/overhang.js
// Pure (no THREE, no DOM) overhang→colour mapping for the viewer heat-map.
// "up" is a surface normal's component along the build-up axis (print-Z), in [-1, 1]:
//   up >= 0  → faces up / vertical wall            → safe (green)
//   up <  0  → faces down (overhang/ceiling)       → severity grows toward red
// The 45° rule: a downward surface needs support once its overhang exceeds 45° from
// vertical, i.e. its normal tilts more than 45° below horizontal → up < -sin(45°) ≈ -0.707.
// So the green→yellow band is 0..thr of downward-ness, and yellow→red is thr..1.

export const SIN45 = Math.SQRT1_2;   // sin(45°) = 0.70710678…

const GREEN = [0.30, 0.78, 0.36];
const YELLOW = [0.96, 0.80, 0.20];
const RED = [0.86, 0.21, 0.21];
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// overhangColor(up, thr=SIN45) -> [r,g,b] in 0..1.
export function overhangColor(up, thr = SIN45) {
  const u = Math.max(-1, Math.min(1, Number(up) || 0));
  if (u >= 0) return GREEN.slice();
  const d = -u;                                   // downward severity 0..1
  if (d <= thr) return lerp(GREEN, YELLOW, d / thr);            // mild overhang (<45°)
  return lerp(YELLOW, RED, (d - thr) / (1 - thr));              // needs support (>45°)
}

// Multiply a normal by a 3x3 normal matrix stored column-major (THREE.Matrix3.elements layout),
// then normalize. nm null/undefined → identity (normals already in world/print space).
function applyNormalMatrix(nx, ny, nz, nm) {
  if (!nm) return [nx, ny, nz];
  const x = nm[0] * nx + nm[3] * ny + nm[6] * nz;
  const y = nm[1] * nx + nm[4] * ny + nm[7] * nz;
  const z = nm[2] * nx + nm[5] * ny + nm[8] * nz;
  const len = Math.hypot(x, y, z) || 1;
  return [x / len, y / len, z / len];
}

// overhangColorsFromNormals(normals, count, nm?, upAxis=[0,1,0]) -> Float32Array(count*3).
// `normals` is a flat [nx,ny,nz,...] array (per-vertex). `upAxis` is the print-up direction
// in the SAME space the (matrix-transformed) normals end up in — viewer +Y for Moldable.
export function overhangColorsFromNormals(normals, count, nm = null, upAxis = [0, 1, 0]) {
  const out = new Float32Array(count * 3);
  const [ux, uy, uz] = upAxis;
  for (let i = 0; i < count; i++) {
    const o = i * 3;
    const [wx, wy, wz] = applyNormalMatrix(normals[o], normals[o + 1], normals[o + 2], nm);
    const up = wx * ux + wy * uy + wz * uz;
    const c = overhangColor(up);
    out[o] = c[0]; out[o + 1] = c[1]; out[o + 2] = c[2];
  }
  return out;
}
