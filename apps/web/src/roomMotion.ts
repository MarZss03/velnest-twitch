import * as THREE from 'three';

type Cue = { group: THREE.Group; age: number; duration: number; kind: 'arrival' | 'target' | 'wave' | 'cheer' | 'dance' };

/** Short, event-driven effects. Geometry is shared; at most 16 cues exist. */
export function createRoomMotion(scene: THREE.Scene) {
  const ring = new THREE.RingGeometry(.46, .49, 48);
  const chip = new THREE.PlaneGeometry(.065, .13);
  const cues: Cue[] = [];
  const release = (cue: Cue) => {
    cue.group.removeFromParent();
    cue.group.children.forEach(child => {
      if (child instanceof THREE.Mesh) (child.material as THREE.Material).dispose();
    });
  };
  return {
    emit(kind: Cue['kind'], position: THREE.Vector3, color: string, reduced: boolean) {
      // Keep the destination confirmation, even when spatial effects are disabled.
      if (reduced && kind !== 'target') return;
      if (cues.length >= 16) release(cues.shift()!);
      const group = new THREE.Group();
      group.position.copy(position);
      group.position.y += .035;
      const count = kind === 'cheer' ? 18 : kind === 'dance' ? 3 : 1;
      for (let i = 0; i < count; i++) {
        const confetti = kind === 'cheer';
        const mesh = new THREE.Mesh(confetti ? chip : ring, new THREE.MeshBasicMaterial({
          color: confetti && i % 3 === 0 ? '#c7efdf' : color,
          transparent: true, opacity: .85, side: THREE.DoubleSide, depthWrite: false,
        }));
        if (!confetti) mesh.rotation.x = -Math.PI / 2;
        group.add(mesh);
      }
      scene.add(group);
      cues.push({ group, kind, age: 0, duration: reduced ? .4 : kind === 'dance' ? 1.6 : kind === 'target' ? .65 : 1.15 });
    },
    update(dt: number, reduced: boolean) {
      for (let n = cues.length - 1; n >= 0; n--) {
        const cue = cues[n];
        cue.age += dt;
        if (cue.age >= cue.duration || (reduced && cue.kind !== 'target')) {
          release(cue); cues.splice(n, 1); continue;
        }
        const t = cue.age / cue.duration;
        cue.group.children.forEach((child, i) => {
          const mesh = child as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
          mesh.material.opacity = .85 * (1 - t);
          if (reduced) return;
          if (cue.kind === 'cheer') {
            const angle = i * 2.39996;
            const spread = (.3 + (i % 4) * .12) * t;
            mesh.position.set(Math.cos(angle) * spread, .9 + 2.4 * t - 2 * t * t, Math.sin(angle) * spread);
            mesh.rotation.set(t * (i % 3 + 2), angle + t * 4, t * 3);
          } else if (cue.kind === 'dance') {
            const phase = (t * 1.7 + i / 3) % 1;
            mesh.scale.setScalar(.7 + phase * 1.4);
            mesh.material.opacity = .6 * (1 - phase) * Math.min(1, (1 - t) * 5);
          } else {
            mesh.scale.setScalar(.4 + (1 - Math.pow(1 - t, 3)) * (cue.kind === 'target' ? .4 : 1.4));
            if (cue.kind === 'wave') mesh.position.y = .1 + t * .9;
          }
        });
      }
    },
    dispose() { cues.forEach(release); cues.length = 0; ring.dispose(); chip.dispose(); },
  };
}
