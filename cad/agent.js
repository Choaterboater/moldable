// cad/agent.js
// Stages 2–5 orchestration: interpret -> (library route | freeform), with the
// validate/self-repair loop for freeform. `compile` is injected (the worker
// runner in the app; a direct call in tests) so this stays unit-testable.
import { MODELS, generate as genLibrary } from './scad-gen.js';
import { interpret, authorFreeform, repairFreeform, refineParams, refineFreeform, expandPrompt, authorIR, repairIR, refineIR } from './interpret.js';
import { validate } from './validate.js';
import { hasApiKey, authorProfile } from './llm.js';
import { irToScad, irParams, applyIRDelta, IRError } from './ir.js';

// Freeform now goes through a JSON-IR (the LLM emits a node tree, ir.js transpiles it to
// manifold OpenSCAD). USE_IR is a one-line revert; the legacy raw-SCAD author stays as the
// fallback (used when the model can't return parseable IR JSON), so the IR path can only
// ADD reliability, never subtract it.
const USE_IR = true;

// run the IR author→transpile→compile→validate→repair loop. Returns the result, or throws.
async function buildFromIR(ir, { compile, onStatus, author, maxRepairs, spec }) {
  let lastDiag = '';
  for (let attempt = 1; attempt <= maxRepairs + 1; attempt++) {
    onStatus && onStatus(attempt === 1 ? 'Rendering…' : `Fixing the model (attempt ${attempt})…`);
    let source;
    try {
      source = irToScad(ir);                         // schema faults repair WITHOUT a compile (fast)
    } catch (e) {
      lastDiag = e instanceof IRError ? e.message : (e && e.message || String(e));
      if (attempt > maxRepairs) break;
      ir = await repairIR(ir, lastDiag, attempt, author);
      continue;
    }
    let stl = null, log = '';
    try { const r = await compile({ source }); stl = r.stl; log = r.log || ''; }
    catch (e) { lastDiag = (e && e.message || String(e)) + (e && e.log ? '\n' + e.log : ''); }
    if (stl) {
      const v = validate(stl, spec.constraints);
      if (v.ok) return { route: 'freeform', source, ir, irParams: irParams(ir), files: [], stl, log, spec, attempts: attempt, warnings: v.warnings || [], recognized: true };
      lastDiag = v.reason || 'failed printability check';
    }
    if (attempt <= maxRepairs) ir = await repairIR(ir, lastDiag, attempt, author);
  }
  const err = new Error('Could not produce a valid model after ' + (maxRepairs + 1) + ' tries: ' + lastDiag);
  err.code = 'repair-exhausted';
  throw err;
}

// buildFromPrompt(prompt, { compile, onStatus, signal, maxRepairs, forceAI, constraints })
//   compile: ({source, files?}) => Promise<{ stl: Uint8Array, log: string }>
// returns { route, system?, params?, source, ir?, irParams?, files, stl, spec, attempts, warnings, recognized }
export async function buildFromPrompt(prompt, { compile, onStatus, signal, maxRepairs = 3, forceAI = false, constraints } = {}) {
  onStatus && onStatus('Interpreting your idea…');
  // routing for the heavy authoring step (claude-cli → opus/16000; otherwise the chosen model).
  const author = { signal, ...authorProfile() };
  // forceAI ("Design with AI") bypasses keyword/template routing → straight to freeform authoring,
  // but first expand the (often terse) prompt into a buildable spec so the author has real dimensions.
  let spec;
  if (forceAI) {
    onStatus && onStatus('Expanding your idea…');
    const description = await expandPrompt(prompt, { signal });
    spec = { freeform: true, description, constraints: { bed: [256, 256], material: 'PLA' }, recognized: true, source: 'forced' };
  } else {
    spec = await interpret(prompt, { signal });
  }
  // Caller-supplied constraints (e.g. the user's SELECTED printer bed) override the
  // interpreter's hardcoded 256×256 default, so bed-fit + the repair hint reflect the
  // real printer rather than a fixed size. (Fixes false/missing bed warnings.)
  if (constraints) spec.constraints = { ...(spec.constraints || {}), ...constraints };

  // ---- known / library route ----
  if (!spec.freeform && spec.system && MODELS[spec.system]) {
    onStatus && onStatus('Rendering…');
    const { source, files } = genLibrary(spec.system, spec.params);
    const { stl, log } = await compile({ source, files });
    const v = validate(stl, spec.constraints);
    if (!v.ok) throw Object.assign(new Error('Model did not render: ' + (v.reason || 'invalid geometry')), { code: 'render-failed' });
    return {
      route: 'library', system: spec.system, params: spec.params, source, files, stl, log,
      spec, attempts: 1, warnings: v.warnings || [], recognized: spec.recognized !== false,
    };
  }

  // ---- freeform route (needs a key) ----
  if (!hasApiKey()) {
    const err = new Error('Freeform shapes need an Anthropic API key. Add one in Settings, or pick a template.');
    err.code = 'needs-key';
    throw err;
  }
  onStatus && onStatus('Designing the part…');
  if (USE_IR) {
    let ir = null;
    try { ir = await authorIR(prompt, spec, author); } catch (e) { ir = null; }   // unparseable JSON / LLM error → fall back to raw author
    if (ir) return await buildFromIR(ir, { compile, onStatus, author, maxRepairs, spec });
  }
  // legacy raw-SCAD author (fallback, or USE_IR off)
  let source = await authorFreeform(prompt, spec, author);
  let lastDiag = '';
  for (let attempt = 1; attempt <= maxRepairs + 1; attempt++) {
    onStatus && onStatus(attempt === 1 ? 'Rendering…' : `Fixing the model (attempt ${attempt})…`);
    let stl = null, log = '';
    try {
      const r = await compile({ source });
      stl = r.stl; log = r.log || '';
    } catch (e) {
      lastDiag = (e && e.message || String(e)) + (e && e.log ? '\n' + e.log : '');
    }
    if (stl) {
      const v = validate(stl, spec.constraints);
      if (v.ok) {
        return { route: 'freeform', source, files: [], stl, log, spec, attempts: attempt, warnings: v.warnings || [], recognized: true };
      }
      lastDiag = v.reason || 'failed printability check';
    }
    if (attempt <= maxRepairs) source = await repairFreeform(source, lastDiag, attempt, author);
  }
  const err = new Error('Could not produce a valid model after ' + (maxRepairs + 1) + ' tries: ' + lastDiag);
  err.code = 'repair-exhausted';
  throw err;
}

// refine(request, { current, signal }) — conversational tweak of an existing model.
//   current = { ir } (freeform-IR) | { freeform:true, source } | { freeform:false, model, params }
// Returns { freeform, ir?, irParams?, params?, source? } — the caller applies it and re-renders.
export async function refine(request, { current, signal } = {}) {
  if (current && current.ir) {
    const delta = await refineIR(current.ir, request, { signal });
    const ir = applyIRDelta(current.ir, delta);
    return { freeform: true, ir, source: irToScad(ir), irParams: irParams(ir) };
  }
  if (current && current.freeform) return { freeform: true, source: await refineFreeform(current.source, request, { signal }) };
  return { freeform: false, params: await refineParams(current.model, current.params, request, { signal }) };
}
