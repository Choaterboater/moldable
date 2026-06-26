// BOSL2_utils.scad — HSW helper functions (no BOSL2 dependency)
// Source: https://github.com/geru/3d-scad-hsw-clip
// Vendored verbatim.
//
// These two functions decode the [ [x, y, radius], ... ] point format
// used by hsw_clip.scad's outline into separate point and radius arrays.

// Extract [x,y] pairs from a radpath (array of [x, y] or [x, y, radius])
function points(radpath) =
    [for (i = [0 : len(radpath) - 1]) [ for (j = [ 0 : 1]) radpath[i][j] ]];

// Extract radius values from a radpath; 0 if not specified
function rads(radpath) =
    [for (i = [0 : len(radpath) - 1]) (len(radpath[i])<=2)? 0 : radpath[i][2]  ];
