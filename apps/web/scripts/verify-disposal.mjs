import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as THREE from 'three';
import {dispose3D} from '../src/dispose3D.ts';

test('leaving a textured room releases shared GPU resources exactly once',()=>{
 const scene=new THREE.Scene();
 const texture=new THREE.Texture();
 const geometry=new THREE.BoxGeometry();
 const material=new THREE.MeshStandardMaterial({map:texture,normalMap:texture});
 scene.add(new THREE.Mesh(geometry,material),new THREE.Mesh(geometry,[material,material]));
 const counts={texture:0,geometry:0,material:0};
 texture.addEventListener('dispose',()=>counts.texture++);
 geometry.addEventListener('dispose',()=>counts.geometry++);
 material.addEventListener('dispose',()=>counts.material++);
 dispose3D(scene);
 assert.deepEqual(counts,{texture:1,geometry:1,material:1});
 scene.traverse(node=>assert.equal(node.userData.disposed,true));
});
