import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { Participant } from '@velnest/shared';
import { attachCosmetic } from './cosmetics';

type Actor = { model: THREE.Group; mixer: THREE.AnimationMixer; clips: THREE.AnimationClip[]; target: THREE.Vector3; action: string; nonce: number; label: HTMLSpanElement; cosmetic: string };

export function Room3D({ participants }: { participants: Participant[] }) {
  const host = useRef<HTMLDivElement>(null);
  const people = useRef(participants);
  people.current = participants;
  const [error, setError] = useState('');
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); }
    catch { setError('3D is unavailable in this browser. Enable hardware acceleration and reload.'); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#252127');
    const camera = new THREE.PerspectiveCamera(38, 1, .1, 60);
    camera.position.set(0, 7, 10);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xfff4e7, 0x524261, 2.5));
    const key = new THREE.DirectionalLight(0xffdfb0, 3);
    key.position.set(-3, 8, 4);
    key.castShadow = true;
    key.shadow.camera.left = key.shadow.camera.bottom = -7;
    key.shadow.camera.right = key.shadow.camera.top = 7;
    key.shadow.mapSize.set(1024,1024);
    scene.add(key);
    const box = (name: string, size: number[], pos: number[], color: string) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size as [number,number,number]), new THREE.MeshStandardMaterial({color, roughness: .8}));
      mesh.name = name;
      mesh.position.set(...pos as [number,number,number]);
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      scene.add(mesh);
    };
    box('Floor',[10,.2,7],[0,-.15,0],'#4a4052');
    box('Back wall',[10,2,.2],[0,.8,-3.5],'#332d39');
    box('Sofa seat',[2.7,.35,.85],[-2,.25,-1.8],'#8e70ad');
    box('Sofa back',[2.7,.65,.2],[-2,.65,-2.2],'#8e70ad');
    box('Stage',[2.4,.25,1.7],[2,.05,-1.8],'#796583');
    box('Screen',[1.8,1,.12],[2,1.25,-3.32],'#bca0e3');
    box('Table',[1.2,.12,.7],[-1.5,.5,.1],'#d7b68d');
    box('Table leg',[.15,.5,.15],[-1.5,.2,.1],'#d7b68d');
    const actors = new Map<string,Actor>();
    const pending = new Set<string>();
    const failed = new Set<string>();
    const loader = new GLTFLoader();
    let disposed = false;
    let frame = 0;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const disposeModel = (model: THREE.Object3D) => model.traverse(obj => {
      if (obj instanceof THREE.Mesh) { obj.geometry.dispose(); const mats = Array.isArray(obj.material) ? obj.material : [obj.material]; mats.forEach(m => m.dispose()); }
    });
    const resize = new ResizeObserver(() => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / Math.max(1,el.clientHeight);
      camera.position.z = camera.aspect < 1 ? 16 : 10;
      camera.updateProjectionMatrix();
    });
    resize.observe(el);
    let last = performance.now();
    const render = (now: number) => {
      const dt = Math.min((now-last)/1000,.05);
      last = now;
      const ids = new Set(people.current.map(p=>p.id));
      actors.forEach((actor,id) => { if (!ids.has(id)) { scene.remove(actor.model); actor.mixer.stopAllAction(); disposeModel(actor.model); actor.label.remove(); actors.delete(id); } });
      for (const p of people.current) {
        let actor = actors.get(p.id);
        if (!actor && !pending.has(p.id) && !failed.has(p.id)) {
          pending.add(p.id);
          loader.load(`/models/${p.avatarId}.glb`, gltf => {
            pending.delete(p.id);
            if (disposed || !people.current.some(person=>person.id===p.id)) { disposeModel(gltf.scene); return; }
            const label = document.createElement('span');
            label.className='room-nameplate';
            label.textContent=p.displayName;
            el.appendChild(label);
            gltf.scene.traverse(obj=>{ if(obj instanceof THREE.Mesh) obj.castShadow=true; });
            gltf.scene.rotation.y=0;
            gltf.scene.position.set((p.x-50)/12,0,(p.y-50)/16);
            scene.add(gltf.scene);
            attachCosmetic(gltf.scene,p.cosmetic);
            actors.set(p.id,{model:gltf.scene,mixer:new THREE.AnimationMixer(gltf.scene),clips:gltf.animations,target:new THREE.Vector3(),action:'',nonce:-1,label,cosmetic:p.cosmetic});
          },undefined,()=>{ pending.delete(p.id); failed.add(p.id); setError('A character could not load. Reload the room to retry.'); });
        }
        actor = actors.get(p.id);
        if (!actor) continue;
        if(actor.cosmetic!==p.cosmetic) { attachCosmetic(actor.model,p.cosmetic); actor.cosmetic=p.cosmetic; }
        actor.target.set((p.x-50)/12,0,(p.y-50)/16);
        const delta=actor.target.clone().sub(actor.model.position);
        const walking=delta.lengthSq()>.0004;
        if(walking) actor.model.rotation.y=Math.atan2(delta.x,delta.z);
        actor.model.position.lerp(actor.target,reduced.matches?1:1-Math.exp(-dt*14));
        const action=p.action??(walking?'walk':'idle');
        if(actor.action!==action || actor.nonce!==p.actionNonce) {
          actor.action=action; actor.nonce=p.actionNonce;
          actor.mixer.stopAllAction();
          const clip=actor.clips.find(c=>c.name.toLowerCase()===action);
          if(clip && !reduced.matches) actor.mixer.clipAction(clip).reset().play();
        }
        if(!reduced.matches) actor.mixer.update(dt);
        const screen=actor.model.position.clone().add(new THREE.Vector3(0,1.2,0)).project(camera);
        actor.label.style.transform=`translate(-50%,-100%) translate(${(screen.x*.5+.5)*el.clientWidth}px,${(-screen.y*.5+.5)*el.clientHeight}px)`;
      }
      renderer.render(scene,camera);
      frame=requestAnimationFrame(render);
    };
    frame=requestAnimationFrame(render);
    return () => { disposed=true; cancelAnimationFrame(frame); resize.disconnect(); actors.forEach(a=>{a.label.remove();a.mixer.stopAllAction();}); disposeModel(scene); renderer.dispose(); renderer.domElement.remove(); };
  },[]);
  return <div className="room-3d" ref={host} aria-label={`3D community room with ${participants.length} participants`}>
    {error && <p className="room-error" role="alert">{error}</p>}
  </div>;
}
