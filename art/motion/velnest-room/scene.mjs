import * as THREE from '../../../apps/web/node_modules/three/build/three.module.js';
import {GLTFLoader} from '../../../apps/web/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import {findRoomPath,fromWorld,toWorld} from '../../../packages/shared/src/room.ts';

const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const smooth=v=>{const t=clamp(v);return t*t*(3-2*t);};
const mix=(a,b,t)=>a+(b-a)*t;
const start={x:0,z:1.25}, approach={x:-2,z:-.78};
const path=[start,...findRoomPath(fromWorld(start.x,start.z),fromWorld(approach.x,approach.z)).map(p=>toWorld(p.x,p.y))];
const lengths=path.slice(1).map((p,i)=>Math.hypot(p.x-path[i].x,p.z-path[i].z));
const total=lengths.reduce((a,b)=>a+b,0);
function walkPoint(progress){
  let distance=clamp(progress)*total;
  for(let i=0;i<lengths.length;i++){
    if(distance<=lengths[i]||i===lengths.length-1){const u=distance/lengths[i],a=path[i],b=path[i+1];return {x:mix(a.x,b.x,u),z:mix(a.z,b.z,u),yaw:Math.atan2(b.x-a.x,b.z-a.z)};}
    distance-=lengths[i];
  }
}
function pose(actor,name,time,previous,weight=1){
  actor.mixer.stopAllAction();
  const clip=actor.clips.find(c=>c.name===name),action=actor.mixer.clipAction(clip);
  action.reset().setEffectiveWeight(weight).play();action.time=time%clip.duration;
  if(previous&&weight<1){const oldClip=actor.clips.find(c=>c.name===previous),old=actor.mixer.clipAction(oldClip);old.reset().setEffectiveWeight(1-weight).play();old.time=time%oldClip.duration;}
  actor.mixer.update(0);
}
export async function build(canvas){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
  renderer.setSize(1920,810,false);renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#252127');
  scene.add(new THREE.HemisphereLight(0xfff4e7,0x524261,2.5));
  const light=new THREE.DirectionalLight(0xffdfb0,3);light.position.set(-3,8,4);light.castShadow=true;
  light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=light.shadow.camera.bottom=-7;light.shadow.camera.right=light.shadow.camera.top=7;light.shadow.normalBias=.035;light.shadow.bias=-.00015;scene.add(light);
  const camera=new THREE.PerspectiveCamera(38,1920/810,.1,60),loader=new GLTFLoader();
  const [room,...characters]=await Promise.all(['afterparty','riff','arc','muse'].map(name=>loader.loadAsync(`assets/models/${name}.glb`)));
  room.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(room.scene);
  const actors=characters.map(g=>{g.scene.traverse(o=>{if(o.isMesh)o.castShadow=true;});scene.add(g.scene);return {model:g.scene,mixer:new THREE.AnimationMixer(g.scene),clips:g.animations};});
  actors[1].model.position.set(-2.65,.02,-1.52);actors[2].model.position.set(-1.35,.02,-1.52);
  function renderAt(time){
    const t=clamp(time,0,12),riff=actors[0];pose(actors[1],'Sit',t);pose(actors[2],'Sit',t);
    let x=0,z=1.25,yaw=0;
    if(t<2.8)pose(riff,'Wave',t);
    else if(t<7.2){const p=walkPoint((t-2.8)/4.4);x=p.x;z=p.z;yaw=p.yaw*smooth((t-2.8)/.2);pose(riff,'Walk',t-2.8,'Wave',clamp((t-2.8)/.16));}
    else if(t<7.6){x=approach.x;z=approach.z;yaw=walkPoint(1).yaw*(1-smooth((t-7.2)/.25));pose(riff,'Idle',t-7.2,'Walk',clamp((t-7.2)/.16));}
    else{const u=smooth((t-7.6)/.6);x=approach.x;z=mix(approach.z,-1.52,u);pose(riff,'Sit',t-7.6,'Idle',clamp((t-7.6)/.4));}
    riff.model.position.set(x,.02,z);riff.model.rotation.y=yaw;
    // Registry camera-dolly-zoom invariant, adapted from CSS depth to Three.js:
    // distance * tan(FOV/2) stays constant during the opening dolly.
    const opening=smooth(t/2.8),travel=smooth((t-2.8)/4.8),reveal=smooth((t-8.2)/3.8);
    const distance=mix(5.8,6.5,opening),focal=5.8*Math.tan(38*Math.PI/360);
    camera.fov=mix(2*Math.atan(focal/distance)*180/Math.PI,38,travel);
    camera.position.set(mix(mix(.8,-1.4,travel),-.4,reveal),mix(mix(3.9,2.8,travel),3.5,reveal),mix(mix(distance,2,travel),3.4,reveal));
    camera.lookAt(mix(mix(-.5,-2,travel),-1.7,reveal),mix(mix(.4,.6,travel),.45,reveal),mix(mix(.1,-1.52,travel),-1.1,reveal));camera.updateProjectionMatrix();scene.updateMatrixWorld(true);renderer.render(scene,camera);
  }
  renderAt(0);return {renderAt};
}
