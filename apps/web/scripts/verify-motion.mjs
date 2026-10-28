import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createRoomMotion } from '../src/roomMotion.ts';

const scene = new THREE.Scene();
const motion = createRoomMotion(scene);
const position = new THREE.Vector3(1, .2, -1);
for (const kind of ['arrival','target','wave','cheer','dance']) motion.emit(kind, position, '#b99af5', false);
for (let frame = 0; frame < 120; frame++) {
  motion.update(1 / 60, false);
  scene.traverse(object => {
    assert.ok([...object.position, ...object.scale].every(Number.isFinite));
    if (object.isMesh) assert.ok(object.material.opacity >= 0 && object.material.opacity <= 1);
  });
}
assert.equal(scene.children.length, 0, 'all bursts must expire');
for (let i = 0; i < 100; i++) motion.emit('cheer', position, '#b99af5', false);
assert.equal(scene.children.length, 16, 'rapid reactions remain bounded');
motion.update(.01, true);
assert.equal(scene.children.length, 0, 'changing to reduced motion removes moving cues');
motion.emit('target', position, '#b99af5', true);
const marker = scene.children[0].children[0];
motion.update(.1, true);
assert.equal(marker.scale.x, 1, 'reduced-motion confirmation stays stationary');
motion.dispose();
assert.equal(scene.children.length, 0, 'room unmount removes all effects');
console.log('PASS motion: finite transforms, expiry, burst cap, reduced motion and cleanup');
