import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {dispose3D} from './dispose3D';

/** Static authored lighting: the room stays calm; reactions provide the movement. */
export function createNightLighting(renderer:THREE.WebGLRenderer,scene:THREE.Scene,camera:THREE.Camera) {
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=.85;
  scene.background=new THREE.Color('#090d18');
  const environment=new RoomEnvironment();
  const pmrem=new THREE.PMREMGenerator(renderer);
  const reflection=pmrem.fromScene(environment,.04);
  scene.environment=reflection.texture;
  scene.environmentIntensity=.25;
  dispose3D(environment);
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0x8da8d2,0x17152b,.65));
  const key=new THREE.DirectionalLight(0xe1e8ff,1.5);
  key.position.set(1,8,5);
  key.castShadow=true;
  key.shadow.camera.left=key.shadow.camera.bottom=-7;
  key.shadow.camera.right=key.shadow.camera.top=7;
  key.shadow.mapSize.set(1024,1024);
  key.shadow.normalBias=.035;
  key.shadow.bias=-.00015;
  scene.add(key);
  for(const [color,power,x,y,z,distance] of [
    [0x9452ff,12,-2.8,1.9,-2.8,7],
    [0x39d9ff,9,3,2.1,-2.8,7],
    [0xffbb74,2.5,.05,1.7,-2.8,3],
    [0x7a50ff,3.5,0,.4,3,6],
  ]) {
    const light=new THREE.PointLight(color,power,distance,2);
    light.position.set(x,y,z);
    scene.add(light);
  }
  const composer=new EffectComposer(renderer);
  // Avoid multiplying bloom-buffer costs by a high-DPI phone's full pixel ratio.
  composer.setPixelRatio(Math.min(devicePixelRatio,1.25));
  composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.16,.23,1.7);
  composer.addPass(bloom);
  const output=new OutputPass();
  composer.addPass(output);
  return {
    resize:(width:number,height:number)=>composer.setSize(width,height),
    render:()=>composer.render(),
    dispose:()=>{
      scene.environment=null;
      reflection.dispose();
      key.shadow.dispose();
      bloom.dispose();
      output.dispose();
      composer.dispose();
    },
  };
}
