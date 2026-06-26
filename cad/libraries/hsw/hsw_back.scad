// hsw_back.scad — Multi-cell HSW (Honeycomb Storage Wall) mounting backplate
//
// Renders a staggered hex-grid of hsw_clip() instances joined by a continuous
// rounded backing plate so the result is a single watertight solid you can
// attach tool-cups, hooks, or shelves to.
//
// Dependencies (included transitively below — caller only needs this file):
//   hsw_clip.scad  →  hswx.scad  +  BOSL2_utils.scad
//
// Usage:
//   include <hsw_back.scad>
//   hsw_back(cols=3, rows=2);
//
// ── Coordinate frame ──────────────────────────────────────────────────────
//   After centering the output is placed so that:
//     X = 0, Y = 0  is the geometric centre of the front face
//     Z = 0         is the WALL-FACE plane (clips insert into the wall at Z < 0)
//     Z = plate_t   is the FRONT face — attach your tool body here, in +Z
//
//   To attach a body exactly centred on the front face:
//     translate([0, 0, plate_t]) { your_body(); }
//
// ── Geometry summary (before centering, in raw clip coordinates) ──────────
//   Horizontal pitch : HSWX_OUTSIDE = 23.6 mm
//   Vertical pitch   : HSWX_OUTSIDE * sqrt(3)/2 ≈ 20.44 mm
//   Odd rows offset  : +HSWX_OUTSIDE/2 = +11.8 mm in X
//   Single clip bbox : X ≈ [-1, 20.1], Y = [0, 10], Z = [-8, 0]
//
// ── Parameters ────────────────────────────────────────────────────────────
//   cols    — clips per row (horizontal count)
//   rows    — number of staggered rows  (vertical count)
//   plate_t — backing plate thickness in +Z direction (default 3 mm)
//              front face sits at Z = plate_t

include <hsw_clip.scad>   // pulls in hswx.scad + BOSL2_utils.scad

module hsw_back(cols, rows, plate_t = 3) {
    // Vertical row-centre pitch for a flat-top hex tessellation
    v_pitch = HSWX_OUTSIDE * sqrt(3) / 2;   // ≈ 20.44 mm

    // Single clip footprint extents (center=false, rotate=0):
    //   X : [clip_x0, clip_x1]  ≈ [-1, 20.1]
    //   Y : [0,        clip_y1] =  [0,  10  ]
    clip_x0 = -1;
    clip_x1 = HSWX_INSIDE + 0.1;   // = 20.1 mm
    clip_y1 = HSWX_INSIDE / 2;     // = 10   mm

    // Bounding box of the full cols × rows grid (uncentered).
    // Even rows start at x = 0; odd rows are shifted +HSWX_OUTSIDE/2.
    // The odd-row shift only applies when rows > 1.
    x_min_bb = clip_x0;                          // = -1
    x_max_bb = (rows > 1 ? HSWX_OUTSIDE / 2 : 0)
               + (cols - 1) * HSWX_OUTSIDE
               + clip_x1;
    y_max_bb = (rows - 1) * v_pitch + clip_y1;  // top of last row

    plate_w = x_max_bb - x_min_bb;
    plate_h = y_max_bb;

    // Centering offset: shift so front-face centre lands at (0, 0, plate_t)
    cx = (x_max_bb + x_min_bb) / 2;
    cy = y_max_bb / 2;

    // Corner radius for the rounded backing plate
    cr = min(2, plate_w / 4, plate_h / 4);

    translate([-cx, -cy, 0])
    union() {
        // ── Rounded rectangular backing plate ─────────────────────────
        // Sits at Z = [0 .. plate_t], fully covering all clip footprints.
        // The top face at Z = plate_t is flat and centred — attach here.
        translate([x_min_bb, 0, 0])
        hull() {
            for (px = [cr, plate_w - cr])
                for (py = [cr, plate_h - cr])
                    translate([px, py, 0])
                        cylinder(r = cr, h = plate_t, $fn = 16);
        }

        // ── Clip array ────────────────────────────────────────────────
        // Row r is offset HSWX_OUTSIDE/2 in X when r is odd (standard
        // honeycomb stagger).  Each clip snaps into one hex cell;
        // its tabs project to Z = -HSWX_DEPTH = -8 (into the wall).
        for (row = [0 : rows - 1])
            for (col = [0 : cols - 1])
                translate([
                    col * HSWX_OUTSIDE
                        + (row % 2 == 1 ? HSWX_OUTSIDE / 2 : 0),
                    row * v_pitch,
                    0
                ])
                    hsw_clip(center = false, rotate = 0);
    }
}
