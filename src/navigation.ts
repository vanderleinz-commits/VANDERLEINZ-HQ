import { rooms, FLOOR_HEIGHT, WORLD_BOUNDS } from './worldData.ts';
import { furnitureFootprints, roomLocal, meetingSeat, lunchSeat, ENTRY_POINT, INTERIOR_DOOR_WIDTH, MAIN_DOOR_WIDTH, STAIR_X, STAIR_WIDTH, STAIR_BOTTOM, STAIR_TOP } from './officeLayout.ts';

export type Point = [number, number, number?];
type Rect = { x: number; z: number; w: number; d: number; floor: 0 | 1 };
export const ROOM_DEPTH = 6.24;
export const ROOM_WIDTH = 6.24;
const radius = .25, step = .2;
const minX = WORLD_BOUNDS.minX, minZ = -7.4, columns = 167, rows = 93;
const obstacles: Rect[] = [...furnitureFootprints];
const add = (x: number, z: number, w: number, d: number, floor: 0 | 1) => obstacles.push({ x, z, w, d, floor });
export const elevation = (point: Point) => point[2] ?? 0;
export const floorOf = (point: Point): 0 | 1 => elevation(point) >= FLOOR_HEIGHT / 2 ? 1 : 0;
export const pointDistance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1], elevation(a) - elevation(b));
const stairElevation = (z: number) => Math.max(0, Math.min(FLOOR_HEIGHT, (STAIR_BOTTOM[1] - z) / (STAIR_BOTTOM[1] - STAIR_TOP[1]) * FLOOR_HEIGHT));
const stairStrip = (point: Point) => Math.abs(point[0] - STAIR_X) <= STAIR_WIDTH / 2 - radius && point[1] >= STAIR_TOP[1] - .00001 && point[1] <= STAIR_BOTTOM[1] + .00001;
export const onStairs = (point: Point) => stairStrip(point) && Math.abs(elevation(point) - stairElevation(point[1])) < .025;

// Doors face the central hall. Reception also has a wide outer entrance.
for (const room of rooms) {
  const [x, z] = room.center, doorSide = z < 0 ? 1 : -1;
  add(x - room.width / 2, z, .16, room.depth, room.floor);
  add(x + room.width / 2, z, .16, room.depth, room.floor);
  const splitWall = (wallZ: number, opening: number) => {
    const piece = (room.width - opening) / 2;
    add(x - opening / 2 - piece / 2, wallZ, piece, .16, room.floor);
    add(x + opening / 2 + piece / 2, wallZ, piece, .16, room.floor);
  };
  if (room.id === 0) splitWall(z - doorSide * room.depth / 2, MAIN_DOOR_WIDTH);
  else add(x, z - doorSide * room.depth / 2, room.width, .16, room.floor);
  splitWall(z + doorSide * room.depth / 2, INTERIOR_DOOR_WIDTH);
}
export function isWalkable(point: Point): boolean {
  const [x, z] = point, y = elevation(point);
  if (!Number.isFinite(x) || !Number.isFinite(z) || !Number.isFinite(y)) return false;
  if (onStairs(point)) return true;
  const floor = floorOf(point);
  if (Math.abs(y - floor * FLOOR_HEIGHT) > .025) return false;
  if (floor === 0) {
    if (x < WORLD_BOUNDS.minX || x > WORLD_BOUNDS.maxX || z < WORLD_BOUNDS.minZ || z > WORLD_BOUNDS.outsideMaxZ) return false;
    if (z > WORLD_BOUNDS.maxZ && Math.abs(x - ENTRY_POINT[0]) > 2.8) return false;
    if (Math.abs(x - STAIR_X) < STAIR_WIDTH / 2 + radius && z > STAIR_TOP[1] && z < STAIR_BOTTOM[1] - .00001) return false;
  } else {
    if (x < WORLD_BOUNDS.minX || x > WORLD_BOUNDS.upperMaxX || z < WORLD_BOUNDS.minZ || z > WORLD_BOUNDS.upperMaxZ) return false;
    if (Math.abs(x - STAIR_X) < STAIR_WIDTH / 2 + radius && z > STAIR_TOP[1] + .00001) return false;
  }
  return !obstacles.some((o) => o.floor === floor && Math.abs(x - o.x) < o.w / 2 + radius && Math.abs(z - o.z) < o.d / 2 + radius);
}
const pointAt = (index: number, floor: 0 | 1): Point => [minX + (index % columns) * step, minZ + Math.floor(index / columns) * step, floor * FLOOR_HEIGHT];
const free = ([0, 1] as const).map((floor) => Array.from({ length: columns * rows }, (_, index) => isWalkable(pointAt(index, floor))));
const PERSON_CLEARANCE = .52;
function segmentWalkable(a: Point, b: Point, occupied: Point[] = []): boolean {
  const count = Math.max(1, Math.ceil(pointDistance(a, b) / .06));
  const clearances = occupied.map(point => Math.min(PERSON_CLEARANCE, pointDistance(a, point)));
  for (let index = 1; index <= count; index++) {
    const t = index / count;
    const point: Point = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, elevation(a) + (elevation(b) - elevation(a)) * t];
    if (!isWalkable(point) || occupied.some((other, i) => pointDistance(point, other) < clearances[i] - .00001)) return false;
  }
  return true;
}
function nearestIndex(point: Point, floor: 0 | 1, available = free[floor], occupied: Point[] = []): number {
  let best = 0, distance = Infinity;
  const requireConnection = isWalkable(point) && Math.abs(elevation(point) - floor * FLOOR_HEIGHT) < .025;
  const gx = Math.round((point[0] - minX) / step), gz = Math.round((point[1] - minZ) / step);
  const nearby = [-1, 0, 1].flatMap(dx => [-1, 0, 1].map(dz => [gx + dx, gz + dz])).filter(([x, z]) => x >= 0 && x < columns && z >= 0 && z < rows)
    .map(([x, z]) => z * columns + x).sort((a, b) => pointDistance(point, pointAt(a, floor)) - pointDistance(point, pointAt(b, floor)));
  for (const index of nearby) if (available[index] && (!requireConnection || segmentWalkable(point, pointAt(index, floor), occupied))) return index;
  for (let index = 0; index < available.length; index++) {
    if (!available[index]) continue;
    const candidate = pointAt(index, floor);
    const d = (candidate[0] - point[0]) ** 2 + (candidate[1] - point[1]) ** 2;
    if (d < distance && (!requireConnection || segmentWalkable(point, candidate, occupied))) { best = index; distance = d; }
  }
  return best;
}
export const nearestWalkable = (point: Point): Point => onStairs(point) ? [...point] : pointAt(nearestIndex(point, floorOf(point)), floorOf(point));
export function roomAt(point: Point): number | null {
  if (Math.abs(elevation(point) - floorOf(point) * FLOOR_HEIGHT) > .025 || onStairs(point)) return null;
  return rooms.find((room) => room.floor === floorOf(point) && Math.abs(point[0] - room.center[0]) < room.width / 2 && Math.abs(point[1] - room.center[1]) < room.depth / 2)?.id ?? null;
}
export function station(roomId: number, index: number): Point {
  if (roomId === 2) return meetingSeat(index % 7).position;
  if (roomId === 5) return lunchSeat(index % 10).position;
  const room = rooms[roomId];
  return nearestWalkable(roomLocal(roomId, [-Math.min(1.25, room.width / 2 - .5), 0, Math.min(1.25, room.width / 2 - .5)][index % 3], index < 3 ? 1.7 : .9));
}
function floorPath(from: Point, to: Point, floor: 0 | 1, occupied: Point[] = []): Point[] {
  if (pointDistance(from, to) < .00001) return [];
  const blockers = occupied.filter(point => floorOf(point) === floor && !onStairs(point) && pointDistance(from, point) > .08);
  if (blockers.some(point => pointDistance(to, point) < PERSON_CLEARANCE)) return [];
  if (isWalkable(from) && segmentWalkable(from, to, blockers)) return [[...to]];
  // A small margin keeps adjacent grid edges outside the occupied circles as well.
  const available = blockers.length ? free[floor].map((walkable, index) => walkable && !blockers.some(point => pointDistance(pointAt(index, floor), point) < PERSON_CLEARANCE + .015)) : free[floor];
  const start = nearestIndex(from, floor, available, blockers), goal = nearestIndex(to, floor, available, blockers);
  if (!available[start] || !available[goal]) return [];
  const previous = new Int32Array(free[floor].length).fill(-1), queue = [start];
  previous[start] = start;
  for (let head = 0; head < queue.length && previous[goal] === -1; head++) {
    const current = queue[head];
    for (const next of [current - 1, current + 1, current - columns, current + columns]) {
      if (next < 0 || next >= available.length || !available[next] || previous[next] !== -1) continue;
      if (Math.abs(next - current) === 1 && Math.floor(next / columns) !== Math.floor(current / columns)) continue;
      previous[next] = current; queue.push(next);
    }
  }
  if (previous[goal] === -1) return [];
  const route: Point[] = [];
  for (let cursor = goal; cursor !== start; cursor = previous[cursor]) route.push(pointAt(cursor, floor));
  route.push(pointAt(start, floor)); route.reverse();
  if (isWalkable(to)) {
    if (pointDistance(route.at(-1)!, to) > .00001) route.push([...to]);
    else route[route.length - 1] = [...to];
  }
  if (pointDistance(route[0], from) < .00001) route.shift();
  const corners = route.filter((point, index) => {
    if (index === 0 || index === route.length - 1) return true;
    const before = route[index - 1], after = route[index + 1];
    return Math.abs((point[0] - before[0]) * (after[1] - point[1]) - (point[1] - before[1]) * (after[0] - point[0])) > .00001;
  });
  const smooth: Point[] = [];
  let cursor = from, next = 0;
  while (next < corners.length) {
    let farthest = next;
    for (let candidate = corners.length - 1; candidate > next; candidate--) if (segmentWalkable(cursor, corners[candidate], blockers)) { farthest = candidate; break; }
    smooth.push(corners[farthest]); cursor = corners[farthest]; next = farthest + 1;
  }
  return smooth;
}
function stairPath(from: Point, to: Point): Point[] {
  const count = Math.max(1, Math.ceil(pointDistance(from, to) / .22));
  return Array.from({ length: count }, (_, index): Point => {
    const t = (index + 1) / count;
    return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, elevation(from) + (elevation(to) - elevation(from)) * t];
  });
}
const rampInterior = (point: Point) => onStairs(point) && elevation(point) > .025 && elevation(point) < FLOOR_HEIGHT - .025;
export function findPath(from: Point, to: Point, occupied: Point[] = []): Point[] {
  if (!isWalkable(to)) return [];
  if (pointDistance(from, to) < .00001) return [];
  if (rampInterior(from) && rampInterior(to)) return stairPath(from, to);
  if (rampInterior(from)) {
    const landing = floorOf(to) === 1 ? STAIR_TOP : STAIR_BOTTOM;
    const after = floorPath(landing, to, floorOf(to), occupied);
    return after.length || pointDistance(landing, to) < .01 ? [...stairPath(from, landing), ...after] : [];
  }
  if (rampInterior(to)) {
    const landing = floorOf(from) === 1 ? STAIR_TOP : STAIR_BOTTOM;
    const before = floorPath(from, landing, floorOf(from), occupied);
    return before.length || pointDistance(from, landing) < .01 ? [...before, ...stairPath(landing, to)] : [];
  }
  const fromFloor = floorOf(from), toFloor = floorOf(to);
  if (fromFloor === toFloor) return floorPath(from, to, fromFloor, occupied);
  const entrance = fromFloor === 0 ? STAIR_BOTTOM : STAIR_TOP, exit = fromFloor === 0 ? STAIR_TOP : STAIR_BOTTOM;
  const before = floorPath(from, entrance, fromFloor, occupied), after = floorPath(exit, to, toFloor, occupied);
  if ((!before.length && pointDistance(from, entrance) > .01) || (!after.length && pointDistance(exit, to) > .01)) return [];
  return [...before, ...stairPath(entrance, exit), ...after];
}
export function moveAlong(position: Point, path: Point[], distance: number): { position: Point; path: Point[]; distanceUsed: number } {
  const available = Math.max(0, distance);
  let remaining = available, current: Point = [...position], index = 0;
  while (index < path.length && remaining > 0) {
    const target = path[index], length = pointDistance(current, target);
    if (length <= remaining) { current = [...target]; remaining -= length; index++; }
    else {
      const t = remaining / length;
      current = [current[0] + (target[0] - current[0]) * t, current[1] + (target[1] - current[1]) * t, elevation(current) + (elevation(target) - elevation(current)) * t];
      remaining = 0;
    }
  }
  return { position: current, path: path.slice(index), distanceUsed: available - remaining };
}
function avatarCandidate(current: Point, x: number, z: number): Point {
  const flat: Point = [x, z, floorOf(current) * FLOOR_HEIGHT];
  const inStrip = Math.abs(x - STAIR_X) <= STAIR_WIDTH / 2 - radius && z >= STAIR_TOP[1] && z <= STAIR_BOTTOM[1];
  if (rampInterior(current)) return inStrip ? [x, z, stairElevation(z)] : z <= STAIR_TOP[1] ? [x, z, FLOOR_HEIGHT] : z >= STAIR_BOTTOM[1] ? [x, z, 0] : [x, z, elevation(current)];
  if (inStrip && ((floorOf(current) === 0 && current[1] >= STAIR_BOTTOM[1] - .08) || (floorOf(current) === 1 && current[1] <= STAIR_TOP[1] + .08))) return [x, z, stairElevation(z)];
  return flat;
}
export function moveAvatar(position: Point, dx: number, dz: number): Point {
  const count = Math.max(1, Math.ceil(Math.hypot(dx, dz) / .06));
  let point: Point = [...position];
  for (let index = 0; index < count; index++) {
    const x = avatarCandidate(point, point[0] + dx / count, point[1]);
    if (isWalkable(x) && Math.abs(elevation(x) - elevation(point)) <= .12) point = x;
    const z = avatarCandidate(point, point[0], point[1] + dz / count);
    if (isWalkable(z) && Math.abs(elevation(z) - elevation(point)) <= .12) point = z;
  }
  return point;
}
