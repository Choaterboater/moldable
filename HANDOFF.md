# Moldable — audit, model repairs, and Casper handoff

## Start here

- **Branch:** `feat/otto-robot`.
- **HEAD when this handoff was written:** `feb43c424b7d11366571fdcef409bc8dc68c59da`.
- **Working tree is not clean.** It contains substantial uncommitted Otto work, model fixes, tests, and verification repairs. Nothing was committed or pushed during this work.
- Preserve existing changes. Do not reset, clean, restore, or assume every changed file belongs to the latest repair.
- **Chrome now works in WSL.** The previous handoff's “clean main” and “browser unavailable” statements were stale and have been replaced.
- This handoff is documentation, not evidence that every audit finding was fixed or that every model is physically functional.

## Request and scope history

The original request was a crew debug/audit covering UX/UXI, interface, frontend, backend/security, code quality, optimization, and dead code, with one lead reviewing the reports. Four bounded reviewers completed their reviews, sequentially; their findings were candidates until independently checked.

The initial audit was read-only. Later work expanded to testing/fixing templates and models, consulting MakerWorld/GitHub, and two explicit Casper verification repairs. The resulting code changes should not be confused with a completed fix of the entire audit backlog.

The session should have made those scope transitions clearer and delivered the consolidated audit report earlier. The open-findings section below preserves the outstanding work.

## Architecture to preserve

- `Moldable.dc.html`: browser UI and component logic using the custom `{{binding}}` framework, not React application source.
- `support.js`: generated runtime; do not hand-edit it or treat dynamically bound component methods as dead code.
- `cad/scad-gen.js`: shared model schemas and OpenSCAD generators, consumed by browser and headless tests.
- `cad/openscad-runner.js` / worker: OpenSCAD WASM compilation; browser viewer uses Three.js.
- `cad/interpret.js`, `cad/agent.js`, `cad/llm.js`: template/LLM authoring route.
- `cad/mesh.js`, `tools/*bridge.mjs`: separate AI-mesh route. A successful template render does not verify the mesh-provider pipeline.
- Keep browser/Node code portable across supported OSes. Use URL-based module paths and existing platform-aware tooling.

## What was completed

### Otto work preserved and checked

Substantial Otto implementation was already present when the audit baseline was taken: libraries, model metadata, printer profiles, validation, docs, thumbnails, and geometry/fit tests. Do not attribute that entire pre-existing diff to the later model-repair pass.

Earlier integration work also corrected:

- Returning from Robots to All templates restores the unrelated catalog.
- Otto's publish dialog displays `CC BY-SA 4.0`; existing other/freeform/mesh behavior was retained.

See [Otto guide](docs/guides/otto.md), [acceptance reference](docs/reference/otto-acceptance.json), and [fit record](docs/reference/otto-fit.md). Hardware fit remains unverified.

### Model defects fixed

| Change | Implementation | Why it mattered |
| --- | --- | --- |
| Twisted vase wall continuity | `cad/scad-gen.js`, `vase()` | Translating the inner twisted extrusion changed its rotational phase and cut gaps through low-sided walls. Inner and outer profiles now share the same twist frame; the cavity is clipped above the floor. |
| Accurate vase control label | Generator schema and HTML bootstrap schema | `radius` was labeled Width. It is now Radius; the parameter's meaning and units were not changed. |
| Portable Gridfinity exports | New `cad/scad-export.js`, runner re-export, HTML `downloadSCAD()` | Bin and Baseplate downloads omitted their required libraries and failed in clean OpenSCAD. Declared include libraries are now embedded, preserving assignment order and source/license notices. Otto keeps its existing attribution/export path. |
| Safe export failure and identity | HTML `downloadSCAD()` | Missing libraries produce an error instead of a broken download. Source/model/title are captured so a selection change during export cannot rename or repackage the wrong design. |
| Working honeycomb bin | Wall-bin schema/generator and HTML bootstrap schema | The gallery's `honeycomb` parameter was ignored. A working Honeycomb front control now perforates the front while retaining the floor, frame, solid mounting back, and connectors. The one-compartment divider loop is guarded. |

Added `test/templates.test.mjs` and `test/scad-export.test.mjs`: **413 additional test cases** covering presets, slider limits, combined limits, actual SCAD downloads, vase cross-sections/floor/cavity, honeycomb geometry, and export safeguards.

### Verification repairs fixed

**Malformed local mesh image input**

- `tools/local-mesh-bridge.mjs`, `dataUriToBase64()` now catches percent-decoding errors and returns the existing invalid-input result.
- Previously, `data:image/png,%` caused an uncaught `URIError`, closed the socket, and terminated the bridge. It now returns HTTP 400 through the existing handler.
- New `test/local-mesh-bridge.test.mjs` runs the real bridge in a child process against a synthetic loopback upstream. It checks malformed percent escapes, no invalid task creation/submission, process survival, and unchanged handling of encoded/base64 submissions.
- The synthetic upstream returns 503 deliberately: no GPU generation or remeshing is performed.

**Phone header overflow**

- Only `Moldable.dc.html` was changed for this repair; `support.js` was not touched.
- Header height/padding moved into `.mw-header`. At widths up to 540px, header groups wrap with automatic height and a full-width branding row.
- No controls, labels, or content were hidden. Desktop retains the original 62px header and 22px horizontal padding.
- Original 390px failure changed from 462px content in a 390px header to 390px content, with no overlap. A 320px case and desktop baseline also passed.

## Verification: what actually ran

**Last full Node run:** `node --test --test-reporter=spec test/*.test.mjs` — **2,152 passed, 0 failed, 14 TODOs**. The TODOs require real Otto printing/hardware evidence; they are not completed acceptance tests.

Other commands actually run during the work:

```bash
node --test test/local-mesh-bridge.test.mjs test/bridge-guard.test.mjs
node test/engine.test.mjs
git diff --check
```

The bridge regression and existing access-gate tests passed. The standalone engine command was run earlier; the latest full Node suite also executes the engine/catalog test files. `git diff --check` passed after the code repairs.

**Evidence distinction:** Bash test runs are diagnostics, not Casper-managed check receipts. No usable `casper_check` capability was available when searched. Browser checks and the service smoke replay were recorded through Casper's native tools; do not upgrade one evidence type into another.

### Model coverage and limits

- Geometry checks cover **27 model types, 39 gallery presets, and 50 catalog designs**.
- New tests exercise each slider's minimum/maximum and each model's all-minimum/all-maximum combination. This is not an exhaustive Cartesian product.
- All 27 actual default SCAD downloads compile without separate library files after the export fix.
- Vase regressions include horizontal wall sections, an intact floor, and an open cavity: whole-mesh manifoldness alone had missed the wall gaps.
- Browser rendering was checked for representative Otto, repaired triangular-vase, and honeycomb-bin journeys, not every possible template journey.
- Physical printing, mating fits, hinge closure, stackability, clutch strength, and load-bearing performance were not established by compilation.
- No real paid-provider jobs or real credential-transmission experiments were used for the audit probes. Provider/cancellation experiments used mocks; bridge regression requests use a synthetic local upstream.

### Useful recorded check IDs

| Check | ID | Last observed result |
| --- | --- | --- |
| Original 390px header | `1796c9ec-3d38-4a6d-b510-dd646ca46277` | Failed before repair; same recorded check passed afterward |
| 320px header, all controls retained | `9cb1af8c-68c9-4637-8b66-d79746d6da01` | Failed before repair; passed afterward |
| Desktop header | `189ae644-50c0-4fbe-b70b-8d5bbc404cd7` | Passed before and after repair |
| Vase Radius label | `7c951ec9-5bab-4d28-b273-8bfe5d4ad3d5` | Passed |
| Formerly broken triangular vase settings | `ab6968af-bfd8-4f3a-928a-2cabe815aebb` | Passed render/estimate assertions |
| Honeycomb bin preset | `3df2be6c-7952-4747-b271-f1810032b9c6` | Passed control/render/estimate assertions |
| Malformed-image bridge smoke | `smoke-1` on `adhoc-1` | Replay returned HTTP 400 after repair |

The original `smoke-1` baseline was recorded as **incomplete**, and its receipt retained `evidence:false` even after the replay passed. Preserve that limitation. The separate Node integration regression failed on the old code and passed after the fix; do not rewrite the smoke baseline to manufacture managed before/after evidence.

Browser screenshots are diagnostic illustrations, not substitutes for assertions. The old Publish check intentionally observed misleading success text; a passing observation of that text does **not** establish real publication.

## Outstanding audit findings

Priorities below are recommended triage, not claims that every security consequence was browser-exploited. Line numbers refer to the current source and will drift.

| Priority / area | Evidence and impact | Recommended correction |
| --- | --- | --- |
| P1 — provider routing | `cad/llm.js:25–28,120–127`: a mocked switch to `claude-cli` reused a stored custom URL and dummy bearer credential. Requests can go to the wrong configured destination. No real key was transmitted. | Separate provider-specific endpoint/key state; prevent cloud credentials from following a CLI/local-provider switch. Add mocked dispatch regressions first. |
| P1 — asynchronous model identity | `Moldable.dc.html:950,1011,1116`: selecting a gallery template does not invalidate `_genSeq`. Deferred probes showed an older generation replacing a newly selected Otto, and an older refinement merging vase parameters into Otto. | Invalidate pending generation/refinement when the design context changes; capture model identity before awaits. Cover gallery/type/new/load transitions. |
| P1 — stale STL download | `Moldable.dc.html:1498` onward: readiness/source matching is enforced for Otto only. A Node UI probe downloaded a previous non-Otto STL while the displayed design was rendering. | Apply source/readiness guards consistently to parametric/freeform STL exports; test pending rebuilds and model switches. |
| P1 candidate — bridge trust boundary | `tools/bridge-guard.mjs:33`: `Origin: null` is explicitly allowed; foreign origins are rejected. Gate acceptance is reproduced, but an opaque-origin browser exploit/local-network reachability was not tested. Existing tests intentionally allow `null`. | Decide/document file-origin support and the trust model before changing it. Validate the browser threat model and introduce an explicit trusted-origin/auth mechanism if required; do not just remove a test to get green. |
| P2 — mesh cancellation | `cad/mesh.js:136–156`: an already-aborted mocked request still submitted once before returning cancelled; the initial submission did not receive the signal. This can start an unwanted job. | Check abort before submit and propagate the signal through adapters/initial POST. Test no-submit-on-pre-abort without real providers. |
| P2 — empty-editor race | `Moldable.dc.html:1720,1729`: empty-source return precedes incrementing `_compileSeq`. A deferred old compile cleared the empty-code error and installed old geometry. | Invalidate the old compile before all early returns. Add a deterministic deferred-promise regression. |
| P2 — startup registry drift | HTML bootstrap model registry omits types exposed by the type chips until `_loadCad()` synchronizes it. A bootstrap-registry probe threw for Otto, stacking tray, cable raceway, and hinge box. Browser startup throttling was not exercised. | Remove the duplicate schema source or gate unavailable types until initialization; test a delayed loader. |
| P2 — misleading publish success | `Moldable.dc.html:1400`: `doPublish()` only changes UI state, yet the dialog claims the design is live on MakerWorld. Reproduced in Chrome. | Describe preparation/manual upload truthfully. Do not imply an upload or account integration that does not exist. |
| P2 — unnamed sliders | Guided/Studio range controls use adjacent spans rather than associated labels/accessible names. Empty names were observed in browser inspection. | Associate labels/IDs or add appropriate ARIA names in both views. |
| P2 — Settings Cancel semantics | `Moldable.dc.html:1423,1749`: printer selection persists immediately; Cancel only closes the dialog. Reproduced with synthetic local storage. | Choose explicit immediate-save wording or implement a settings draft with Apply/Cancel. |
| P2 — Studio error visibility | `hasGenError` banners are in Guided markup; generation catches set `genError` plus a transient toast. This is a source-supported persistent-feedback gap, not a completed Studio failure-journey browser test. | Add persistent Studio feedback and verify a mocked failed generation there. |
| P3 — repeated mesh scans | `setPrinter()` calls `_printEstimate()` over every STL triangle, although geometry is unchanged. Source-supported optimization opportunity; no measured performance regression established. | Benchmark first, then cache geometry metrics per STL identity and recompute fit separately. |
| P3 — dead-code candidate | Private `const b` in `cad/scad-gen.js:209` appears unused. Dynamic UI bindings/generated code were excluded from this allegation. | Confirm references before removal. Keep cleanup separate from correctness/security fixes. |

Additional candidates, **not promoted to independently reproduced defects**:

- Replicate bridge request-shape crashes suggested by source review (e.g. JSON `null` / non-string model). Reproduce safely before patching; the local-mesh percent-decoding fix does not claim to address these.
- Some controls produce identical endpoint geometry when their feature is inactive: Otto feet while editing a head, pedestal wall with no recess, and stacking-tray lip at defaults. Distinguish conditional/inactive controls from broken features; investigate actual stacking semantics before promising a nesting fix.
- Passing STL topology does not prove living-hinge closure or other mechanical usefulness. Add semantic geometry/fit checks instead of declaring every model fully functional.

## Recommended next work

1. **Review and partition the uncommitted worktree.** Identify existing Otto work versus later repairs before any eventual commit; commit/push only if requested.
2. **Address routing/trust/cancellation risks before real credentials or provider jobs.** Start with mocked routing and pre-aborted-submit tests; separately resolve the intentional `null`-origin policy.
3. **Fix design/compile identity races and stale exports.** Use deterministic deferred promises, then repeat representative browser journeys without weakening recorded checks.
4. **Repair UX truthfulness and feedback.** Publish wording, Settings semantics, accessible names, persistent Studio errors, and delayed-initialization behavior.
5. **Validate mechanical intent.** Expand beyond compile/topology checks, then gather actual Otto fit/print evidence using the guide and fit record. Leave physical TODOs open until evidence exists.
6. **Measure optimization candidates, then clean private dead code.** Avoid a broad refactor mixed into the correctness fixes.

For a focused next coding task: add failing regressions for stale generation/refinement and stale non-Otto STL export, then make the smallest identity/readiness fixes.

## Running / resuming

Use Casper-managed browser/service tools for task-owned background servers. The previous preview was `http://127.0.0.1:8765/Moldable.dc.html`; do not assume it or the task-owned bridge `adhoc-1` survives a new session.

Existing cross-platform launcher commands, from the project root:

```bash
node tools/start.mjs              # web + Replicate bridge; does not itself verify a cloud job
node tools/start.mjs local        # web + local bridge; needs a separate Hunyuan server for actual generation
node tools/start.mjs --with-ai    # additionally starts the local Claude CLI bridge
```

The full suite command above is the primary existing verification command. Do not narrow or rewrite configured checks to make failures disappear. New docs alone do not require another expensive geometry run; rely on accurately dated/qualified last-run results and Casper's final recorded checks.

### External references actually accessed

- [Gridfinity Extended upstream](https://github.com/ostat/gridfinity_extended_openscad): useful combined-build/source references; upstream license is GNU GPL v3. Export notices now point to it. Review source-distribution licensing before publishing; do not assume a generic UI CC BY label covers bundled third-party source.
- [OpenSCAD extrusion example](https://github.com/openscad/openscad/blob/master/examples/Basics/linear_extrude.scad): official example, carrying a CC0 dedication.
- MakerWorld Parametric Model Maker was blocked by HTTP 403/Cloudflare in both fetch and Chrome. No MakerWorld example/source or successful upload was verified. This was not established as an account-login issue, and the blocker was not bypassed.

## How this session could have gone better

### Assistant/workflow improvements

- **Make scope changes explicit.** Close the read-only audit with a prioritized report before switching to fixes, or explicitly identify the new authorized scope. Avoid presenting a few model fixes as the result of the entire crew audit.
- **Deliver findings sooner.** Four reviewers completed, but the lead spent too long extending probes before consolidating results. Use a bounded evidence table: reproduced, source-supported, hypothesis, fixed, and not tested.
- **Check tools once, early.** Chrome became available mid-session; that changed coverage. Discover/cache browser/check capabilities rather than repeatedly searching for an unavailable `casper_check` runner.
- **Test the intended behavior, not just compilation.** The old engine checks passed triangular vases with gapped walls. Cross-sections, cavity/floor probes, actual export compilation, and feature-effect tests found defects that triangle counts could not.
- **Use unique browser selectors.** Repeated initial attempts matched both template and catalog grids. Inspect structure first; prefer stable scoped selectors or explicit test hooks. Correct invalid checks transparently; never withdraw genuine failures just to get green.
- **Inject mocks at the real dependency boundary.** One export-failure regression initially replaced `ui._cad`, but `_loadCad()` returned the original module. Correcting that injection was necessary; the production failure behavior should not be weakened to satisfy a mistaken mock.
- **Keep reports honest about evidence.** A screenshot, a green defect-observation check, a Node probe, and a managed regression receipt mean different things. Also preserve pre-existing changes rather than implying authorship of the whole diff.

### Concrete Casper product improvements

- **Give checks a purpose:** `regression gate`, `audit observation`, `expected defect`, or `diagnostic`. An audit should be able to record a known defect without automatically converting a report-only task into mandatory implementation work.
- **Represent scope transitions explicitly:** show audit-only versus authorized repair scope, and retain a task/change ledger across compaction and verification-repair turns. The resume summary should identify which request superseded which constraint.
- **Expose verification provenance:** display baseline completeness, failed-before/passed-after evidence, current scoped freshness, and the exact stored request/expectation. A successful replay of an incomplete baseline should remain visibly different from a valid before/after receipt.
- **Improve browser diagnostics:** ambiguity errors should identify the selector and matched nodes, including hidden/template copies and the step at which it failed. Role/name locators or stable test-hook support would reduce brittle style selectors.
- **Separate crash history from current health:** show process generation/PID and distinguish a historical crash from a crash in the just-tested process. State whether a health request silently restarted the service; a restarted GET alone does not prove survival of the prior POST.
- **Provide a discoverable check runner or a clear fallback:** no configured checks/usable `casper_check` was detected here. Make it obvious how native browser/service receipts and direct Node diagnostics contribute to acceptance instead of leaving the assistant to infer it.
- **Attach bounded test receipts:** retain command, counts, exit status, source scope, and log location so large geometry-suite output truncation does not obscure the result. Preserve these receipts through handoff/compaction.
- **Track coverage without overclaiming:** model/preset counts, sampled parameter combinations, browser journeys, mocked providers, and physical TODOs should be separate dimensions. “All tests passed” must not imply “all models physically work.”
- **Offer a destination-resolution preflight:** the Desktop copy was initially blocked because its destination was a shell variable and Casper could not rule out replacing a configured check. Keep that protection, but show resolved source/destination paths and provide a clear literal-path fallback for authorized, non-clobbering copies.

## This handoff update

This documentation request updates `HANDOFF.md` and adds a [reconstructed session record](docs/handoffs/session-export.md), which is not a complete verbatim transcript. The user also requested Desktop copies; verified delivery paths are reported in the final response. No tests were rerun for this documentation-only update; the last full-run result above is carried forward, not presented as a new managed pass.
