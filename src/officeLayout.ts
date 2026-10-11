import { rooms, staff } from './worldData.ts';
import type { Point } from './navigation.ts';

export type Seat = { position: Point; rotation: number };
export const ENTRY_POINT: Point = [-7.35, 7.7];
export const RECEPTION_POST: Point = [-7.35, 2.65];
export const roomRotation = (id: number) => rooms[id].center[1] > 0 ? Math.PI : 0;
export const roomLocal = (id: number, x: number, z: number): Point => {
  const room = rooms[id], side = room.center[1] < 0 ? 1 : -1;
  return [room.center[0] + x * side, room.center[1] + z * side];
};
const desk = (roomId: number, dx: number, dz: number, staffIndex: number) => {
  const [x,z] = roomLocal(roomId,dx,dz);
  return {roomId,x,z,rotation:roomRotation(roomId),staffIndex};
};
export const desks = [desk(1,-.9,-.8,0),desk(3,-.85,-.8,1),desk(1,.9,-.8,2),desk(4,-.85,-.8,3),desk(7,-.5,-.8,4),desk(6,1.0,.15,5)];
export function workSeat(index: number): Seat {
  if(index===6) return {position:RECEPTION_POST,rotation:0};
  const d=desks.find(d=>d.staffIndex===index)!;
  return {position:[d.x+Math.sin(d.rotation)*.70,d.z+Math.cos(d.rotation)*.70],rotation:d.rotation+Math.PI};
}
const sharedSeat = (roomId:number,index:number):Seat => {
  const x=index<3?-1.14:1.14, z=[-1,0,1][index%3];
  return {position:roomLocal(roomId,x,z),rotation:roomRotation(roomId)+(index<3?Math.PI/2:-Math.PI/2)};
};
export const meetingSeat=(index:number)=>sharedSeat(2,index);
export const lunchSeat=(index:number)=>sharedSeat(5,index);
export const errandPoint=(index:number):Point=>roomLocal(staff[index].roomId,index%2?1.55:-1.55,1.5);
export const arrivalMinute=(index:number)=>index===6?420:426+index*7;
