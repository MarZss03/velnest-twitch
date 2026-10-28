import { fromWorld } from './room.js';

/** Matches the three authored cushions in art/blender/build_room.py. */
const cushions = [
  { id: 'sofa-left', name: 'left cushion', x: -2.65, z: -1.52 },
  { id: 'sofa-middle', name: 'middle cushion', x: -2, z: -1.52 },
  { id: 'sofa-right', name: 'right cushion', x: -1.35, z: -1.52 },
] as const;
export const SEATS = cushions.map(seat => ({ ...seat, position: fromWorld(seat.x, seat.z), approach: fromWorld(seat.x, -.78) }));
export type SeatId = typeof SEATS[number]['id'];
