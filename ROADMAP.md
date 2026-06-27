# Moldable Product Roadmap

*From a multi-agent feature-exploration pass (6 lenses → 40 ideas → ~22 distinct bets), weighted toward what only Moldable can do: a no-backend browser app, dual OpenSCAD + AI-mesh engines, a free local RTX-3080 path, and the sculpts gallery.*

> **Status:** **Shipped ✅** — #1 Live sliders · #2 Conversational refinement · #3 Prompt expansion · #4 Filament cost/time · #5 Dimensions + bed-fit · #6 Save your designs · #10 Shareable links. **Remaining proposals:** #7 Sculpt→parametric · #8 Sculpt flat-base/hollow · #9 Local launcher/OOM presets · the bets & moonshots below.

---

## Top 10 (ranked)

| # | Idea | Pitch | Builds on | Tag |
|---|------|-------|-----------|-----|
| 1 ✅ | **Live sliders for freeform SCAD** | Parse the `// [min:max]` comments the LLM already emits → range sliders. | `_parseScadParams`/`setFreeformParam` (done) | High · **Small** |
| 2 | **Conversational refinement** | "Refine" box: "make the base wider", "add a keychain hole" → JSON-delta (parametric) or surgical source edit (freeform). | `interpret.js`, `agent.js` repair loop | High · Medium |
| 3 | **Prompt expansion pre-pass** | On keyword miss, a ~180-token call rewrites "horse" → a printability-aware description feeding both engines (~$0.0003). | `interpret.js` | High · **Small** |
| 4 | **Filament cost & print-time panel** | "~38g PLA · $0.46 · 55–80 min" under Download — pure math on data `validate.js` already computes. | `inspectStl()` volume/area | High · **Small** |
| 5 | **Printer profiles & live bed-fit** | Pick your printer once; auto bed-check + tell the LLM the limit up front. | `validate.js` bed check (unhardcode 256×256) | High · **Small** |
| 6 | **Save your designs** | Persist parametric states (tiny JSON); search/rename/export in the gallery. | mirrors `_saveSculpt` | High · **Small** |
| 7 | **Sculpt → parametric bridge** | "Convert to parametric" maps a sculpt's bbox to the closest template, dims pre-filled (mesh → publishable SCAD). | `Box3` + `schemaText()` | High · Medium |
| 8 | **Sculpt print-prep: flat base + hollow** | Drag a Z-clip for a flat base; "Hollow" shells to 2.5mm + drain holes. | `mesh-print.py` (trimesh/voxel) | High · Medium |
| 9 | **Local launcher + OOM-adaptive presets** | One command starts all services; bridge auto-retries OOM at half-octree; ships `rtx3080-10gb` presets. | `DESKTOP_SETUP.md`, `local-mesh-bridge.mjs` | High · **Small** |
| 10 | **Shareable parametric link** | "Copy link" base64-encodes `{model, params, color}` into the URL hash; loads pre-filled. | `btoa`/`atob` + `loadGallery` | High · **Small** |

---

## ⚡ Quick wins (small effort, ship now)
Live freeform sliders (done) · prompt expansion · filament cost & time · printer profiles & bed-fit · save designs + gallery search/export · overhang heat-map (color the viewer where supports are needed — works for SCAD *and* sculpts) · shareable URL-hash link · local launcher + OOM presets · transparent routing ("why this template / try instead" — `confidence` is already computed and discarded) · size-reference overlay + target-size input · onboarding carousel + "Surprise Me".

## 🎯 High-impact bets (medium/large)
Conversational refinement (sequence after live sliders) · parametric attachment weld ("Add keychain ring / Gridfinity socket / display stand" merged via `concatenate`, no CSG lib) · sculpt → parametric · open-in-slicer deep link (`showSaveFilePicker` + `bambu-studio://`) · fit-to-object / measurement-first · bas-relief / stamp / coaster mode · local SD text→image→3D bridge.

## 🚀 Moonshots
Fully-local, fully-free **text → print** loop (text → local SD image → Hunyuan/Trellis mesh → print-ready GLB — a category-of-one for a no-backend app) · photo → parametric "snap & fit" (snap a mug → precise cupholder adapter) · sketch → 3D via Claude vision · inline AR preview (`<model-viewer>`, "will it fit on my desk") · auto-split with dovetail keys for over-bed parts.

---

## 🥇 If only one next: **Live sliders** — *shipped.* Recommended next: **Prompt expansion (#3)** then **Conversational refinement (#2)**.

*Cut/merged:* NL-param-refine folds into #2 · "My Templates" + "Your designs" are one feature · "Surprise Me" folds into onboarding · cloud Trellis-via-Flux is the weaker twin of local SD · multi-part bed composer / GLB texture passthrough / auto-thicken / symmetrize deemed low-ROI for now.
