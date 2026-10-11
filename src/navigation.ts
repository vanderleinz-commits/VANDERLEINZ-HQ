import { rooms } from './worldData.ts';
import { desks, roomLocal, meetingSeat, lunchSeat } from './officeLayout.ts';

export type Point = [number, number];
type Rect = { x: number; z: number; w: number; d: number };
export const ROOM_DEPTH = 4.9;
export const ROOM_WIDTH = 4.65;
const radius = 0.25;
const step = 0.2;
const minX = -9.6, minZ = -5.4, columns = 97, rows = 70;
const obstacles: Rect[] = [];
const add = (x: number, z: number, w: number, d: number) => obstacles.push({ x, z, w, d });

// Chairs are interaction anchors; solid desks, tables and walls block travel.
for (const room of rooms) {
  const [x, z] = room.center;
  const doorSide = room.center[1] < 0 ? 1 : -1;
  add(x - ROOM_WIDTH / 2, z, 0.16, ROOM_DEPTH);
  add(x + ROOM_WIDTH / 2, z, 0.16, ROOM_DEPTH);
  if (room.id === 0) {
    add(x-1.825,z-doorSide*ROOM_DEPTH/2,1,.16);
    add(x+1.825,z-doorSide*ROOM_DEPTH/2,1,.16);
  } else add(x, z - doorSide * ROOM_DEPTH / 2, ROOM_WIDTH, 0.16);
  add(x - 1.52, z + doorSide * ROOM_DEPTH / 2, 1.45, 0.16);
  add(x + 1.52, z + doorSide * ROOM_DEPTH / 2, 1.45, 0.16);
  const item = (dx: number, dz: number, w: number, d: number) => add(x + doorSide * dx, z + doorSide * dz, w, d);
  switch (room.id) {
    case 0: add(-7.35,3.5,2.25,.8); item(1.68,.3,.6,1.42); item(-1.83,-1.85,.4,.4); break;
    case 1: item(1.7,-1.92,.6,.43); break;
    case 2: item(0,-.1,1.35,2.5); break;
    case 3: item(1.3,-1.3,1.03,.12); item(1.75,.3,.6,.43); break;
    case 4: item(1.74,-1.25,.6,.43); break;
    case 5: item(0,-.1,1.35,2.5); item(0,-1.96,3.68,.64); break;
    case 6: item(-1.2,-1.23,.7,.87); item(-.25,-1.23,.7,.87); break;
    case 7: item(1.5,-.65,.54,1.25); item(1.8,-1.92,.6,.43); break;
  }
  if (![0,5,6].includes(room.id)) item(room.id === 2 || room.id === 3 ? 1.75 : -1.75,-2,.4,.4);
}
desks.forEach(d=>add(d.x,d.z,1.45,.76));

export function isWalkable([x, z]: Point): boolean {
  return Number.isFinite(x) && Number.isFinite(z) && x >= minX && x <= 9.6 && z >= minZ && z <= 8.4 && (z<=5.55 || (x>=-9.5 && x<=-5.2)) &&
    !obstacles.some((o) => Math.abs(x - o.x) < o.w / 2 + radius && Math.abs(z - o.z) < o.d / 2 + radius);
}
const pointAt = (i: number): Point => [minX + (i % columns) * step, minZ + Math.floor(i / columns) * step];
const free = Array.from({ length: columns * rows }, (_, i) => isWalkable(pointAt(i)));
function nearestIndex(point: Point): number {
  let best = 0, distance = Infinity;
  for (let i = 0; i < free.length; i++) {
    if (!free[i]) continue;
    const p = pointAt(i);
    const d = (p[0] - point[0]) ** 2 + (p[1] - point[1]) ** 2;
    if (d < distance) { best = i; distance = d; }
  }
  return best;
}
export const nearestWalkable = (point: Point): Point => pointAt(nearestIndex(point));
export function roomAt([x, z]: Point): number | null {
  return rooms.find((r) => Math.abs(x - r.center[0]) < ROOM_WIDTH / 2 && Math.abs(z - r.center[1]) < ROOM_DEPTH / 2)?.id ?? null;
}
export function station(roomId: number, index: number): Point {
  if(roomId===2) return meetingSeat(index%6).position;
  if(roomId===5) return lunchSeat(index%6).position;
  return nearestWalkable(roomLocal(roomId,[-1.25,0,1.25][index%3],index<3?1.7:.9));
}

export function findPath(from: Point, to: Point): Point[] {
  if(Math.hypot(from[0]-to[0],from[1]-to[1])<.00001) return [];
  const start = nearestIndex(from), goal = nearestIndex(to);
  const previous = new Int32Array(free.length).fill(-1);
  const queue = [start];
  previous[start] = start;
  for (let head = 0; head < queue.length && previous[goal] === -1; head++) {
    const current = queue[head];
    for (const next of [current - 1, current + 1, current - columns, current + columns]) {
      if (next < 0 || next >= free.length || !free[next] || previous[next] !== -1) continue;
      if (Math.abs(next - current) === 1 && Math.floor(next / columns) !== Math.floor(current / columns)) continue;
      previous[next] = current;
      queue.push(next);
    }
  }
  if (previous[goal] === -1) return [];
  const route: Point[] = [];
  for (let cursor = goal; cursor !== start; cursor = previous[cursor]) route.push(pointAt(cursor));
  route.push(pointAt(start));
  route.reverse();
  if(isWalkable(to) && Math.hypot(route[route.length-1][0]-to[0],route[route.length-1][1]-to[1])>.00001) route.push([...to]);
  if (Math.hypot(route[0][0] - from[0], route[0][1] - from[1]) < 0.00001) route.shift();
  return route;
}

export function moveAlong(position: Point, path: Point[], distance: number): { position: Point; path: Point[]; distanceUsed: number } {
  const available = distance;
  let current: Point = [...position], index = 0;
  while (index < path.length && distance > 0) {
    const target = path[index];
    const length = Math.hypot(target[0] - current[0], target[1] - current[1]);
    if (length <= distance) { current = target; distance -= length; index++; }
    else { current = [current[0] + (target[0] - current[0]) / length * distance, current[1] + (target[1] - current[1]) / length * distance]; distance = 0; }
  }
  return { position: current, path: path.slice(index), distanceUsed: available - distance };
}

export function moveAvatar(position: Point, dx: number, dz: number): Point {
  // Substeps prevent tunnelling through furniture after a slow frame.
  const count = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.08));
  let p: Point = [...position];
  for (let i = 0; i < count; i++) {
    const x: Point = [p[0] + dx / count, p[1]];
    if (isWalkable(x)) p = x;
    const z: Point = [p[0], p[1] + dz / count];
    if (isWalkable(z)) p = z;
  }
  return p;
}
