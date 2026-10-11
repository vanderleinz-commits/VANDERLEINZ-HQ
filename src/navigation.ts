import { rooms } from './worldData.ts';

export type Point = [number, number];
type Rect = { x: number; z: number; w: number; d: number };
export const ROOM_DEPTH = 4.9;
export const ROOM_WIDTH = 4.65;
const radius = 0.25;
const step = 0.2;
const minX = -9.6, minZ = -5.4, columns = 97, rows = 55;
const obstacles: Rect[] = [];
const add = (x: number, z: number, w: number, d: number) => obstacles.push({ x, z, w, d });

// The two rows open onto the shared central corridor. Footprints include chairs.
for (const room of rooms) {
  const [x, z] = room.center;
  const doorSide = room.id < 4 ? 1 : -1;
  add(x - ROOM_WIDTH / 2, z, 0.16, ROOM_DEPTH);
  add(x + ROOM_WIDTH / 2, z, 0.16, ROOM_DEPTH);
  add(x, z - doorSide * ROOM_DEPTH / 2, ROOM_WIDTH, 0.16);
  add(x - 1.52, z + doorSide * ROOM_DEPTH / 2, 1.45, 0.16);
  add(x + 1.52, z + doorSide * ROOM_DEPTH / 2, 1.45, 0.16);
  const item = (dx: number, dz: number, w: number, d: number) => add(x + doorSide * dx, z + doorSide * dz, w, d);
  const desk = (dx: number, dz: number) => { item(dx, dz, 1.45, 0.76); item(dx, dz + 0.83, 0.55, 0.6); };
  switch (room.id) {
    case 0: item(0, -0.65, 2.25, 0.85); item(1.2, -0.9, 0.55, 0.6); break;
    case 1: desk(-0.85, -0.7); desk(0.95, -0.7); break;
    case 2: item(0, -0.2, 1.48, 1.48); item(-1.15, -0.55, 0.6, 0.55); item(1.15, -0.55, 0.6, 0.55); item(0, -1.15, 0.55, 0.6); item(0, 0.95, 0.55, 0.6); break;
    case 3: desk(-0.95, -0.75); item(1.05, -1.25, 0.85, 0.65); break;
    case 4: desk(-0.95, -0.85); desk(0.85, -0.85); item(1.65, -1.3, 0.46, 1.2); break;
    case 5: item(-0.65, -0.9, 1.55, 0.8); item(0.45, 0.25, 1.04, 1.04); item(1.35, -0.7, 0.65, 0.65); break;
    case 6: item(-1.15, -1.2, 0.72, 0.95); item(0.1, -1.2, 0.72, 0.95); desk(1.25, 0.45); break;
    case 7: desk(-0.35, -0.85); item(1.15, -1.55, 1.55, 0.8); break;
  }
  if (room.id !== 6) item(room.id === 2 || room.id === 3 ? 1.6 : -1.6, -1.95, 0.55, 0.55);
}

export function isWalkable([x, z]: Point): boolean {
  return Number.isFinite(x) && Number.isFinite(z) && x >= minX && x <= 9.6 && z >= minZ && z <= 5.4 &&
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
  const [x, z] = rooms[roomId].center;
  // Individual standing spots keep the team readable in shared rooms.
  return nearestWalkable([x + [-1.25, 0, 1.25][index % 3], z + (roomId < 4 ? 1 : -1) * (index < 3 ? 1.7 : 0.85)]);
}

export function findPath(from: Point, to: Point): Point[] {
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
