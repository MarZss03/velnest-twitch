import * as THREE from 'three';

/** One crossfade vocabulary for the selector and the multiplayer room. */
export function createAnimator(mixer: THREE.AnimationMixer, clips: THREE.AnimationClip[]) {
  let active: THREE.AnimationAction | undefined;
  return (name: string, reduced = false) => {
    const clip=clips.find(clip=>clip.name.toLowerCase()===name.toLowerCase());
    if(!clip) return;
    if(reduced) {
      mixer.stopAllAction(); active=undefined;
      // Sitting is meaningful state. Hold the authored pose without its breathing loop.
      if(name.toLowerCase()==='sit') {
        const pose=mixer.clipAction(clip);
        pose.reset().play(); pose.paused=true; mixer.update(0); active=pose;
      }
      return;
    }
    const next=mixer.clipAction(clip);
    if(next===active) { next.reset().play(); return; }
    next.reset().setEffectiveWeight(1).setEffectiveTimeScale(1).play();
    if(active) { active.fadeOut(.16); next.fadeIn(.16); }
    active=next;
  };
}
