import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../../../',import.meta.url);
const bytes=await readFile(new URL('apps/web/public/models/afterparty.glb',root));
const jsonLength=bytes.readUInt32LE(12);
const gltf=JSON.parse(bytes.subarray(20,20+jsonLength).toString());
const manifest=JSON.parse(await readFile(new URL('art/blender/night-lounge-manifest.json',root),'utf8'));

test('night lounge fits the self-hosted web asset and geometry budgets',()=>{
 assert.equal(bytes.subarray(0,4).toString(),'glTF');
 assert.ok(bytes.length<3_000_000,`room is ${bytes.length} bytes`);
 assert.ok(gltf.extensionsRequired.includes('KHR_draco_mesh_compression'));
 const primitives=gltf.meshes.flatMap(mesh=>mesh.primitives);
 const triangles=primitives.reduce((sum,p)=>sum+gltf.accessors[p.indices].count/3,0);
 assert.ok(triangles<180_000 && triangles>50_000,`triangles: ${triangles}`);
 assert.ok(primitives.length<=24,`room draw batches: ${primitives.length}`);
 assert.equal(manifest.bytes,bytes.length);
 assert.equal(manifest.triangles,triangles);
 assert.ok(gltf.images.length>=8,'furniture must retain its real PBR textures');
 assert.ok(gltf.images.every(image=>Number.isInteger(image.bufferView)&&!image.uri),'textures must be embedded');
 for(const name of ['Neon violet','Neon glacier','Warm task light']) {
  const material=gltf.materials.find(m=>m.name===name);
  assert.ok(material?.emissiveFactor?.some(value=>value>0));
  assert.ok(material.extensions?.KHR_materials_emissive_strength?.emissiveStrength>=2);
 }
});

test('every downloaded CC0 source matches its recorded authoring checksum',async()=>{
 for(const asset of manifest.source_assets){
  const folder=new URL(`art/vendor/polyhaven/${asset}/`,root);
  const source=JSON.parse(await readFile(new URL('source.json',folder),'utf8'));
  assert.equal(source.license,'CC0-1.0');assert.ok(Object.keys(source.authors).length);
  assert.equal(source.source,`https://polyhaven.com/a/${asset}`);
  for(const file of source.files){
   const original=await readFile(new URL(file.file,folder));
   assert.equal(createHash('sha256').update(original).digest('hex'),file.sha256);
  }
 }
});

test('local Draco decoder and both executable fallbacks are present',async()=>{
 const folder=new URL('apps/web/public/vendor/draco/',root);
 const wasm=await readFile(new URL('draco_decoder.wasm',folder));
 assert.deepEqual([...wasm.subarray(0,4)],[0,97,115,109]);
 for(const name of ['draco_wasm_wrapper.js','draco_decoder.js','LICENSE.txt'])assert.ok((await readFile(new URL(name,folder))).length>1000);
});
