import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { dispose3D } from './dispose3D';
import type { CosmeticId } from '@velnest/shared';

/** Every item is authored in shared socket coordinates, never per-avatar offsets. */
export function attachCosmetic(model: THREE.Object3D, id: CosmeticId = 'none') {
  const oldItems: THREE.Object3D[]=[];
  model.traverse(obj => { if (obj.name.startsWith('cosmetic_')) oldItems.push(obj); });
  oldItems.forEach(obj => {
    obj.visible=false;
    obj.removeFromParent();
    dispose3D(obj);
  });
  const slot = id === 'headphones' ? 'Head' : id === 'backpack' ? 'slot_back' : 'slot_hand_R';
  const parent = model.getObjectByName(slot);
  if (!parent || id === 'none') return;
  const item = new THREE.Group();
  item.name = `cosmetic_${id}`;
  parent.add(item);
  new GLTFLoader().load(`/models/props/${id}.glb`, gltf => {
    if (!item.visible || !item.parent || !model.parent || model.userData.disposed) {
      dispose3D(gltf.scene);
      return;
    }
    // Both avatar joints and exported props already use glTF's Y-up frame.
    gltf.scene.rotation.x=0;
    item.add(gltf.scene);
    item.children.filter(child=>child!==gltf.scene).forEach(child=>{child.visible=false;});
  },undefined,()=>{ /* Keep the geometric fallback if the authored asset cannot load. */ });
  const material = new THREE.MeshStandardMaterial({color: new THREE.Color(.35,.78,.62), roughness: .72});
  const add = (geometry: THREE.BufferGeometry, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x,y,z);
    mesh.castShadow = true;
    item.add(mesh);
    return mesh;
  };
  // Match the authored GLBs in glTF's Y-up local frame while they load.
  if (id === 'headphones') {
    add(new THREE.TorusGeometry(.245,.018,8,24,Math.PI),0,0,0);
    for(const x of [-.245,.245]) add(new THREE.SphereGeometry(1,12,8),x,0,0).scale.set(.035,.075,.065);
  } else if (id === 'backpack') {
    add(new THREE.SphereGeometry(1,12,8),0,-.03,-.055).scale.set(.12,.15,.075);
    add(new THREE.SphereGeometry(1,12,8),0,-.07,-.12).scale.set(.09,.06,.025);
  } else {
    add(new THREE.CylinderGeometry(.022,.022,.30,12),0,.12,0);
    add(new THREE.SphereGeometry(.04,12,8),0,.28,0);
  }
}
