// cad/agent.js
// Stages 2–5 orchestration: interpret -> (library route | freeform), with the
// validate/self-repair loop for freeform. `compile` is injected (the worker
// runner in the app; a direct call in tests) so this stays unit-testable.
import { MODELS, generate as genLibrary } from './scad-gen.js';
import { interpret, authorFreeform, repairFreeform, refineParams, refineFreeform, expandPrompt } from './interpret.js';
import { validate } from './validate.js';
import { hasApiKey } from './llm.js';

// buildFromPrompt(prompt, { compile, onStatus, signal, maxRepairs })
//   compile: ({source, files?}) => Promise<{ stl: Uint8Array, log: string }>
// returns { route, system?, params?, source, files, stl, spec, attempts, warnings, recognized }
export async function buildFromPrompt(prompt, { compile, onStatus, signal, maxRepairs = 3, forceAI = false } = {}) {
  onStatus && onStatus('Interpreting your idea…');
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
  onStatus && onStatus('Writing OpenSCAD…');
  let source = await authorFreeform(prompt, spec, { signal });
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
    if (attempt <= maxRepairs) source = await repairFreeform(source, lastDiag, attempt, { signal });
  }
  const err = new Error('Could not produce a valid model after ' + (maxRepairs + 1) + ' tries: ' + lastDiag);
  err.code = 'repair-exhausted';
  throw err;
}

// refine(request, { current, signal }) — conversational tweak of an existing model.
//   current = { freeform:true, source } | { freeform:false, model, params }
// Returns { freeform, params? , source? } — the caller applies it and lets the viewer re-render.
export async function refine(request, { current, signal } = {}) {
  if (current && current.freeform) return { freeform: true, source: await refineFreeform(current.source, request, { signal }) };
  return { freeform: false, params: await refineParams(current.model, current.params, request, { signal }) };
}
