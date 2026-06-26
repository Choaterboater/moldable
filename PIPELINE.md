# Moldable — Real OpenSCAD Generation Pipeline

How an LLM → OpenSCAD → STL backend replaces the prototype's hand-written JS
geometry, reusing every slot the current UI already exposes.

> **Context for Claude Code:** `Moldable.dc.html` is a working *prototype*. Today it
> matches a prompt to a keyword and draws an approximate mesh with a JS `buildX()`
> function; the "OpenSCAD code" panel and "Download STL" are illustrative, not real.
> This document specifies the real backend. The single swap is: **spec → real
> OpenSCAD → WASM render → exact, manifold, print-ready STL.** Everything else in the
> UI stays put.

---

## Pipeline stages

### 1. Capture — intent in
A natural-language prompt or a reference photo. No CAD vocabulary required, e.g.
*"a 3×2 gridfinity bin with a label tab"* or *"a wall hook for pliers."*
**UI slot:** prompt box + image drop (exists).

### 2. Interpret — Claude
Resolve the request into a structured **spec**; ask a clarifying question when
confidence is low.

```json
{
  "system": "gridfinity",
  "part": "bin",
  "params": { "gx": 3, "gy": 2, "u": 6, "labelTab": true },
  "constraints": { "bed": [256, 256], "material": "PLA" }
}
```

**UI slot:** the "not sure what that is" banner + model-type switcher (exists).

### 3. Author OpenSCAD — spec → `.scad` source
Two routes:

- **Library route (default):** known systems call **vetted parametric libraries**
  with the params. Deterministic, fast, guaranteed-valid.
- **Freeform route (novel shapes):** no library fits → Claude writes original
  OpenSCAD, grounded on the OpenSCAD cheatsheet.

**UI slot:** the OpenSCAD code panel — now live and editable (exists).

### 4. Render — `.scad` → mesh + STL
**OpenSCAD-WASM** compiles in the browser: F5 preview feeds the live Three.js
viewer; F6 produces the manifold mesh exported as STL. Heavy parts can fall back to
a server renderer.
**UI slots:** 3D viewer + Download STL (exist).

### 5. Validate & self-correct — agent loop
Check manifoldness, wall thickness, overhangs, and bed fit. On a compile error or
failed check, the diagnostics go **back to step 3** — Claude patches the SCAD and
re-renders until it passes. Cap at N tries, then surface a fixable explanation.

### 6. Deliver & tune — printable + adjustable
Spec params become the parameter sliders; each change re-runs steps 3–4 for a live
re-render. The validated STL downloads or publishes to MakerWorld with its
parametric source attached.
**UI slots:** parameter sliders + Publish to MakerWorld (exist).

---

## Maps onto today's UI

| Current UI element            | Pipeline stage |
| ----------------------------- | -------------- |
| Prompt / image drop           | 1 Capture      |
| Type switcher + "not sure" banner | 2 Interpret |
| OpenSCAD code panel           | 3 Author       |
| 3D viewer + Download STL      | 4 Render       |
| Parameter sliders             | 6 Tune         |
| Publish to MakerWorld         | 6 Deliver      |

---

## Two decisions that shape the build

1. **Library-first, freeform-fallback.** Route to curated libraries whenever a
   system matches — they're safe, instant, and standards-compliant. Reserve
   LLM-authored SCAD for genuinely novel parts, where the repair loop earns its keep.
2. **WASM in-browser vs. server render.** WASM keeps it instant, private, and
   offline for typical parts; a server renderer handles heavy CSG, caches common
   library calls, and keeps the agent repair loop off the user's device.

---

## Suggested build order

1. **Render first.** Wire `openscad-wasm` and feed it a hard-coded `.scad` →
   mesh into the existing Three.js viewer + STL export. Proves the riskiest piece.
2. **Library route.** Map the existing model types (gridfinity bin/baseplate, HSW
   clip parts) to real library calls; bind the parameter sliders to library params.
3. **Interpret step.** Add the Claude call that turns a prompt into the spec JSON;
   reuse the type switcher as the low-confidence fallback.
4. **Validate + repair loop.** Add printability checks and the
   error → re-author → re-render cycle.
5. **Freeform route.** Allow LLM-authored SCAD for unmatched requests, gated behind
   the repair loop.

---

## Reference repositories

| Repo | Role |
| ---- | ---- |
| https://github.com/ostat/gridfinity_extended_openscad | library — Gridfinity bins, trays, baseplates |
| https://github.com/geru/3d-scad-hsw-clip | library — HSW honeycomb clip/connector |
| https://github.com/geru/3d-scad-hsw-customizable | library — HSW honeycomb wall |
| https://github.com/Chippen4713/WallMounts | library — wall-mount accessories |
| https://github.com/iancanderson/openscad-agent | freeform — LLM-authored SCAD patterns |
| https://github.com/BaLaurent/ClawdCAD | freeform — LLM-authored SCAD patterns |
| https://github.com/swh/openscad-skill | freeform — OpenSCAD authoring skill |
| https://github.com/codeofaxel/Kiln | orchestration — agent loop |
| https://github.com/EdwinjJ1/3d-print-skill | orchestration — printability checks |
| https://github.com/openscad/openscad-wasm | render — in-browser compile → mesh + STL |
| https://openscad.org/cheatsheet/ | grounding — OpenSCAD syntax context |
