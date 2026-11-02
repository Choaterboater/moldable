# Third-party licenses

Moldable's own code is [MIT](LICENSE). These bundled files keep their upstream licenses.

| Path | Upstream | License | License file |
|---|---|---|---|
| `cad/libraries/gridfinity/` | [ostat/gridfinity_extended_openscad](https://github.com/ostat/gridfinity_extended_openscad) | GPL-3.0 | [LICENSE](cad/libraries/gridfinity/LICENSE) |
| Snippets inside the gridfinity files | [UBaer21/UB.scad](https://github.com/UBaer21/UB.scad), [thehans/funcutils](https://github.com/thehans/funcutils) | CC0-1.0 | — |
| `cad/libraries/hsw/` (HSW clip files) | [geru/3d-scad-hsw-clip](https://github.com/geru/3d-scad-hsw-clip) | MIT | [LICENSE-hsw-clip](cad/libraries/hsw/LICENSE-hsw-clip) |
| `cad/libraries/hsw/BOSL2_utils.scad` | [BelfrySCAD/BOSL2](https://github.com/BelfrySCAD/BOSL2) | BSD-2-Clause | [LICENSE-BOSL2](cad/libraries/hsw/LICENSE-BOSL2) |
| `cad/libraries/otto/` and exported Otto geometry | Based on [Otto DIY](https://www.ottodiy.com) | CC-BY-SA-4.0 | [LICENSE](cad/libraries/otto/LICENSE) |
| `cad/libraries/apmount/` | Moldable | MIT | [LICENSE](LICENSE) |

The GPL-3.0 Gridfinity files are kept in their own folder and loaded as separate
files. A standalone `.scad` export of a Gridfinity model bundles them and so is
GPL-3.0; it includes that notice.
