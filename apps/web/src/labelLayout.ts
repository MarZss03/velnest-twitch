export type LabelBox={x:number;y:number;width:number;height:number};

/** Place a head label within the viewport, or omit visual clutter when packed. */
export function placeRoomLabel(anchor:{x:number;y:number},size:{width:number;height:number},bounds:{width:number;height:number},placed:LabelBox[]):LabelBox|null {
  const margin=8,gap=6;
  if(!Number.isFinite(anchor.x+anchor.y+size.width+size.height+bounds.width+bounds.height) || size.width<=0 || size.height<=0 || bounds.width<size.width+margin*2 || bounds.height<size.height+margin*2) return null;
  if(anchor.x<0 || anchor.x>bounds.width || anchor.y<0 || anchor.y>bounds.height) return null;
  const x=Math.max(size.width/2+margin,Math.min(bounds.width-size.width/2-margin,anchor.x));
  const y=Math.max(size.height+margin,Math.min(bounds.height-margin,anchor.y));
  const candidates:{x:number;y:number;distance:number}[]=[];
  const reach=bounds.width<480?100:160;
  for(let row=0;row<=6;row++) for(let column=-3;column<=3;column++) {
    const candidate={x:x+column*(size.width+gap),y:y-row*(size.height+gap)};
    const dx=candidate.x-anchor.x,dy=candidate.y-anchor.y;
    const distance=Math.hypot(dx,dy);
    if(distance>reach || candidate.x-size.width/2<margin || candidate.x+size.width/2>bounds.width-margin || candidate.y-size.height<margin || candidate.y>bounds.height-margin) continue;
    candidates.push({...candidate,distance});
  }
  candidates.sort((a,b)=>a.distance-b.distance);
  for(const candidate of candidates){
    const box={x:candidate.x,y:candidate.y,...size};
    if(!placed.some(other=>Math.abs(box.x-other.x)<(box.width+other.width)/2+gap && box.y>other.y-other.height-gap && box.y-box.height<other.y+gap)) return box;
  }
  return null;
}
