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
