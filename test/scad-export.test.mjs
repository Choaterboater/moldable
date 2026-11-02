import test from 'node:test';
import assert from 'node:assert/strict';
import { standaloneScad } from '../cad/scad-export.js';

test('SCAD bundling leaves self-contained source unchanged', async () => {
  assert.equal(await standaloneScad('cube(1);', []), 'cube(1);');
});
test('SCAD bundling preserves library notices and override order', async () => {
  const source = await standaloneScad('include <lib.scad>\nwidth=3;', [
    { name: 'lib.scad', contents: '// SPDX-License-Identifier: GPL-3.0-or-later\nwidth=1;\ncube(width);' },
  ]);
  assert.match(source, /SPDX-License-Identifier: GPL-3.0-or-later/);
  assert.ok(source.indexOf('width=1;') < source.indexOf('width=3;'));
  assert.doesNotMatch(source, /^\s*include\s*</m);
});
test('SCAD bundling reads declared URL files through its loader', async () => {
  const file = { name: 'lib.scad', url: 'libraries/lib.scad' };
  const result = await standaloneScad('include <lib.scad>; // dependency\ncube(1);', [file], async requested => {
    assert.equal(requested, file);
    return 'module helper() {}';
  });
  assert.match(result, /module helper\(\) \{\}/);
});
test('SCAD bundling expands nested declared includes', async () => {
  const result = await standaloneScad('include <outer.scad>', [
    { name: 'outer.scad', contents: 'include <inner.scad>\nsphere(2);' },
    { name: 'inner.scad', contents: 'cube(1);' },
  ]);
  assert.match(result, /cube\(1\);[\s\S]*sphere\(2\);/);
  assert.doesNotMatch(result, /^\s*include\s*</m);
});
test('SCAD bundling rejects missing libraries', async () => {
  await assert.rejects(standaloneScad('include <missing.scad>', []), /Missing SCAD library: missing.scad/);
});
test('SCAD bundling rejects cyclic includes', async () => {
  await assert.rejects(standaloneScad('include <loop.scad>', [
    { name: 'loop.scad', contents: 'include <loop.scad>' },
  ]), /Cyclic SCAD include: loop.scad/);
});
test('SCAD bundling refuses to change use semantics', async () => {
  await assert.rejects(standaloneScad('use <lib.scad>', [
    { name: 'lib.scad', contents: 'cube(1);' },
  ]), /Cannot inline use directive: lib.scad/);
});
