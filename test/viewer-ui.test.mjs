import test from 'node:test';
import assert from 'node:assert/strict';
import { createUi, html } from './helpers/otto-ui.mjs';

// Result-screen navigation and layout bindings (Moldable.dc.html).
test('Mouse wheel notch zooms ~14% and the reverse notch undoes it', async () => {
  const { ui } = await createUi();
  const zin = ui._wheelZoomFactor(-100, 0, false), zout = ui._wheelZoomFactor(100, 0, false);
  assert.ok(zin > 0.8 && zin < 0.9, String(zin));
  assert.ok(Math.abs(zin * zout - 1) < 1e-9);
});
test('Trackpad-sized scroll deltas zoom in small steps', async () => {
  const { ui } = await createUi();
  const f = ui._wheelZoomFactor(-3, 0, false);
  assert.ok(f < 1 && f > 0.99, String(f));
});
test('Line-mode wheels match pixel-mode wheels; pinch is stronger; steps are clamped', async () => {
  const { ui } = await createUi();
  assert.equal(ui._wheelZoomFactor(-3, 1, false), ui._wheelZoomFactor(-48, 0, false));
  assert.ok(ui._wheelZoomFactor(-10, 0, true) < ui._wheelZoomFactor(-10, 0, false));
  assert.equal(ui._wheelZoomFactor(-1e6, 0, false), 0.5);
  assert.equal(ui._wheelZoomFactor(1e6, 0, false), 2);
});
test('Zoom limits follow the model size', async () => {
  const { ui } = await createUi();
  const small = ui._zoomLimits(20), big = ui._zoomLimits(500);
  assert.ok(small.min < big.min && small.max <= big.max);
  assert.ok(small.min < 2, 'small parts can be inspected up close');
  assert.ok(big.max >= 500 * 10, 'large models can be zoomed out to see whole');
});
test('Viewer buttons and hint are bound', async () => {
  const { ui } = await createUi();
  const v = ui.renderVals();
  for (const k of ['zoomIn', 'zoomOut', 'fitView', 'resetView', 'viewFront', 'viewTop']) assert.equal(typeof v[k], 'function', k);
  assert.match(v.viewerHint, /zoom/);
  for (const label of ['Zoom in', 'Zoom out', 'Fit model in view']) assert.equal((html.match(new RegExp(`aria-label="${label}"`, 'g')) || []).length, 2, label);
});
test('Model type dropdown lists exactly the model types, in both layouts', async () => {
  const { ui } = await createUi();
  const types = ui.renderVals().typeList.map(t => [t.key, t.label]);
  const selects = html.match(/<select[^>]*mw-select[^>]*>[\s\S]*?<\/select>/g);
  assert.equal(selects.length, 2);
  for (const sel of selects) {
    const opts = [...sel.matchAll(/<option value="([^"]*)"[^>]*>([^<]*)<\/option>/g)].map(m => [m[1], m[2]]).filter(([k]) => k);
    assert.deepEqual(opts, types);
  }
});
test('Model type dropdown follows and changes the model', async () => {
  const { ui } = await createUi();
  ui.loadGallery({ model: 'otto', name: 'Otto Robot', params: {} });
  assert.equal(ui.renderVals().modelTypeValue, 'otto');
  ui.renderVals().onTypeChange({ target: { value: 'vase' } });
  assert.equal(ui.state.model, 'vase');
  ui.setState({ freeform: true });
  assert.equal(ui.renderVals().modelTypeValue, '');
});
test('Otto sliders are grouped into Shape, Details and Fit', async () => {
  const { ui } = await createUi();
  ui.loadGallery({ model: 'otto', name: 'Otto Robot', params: {} });
  const heads = ui.renderVals().paramList.filter(p => p.heading).map(p => [p.key, p.heading]);
  assert.deepEqual(heads, [['headStyle', 'Shape'], ['ears', 'Details'], ['clearance', 'Fit']]);
});
test('Non-Otto sliders have no group headings', async () => {
  const { ui } = await createUi();
  ui.loadGallery({ model: 'vase', name: 'Vase', params: {} });
  assert.ok(ui.renderVals().paramList.length > 0);
  assert.ok(ui.renderVals().paramList.every(p => !p.heading));
});
