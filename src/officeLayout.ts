import { rooms, staff, STAFF_WORKERS, FLOOR_HEIGHT } from './worldData.ts';
import type { Point } from './navigation.ts';
export { FLOOR_HEIGHT, FLOOR_SURFACE_HEIGHT, STAFF_WORKERS } from './worldData.ts';

export type Seat = { position: Point; rotation: number };
export type Footprint = { x: number; z: number; w: number; d: number; floor: 0 | 1 };
export const ENTRY_POINT: Point = [-7.3, 8, 0];
export const INTERIOR_DOOR_WIDTH = 1.5;
export const MAIN_DOOR_WIDTH = 2.65;
export const RECEPTION_POST: Point = [-7.7, 1.85, 0];
export const RECEPTION_DESK_POINT: Point = [-7.7, 2.7, 0];
export const ATTENDANCE_SERVICE_POINT: Point = [-7.7, 3.55, 0];
export const ATTENDANCE_POINT = ATTENDANCE_SERVICE_POINT;
export const STAIR_X = 10.5;
export const STAIR_WIDTH = 1.8;
export const STAIR_BOTTOM: Point = [STAIR_X, 5.3, 0];
export const STAIR_TOP: Point = [STAIR_X, .5, FLOOR_HEIGHT];
export const meetingSlot = (index: number) => STAFF_WORKERS.slice(0, 6).indexOf(index as typeof STAFF_WORKERS[number]);
export const lunchSlot = (index: number) => STAFF_WORKERS.indexOf(index as typeof STAFF_WORKERS[number]);
export const OWNER_LUNCH_SLOT = 7;
export const HR_TABLE_LOCAL = [.85, .3] as const;
export const HR_TABLE_SIZE = [1.1, .65] as const;
export const FOUNDER_SOFA_LOCAL = [.85, .65] as const;
export const FOUNDER_COFFEE_LOCAL = [.85, -.7] as const;
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
  desk(1, -2, .7, 3), desk(1, 2, .7, 4), desk(6, .9, .5, 5), desk(4, -1.15, -1.5, 7),
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
export const lunchSeat = (slot: number): Seat => slot === OWNER_LUNCH_SLOT
  ? { position: roomLocal(5, 0, 1.8), rotation: Math.PI }
  : sharedSeat(5, slot);
export const librarySeat = (index: number): Seat => ({ position: roomLocal(8, index % 2 ? .75 : -.75, .35), rotation: Math.PI });
export const interviewSeat = (index: number): Seat => ({ position: roomLocal(4, HR_TABLE_LOCAL[0], HR_TABLE_LOCAL[1] + (index % 2 ? -.75 : .75)), rotation: index % 2 ? 0 : Math.PI });
export const hrdSeat = interviewSeat;
export const ownerDeskPoint: Point = roomLocal(3, -.55, -1.55);
export const ownerDeskSeat: Seat = { position: roomLocal(3, -.55, -.82), rotation: Math.PI };
export const founderMeetingSeat = (index: number): Seat => ({ position: roomLocal(3, FOUNDER_SOFA_LOCAL[0] + (index === 0 ? -.42 : .42), FOUNDER_SOFA_LOCAL[1]), rotation: Math.PI });
export const clientMeetingSeat = (slot: number): Seat => {
  const places: Seat[] = [
    { position: roomLocal(11, -1.12, -.5), rotation: Math.PI / 2 },
    { position: roomLocal(11, 1.12, -.5), rotation: -Math.PI / 2 },
    { position: roomLocal(11, -1.12, 1.05), rotation: Math.PI / 2 },
    { position: roomLocal(11, 1.12, 1.05), rotation: -Math.PI / 2 },
  ];
  return places[((slot % places.length) + places.length) % places.length];
};
export const toiletPoint = (roomId: number): Point => roomLocal(roomId === 10 ? 10 : 9, 0, .15);
export const pantryDrinkPoint: Point = roomLocal(5, -1.65, -1.85);
export const pantryCookPoint: Point = roomLocal(5, 1.8, -1.35);
export const attendancePoint = (index: number): Point => {
  const slot = Math.max(0, lunchSlot(index));
  return ([[-5.6, 2, 0], [-4.85, 2, 0], [-5.6, 2.75, 0], [-4.85, 2.75, 0], [-5.6, 3.5, 0], [-4.85, 3.5, 0], [-5.6, 4.25, 0]] as Point[])[slot];
};
export const inspectionPoint = (target: number): Point => {
  const seat = workSeat(target), angle = seat.rotation + (target === 7 ? -Math.PI / 2 : Math.PI / 2);
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
const founderDesk = roomLocal(3, -.55, -1.55);
furnitureFootprints.push({ x: founderDesk[0], z: founderDesk[1], w: 1.45, d: .76, floor: 1 });
item(3, FOUNDER_COFFEE_LOCAL[0], FOUNDER_COFFEE_LOCAL[1], 1.3, .55);
// Cushions are docking surfaces, like chair seats; the back and arms block through traffic.
item(3, FOUNDER_SOFA_LOCAL[0], FOUNDER_SOFA_LOCAL[1] + .42, 1.92, .14);
for (const side of [-1, 1]) item(3, FOUNDER_SOFA_LOCAL[0] + side * .89, FOUNDER_SOFA_LOCAL[1], .12, .72);
item(4, HR_TABLE_LOCAL[0], HR_TABLE_LOCAL[1], HR_TABLE_SIZE[0], HR_TABLE_SIZE[1]);
item(4, 1.8, -1.6, .45, .8);
item(5, 0, -.1, 1.35, 2.5);
item(5, 1.3, -2.05, 1.2, .5);
item(5, -1.65, -2.25, .65, .18);
item(6, -1.2, -1.3, .65, .9);
item(6, -.35, -1.3, .65, .9);
item(7, 1.65, -1.75, .5, .65);
item(11, 0, -.1, 1.35, 2.5);
item(8, 0, -.5, 2.7, .75);
item(8, -1.85, -1.0, .35, 2.1);
item(8, 1.85, -1.0, .35, 2.1);
item(9, 0, -1.3, .65, .8);
item(9, .7, -.55, .35, .5);
item(10, 0, -1.3, .65, .8);
item(10, .7, -.55, .35, .5);
