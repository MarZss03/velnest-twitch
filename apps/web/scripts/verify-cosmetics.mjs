import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {attachCosmetic} from '../src/cosmetics.ts';
import {dispose3D} from '../src/dispose3D.ts';

const assets=new Map();
for(const name of ['riff','arc','muse','props/headphones','props/backpack','props/lightstick']) assets.set(`/models/${name}.glb`,await readFile(new URL(`../public/models/${name}.glb`,import.meta.url)));
const hashes=Object.fromEntries([...assets].map(([name,bytes])=>[name,createHash('sha256').update(bytes).digest('hex')]));
const parse=bytes=>new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
let requestGate,requestArrived;
const server=createServer(async(req,res)=>{
  requestArrived?.();
  if(requestGate)await requestGate;
  const bytes=assets.get(req.url);
  if(!bytes){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':'model/gltf-binary'});res.end(bytes);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
THREE.DefaultLoadingManager.setURLModifier(url=>new URL(url,base).href);
// GLTFLoader's optional progress event is a DOM API absent in Node.
globalThis.ProgressEvent??=class ProgressEvent{constructor(type,values){this.type=type;Object.assign(this,values);}};

function visibleBounds(root){
  root.updateWorldMatrix(true,true);
  const inverse=root.matrixWorld.clone().invert(),box=new THREE.Box3();
  root.traverse(node=>{
    if(!node.isMesh)return;
    for(let parent=node;parent;parent=parent.parent)if(!parent.visible)return;
    node.geometry.computeBoundingBox();
    box.union(node.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,node.matrixWorld)));
  });
  assert.ok(!box.isEmpty(),'visible prop geometry is required');
  assert.ok([...box.min.toArray(),...box.max.toArray()].every(Number.isFinite),'prop bounds must remain finite');
  return box;
}
const reference=new Map(),materialReference=new Map();
for(const id of ['headphones','backpack','lightstick']){
  const gltf=await parse(assets.get(`/models/props/${id}.glb`));
  reference.set(id,visibleBounds(gltf.scene));
  gltf.scene.traverse(node=>{if(node.isMesh&&!materialReference.has(id))materialReference.set(id,{color:node.material.color.toArray(),roughness:node.material.roughness});});
  dispose3D(gltf.scene);
}
const summary={identities:3,cosmetics:4,clips:6,times:[0,.2,.5,1.2,1.9],poseSamples:0,slowLoadFallbacks:0,discardedLoadChecks:0,hashes};
try{
  for(const identity of ['riff','arc','muse']){
    const gltf=await parse(assets.get(`/models/${identity}.glb`));
    assert.deepEqual(gltf.animations.map(clip=>clip.name).sort(),['Idle','Walk','Wave','Cheer','Dance','Sit'].sort());
    const stage=new THREE.Scene();stage.add(gltf.scene);
    const mixer=new THREE.AnimationMixer(gltf.scene);
    for(const id of ['none','headphones','backpack','lightstick']){
      let item;
      if(id==='none')attachCosmetic(gltf.scene,id);
      else{
        let release;
        requestGate=new Promise(resolve=>{release=resolve;});
        const arrived=new Promise(resolve=>{requestArrived=resolve;});
        const loaded=new Promise((resolve,reject)=>{THREE.DefaultLoadingManager.onLoad=resolve;THREE.DefaultLoadingManager.onError=url=>reject(new Error(`Unexpected prop failure ${url}`));});
        attachCosmetic(gltf.scene,id);
        await arrived;
        item=gltf.scene.getObjectByName(`cosmetic_${id}`);
        assert.ok(item,'fallback must attach immediately');
        const before=visibleBounds(item),expected=reference.get(id);
        assert.ok(before.getCenter(new THREE.Vector3()).distanceTo(expected.getCenter(new THREE.Vector3()))<.015,`${identity}/${id}: fallback center must match authored Y-up coordinates`);
        assert.ok(before.getSize(new THREE.Vector3()).distanceTo(expected.getSize(new THREE.Vector3()))<.025,`${identity}/${id}: fallback envelope must match authored asset`);
        const expectedMaterial=materialReference.get(id);
        for(const mesh of item.children.filter(child=>child.isMesh)){
          assert.ok(mesh.material.color.toArray().every((value,index)=>Math.abs(value-expectedMaterial.color[index])<1e-5),'fallback color must match the authored material');
          assert.ok(Math.abs(mesh.material.roughness-expectedMaterial.roughness)<1e-5,'fallback roughness must match the authored material');
        }
        summary.slowLoadFallbacks++;
        release();await loaded;requestGate=null;requestArrived=null;
        assert.ok(item.children.some(child=>!child.isMesh),'authored prop replaces the visible fallback');
        assert.ok(item.children.filter(child=>child.isMesh).every(child=>!child.visible),'fallback meshes are hidden after load');
        const after=visibleBounds(item);
        assert.ok(after.getCenter(new THREE.Vector3()).distanceTo(expected.getCenter(new THREE.Vector3()))<.001);
      }
      for(const clip of gltf.animations){
        mixer.stopAllAction();mixer.clipAction(clip).reset().play();
        for(const time of summary.times){
          mixer.setTime(time);stage.updateMatrixWorld(true);
          if(item){
            const slot=gltf.scene.getObjectByName(id==='headphones'?'Head':id==='backpack'?'slot_back':'slot_hand_R');
            assert.equal(item.parent,slot,'all identities use the same socket, with no per-character correction');
            assert.ok(item.getWorldPosition(new THREE.Vector3()).distanceTo(slot.getWorldPosition(new THREE.Vector3()))<1e-6,'prop must follow its animated socket');
            assert.ok(item.getWorldQuaternion(new THREE.Quaternion()).normalize().angleTo(slot.getWorldQuaternion(new THREE.Quaternion()).normalize())<1e-6,'prop orientation must follow its animated socket');
            visibleBounds(item);
          }
          summary.poseSamples++;
        }
      }
      if(item){
        const geometries=new Set(),materials=new Set();item.traverse(node=>{if(node.isMesh){geometries.add(node.geometry);(Array.isArray(node.material)?node.material:[node.material]).forEach(mat=>materials.add(mat));}});
        let releasedGeometries=0,releasedMaterials=0;
        geometries.forEach(geometry=>geometry.addEventListener('dispose',()=>releasedGeometries++));
        materials.forEach(material=>material.addEventListener('dispose',()=>releasedMaterials++));
        attachCosmetic(gltf.scene,'none');
        assert.equal(item.parent,null);assert.equal(releasedGeometries,geometries.size);assert.equal(releasedMaterials,materials.size,'shared fallback materials are disposed once');
      }
    }
    // A response arriving after an immediate switch must never resurrect an item.
    let release;requestGate=new Promise(resolve=>{release=resolve;});
    const arrived=new Promise(resolve=>{requestArrived=resolve;});
    const finished=new Promise(resolve=>{THREE.DefaultLoadingManager.onLoad=resolve;});
    attachCosmetic(gltf.scene,'lightstick');await arrived;attachCosmetic(gltf.scene,'none');release();await finished;
    assert.ok(!gltf.scene.getObjectByName('cosmetic_lightstick'));summary.discardedLoadChecks++;
    requestGate=null;requestArrived=null;mixer.stopAllAction();dispose3D(stage);
    console.log(`PASS ${identity}: four cosmetics × six clips × five samples; authored/fallback alignment and replacement cleanup`);
  }
  assert.equal(summary.poseSamples,360);
  const report=process.argv.find(arg=>arg.startsWith('--report='));
  if(report){const path=resolve(fileURLToPath(new URL('../../../',import.meta.url)),report.slice(9));await mkdir(dirname(path),{recursive:true});await writeFile(path,JSON.stringify(summary,null,2)+'\n');}
}finally{
  THREE.DefaultLoadingManager.setURLModifier(undefined);THREE.DefaultLoadingManager.onLoad=()=>{};THREE.DefaultLoadingManager.onError=()=>{};
  await new Promise(resolve=>server.close(resolve));
}
