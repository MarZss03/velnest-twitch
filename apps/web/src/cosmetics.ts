import * as THREE from 'three';
import type { CosmeticId } from '@velnest/shared';

/** Every item is authored in shared socket coordinates, never per-avatar offsets. */
export function attachCosmetic(model: THREE.Object3D, id: CosmeticId = 'none') {
  const slot = id === 'headphones' ? 'Head' : id === 'backpack' ? 'slot_back' : 'slot_hand_R';
  const parent = model.getObjectByName(slot);
  if (!parent || id === 'none') return;
  const item = new THREE.Group();
  item.name = `cosmetic_${id}`;
  const material = new THREE.MeshStandardMaterial({color: '#a6e2c5', roughness: .55});
  const add = (geometry: THREE.BufferGeometry, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x,y,z);
    mesh.castShadow = true;
    item.add(mesh);
    return mesh;
  };
  // Blender's authored joint-local frame is Z-up, including exported sockets.
  if (id === 'headphones') {
    const band=add(new THREE.TorusGeometry(.245,.018,8,24,Math.PI),0,0,.025);
    band.rotation.x=Math.PI/2;
    for(const x of [-.245,.245]) add(new THREE.SphereGeometry(.055,12,8),x,0,0).scale.set(.6,1,1.3);
  } else if (id === 'backpack') {
    add(new THREE.BoxGeometry(.20,.10,.24),0,.04,-.03);
  } else {
    const stick=add(new THREE.CylinderGeometry(.018,.018,.27,12),0,0,.10);
    stick.rotation.x=Math.PI/2;
    add(new THREE.SphereGeometry(.045,12,8),0,0,.25);
  }
  parent.add(item);
}
