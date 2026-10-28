import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

for(const identity of ['riff','arc','muse']) {
  const bytes=await readFile(new URL(`../public/models/${identity}.glb`,import.meta.url));
  const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const mixer=new THREE.AnimationMixer(gltf.scene);
  const skinned=[];
  gltf.scene.traverse(node=>{if(node.isSkinnedMesh)skinned.push(node);});
  assert.ok(skinned.length>0,`${identity}: standard skinned meshes required`);
  const sample=(name,time)=>{
    mixer.stopAllAction();
    const clip=gltf.animations.find(clip=>clip.name===name);
    assert.ok(clip,`${identity}: missing ${name}`);
    mixer.clipAction(clip).reset().play();
    mixer.setTime(time);
    gltf.scene.updateMatrixWorld(true);
    for(const mesh of skinned){
      mesh.skeleton.update();
      const vertex=new THREE.Vector3();
      mesh.getVertexPosition(0,vertex);
      assert.ok(Number.isFinite(vertex.x+vertex.y+vertex.z),'Skin deformation must stay finite');
    }
    return Object.fromEntries(['Root','Arm_L','Arm_R','Leg_L','Leg_R'].map(name=>{
      const node=gltf.scene.getObjectByName(name);
      return [name,{q:node.quaternion.clone(),p:node.position.clone()}];
    }));
  };
  const idle=sample('Idle',.5);
  const cheer=sample('Cheer',.5);
  const bone=gltf.scene.getObjectByName('bone_Arm_L');
  assert.ok(bone?.isBone, 'Deforming arm bone must exist');
  const control=gltf.scene.getObjectByName('Arm_L');
  const skeleton=skinned.find(mesh=>mesh.skeleton.bones.includes(bone)).skeleton;
  const skinMatrix=new THREE.Matrix4().multiplyMatrices(bone.matrixWorld,skeleton.boneInverses[skeleton.bones.indexOf(bone)]);
  const boneWorld=new THREE.Quaternion();
  skinMatrix.decompose(new THREE.Vector3(),boneWorld,new THREE.Vector3());
  const controlWorld=control.getWorldQuaternion(new THREE.Quaternion());
  assert.ok(boneWorld.angleTo(controlWorld)<.001,'Baked skin bone must match the world-space animation control');
  assert.ok(cheer.Arm_L.q.angleTo(idle.Arm_L.q)>1,'Cheer must raise left arm');
  assert.ok(cheer.Arm_R.q.angleTo(idle.Arm_R.q)>1,'Cheer must raise right arm');
  assert.ok(cheer.Root.p.y>idle.Root.p.y+.05,'Cheer must jump');
  const a=sample('Wave',.2),b=sample('Wave',.6);
  assert.ok(a.Arm_R.q.angleTo(b.Arm_R.q)>.1,'Wave arm must move');
  const walkA=sample('Walk',.15),walkB=sample('Walk',.65);
  assert.ok(walkA.Leg_L.q.angleTo(walkB.Leg_L.q)>.2,'Walk legs must stride');
  assert.ok(sample('Dance',.3).Arm_L.q.angleTo(idle.Arm_L.q)>.05,'Dance must move arms');
  const restored=sample('Idle',.5);
  assert.ok(restored.Arm_L.q.angleTo(idle.Arm_L.q)<.001,'Idle must restore the left arm');
  assert.ok(restored.Root.p.distanceTo(idle.Root.p)<.001,'Idle must restore root height');
  console.log(`PASS ${identity}: five clips, raised arms, jump, wave, stride, dance and idle restoration`);
}
