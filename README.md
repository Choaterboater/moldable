# Moldable

Turn natural-language prompts (or photos) into 3D-printable models — OpenSCAD parametric
templates + AI freeform authoring + AI organic-mesh sculpting. No backend; runs in the browser.

## Run the app
One command starts the web server **and** a mesh bridge (stops both on Ctrl+C):
```bash
node tools/start.mjs            # Replicate bridge (cloud; paste token in Settings)
node tools/start.mjs local      # free local Hunyuan bridge (needs your GPU server)
# then open http://127.0.0.1:8765/Moldable.dc.html
```
Or just the static server (no Sculpt backend): `python3 -m http.server 8765`

## Sculpt from a photo (AI mesh)
Two backends, same in-app "Sculpt from photo" flow (both auto-remesh to print-ready):
- **Cloud (Replicate):** `node tools/replicate-bridge.mjs` — Trellis (cheap) / Hunyuan3D (detailed). Needs a Replicate token in Settings.
- **Local & free (GPU):** `node tools/local-mesh-bridge.mjs` → talks to a local Hunyuan3D server, no token. Full setup for an RTX 3080 in **[DESKTOP_SETUP.md](DESKTOP_SETUP.md)**.

## Tools (Node + Python)
- `tools/mesh-print.py` — AI mesh GLB → print-ready STL (scale to mm, orient, optional `--voxel` for watertight). Deps: `pip install trimesh scikit-image numpy fast-simplification`
- `tools/replicate-bridge.mjs` / `tools/local-mesh-bridge.mjs` — Sculpt bridges (cloud / local), same Meshy-shaped contract + auto-remesh.
- See PIPELINE.md for the architecture.

## Tests
```bash
node test/engine.test.mjs   # all parametric models compile to manifold STL
```
