// hsw_clip.scad — HSW clip/connector module (BOSL2-free vendored version)
//
// Original source: https://github.com/geru/3d-scad-hsw-clip
// Modifications from original:
//   - Removed: include <BOSL2/std.scad> and include <BOSL2/rounding.scad>
//   - round_corners() call replaced with points() — sharp corners, same snap geometry
//   - cuboid() (BOSL2) replaced with standard translate+cube
//   - cyl()    (BOSL2) replaced with standard rotate+cylinder
//   - All snap-fit dimensions are unchanged.
//
// Dependencies (both in this directory):
//   include <hswx.scad>        — HSWX_* dimensional constants
//   include <BOSL2_utils.scad> — points() / rads() helpers
//
// ---- Coordinate orientation (with center=false, rotate=0) ----
//   X : width  — clip spans X ≈ [-1 .. 20.1] (HSWX_INSIDE + small lips)
//   Y : height — clip spans Y = [0 .. HSWX_INSIDE/2] = [0 .. 10 mm]
//   Z : depth  — clip spans Z = [-HSWX_DEPTH .. 0] = [-8 .. 0 mm]
//       Z = 0  is the WALL FACE (flat mounting surface)
//       Z < 0  goes INTO the honeycomb wall (the snap tabs live here)
//       +Z     is OUT FROM THE WALL — attach cup/hook geometry here
//
// ---- N-tile-wide plate ----
//   For N clips side by side, space them HSWX_OUTSIDE (23.6 mm) apart in X:
//     for (i=[0:N-1]) translate([i*HSWX_OUTSIDE, 0, 0]) hsw_clip(center=false);
//   The flat attachment face is the Z=0 plane.
//
// ---- Module: hsw_clip ----
//   center  = false  — if true, center clip at origin in X and Y
//   rotate  = 0      — rotate result around Z (0 or 180 for connector pairs)
//   type    = 0      — outline variant (only 0 is defined)
//   hexbase = 0      — if >0, add a hex-cylinder base of this height (mm) at Z=0
//   rectbase= 0      — if >0, add a rectangular plate of this height (mm) at Z=0
//   slop    = 0      — extra gap (mm) to loosen a tight fit; try 0.05 if stiff

include <hswx.scad>
include <BOSL2_utils.scad>

$fn = 50;

plug_base_lip         = 1;
plug_stud_thickness   = 1.7;
plug_spring_base      = 3;
plug_spring_depth     = 5;
plug_spring_thickness = 1.4;

module hsw_clip(
  center   = false,
  rotate   = 0,
  type     = 0,
  hexbase  = 0,
  rectbase = 0,
  slop     = 0
) {
  hswx_inside = HSWX_INSIDE - slop;

  // Cross-section profile in the XY plane.
  // Third element is the original corner-rounding radius (kept for reference;
  // not used here — replace polygon() with round_corners() if BOSL2 is available).
  outline = [ [
    [ -plug_base_lip,                             0            ],
    [           slop,                             0,       0.1 ],
    [           slop,               HSWX_LOCK_DEPTH            ],
    [ -HSWX_LOCK_LIP, HSWX_LOCK_LIP+HSWX_LOCK_DEPTH,     0.5 ],
    [ -HSWX_LOCK_LIP,                    HSWX_DEPTH,     1.5  ],
    [ plug_stud_thickness,               HSWX_DEPTH            ],
    [ plug_spring_base,                  HSWX_DEPTH,     3.5  ],
    [ hswx_inside/2, HSWX_DEPTH-plug_spring_depth-0.5,   5.0  ],
    [ hswx_inside-plug_spring_base,      HSWX_DEPTH,     3.5  ],
    [ hswx_inside-plug_stud_thickness,   HSWX_DEPTH            ],
    [    hswx_inside,                    HSWX_DEPTH,     2.0  ],
    [ hswx_inside+HSWX_LOCK_LIP, HSWX_LOCK_DEPTH+HSWX_LOCK_LIP, 0.5 ],
    [    hswx_inside,               HSWX_LOCK_DEPTH            ],
    [    hswx_inside,                           0.1,     0.1  ],
    [ hswx_inside+0.1,                            0            ],
    [ hswx_inside-plug_stud_thickness-0.5,        0            ],
    [ hswx_inside-plug_stud_thickness,          0.5,     1.0  ],
    [ hswx_inside-plug_stud_thickness, HSWX_DEPTH-plug_spring_thickness-1.4, 1.5 ],
    [ hswx_inside-plug_spring_base+.1, HSWX_DEPTH-plug_spring_thickness-0.1, 1.0 ],
    [ HSWX_INSIDE/2, HSWX_DEPTH-plug_spring_depth-plug_spring_thickness, 6.0 ],
    [ plug_spring_base, HSWX_DEPTH-plug_spring_thickness, 2.0 ],
    [ plug_stud_thickness,             HSWX_DEPTH/3,     1.0  ],
    [ HSWX_INSIDE/3.4,                            0            ],
    [ plug_stud_thickness,                        0            ],
  ] ];

  translate(center ? [0,0,0] : [HSWX_INSIDE/2, HSWX_INSIDE/4, 0])
  rotate([0,0,rotate])
    union() {
      // Clip body: profile extruded HSWX_INSIDE/2 deep in Y, then rotated
      // so Y-extent becomes Z and the Z-extent (depth) becomes -Y→+Z direction.
      translate([-HSWX_INSIDE/2, -HSWX_INSIDE/4, 0])
        rotate([-90,0,0])
          linear_extrude(HSWX_INSIDE/2)
            polygon(points(outline[type]));

      // Optional hex-cylinder stud at Z=0 (replaces BOSL2 cyl())
      if (hexbase > 0) {
        translate([0, hexbase/2, 0])
          rotate([90, 0, 30])
            cylinder(h=hexbase, d=HSWX_OD-1, $fn=6);
      }

      // Optional rectangular backplate at Z=0 (replaces BOSL2 cuboid())
      // Spans HSWX_OUTSIDE wide × HSWX_INSIDE/2 tall × rectbase deep (+Z)
      if (rectbase > 0) {
        translate([-HSWX_OUTSIDE/2, -HSWX_INSIDE/4, 0])
          cube([HSWX_OUTSIDE, HSWX_INSIDE/2, rectbase]);
      }
    }
}

// ---- Module: hsw_clipconnector ----
// Double clip that locks two HSW panels together.
// (Included for completeness; not used for single-wall accessories.)
module hsw_clipconnector(slop=0) {
  height = 3;
  difference() {
    union() {
      hsw_clip(center=true, rotate=180, type=0, rectbase=height, slop=slop);
      translate([HSWX_OUTSIDE, 0, 0])
        hsw_clip(center=true, rotate=0, type=0, rectbase=height, slop=slop);
    }
    // stress-reliever slot between the two clips
    translate([HSWX_OUTSIDE/2, HSWX_INSIDE/2, height])
      rotate([90,0,0])
        cylinder(h=HSWX_INSIDE, d=height);
  }
}
