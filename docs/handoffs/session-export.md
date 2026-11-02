# Moldable — reconstructed session export

## Integrity and scope

**This is a reconstructed Markdown session record, not a verbatim transcript.** Earlier conversation messages and some tool output were compacted before this export was requested. This record combines the retained summary, visible subsequent messages, inspected source, and recorded results. It does not invent missing dialogue or timestamps, and it cannot recover omitted raw tool output.

For the actionable technical handoff, see [HANDOFF.md](../../HANDOFF.md). That document contains the prioritized outstanding findings, source references, next-work order, and Casper product feedback. This record preserves the session's chronology and decisions instead.

- Project: `/home/choate/modable/moldable`.
- Branch at handoff: `feat/otto-robot`.
- HEAD: `feb43c424b7d11366571fdcef409bc8dc68c59da`.
- Substantial tracked/untracked work remains uncommitted. No commit or push was performed.
- Windows Desktop resolved through the Windows known-folder API to `C:\Users\choat\Desktop`.
- This export was prepared for the user-requested Desktop copy. The final conversation reply supplies the actual verified delivery paths.

## Requests represented in the available history

The original audit request, preserved in the retained context and Casper repair prompts:

> run a crew debug and report back to one and review it - ux, uxi, debug, audit, interface, backend,frontend, optimization,code, deadcode

A subsequent model request is preserved in summarized form: test different templates/models because some are broken, fix them, and consult MakerWorld's Parametric Model Maker examples/OpenSCAD source. The user offered to log in if required.

Visible follow-ups during that work:

> bot issues

> github prob has some stuff as well

Later, two Casper repair requests explicitly asked for the smallest fixes to recorded failures while retaining checks and unrelated behavior:

- Verification repair 1/3: malformed local-mesh image data closed the socket and crashed the service instead of returning HTTP 400.
- Browser replay repair 2/3: phone header content occupied 462px inside a 390px box.

The documentation/export requests:

> write a handoff on what was done and what to do next and how this session could of gone better so i can also improve casper

> copy it to the windows deskotp as well

> explort this session as well in a md and save to desktop

## Phase 1 — Otto integration and baseline

The retained history describes earlier Otto integration work and a large pre-existing uncommitted implementation. Files included Otto libraries/metadata, printer profiles, docs, thumbnails, and tests, plus changes to the app, authoring, validation, and engine suites.

Two integration gaps were corrected earlier:

- Catalog content reappears under All templates after leaving the Robots category.
- Otto's publish license binding displays `CC BY-SA 4.0`, retaining existing behavior for other/freeform/mesh designs.

Before the audit, the live tree was recorded rather than trusting the old handoff:

```text
branch: feat/otto-robot
HEAD: feb43c424b7d11366571fdcef409bc8dc68c59da
baseline git diff --binary SHA-256:
f856255b0e4c0b5455d3ebebb2aa6b2041716e2d4de3869f542d45adda4b1c57
baseline tracked + non-ignored untracked content-list SHA-256:
d499dfa52a4501660a123374324ed204d3d5b87bef9c03a198f058d8722a8edb
```

Those hashes describe the earlier audit baseline, not the later repaired or documentation-updated tree. They were rechecked unchanged during the read-only investigation before subsequent authorized fixes.

## Phase 2 — crew audit and lead verification

Four bounded reviewers completed sequential reviews covering UX/interface, frontend/debugging, backend/security, and code/optimization/dead code. Their output was treated as candidate findings. The lead inspected source and independently reproduced selected issues.

The initial scope was read-only. Existing uncommitted changes were preserved; the generated `support.js` and dynamic component bindings were not treated as ordinary dead code.

Independent probes or source checks identified:

- Deferred generation/refinement applying to a newly selected model.
- Non-Otto STL download using an old mesh during rendering.
- Empty-editor state overwritten by an older compile completion.
- Missing bootstrap model schemas exposed through selectable type chips.
- Custom URL and dummy bearer credential following a provider switch to Claude CLI.
- Pre-aborted mesh requests still submitting once before reporting cancellation.
- `Origin: null` accepted by the shared bridge gate; browser exploitation was not established.
- Publish UI claiming a live MakerWorld listing without performing publication.
- Settings Cancel retaining an immediately persisted printer selection.
- Empty accessible names on sliders.
- Source-supported Studio error-feedback and repeated-STL-scan concerns.
- A private unused-helper candidate, not a broad claim that bound UI methods are dead.

The complete remaining backlog and evidence qualifications are in the handoff. Most of those findings were **not fixed** in this session.

### Tool limitations and changes

- An initial large inline assertion harness was blocked by Casper's configured-check protection. It was not forced through; smaller observation probes and normal test files were used later.
- A usable `casper_check` capability was not available when searched. Direct Node runs remained diagnostic evidence, distinct from native browser/service check receipts.
- Chrome became available in WSL during the work, enabling representative runtime browser checks. The previous blanket browser-unavailable limitation ceased to apply.
- Some initial browser selectors were invalid or ambiguous. In particular, a selector matched both template and catalog grids. Invalid unrecorded attempts were corrected; genuine failing checks were retained.
- A malformed local-mesh request produced a real `URIError` service crash. This was initially audit evidence, then repaired after an explicit verification-repair request.

## Phase 3 — model and template testing

The model work inventoried:

- 27 model types.
- 39 gallery presets.
- 50 catalog designs.

An initial 351-case sweep covered gallery presets, individual slider endpoints, and catalog compilation. A separate 54-case sweep exercised each model's all-minimum and all-maximum settings. These reported no generic compile/topology/bed-placement failures, but that was not sufficient to establish functional geometry.

### Defects found beyond generic compilation

**Twisted vase:** horizontal slices through allowed triangular-vase settings had three disconnected wall strips rather than one continuous wall section. The whole vase could still be one manifold object because its bottom joined those strips. The issue also occurred in an existing engine-test variant (`sides:3`, `twist:300`, `height:220`).

**Gridfinity export:** actual UI `.scad` downloads were compiled with no supplemental files. Initially 25 of 27 compiled; Gridfinity Bin and Baseplate failed because their includes were not bundled.

**Honeycomb bin:** gallery presets supplied `honeycomb:0/1`, but the parameter was absent from the model schema and did not change generated source.

**Label:** the vase's radius parameter was labeled Width.

### External references

MakerWorld text fetch returned HTTP 403 and Chrome showed Cloudflare verification. The user noted “bot issues”; the investigation did not bypass the blocker or establish that account login would solve it.

After the GitHub suggestion, public references were successfully read:

- https://github.com/ostat/gridfinity_extended_openscad
- Its README/license, including combined-build references and GNU GPL v3 licensing.
- https://github.com/openscad/openscad/blob/master/examples/Basics/linear_extrude.scad — official example with a CC0 dedication.

No MakerWorld example source, successful upload, real paid-provider job, or physical print was verified.

## Phase 4 — targeted model fixes

The implementation remained within the existing generator/runner/UI architecture:

- Vase inner and outer profiles now use the same twist frame. The cavity is clipped above the floor instead of translating a separately twisted extrusion.
- Radius is labeled accurately in the generator and HTML bootstrap schemas.
- New `cad/scad-export.js` inlines declared include libraries at their original positions, preserving override order and notices. Missing/cyclic dependencies fail explicitly; `use` is not silently flattened into different semantics. Otto retains its existing specialized portable-export path.
- SCAD export captures model/source/title identity across awaits and does not download a partial artifact on library failure.
- Wall-bin honeycomb front perforations and a schema/UI control were implemented without cutting the mounting back, floor, or connectors. The single-compartment divider loop was guarded.
- Gridfinity source/license notices were added to generated source.

Added tests:

```text
test/templates.test.mjs
test/scad-export.test.mjs
```

Together they added 413 cases. Coverage includes presets, individual and combined limits, real SCAD downloads, vase wall sections/floor/open cavity, feature-effect checks, and export failure/identity behavior.

### Test development evidence

- The first focused regression run failed 16 of 19 selected cases on the old implementation.
- After the production fixes, 18 of those 19 passed. The remaining failure was a test-injection mistake: replacing `ui._cad` did not change the module returned by `_loadCad()`.
- The mock was corrected at the actual dependency boundary. The production behavior was not weakened to satisfy the mistaken injection.
- Cavity/floor tests were added to ensure that merely replacing the vase with a solid plug could not satisfy the wall-continuity assertions.
- The full suite then passed 2,151 tests, with 14 existing physical TODOs.

Representative browser checks confirmed the Radius label, a worker-rendered triangular vase at the previously broken settings, and a honeycomb bin with its control enabled and matching compiled-mesh print estimate.

## Phase 5 — Casper verification repair 1/3

### Failure received

Recorded check `smoke-1`, “Malformed image data returns 400 without crashing the local bridge,” failed because the socket closed. The service log showed:

```text
URIError: URI malformed
  at decodeURIComponent
  at dataUriToBase64
```

The failing request used a synthetic malformed image data URI. The initial recorded smoke baseline was incomplete.

### Repair and evidence

- The original smoke replay reproduced the crash before editing.
- A new integration test, `test/local-mesh-bridge.test.mjs`, also failed on the old code with a closed socket.
- The production change was limited to catching decode errors in `dataUriToBase64()` and returning `null`, allowing the existing handler to respond HTTP 400.
- The integration test uses the real child-process bridge with an ephemeral port and a synthetic loopback upstream returning 503. It verifies no invalid jobs and successful subsequent URI submission handling, without invoking a GPU or remesher.
- The same smoke replay then returned HTTP 400.
- The integration and existing access-gate tests passed.

Important limitation: the native smoke receipt retained `baseline:incomplete` and `evidence:false`. A passing replay was not relabeled as complete managed before/after evidence. Historical crash output also appeared beside a later healthy result; process restart state must be considered when interpreting such receipts.

## Phase 6 — Casper browser repair 2/3

### Failure received

Original browser check:

```text
id: 1796c9ec-3d38-4a6d-b510-dd646ca46277
name: Phone home header controls stay within 390px
viewport: 390 x 844
header content width: 462px
header box width: 390px
```

The document itself did not overflow, but the fixed-height, non-wrapping header clipped controls. The original check was replayed and failed before editing. Additional desktop and 320px checks were recorded before editing as well.

### Repair

Only `Moldable.dc.html` changed for this repair:

- Header height/padding moved into `.mw-header`.
- A media query up to 540px allows wrapping, automatic height, smaller padding, and a full-width branding row.
- No controls, text, or handlers were removed or hidden.
- Desktop retained the 62px height and original horizontal padding.
- Generated `support.js` was not edited.

### Results

- Original 390px recorded check passed, with header content width exactly 390px and no overlap.
- 320px recorded check changed from failure to pass with all controls present.
- Desktop baseline passed before and after the change.
- The unchanged full Node command passed **2,152 tests**, failed **0**, and retained **14 physical-print TODOs**.

## Last-run commands and receipt references

Commands actually run during the coding/repair work include:

```bash
node --test --test-reporter=spec test/*.test.mjs
node --test test/local-mesh-bridge.test.mjs test/bridge-guard.test.mjs
node test/engine.test.mjs
git diff --check
```

The latest full-suite counts are 2,152 pass / 0 fail / 14 TODO. These are direct Node diagnostics, not a claim of a configured Casper test-runner pass. No tests were rerun solely for this documentation/export request.

Useful native browser IDs:

```text
390px header:       1796c9ec-3d38-4a6d-b510-dd646ca46277
320px header:       9cb1af8c-68c9-4637-8b66-d79746d6da01
desktop header:     189ae644-50c0-4fbe-b70b-8d5bbc404cd7
vase Radius label: 7c951ec9-5bab-4d28-b273-8bfe5d4ad3d5
triangular vase:    ab6968af-bfd8-4f3a-928a-2cabe815aebb
honeycomb bin:      3df2be6c-7952-4747-b271-f1810032b9c6
```

A passing check that observed the old misleading Publish text was diagnostic evidence of that UI defect, not evidence of actual publication.

## Phase 7 — handoff and Desktop export request

The user requested a handoff covering completed work, next work, and how both the session and Casper could improve.

The old `HANDOFF.md` incorrectly described a clean `main` branch and unavailable browser. It was replaced with current branch/worktree facts, implementation details, verification provenance, qualified open findings, prioritized next steps, and concrete assistant/Casper improvement recommendations.

The user then requested a Windows Desktop copy and a Markdown session export.

- Windows PowerShell's known-folder API resolved the Desktop to `C:\Users\choat\Desktop`; no guessed Windows username or broad user-folder search was used.
- The first copy command was **not run**: Casper refused a shell-variable destination because it could not rule out overwriting a configured check, and requested a plain destination path.
- The copy workflow was changed to explicit, inspectable destination paths, retaining non-clobbering behavior rather than bypassing protection.
- This reconstructed record was added at `docs/handoffs/session-export.md` to provide a project copy as well as the requested Desktop copy.
- Final copy success and content identity are reported separately after the file operations; this prepared record does not fabricate an export receipt.

## Lessons preserved for the next session

- Explicitly distinguish report-only audit scope from later authorized repairs.
- Deliver the consolidated report before expanding into a long repair pass.
- Separate reviewer allegations, source-supported findings, reproductions, fixed defects, and acceptance evidence.
- Discover current browser/check tools early and retain capability state across compaction.
- Keep expected-defect observations separate from regression/release gates.
- Inspect selectors before recording checks; do not replace real failures with easier assertions.
- Include semantic geometry and actual artifact tests, not just compile success and manifoldness.
- Use mocks/synthetic loopback services instead of real credentials or provider jobs for fault probes.
- Expose incomplete baselines, scoped freshness, process restarts, and historical crash generations clearly in Casper.
- Maintain an authoritative request/change ledger and honest transcript-export limits through compaction.
- Resolve destination paths transparently before authorized copies; retain configured-check and non-clobber protections.

The next recommended coding work is the unresolved provider-routing/design-identity/stale-export backlog described in [HANDOFF.md](../../HANDOFF.md), not a claim that the entire audit is complete.
