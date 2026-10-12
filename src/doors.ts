import { rooms, FLOOR_HEIGHT } from './worldData.ts';
import { roomLocal, INTERIOR_DOOR_WIDTH } from './officeLayout.ts';
import { roomAt, pointDistance } from './navigation.ts';
import type { Point } from './navigation.ts';

export function willUseDoor(roomId: number, point: Point, destination?: Point, motion?: [number, number]): boolean {
  const room = rooms[roomId], threshold = roomLocal(roomId, 0, room.depth / 2);
  if (Math.abs((point[2] ?? 0) - room.floor * FLOOR_HEIGHT) > .25) return false;
  const dx = threshold[0] - point[0], dz = threshold[1] - point[1];
  const distance = Math.hypot(dx, dz), laneWidth = INTERIOR_DOOR_WIDTH / 2 - .2;
  if (distance > 1.3 || Math.abs(dx) > laneWidth) return false;
  const inside = roomAt(point) === roomId;
  if (destination && pointDistance(point, destination) > .05) {
    const destinationInside = roomAt(destination) === roomId;
    if (inside !== destinationInside) return true;
    // Finish clearing the sill after an exit before the leaf closes behind the body.
    const outward = room.center[1] < 0 ? 1 : -1;
    const forward = (destination[1] - point[1]) * outward;
    if (!inside && Math.abs(dz) < .35 && forward > .05 && forward / pointDistance(point, destination) > .45) return true;
  }
  if (!motion) return false;
  const length = Math.hypot(...motion);
  if (length <= .00001) return false;
  if (distance < .35 && Math.abs(motion[1]) / length > .75) return true;
  return distance > .001 && (motion[0] * dx + motion[1] * dz) / (length * distance) > .75;
}
