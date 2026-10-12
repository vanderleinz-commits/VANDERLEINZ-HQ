import { rooms, staff, STAFF_WORKERS, FLOOR_HEIGHT } from './worldData.ts';
import type { Point } from './navigation.ts';
export { FLOOR_HEIGHT, FLOOR_SURFACE_HEIGHT, STAFF_WORKERS, WORLD_BOUNDS } from './worldData.ts';

export type Seat = { position: Point; rotation: number };
export type Footprint = { x: number; z: number; w: number; d: number; floor: 0 | 1 };
export const ENTRY_POINT: Point = [-9.49, 10.1, 0];
export const INTERIOR_DOOR_WIDTH = 1.65;
export const MAIN_DOOR_WIDTH = 2.65;
export const RECEPTION_POST: Point = [-10.2, 2.1, 0];
export const RECEPTION_DESK_POINT: Point = [-10.2, 2.95, 0];
export const ATTENDANCE_SERVICE_POINT: Point = [-10.2, 3.8, 0];
export const ATTENDANCE_POINT = ATTENDANCE_SERVICE_POINT;
export const STAIR_X = 13.65;
export const STAIR_WIDTH = 2.05;
export const STAIR_BOTTOM: Point = [STAIR_X, 6.89, 0];
export const STAIR_TOP: Point = [STAIR_X, .65, FLOOR_HEIGHT];
export const meetingSlot = (index: number) => STAFF_WORKERS.slice(0, 6).indexOf(index as typeof STAFF_WORKERS[number]);
export const lunchSlot = (index: number) => STAFF_WORKERS.indexOf(index as typeof STAFF_WORKERS[number]);
export const OWNER_LUNCH_SLOT = 9;
export const HR_TABLE_LOCAL = [1.15, .45] as const;
export const HR_TABLE_SIZE = [1.25, .8] as const;
export const FOUNDER_SOFA_LOCAL = [-1.65, .45] as const;
export const FOUNDER_COFFEE_LOCAL = [0, .55] as const;
export const FOUNDER_SOFAS = [{ x: -1.65, z: .45, rotation: Math.PI / 2 }, { x: 1.65, z: .45, rotation: -Math.PI / 2 }] as const;
export const LUNCH_TABLE_LOCAL = [0, .45] as const;
export const LUNCH_TABLE_SIZE = [1.65, 3.4] as const;
export const CLIENT_TABLE_SIZE = [1.65, 3.25] as const;
export const roomRotation = (id: number) => rooms[id].center[1] > 0 ? Math.PI : 0;
export const roomLocal = (id: number, x: number, z: number): Point => {
  const room = rooms[id], side = room.center[1] < 0 ? 1 : -1;
  return [room.center[0] + x * side, room.center[1] + z * side, room.floor * FLOOR_HEIGHT];
};
const desk = (roomId: number, dx: number, dz: number, staffIndex: number, facesDoor = false) => {
  const [x, z, y] = roomLocal(roomId, dx, dz);
  return { roomId, x, z, y: y ?? 0, floor: rooms[roomId].floor, rotation: roomRotation(roomId) + (facesDoor ? Math.PI : 0), staffIndex };
};
export const desks = [
  desk(7, -.75, -1.9, 0, true), desk(1, -3.25, -1.25, 1), desk(1, 3.25, -1.25, 2),
  desk(1, -3.25, 1.05, 3), desk(1, 3.25, 1.05, 4), desk(6, 1.3, -1.9, 5, true), desk(4, -1.2, -1.9, 7, true),
];
export function workSeat(index: number): Seat {
  if (index === 6) return { position: RECEPTION_POST, rotation: 0 };
  if (index === 8 || index === 9) return { position: roomLocal(12, index === 8 ? -.7 : .7, 1.65), rotation: Math.PI };
  const d = desks.find((item) => item.staffIndex === index)!;
  return { position: [d.x + Math.sin(d.rotation) * .7, d.z + Math.cos(d.rotation) * .7, d.y], rotation: d.rotation + Math.PI };
}
const sharedSeat = (roomId: number, index: number): Seat => {
  const slot = ((index % 7) + 7) % 7;
  if (slot === 6) return { position: roomLocal(roomId, 0, -2.1), rotation: roomRotation(roomId) };
  const x = slot < 3 ? -1.25 : 1.25, z = [-1.15, 0, 1.15][slot % 3];
  return { position: roomLocal(roomId, x, z), rotation: roomRotation(roomId) + (slot < 3 ? Math.PI / 2 : -Math.PI / 2) };
};
export const meetingSeat = (slot: number) => sharedSeat(2, slot);
export const lunchSeat = (index: number): Seat => {
  const slot = ((index % 10) + 10) % 10;
  if (slot >= 8) return { position: roomLocal(5, 0, slot === 8 ? -1.85 : 2.7), rotation: slot === 8 ? 0 : Math.PI };
  return { position: roomLocal(5, slot < 4 ? -1.35 : 1.35, [-.85, .1, 1.05, 2][slot % 4]), rotation: slot < 4 ? Math.PI / 2 : -Math.PI / 2 };
};
export const librarySeat = (index: number): Seat => ({ position: roomLocal(8, [-1.15, 0, 1.15][((index % 3) + 3) % 3], .6), rotation: Math.PI });
export const receptionBreakSeat = (index: number): Seat => ({ position: roomLocal(0, 4.8, [-1.5, -.5, .5][((index % 3) + 3) % 3]), rotation: Math.PI / 2 });
export const interviewSeat = (index: number): Seat => ({ position: roomLocal(4, HR_TABLE_LOCAL[0], HR_TABLE_LOCAL[1] + (index % 2 ? -.85 : .85)), rotation: index % 2 ? 0 : Math.PI });
export const hrdSeat = interviewSeat;
export const ownerDeskPoint: Point = roomLocal(3, -.7, -1.9);
export const ownerDeskRotation = Math.PI;
export const ownerDeskSeat: Seat = { position: roomLocal(3, -.7, -2.6), rotation: 0 };
export const founderMeetingSeat = (index: number): Seat => ({ position: roomLocal(3, index % 2 ? 1.65 : -1.65, .45), rotation: index % 2 ? -Math.PI / 2 : Math.PI / 2 });
export const clientMeetingSeat = (index: number): Seat => {
  const slot = ((index % 8) + 8) % 8;
  const x = slot % 2 ? 1.35 : -1.35, z = [-1.35, -.45, .45, 1.35][Math.floor(slot / 2)];
  return { position: roomLocal(11, x, z), rotation: slot % 2 ? -Math.PI / 2 : Math.PI / 2 };
};
export const toiletPoint = (roomId: number): Point => roomLocal(roomId === 10 ? 10 : 9, 0, .2);
export const pantryDrinkPoint: Point = roomLocal(5, -2.2, -1.95);
export const pantryCookPoint: Point = roomLocal(5, 1.8, -1.95);
export const CATERING_COUNTER_POINT: Point = roomLocal(5, 1.3, -2.75);
export const attendancePoint = (index: number): Point => {
  const slot = Math.max(0, lunchSlot(index));
  return [-8.8 + (slot % 3) * .8, 4.2 + Math.floor(slot / 3) * .85, 0];
};
export const inspectionPoint = (target: number): Point => {
  const seat = workSeat(target), angle = seat.rotation + (target === 7 ? -Math.PI / 2 : Math.PI / 2);
  return [seat.position[0] + Math.sin(angle) * 1.02, seat.position[1] + Math.cos(angle) * 1.02, seat.position[2] ?? 0];
};
export const servicePoint = (target: number): Point => {
  if (target === -1) return [ownerDeskSeat.position[0] + 1.02, ownerDeskSeat.position[1], FLOOR_HEIGHT];
  if (target === 6) return [-11.65, 2.1, 0];
  if (target === 8 || target === 9) return roomLocal(12, target === 8 ? -1.65 : 1.65, 1.65);
  return inspectionPoint(target);
};
export const clientServicePoint = (slot: number): Point => {
  const seat = clientMeetingSeat(slot);
  return [seat.position[0] + (slot % 2 ? .85 : -.85), seat.position[1], FLOOR_HEIGHT];
};
export const cleaningPoint = (roomId: number): Point => roomLocal(roomId, 0, roomId === 0 ? .15 : roomId === 5 ? -2.05 : roomId === 8 ? 1.75 : 2.1);
export const drinkPlacement = (target: number): { position: Point; height: number } => {
  if (target === 6) return { position: [-9.45, 3.03, 0], height: 1.2 };
  if (target === -1) return { position: [ownerDeskPoint[0] - .57, ownerDeskPoint[1] + .15, FLOOR_HEIGHT], height: .84 };
  if (target === 8 || target === 9) return { position: roomLocal(12, target === 8 ? -.58 : .58, .63), height: .83 };
  const d = desks.find(item => item.staffIndex === target);
  if (!d) return { position: roomLocal(12, 0, .75), height: .78 };
  return { position: [d.x + Math.cos(d.rotation) * .57 - Math.sin(d.rotation) * .15, d.z - Math.sin(d.rotation) * .57 - Math.cos(d.rotation) * .15, d.y], height: .84 };
};
export const clientDrinkPlacement = (slot: number): { position: Point; height: number } => ({ position: roomLocal(11, slot % 2 ? .55 : -.55, [-1.35, -.45, .45, 1.35][Math.floor(((slot % 8) + 8) % 8 / 2)]), height: .84 });
export const errandPoint = (index: number): Point => roomLocal(staff[index].roomId, index % 2 ? 2.15 : -2.15, 2.1);
export const arrivalMinute = (index: number) => index === 6 ? 420 : 423 + Math.max(0, lunchSlot(index)) * 2.5;

// Shared furniture bounds keep visual placement and navigation in agreement.
export const furnitureFootprints: Footprint[] = desks.map((d) => ({ x: d.x, z: d.z, w: 1.45, d: .76, floor: d.floor }));
const item = (roomId: number, x: number, z: number, w: number, d: number) => {
  const point = roomLocal(roomId, x, z);
  furnitureFootprints.push({ x: point[0], z: point[1], w, d, floor: rooms[roomId].floor });
};
furnitureFootprints.push({ x: RECEPTION_DESK_POINT[0], z: RECEPTION_DESK_POINT[1], w: 2.25, d: .8, floor: 0 });
item(0, 5.18, -.5, .14, 3.5);
item(0, -4.8, -2.3, 1.5, .55);
item(0, 5.55, 2.25, .55, .55);
item(0, 5.55, -2.25, .55, .55);
item(1, 5.5, -2.45, 1.0, .45);
item(2, 0, -.1, 1.35, 2.5);
furnitureFootprints.push({ x: ownerDeskPoint[0], z: ownerDeskPoint[1], w: 1.45, d: .76, floor: 1 });
item(3, 0, .55, 1.15, .8);
for (const sofa of FOUNDER_SOFAS) {
  item(3, sofa.x + (sofa.x < 0 ? -.44 : .44), sofa.z, .16, 2.2);
  item(3, sofa.x, sofa.z - 1.04, .8, .14);
  item(3, sofa.x, sofa.z + 1.04, .8, .14);
  item(3, sofa.x + (sofa.x < 0 ? .45 : -.45), sofa.z - .78, .85, .65);
}
item(3, 2.65, -2.55, .55, .45);
item(11, 2.7, -1.7, .42, .5);
item(4, HR_TABLE_LOCAL[0], HR_TABLE_LOCAL[1], HR_TABLE_SIZE[0], HR_TABLE_SIZE[1]);
item(4, 2.65, -2.1, .45, .8);
item(5, 0, LUNCH_TABLE_LOCAL[1], LUNCH_TABLE_SIZE[0], LUNCH_TABLE_SIZE[1]);
item(5, 1.3, -2.75, 2, .55);
item(5, -2.2, -2.8, .75, .4);
item(6, -2.3, -1.95, .65, .9);
item(6, -1.35, -1.95, .65, .9);
item(7, 2.65, -2.45, .5, .65);
item(11, 0, 0, CLIENT_TABLE_SIZE[0], CLIENT_TABLE_SIZE[1]);
item(8, 0, -.5, 3.6, .9);
item(8, -2.6, -1.0, .35, 2.8);
item(8, 2.6, -1.0, .35, 2.8);
for (const id of [9, 10]) { item(id, 0, -1.8, .65, .8); item(id, .95, -.8, .35, .5); }
item(12, -2.4, -1.3, .75, 2.4);
item(12, 1.2, -2.65, 2.4, .6);
item(12, 2.35, -.8, .7, 1.15);
item(12, 0, .75, 1.55, .55);
