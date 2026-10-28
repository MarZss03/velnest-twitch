import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

for(const identity of ['riff','arc','muse']) {
  const bytes=await readFile(new URL(`../public/models/${identity}.glb`,import.meta.url));
  const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const mixer=new THREE.AnimationMixer(gltf.scene);
  const sample=(name,time)=>{
    mixer.stopAllAction();
    const clip=gltf.animations.find(clip=>clip.name===name);
    assert.ok(clip,`${identity}: missing ${name}`);
    mixer.clipAction(clip).reset().play();
    mixer.setTime(time);
    return Object.fromEntries(['Root','Arm_L','Arm_R','Leg_L','Leg_R'].map(name=>{
      const node=gltf.scene.getObjectByName(name);
      return [name,{q:node.quaternion.clone(),p:node.position.clone()}];
    }));
  };
  const idle=sample('Idle',.5);
  const cheer=sample('Cheer',.5);
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
