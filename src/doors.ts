import { rooms, FLOOR_HEIGHT } from './worldData.ts';
import { roomLocal } from './officeLayout.ts';
import { roomAt } from './navigation.ts';
import type { Point } from './navigation.ts';

export function willUseDoor(roomId: number, point: Point, destination?: Point, motion?: [number, number]): boolean {
  const room = rooms[roomId], threshold = roomLocal(roomId, 0, room.depth / 2);
  if (Math.abs((point[2] ?? 0) - room.floor * FLOOR_HEIGHT) > .25) return false;
  const dx = threshold[0] - point[0], dz = threshold[1] - point[1];
  if (Math.hypot(dx, dz) > 1.3) return false;
  if (roomAt(point) === roomId) return true;
  if (destination && roomAt(destination) === roomId && Math.abs(dx) < .8) return true;
  if (!motion || Math.abs(dx) > .6) return false;
  const length = Math.hypot(...motion), distance = Math.hypot(dx, dz);
  return length > .00001 && distance > .001 && (motion[0] * dx + motion[1] * dz) / (length * distance) > .75;
}
