/** Authoritative floor coordinates, matching Blender's Afterparty environment. */
export const toWorld = (x: number, y: number) => ({ x: (x - 50) / 12, z: (y - 50) / 16 });
export const fromWorld = (x: number, z: number) => ({ x: x * 12 + 50, y: z * 16 + 50 });

const obstacles = [
  { left: -3.65, right: -.35, back: -2.4, front: -.85 },
  { left: -2.85, right: -.95, back: -.65, front: .45 }
];

export function canOccupy(x: number, y: number) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 5 || x > 95 || y < 12 || y > 88) return false;
  const point = toWorld(x,y);
  return !obstacles.some(box => point.x > box.left && point.x < box.right && point.z > box.back && point.z < box.front);
}

export function moveInRoom(x: number, y: number, dx: number, dy: number) {
  const nextX = Math.max(5,Math.min(95,x+dx));
  const nextY = Math.max(12,Math.min(88,y+dy));
  if(canOccupy(nextX,nextY)) return {x:nextX,y:nextY};
  // Sliding along furniture feels better than freezing diagonal input.
  if(canOccupy(nextX,y)) return {x:nextX,y};
  if(canOccupy(x,nextY)) return {x,y:nextY};
  return {x,y};
}

export function floorHeight(x: number,z: number) {
  return x > .65 && x < 3.35 && z > -2.75 && z < -.85 ? .20 : .02;
}

type Point = {x:number;y:number};

/** Sweep at sub-avatar spacing so a route cannot tunnel through thin corners. */
export function clearSegment(a: Point,b: Point) {
  const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/.3));
  for(let i=0;i<=steps;i++) {
    const t=i/steps;
    if(!canOccupy(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t)) return false;
  }
  return true;
}

/** Shortest visibility-graph route around the room's expanded furniture boxes. */
export function findRoomPath(start: Point,end: Point): Point[] {
  if(!canOccupy(start.x,start.y)||!canOccupy(end.x,end.y)) return [];
  if(clearSegment(start,end)) return [end];
  const corners=obstacles.flatMap(box=>[
    fromWorld(box.left-.04,box.back-.04),fromWorld(box.right+.04,box.back-.04),
    fromWorld(box.left-.04,box.front+.04),fromWorld(box.right+.04,box.front+.04)
  ]).filter(p=>canOccupy(p.x,p.y));
  const points=[start,end,...corners];
  const distance=points.map(()=>Infinity), previous=points.map(()=>-1), visited=new Set<number>();
  distance[0]=0;
  while(visited.size<points.length) {
    let current=-1;
    for(let i=0;i<points.length;i++) if(!visited.has(i)&&(current===-1||distance[i]<distance[current])) current=i;
    if(current===-1||!Number.isFinite(distance[current])) return [];
    if(current===1) break;
    visited.add(current);
    for(let i=0;i<points.length;i++) {
      if(visited.has(i)||i===current||!clearSegment(points[current],points[i])) continue;
      const cost=distance[current]+Math.hypot(points[i].x-points[current].x,points[i].y-points[current].y);
      if(cost<distance[i]) {distance[i]=cost;previous[i]=current;}
    }
  }
  const route: Point[]=[];
  for(let i=1;i!==0;i=previous[i]) {if(i<0)return [];route.unshift(points[i]);}
  return route;
}
