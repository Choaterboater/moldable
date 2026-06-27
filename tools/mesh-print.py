#!/usr/bin/env python3
"""
mesh-print.py — turn an AI-generated mesh (Hunyuan3D / Trellis / Meshy / Tripo GLB/OBJ)
into a 3D-PRINTABLE STL. AI meshes look good but aren't print-ready: no real scale,
not watertight, floating bits, no flat base. This fixes all of that.

  python3 tools/mesh-print.py in.glb out.stl --size 80          # longest axis -> 80mm
  python3 tools/mesh-print.py in.glb out.stl --size 80 --voxel 0.6   # force watertight via voxel remesh

Pipeline: load -> keep largest body -> repair (fill holes/fix normals) -> if still
leaky, voxel-remesh (guaranteed watertight) -> scale to mm -> stable orientation ->
drop to Z=0 -> optional decimate -> printability report -> export STL.
Deps:  pip install trimesh numpy   (no Blender, no GPU — runs on any machine)
"""
import argparse, sys
import numpy as np
import trimesh


def load_single(path):
    # force='mesh' bakes every scene-graph node transform and concatenates all geometry into a
    # single Trimesh. Concatenating scene.geometry directly (the old force='scene' path) ignored
    # those node transforms, mis-orienting/scrambling multi-part or up-axis-baked GLBs.
    m = trimesh.load(path, force='mesh')
    if not isinstance(m, trimesh.Trimesh) or len(m.faces) == 0:
        raise SystemExit('no mesh geometry found in ' + path)
    return m


def keep_largest(m):
    parts = m.split(only_watertight=False)
    if len(parts) <= 1:
        return m
    big = max(parts, key=lambda p: p.area)
    print(f'  dropped {len(parts) - 1} floating piece(s); kept the largest body')
    return big


def repair(m):
    m.merge_vertices()
    try: m.update_faces(m.unique_faces())
    except Exception: pass
    try: m.update_faces(m.nondegenerate_faces())
    except Exception: pass
    trimesh.repair.fix_winding(m)
    trimesh.repair.fix_normals(m)
    trimesh.repair.fill_holes(m)
    return m


def voxel_remesh(m, pitch):
    print(f'  voxel remeshing @ {pitch:.2f}mm -> guaranteed watertight manifold')
    vg = m.voxelized(pitch=pitch).fill()
    rm = vg.marching_cubes
    rm.apply_transform(vg.transform)          # index-space -> world (mm); else scale is lost
    rm.merge_vertices()
    trimesh.repair.fix_normals(rm)
    return rm


def emax(m):
    e = m.extents
    return float(e.max()) if e is not None and len(e) else 0.0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('input'); ap.add_argument('output')
    ap.add_argument('--size', type=float, default=80.0, help='longest axis target (mm)')
    ap.add_argument('--voxel', type=float, default=0.0, help='OPTIONAL voxel remesh pitch (mm) — guaranteed watertight but blobs/loses detail')
    ap.add_argument('--clean', action='store_true', help='drop floaters + fill holes (can shed detail on fragmented AI meshes); default off = lightest touch')
    ap.add_argument('--maxtris', type=int, default=300000, help='decimate cap (only applied with --clean/--voxel)')
    ap.add_argument('--minwall', type=float, default=0.8)
    a = ap.parse_args()

    m = load_single(a.input)
    print(f'loaded: {len(m.faces)} tris, watertight={m.is_watertight}')

    # DEFAULT = lightest touch: scale + drop + export the WHOLE mesh and let the slicer repair
    # (Bambu's auto-repair beats aggressive remeshing). --clean/--voxel do heavier work that can
    # fragment or blob AI meshes, so they're opt-in. The heavy ops also run only here (post-guard).
    if a.clean or a.voxel > 0:
        if len(m.faces) > a.maxtris:
            try:
                m = m.simplify_quadric_decimation(face_count=a.maxtris)
                print(f'  decimated to {len(m.faces)} tris')
            except Exception as e:
                print(f'  (decimate skipped: {e})')
        m = keep_largest(m)

    cur = emax(m)
    if cur > 0:
        m.apply_scale(a.size / cur)          # AI meshes are unitless -> scale to real mm

    if a.voxel > 0:
        m = voxel_remesh(m, max(a.voxel, a.size / 160.0))   # capped grid so it can't OOM
    elif a.clean:
        m = repair(m)                        # fill holes / fix normals
    # else: leave geometry as-is (full detail; slicer auto-repairs minor holes)

    m.apply_translation([0, 0, -m.bounds[0][2]])   # drop lowest point to Z=0 (reorient in your slicer if needed)

    wt = m.is_watertight
    vol = float(m.volume) if wt else 0.0
    area = float(m.area)
    wall = (2 * vol / area) if (wt and area > 0) else 0.0
    bb = m.extents
    print('--- printability report ---')
    print(f'  watertight: {wt}   winding consistent: {m.is_winding_consistent}')
    print(f'  size: {bb[0]:.1f} x {bb[1]:.1f} x {bb[2]:.1f} mm   tris: {len(m.faces)}')
    print(f'  volume: {vol/1000:.1f} cm^3   effective wall ~ {wall:.2f} mm')
    if not wt:
        print('  note: small holes remain — detail is kept; let your slicer auto-repair, or pass --voxel 0.8 for a guaranteed-watertight (blobbier) version')
    if 0 < wall < a.minwall:
        print(f'  WARNING: thin (eff wall {wall:.2f} < {a.minwall}mm) — scale up or thicken')

    m.export(a.output)
    print(f'wrote {a.output}  ({"PRINT-READY" if wt else "detail-kept; slicer auto-repair closes minor holes"})')
    return 0   # exporting succeeded; not-watertight is a fixable note, not a failure


if __name__ == '__main__':
    sys.exit(main())
