// Otto-specific template metadata and portable exports. No DOM or engine.
export const OTTO_MODEL = { label: 'Otto Robot', cat: 'Robots', tags: ['otto', 'robot', 'biped', 'arduino', 'nano', 'parametric'], params: [
  { key: 'part', label: 'Part (0 Head · 1 Body · 2 Leg L · 3 Leg R · 4 Foot L · 5 Foot R · 6 Whole plate · 7 Assembled view · 8 Back cover)', min: 0, max: 8, step: 1, def: 7, unit: '' },
  { key: 'headStyle', label: 'Head (0 Cube · 1 Rounded · 2 Bevel · 3 Dome)', min: 0, max: 3, step: 1, def: 1, unit: '' },
  { key: 'corner', label: 'Corner radius', min: 0, max: 12, step: 1, def: 4, unit: 'mm' },
  { key: 'grow', label: 'Shell growth', min: 0, max: 10, step: 1, def: 0, unit: 'mm' },
  { key: 'ears', label: 'Ears (0 None · 1 Round · 2 Cat · 3 Bear)', min: 0, max: 3, step: 1, def: 0, unit: '' },
  { key: 'antenna', label: 'Antenna height', min: 0, max: 30, step: 1, def: 0, unit: 'mm' },
  { key: 'hat', label: 'Hat (0 None · 1 Cap · 2 Top hat · 3 Helmet)', min: 0, max: 3, step: 1, def: 0, unit: '' },
  { key: 'mouth', label: 'Mouth (0 Classic nose · 1 OLED, taller head · 2 Grille)', min: 0, max: 2, step: 1, def: 0, unit: '' },
  { key: 'feet', label: 'Feet (0 Classic · 1 Boot · 2 Wide stable)', min: 0, max: 2, step: 1, def: 0, unit: '' },
  { key: 'clearance', label: 'Fit clearance (extra room around hardware)', min: 0.1, max: 0.5, step: 0.05, def: 0.25, unit: 'mm' },
] };
export const OTTO_PRESETS = [
  { name: 'Classic Otto', model: 'otto', color: '#5b8fb0', params: { headStyle: 0 } },
  { name: 'Rounded Otto', model: 'otto', color: '#7d9b76', params: { headStyle: 1 } },
  { name: 'Cat-ear Otto', model: 'otto', color: '#e0653f', params: { headStyle: 1, ears: 2 } },
];
export const OTTO_FILES = ['otto_fit.scad', 'otto_core.scad', 'otto_shells.scad'].map(name => ({
  name: 'otto/' + name, url: 'libraries/otto/' + name,
}));
export const OTTO_NOTICE = `// SPDX-License-Identifier: CC-BY-SA-4.0
// Otto DIY / Camilo Parra Palacio and the Otto DIY team: https://www.ottodiy.com
// Moldable remix: newly authored prototype core and styled shells; NOT V13 fit-certified.
// Reference CAD: https://www.printables.com/model/31955
// Modular styling reference: Martin Perdeaux https://www.printables.com/model/230575
// License: https://creativecommons.org/licenses/by-sa/4.0/
// Purchased hardware dimensions and physical fit remain UNVERIFIED.
`;
export const OTTO_FIT_MESSAGE = 'Otto prototype: hardware fit is unverified. Print the four fit tests before the full robot.';
export const OTTO_OVERFLOW = 'Otto plate exceeds the selected printer volume — print parts one at a time.';
export const OTTO_STL_CREDIT = 'Otto DIY / Moldable remix | CC-BY-SA-4.0 | https://www.ottodiy.com';

// Binary STL provides an 80-byte descriptive header. Never alter triangles.
export function creditOttoStl(stl) {
  const out = new Uint8Array(stl);
  out.fill(0, 0, 80);
  out.set(new TextEncoder().encode(OTTO_STL_CREDIT), 0);
  return out;
}
// Keep runtime libraries readable/separate, but make downloaded SCAD portable.
export async function standaloneOttoScad(source, files, readContents) {
  const chunks = [];
  for (const expected of OTTO_FILES) {
    const file = files.find(f => f.name === expected.name);
    if (!file) throw new Error('Missing Otto library: ' + expected.name);
    const text = file.contents ?? await readContents(file);
    chunks.push(text.replace(/^\s*(?:use|include)\s*<[^>]+>\s*;?\s*$/gm, ''));
  }
  return OTTO_NOTICE + chunks.join('\n') + '\n' + source.replace(/^\s*(?:use|include)\s*<otto\/[^>]+>\s*;?\s*$/gm, '');
}
