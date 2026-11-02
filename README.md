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

## Otto Robot

The **Robots** template adds Classic, Rounded and Cat-ear Otto presets, seven parts (head, back cover, body, legs, feet) in Otto V9 proportions with four servos, a full-robot Assembled view,
a whole plate, fixed hardware cavities, exterior sliders and four small fit-test
downloads. Type **otto robot** to open it. H2C left/right/dual nozzle profiles check
all three printable dimensions. Otto SCAD exports are standalone; STL and SCAD
carry Otto DIY / CC-BY-SA-4.0 attribution.

**Prototype, not physically fit-certified:** original V13 CAD access and purchased
hardware measurements remain outstanding. Read the [Otto guide](docs/guides/otto.md)
and [fit record](docs/reference/otto-fit.md) before full prints. Power and walking
trials are deferred. No unpublished color/3MF or Copilot-bridge code was assumed.

## Tests
```bash
node --test test/*.test.mjs # includes individually reported Otto geometry/fit cases
node test/engine.test.mjs   # all parametric models compile to manifold STL
```
