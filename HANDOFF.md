# Moldable — Session Handoff

_Last updated: 2026-06-28. Read this + [`ROADMAP.md`](ROADMAP.md) to pick up where the last session left off._

## Where things stand
- **All work is on `main`** (single clean branch). The big session PR **[#1](https://github.com/Choaterboater/moldable/pull/1) is merged** (review record); temp branches cleaned up.
- Repo: `Choaterboater/moldable`. Working tree clean.

## What Moldable is
A no-backend, single-file browser app (`Moldable.dc.html`, custom `{{binding}}` framework) that turns text/photos into 3D-printable models via **two engines**:
- **Generate / ✨ Design with AI → OpenSCAD** (`cad/scad-gen.js` templates + `cad/interpret.js` LLM freeform) → exact mm-accurate parts.
- **🪑 Sculpt → AI mesh** (`cad/mesh.js` → `tools/*bridge.mjs` → Replicate Hunyuan3D/Trellis, Meshy/Tripo, or local Hunyuan) → organic shapes. `tools/mesh-print.py` auto-preps for print.

## Shipped (this session)
- **Bug fixes:** sculpt text→3D restored on **Replicate+Hunyuan3D** (it *does* text→3D); "house" → a STRUCTURES/BUILDINGS pattern; 14-bug multi-agent debug pass (incl. a structurally-broken default **Phone Stand**, and a **bridge LAN-exposure** fix → bound to `127.0.0.1`).
- **Sculpt UX:** Settings backend picker + Trellis/Hunyuan model picker; **Sculpt vs Design-with-AI = mutually-exclusive mode toggles**; "Your sculpts" IndexedDB gallery.
- **8 roadmap features:** live sliders for AI parts · **conversational refinement** ("make the base wider") · prompt expansion · filament cost/time estimate · dims + printer bed-fit · save-your-designs · shareable links · one-command launcher.

## ⚠️ Verification status
Everything was **logic-verified in Node** (parsers, clamping, encode/decode, fit math; full test suite green) — but the **browser UI was not runtime-tested** (no browser in the build environment). **Smoke-test before extending:** sliders, the Refine box, cost/dims badge, Save/Share buttons, the home galleries.

## Run & test
```bash
node tools/start.mjs            # web server (:8765) + Replicate bridge (:8788); Ctrl+C stops both
node tools/start.mjs local      # free local Hunyuan path (needs your GPU server)
# open http://127.0.0.1:8765/Moldable.dc.html  (HARD-refresh after any JS change: Cmd+Shift+R)

node test/engine.test.mjs       # + mesh / llm / agent / catalog — all green
```

## What's next
See [`ROADMAP.md`](ROADMAP.md). Recommended next: **#7 Sculpt→parametric**, **#8 sculpt flat-base/hollow**, or the **overhang heat-map**. Moonshots: fully-local free text→print, photo→precise-fit, sketch→3D, AR preview.

## Context for the assistant
- User runs **Replicate + Hunyuan3D + token** (text→3D works), has an **RTX 3080**, uses **both engines**.
- The assistant cannot run the browser here → verify logic in Node and ask the user to smoke-test rendering; never claim untested UI works.
