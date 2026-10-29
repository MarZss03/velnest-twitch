import { fromWorld } from './room.js';

/** Chair anchors in the lounge. Preserve IDs for existing room events. */
const cushions = [
  { id: 'sofa-left', name: 'left chair', x: -2.65, z: -1.52 },
  { id: 'sofa-middle', name: 'middle chair', x: -2, z: -1.52 },
  { id: 'sofa-right', name: 'right chair', x: -1.35, z: -1.52 },
] as const;
export const SEATS = cushions.map(seat => ({ ...seat, position: fromWorld(seat.x, seat.z), approach: fromWorld(seat.x, -.78) }));
export type SeatId = typeof SEATS[number]['id'];
