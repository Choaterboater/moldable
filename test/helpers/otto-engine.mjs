import OpenSCAD from '../../cad/openscad.js';
import { readFileSync } from 'node:fs';
import { generate } from '../../cad/scad-gen.js';
import { inspectStl } from '../../cad/validate.js';
import { SIN45 } from '../../cad/overhang.js';
const wasmBinary = readFileSync(new URL('../../cad/openscad.wasm', import.meta.url));
const cache = new Map();
export function contents(file) { return file.contents ?? readFileSync(new URL('../../cad/' + file.url, import.meta.url), 'utf8'); }
export async function compile(source, files = []) {
  const log = [];
  const inst = await OpenSCAD({ noInitialRun: true, wasmBinary, print: s => log.push(s), printErr: s => log.push(s) });
  for (const f of files) {
    const path = '/' + f.name;
    inst.FS.mkdirTree(path.slice(0,path.lastIndexOf('/')) || '/');
    inst.FS.writeFile(path, contents(f));
  }
  inst.FS.writeFile('/in.scad', source);
  let rc;
  try { rc = inst.callMain(['/in.scad','--backend=manifold','--export-format=binstl','-o','/out.stl']); }
  catch(e) { throw new Error(e.message + '\n' + log.join('\n')); }
  let stl = null;
  try { stl = inst.FS.readFile('/out.stl'); } catch { /* empty intersection */ }
  return { rc, stl, log: log.join('\n'), info: stl ? inspectStl(stl) : null };
}
export function compiledPart(params) {
  const g = generate('otto', params);
  if (!cache.has(g.source)) cache.set(g.source, compile(g.source, g.files));
  return cache.get(g.source);
}
export function supportFaces(stl) {
  const dv = new DataView(stl.buffer, stl.byteOffset, stl.byteLength);
  const count = dv.getUint32(80,true);
  let unsupported = 0;
  for(let t=0;t<count;t++) {
    const off=84+t*50;
    const nz=dv.getFloat32(off+8,true);
    const zs=[dv.getFloat32(off+20,true),dv.getFloat32(off+32,true),dv.getFloat32(off+44,true)];
    // Bed contact faces are supported by the plate, not an overhang.
    if(nz < -SIN45-0.0001 && Math.max(...zs)>0.05) unsupported++;
  }
  return unsupported;
}
