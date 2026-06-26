# Moldable

Turn natural-language prompts (or photos) into 3D-printable models — OpenSCAD parametric
templates + AI freeform authoring + AI organic-mesh sculpting. No backend; runs in the browser.

## Run the app
```bash
python3 -m http.server 8765
# open http://127.0.0.1:8765/Moldable.dc.html
```

## Tools (Node + Python)
- `tools/mesh-print.py` — AI mesh GLB → print-ready STL (scale to mm, orient, optional --voxel for watertight). Deps: `pip install trimesh scikit-image numpy fast-simplification`
- `tools/replicate-bridge.mjs` — Sculpt-with-AI bridge to Replicate (Trellis / Hunyuan3D) + auto-remesh. `node tools/replicate-bridge.mjs`
- See PIPELINE.md for the architecture.

## Tests
```bash
node test/engine.test.mjs   # all parametric models compile to manifold STL
```
