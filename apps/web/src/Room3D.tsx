import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { AVATARS, SEATS, canOccupy, floorHeight, fromWorld, type Participant, type SeatId } from '@velnest/shared';
import { attachCosmetic } from './cosmetics';
import { createAnimator } from './animation';
import { dispose3D } from './dispose3D';
import { createRoomMotion } from './roomMotion';
import {placeRoomLabel,type LabelBox} from './labelLayout';

type Actor = { model: THREE.Group; mixer: THREE.AnimationMixer; animate: (name:string,reduced?:boolean)=>void; target: THREE.Vector3; action: string; nonce: number; label: HTMLSpanElement; labelWidth: number; labelHeight: number; cosmetic: string };

export function Room3D({ participants, occupancyKnown=true, onNavigate, onSit, selfId }: { participants: Participant[]; occupancyKnown?:boolean; onNavigate?: (position:{x:number;y:number})=>void; onSit?: (seatId:SeatId)=>void; selfId?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const people = useRef(participants);
  people.current = participants;
  const navigate=useRef(onNavigate);
  navigate.current=onNavigate;
  const sit=useRef(onSit);
  sit.current=onSit;
  const self=useRef(selfId);
  self.current=selfId;
  const [error, setError] = useState('');
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); }
    catch { setError('3D is unavailable in this browser. Enable hardware acceleration and reload.'); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const motion = createRoomMotion(scene);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
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
    key.shadow.normalBias=.035;
    key.shadow.bias=-.00015;
    scene.add(key);
    const raycaster=new THREE.Raycaster();
    const ground=new THREE.Plane(new THREE.Vector3(0,1,0),0);
    const point=new THREE.Vector3();
    const seatTargets=SEATS.map(seat=>{
      const target=new THREE.Mesh(new THREE.BoxGeometry(.58,.24,.66),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
      target.position.set(seat.x,.59,seat.z);
      target.userData.seatId=seat.id;
      scene.add(target);
      return target;
    });
    const onClick=(event:MouseEvent)=>{
      if(!navigate.current) return;
      const rect=renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),camera);
      const cushion=raycaster.intersectObjects(seatTargets)[0];
      if(cushion && sit.current) { sit.current(cushion.object.userData.seatId); return; }
      if(raycaster.ray.intersectPlane(ground,point)) {
        const destination=fromWorld(point.x,point.z);
        if(!canOccupy(destination.x,destination.y)) return;
        point.y=floorHeight(point.x,point.z);
        motion.emit('target',point,'#c7efdf',reduced.matches);
        navigate.current(destination);
      }
    };
    renderer.domElement.addEventListener('click',onClick);
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
    const onMotionPreference=()=>actors.forEach(actor=>{ actor.action=''; });
    reduced.addEventListener('change',onMotionPreference);
    const pending = new Set<string>();
    const failed = new Set<string>();
    const loader = new GLTFLoader();
    let disposed = false;
    let frame = 0;
    const disposeModel = dispose3D;
    loader.load('/models/afterparty.glb', gltf => {
      if(disposed) { disposeModel(gltf.scene); return; }
      for(const name of ['Floor','Back wall','Sofa seat','Sofa back','Stage','Screen','Table','Table leg']) {
        const fallback=scene.getObjectByName(name);
        if(fallback) { fallback.removeFromParent(); disposeModel(fallback); }
      }
      gltf.scene.traverse(obj=>{if(obj instanceof THREE.Mesh){obj.receiveShadow=true;obj.castShadow=true;}});
      scene.add(gltf.scene);
    },undefined,()=>{ /* The basic room remains usable when environment loading fails. */ });
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
      if(document.hidden) { frame=requestAnimationFrame(render); return; }
      const ids = new Set(people.current.map(p=>p.id));
      const player=people.current.find(person=>person.id===self.current);
      if(camera.aspect<.85 && player) {
        const x=(player.x-50)/12, z=(player.y-50)/16;
        camera.position.set(x,4,z+5.6);
        camera.lookAt(x,.35,z-.45);
      } else {
        camera.position.set(0,7,camera.aspect<1?16:10);
        camera.lookAt(0,0,0);
      }
      actors.forEach((actor,id) => { if (!ids.has(id)) { scene.remove(actor.model); actor.mixer.stopAllAction(); disposeModel(actor.model); actor.label.remove(); actors.delete(id); } });
      const placedLabels:LabelBox[]=[];
      const ordered=[...people.current].sort((a,b)=>Number(b.id===self.current)-Number(a.id===self.current) || Number(Boolean(b.action))-Number(Boolean(a.action)) || a.id.localeCompare(b.id));
      for (const p of ordered) {
        let actor = actors.get(p.id);
        if (!actor && !pending.has(p.id) && !failed.has(p.id)) {
          pending.add(p.id);
          loader.load(`/models/${p.avatarId}.glb`, gltf => {
            pending.delete(p.id);
            if (disposed || !people.current.some(person=>person.id===p.id)) { disposeModel(gltf.scene); return; }
            const label = document.createElement('span');
            label.className='room-nameplate';
            label.setAttribute('aria-hidden','true');
            label.textContent=p.displayName;
            el.appendChild(label);
            gltf.scene.traverse(obj=>{ if(obj instanceof THREE.Mesh) obj.castShadow=true; });
            gltf.scene.rotation.y=0;
            gltf.scene.position.set((p.x-50)/12,0,(p.y-50)/16);
            gltf.scene.position.y=floorHeight(gltf.scene.position.x,gltf.scene.position.z);
            scene.add(gltf.scene);
            motion.emit('arrival',gltf.scene.position,AVATARS.find(a=>a.id===p.avatarId)!.color,reduced.matches);
            attachCosmetic(gltf.scene,p.cosmetic);
            const mixer=new THREE.AnimationMixer(gltf.scene);
            actors.set(p.id,{model:gltf.scene,mixer,animate:createAnimator(mixer,gltf.animations),target:new THREE.Vector3(),action:'',nonce:-1,label,labelWidth:0,labelHeight:0,cosmetic:p.cosmetic});
          },undefined,()=>{ pending.delete(p.id); failed.add(p.id); setError('A character could not load. Reload the room to retry.'); });
        }
        actor = actors.get(p.id);
        if (!actor) continue;
        if(actor.cosmetic!==p.cosmetic) { attachCosmetic(actor.model,p.cosmetic); actor.cosmetic=p.cosmetic; }
        actor.target.set((p.x-50)/12,0,(p.y-50)/16);
        actor.target.y=floorHeight(actor.target.x,actor.target.z);
        const delta=actor.target.clone().sub(actor.model.position);
        const walking=delta.lengthSq()>.0004;
        if(p.seat?.status==='seated') actor.model.rotation.y=0;
        else if(walking) actor.model.rotation.y=Math.atan2(delta.x,delta.z);
        actor.model.position.lerp(actor.target,reduced.matches?1:1-Math.exp(-dt*14));
        const action=p.seat?.status==='seated'?'sit':p.action??(walking?'walk':'idle');
        if(actor.action!==action || actor.nonce!==p.actionNonce) {
          if(p.action && actor.nonce!==p.actionNonce) motion.emit(p.action,actor.model.position,AVATARS.find(a=>a.id===p.avatarId)!.color,reduced.matches);
          actor.action=action; actor.nonce=p.actionNonce;
          actor.label.dataset.action=p.action??'';
          actor.label.textContent=p.seat?.status==='seated' ? `${p.displayName} (seated)` : p.action ? `${p.displayName} (${p.action})` : p.displayName;
          actor.labelWidth=actor.label.offsetWidth;
          actor.labelHeight=actor.label.offsetHeight;
          actor.animate(action,reduced.matches);
        }
        if(!reduced.matches) actor.mixer.update(dt);
        const screen=actor.model.position.clone().add(new THREE.Vector3(0,1.2,0)).project(camera);
        const x=(screen.x*.5+.5)*el.clientWidth;
        const anchorY=(-screen.y*.5+.5)*el.clientHeight;
        const box=screen.z>=-1&&screen.z<=1?placeRoomLabel({x,y:anchorY},{width:actor.labelWidth,height:actor.labelHeight},{width:el.clientWidth,height:el.clientHeight},placedLabels):null;
        actor.label.style.visibility=box?'visible':'hidden';
        if(box){
          placedLabels.push(box);
          const dx=x-box.x,dy=anchorY-box.y;
          actor.label.style.setProperty('--leader-height',`${Math.hypot(dx,dy)}px`);
          actor.label.style.setProperty('--leader-angle',`${-Math.atan2(dx,dy)}rad`);
          actor.label.style.transform=`translate(-50%,-100%) translate(${box.x}px,${box.y}px)`;
        }
      }
      motion.update(dt,reduced.matches);
      renderer.render(scene,camera);
      frame=requestAnimationFrame(render);
    };
    frame=requestAnimationFrame(render);
    return () => { disposed=true; reduced.removeEventListener('change',onMotionPreference); renderer.domElement.removeEventListener('click',onClick); cancelAnimationFrame(frame); resize.disconnect(); actors.forEach(a=>{a.label.remove();a.mixer.stopAllAction();}); motion.dispose(); disposeModel(scene); renderer.dispose(); renderer.domElement.remove(); };
  },[]);
  return <div className="room-3d" ref={host} aria-label={occupancyKnown?`3D community room with ${participants.length} participants`:'3D community room preview; occupancy unavailable'}>
    {occupancyKnown && <ul className="visually-hidden" aria-label="People inside">{participants.map(person=><li key={person.id}>{person.displayName}{person.seat?.status==='seated'?' (seated)':person.action?` (${person.action})`:''}</li>)}</ul>}
    {error && <p className="room-error" role="alert">{error}</p>}
  </div>;
}
