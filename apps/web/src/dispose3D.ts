import * as THREE from 'three';

export function dispose3D(root: THREE.Object3D) {
  const geometries=new Set<THREE.BufferGeometry>();
  const materials=new Set<THREE.Material>();
  const skeletons=new Set<THREE.Skeleton>();
  root.traverse(node=>{
    node.userData.disposed=true;
    if(node instanceof THREE.Mesh) {
      geometries.add(node.geometry);
      (Array.isArray(node.material)?node.material:[node.material]).forEach(material=>materials.add(material));
    }
    if(node instanceof THREE.SkinnedMesh) skeletons.add(node.skeleton);
  });
  geometries.forEach(geometry=>geometry.dispose());
  materials.forEach(material=>material.dispose());
  skeletons.forEach(skeleton=>skeleton.dispose());
}
