import { rooms, staff, STAFF_WORKERS, FLOOR_HEIGHT } from './worldData.ts';
import type { Point } from './navigation.ts';
export { FLOOR_HEIGHT, STAFF_WORKERS } from './worldData.ts';

export type Seat = { position: Point; rotation: number };
export type Footprint = { x: number; z: number; w: number; d: number; floor: 0 | 1 };
export const ENTRY_POINT: Point = [-9.8, 8, 0];
export const RECEPTION_POST: Point = [-9.8, 2.7, 0];
export const RECEPTION_DESK_POINT: Point = [-9.8, 3.55, 0];
export const ATTENDANCE_SERVICE_POINT: Point = [-9.8, 4.4, 0];
export const ATTENDANCE_POINT = ATTENDANCE_SERVICE_POINT;
export const STAIR_X = 10.5;
export const STAIR_WIDTH = 1.8;
export const STAIR_BOTTOM: Point = [STAIR_X, 5.3, 0];
export const STAIR_TOP: Point = [STAIR_X, .5, FLOOR_HEIGHT];
export const meetingSlot = (index: number) => STAFF_WORKERS.indexOf(index as typeof STAFF_WORKERS[number]);
export const roomRotation = (id: number) => rooms[id].center[1] > 0 ? Math.PI : 0;
export const roomLocal = (id: number, x: number, z: number): Point => {
  const room = rooms[id], side = room.center[1] < 0 ? 1 : -1;
  return [room.center[0] + x * side, room.center[1] + z * side, room.floor * FLOOR_HEIGHT];
};
const desk = (roomId: number, dx: number, dz: number, staffIndex: number) => {
  const [x, z, y] = roomLocal(roomId, dx, dz);
  return { roomId, x, z, y: y ?? 0, floor: rooms[roomId].floor, rotation: roomRotation(roomId), staffIndex };
};
export const desks = [
  desk(7, -.6, -.7, 0), desk(1, -2, -1.1, 1), desk(1, 2, -1.1, 2),
  desk(1, -2, .7, 3), desk(1, 2, .7, 4), desk(6, .9, .5, 5), desk(3, -.6, -.7, 7),
];
export function workSeat(index: number): Seat {
  if (index === 6) return { position: RECEPTION_POST, rotation: 0 };
  const d = desks.find((item) => item.staffIndex === index)!;
  return { position: [d.x + Math.sin(d.rotation) * .7, d.z + Math.cos(d.rotation) * .7, d.y], rotation: d.rotation + Math.PI };
}
const sharedSeat = (roomId: number, index: number): Seat => {
  const slot = ((index % 7) + 7) % 7;
  if (slot === 6) return { position: roomLocal(roomId, 0, -1.85), rotation: roomRotation(roomId) };
  const x = slot < 3 ? -1.14 : 1.14, z = [-1, 0, 1][slot % 3];
  return { position: roomLocal(roomId, x, z), rotation: roomRotation(roomId) + (slot < 3 ? Math.PI / 2 : -Math.PI / 2) };
};
export const meetingSeat = (slot: number) => sharedSeat(2, slot);
export const lunchSeat = (slot: number) => sharedSeat(5, slot);
export const librarySeat = (index: number): Seat => ({ position: roomLocal(8, index % 2 ? .75 : -.75, .35), rotation: Math.PI });
export const interviewSeat = (index: number): Seat => ({ position: roomLocal(4, index % 2 ? .75 : -.75, .2), rotation: roomRotation(4) + Math.PI });
export const hrdSeat = interviewSeat;
export const founderMeetingSeat = (index: number): Seat => ({ position: roomLocal(3, index === 7 ? 1.8 : .45, .65), rotation: index === 7 ? -Math.PI / 2 : Math.PI / 2 });
export const toiletPoint = (roomId: number): Point => roomLocal(roomId === 10 ? 10 : 9, 0, .15);
export const pantryDrinkPoint: Point = roomLocal(5, -1.65, -1.85);
export const pantryCookPoint: Point = roomLocal(5, 1.8, -1.35);
export const attendancePoint = (index: number): Point => {
  const slot = index === 7 ? 0 : Math.min(6, Math.max(0, meetingSlot(index) + 1));
  // The front waiting rows continue along the clear side of the counter, with 70 cm between bodies.
  return ([[-11.2, 4.45, 0], [-8.4, 4.45, 0], [-11.2, 5.15, 0], [-8.4, 5.15, 0], [-8.2, 3.75, 0], [-8.2, 3.05, 0], [-8.2, 2.35, 0]] as Point[])[slot];
};
export const inspectionPoint = (target: number): Point => {
  const seat = workSeat(target), angle = seat.rotation + Math.PI / 2;
  return [seat.position[0] + Math.sin(angle) * 1.02, seat.position[1] + Math.cos(angle) * 1.02, seat.position[2] ?? 0];
};
export const errandPoint = (index: number): Point => roomLocal(staff[index].roomId, index % 2 ? 1.65 : -1.65, 1.5);
export const arrivalMinute = (index: number) => index === 6 ? 420 : index === 7 ? 423 : 426 + Math.max(0, meetingSlot(index)) * 3;

// Furniture positions are shared by the visible world and the navigation grid.
export const furnitureFootprints: Footprint[] = desks.map((d) => ({ x: d.x, z: d.z, w: 1.45, d: .76, floor: d.floor }));
const item = (roomId: number, x: number, z: number, w: number, d: number) => {
  const point = roomLocal(roomId, x, z);
  furnitureFootprints.push({ x: point[0], z: point[1], w, d, floor: rooms[roomId].floor });
};
furnitureFootprints.push({ x: RECEPTION_DESK_POINT[0], z: RECEPTION_DESK_POINT[1], w: 2.25, d: .8, floor: 0 });
item(0, 1.83, .4, .48, 1.3);
item(1, 3.9, -1.9, 1.0, .45);
item(2, 0, -.1, 1.35, 2.5);
item(3, 1.7, -1.8, .55, .45);
item(3, 1.1, .65, .4, .55);
item(4, 0, -.6, 2.2, .7);
item(4, -1.8, -1.6, .45, 1.0);
item(5, 0, -.1, 1.35, 2.5);
item(5, 1.3, -2.05, 1.2, .5);
item(5, -1.65, -2.25, .65, .18);
item(6, -1.2, -1.3, .65, .9);
item(6, -.35, -1.3, .65, .9);
item(7, 1.65, -1.75, .5, .65);
item(8, 0, -.5, 2.7, .75);
item(8, -1.85, -1.0, .35, 2.1);
item(8, 1.85, -1.0, .35, 2.1);
item(9, 0, -1.3, .65, .8);
item(9, .7, -.55, .35, .5);
item(10, 0, -1.3, .65, .8);
item(10, .7, -.55, .35, .5);
