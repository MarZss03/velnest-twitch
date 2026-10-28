import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { AvatarId, CosmeticId } from '@velnest/shared';
import { attachCosmetic } from './cosmetics';

export function AvatarPreview({ avatarId, cosmetic = 'none' }: { avatarId: AvatarId; cosmetic?: CosmeticId }) {
  const host = useRef<HTMLDivElement>(null);
  const play = useRef<(name: string) => void>(() => {});
  const [status, setStatus] = useState('Loading character…');
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let frame = 0;
    let mixer: THREE.AnimationMixer | undefined;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, .01, 20);
    camera.position.set(1.1, .9, 2.3);
    camera.lookAt(0, .55, 0);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x74677f, 2.2));
    const light = new THREE.DirectionalLight(0xffe4ce, 3);
    light.position.set(2, 4, 3);
    scene.add(light);
    const resize = new ResizeObserver(() => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    });
    resize.observe(el);
    setStatus('Loading character…');
    new GLTFLoader().load(`/models/${avatarId}.glb`, gltf => {
      if (disposed) return;
      scene.add(gltf.scene);
      attachCosmetic(gltf.scene, cosmetic);
      mixer = new THREE.AnimationMixer(gltf.scene);
      play.current = name => {
        mixer?.stopAllAction();
        const clip = gltf.animations.find(a => a.name.toLowerCase() === name.toLowerCase());
        if (clip && !matchMedia('(prefers-reduced-motion: reduce)').matches) mixer?.clipAction(clip).reset().play();
      };
      play.current('Idle');
      setStatus('Drag to turn. Choose an action.');
    }, undefined, () => setStatus('Could not load character. Select another to retry.'));
    let previous = performance.now();
    const render = (now: number) => {
      mixer?.update(Math.min((now - previous) / 1000, .05));
      previous = now;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    let pointerX: number | null = null;
    const down = (e: PointerEvent) => { pointerX = e.clientX; renderer.domElement.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => { if (pointerX !== null) { scene.rotation.y += (e.clientX - pointerX) * .012; pointerX = e.clientX; } };
    const up = () => { pointerX = null; };
    renderer.domElement.addEventListener('pointerdown', down);
    renderer.domElement.addEventListener('pointermove', move);
    renderer.domElement.addEventListener('pointerup', up);
    renderer.domElement.addEventListener('pointercancel', up);
    return () => {
      disposed = true;
      play.current = () => {};
      cancelAnimationFrame(frame);
      resize.disconnect();
      mixer?.stopAllAction();
      scene.traverse(obj => { if (obj instanceof THREE.Mesh) { obj.geometry.dispose(); const mats = Array.isArray(obj.material) ? obj.material : [obj.material]; mats.forEach(m => m.dispose()); } });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [avatarId, cosmetic]);
  return <section className="character-preview" aria-label={`${avatarId} 3D preview`}>
    <div ref={host} className="character-canvas" />
    <p role="status">{status}</p>
    <div className="preview-actions">{['Idle', 'Walk', 'Wave', 'Cheer', 'Dance'].map(name => <button key={name} type="button" onClick={() => play.current(name)}>{name}</button>)}</div>
  </section>;
}
