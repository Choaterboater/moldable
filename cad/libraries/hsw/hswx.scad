// hswx.scad — HSW (Honeycomb Storage Wall) dimensional constants
// Source: https://github.com/geru/3d-scad-hsw-clip
// Vendored verbatim (no external dependencies).

/* [Shape of the hexes -- lowercase is deprecated and will go away] */
hswx_inside = 20;                       // hexagon inside width flat-flat
HSWX_INSIDE = hswx_inside;
hswx_wall = 1.8;                        // hexagon inner wall thickness [:0.01]
HSWX_WALL = hswx_wall;
hswx_outside = HSWX_INSIDE+HSWX_WALL*2; // hexagon outside width flat-flat
HSWX_OUTSIDE = hswx_outside;

hswx_side = HSWX_OUTSIDE / sqrt(3);    // hexagon outside side length
HSWX_SIDE = hswx_side;
hswx_od = HSWX_SIDE * 2;               // outer diameter of circle containing outer hexagon
HSWX_OD = hswx_od;

hswx_depth = 8;                        // depth of grid
HSWX_DEPTH = hswx_depth;

hswx_lock_depth = 5;                   // depth of locking section start
HSWX_LOCK_DEPTH = hswx_lock_depth;

hswx_lock_lip = 1;                     // depth of lip = protrusion of lip = chamfer
HSWX_LOCK_LIP = hswx_lock_lip;
hswx_lock_chamfer = HSWX_LOCK_LIP;     // chamfer is 45deg, so defined = lock_lip
HSWX_LOCK_CHAMFER = hswx_lock_chamfer;

hswx_id_large = (HSWX_INSIDE + 2*HSWX_LOCK_LIP) * 2/sqrt(3); // diameter of circle containing large hexagon fitting locks and clips
HSWX_ID_LARGE = hswx_id_large;
hswx_id_small = HSWX_INSIDE * 2/sqrt(3);                     // diameter of circle containing small hexagon fitting standard plugs
HSWX_ID_SMALL = hswx_id_small;

module _hswx_constant_show_all() {
echo( "HSWX_INSIDE", HSWX_INSIDE );
echo( "HSWX_WALL", HSWX_WALL );
echo( "HSWX_OUTSIDE", HSWX_OUTSIDE );
echo( "HSWX_SIDE", HSWX_SIDE );
echo( "HSWX_OD", HSWX_OD );
echo( "HSWX_LOCK_DEPTH", HSWX_LOCK_DEPTH );
echo( "HSWX_LOCK_LIP", HSWX_LOCK_LIP );
echo( "HSWX_ID_LARGE", HSWX_ID_LARGE );
echo( "HSWX_ID_SMALL", HSWX_ID_SMALL );
}
