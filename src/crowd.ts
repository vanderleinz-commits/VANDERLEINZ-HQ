import { findPath, isWalkable, moveAlong, onStairs, pointDistance, elevation } from './navigation.ts';
import type { Point } from './navigation.ts';
import { STAIR_X,STAIR_BOTTOM,STAIR_TOP } from './officeLayout.ts';

export type CrowdPerson = { id: number; position: Point; moving: boolean };
const BODY_SPACE = .52;
const failedDetours = new Map<number, { signature: string; expiresAt: number }>();
const pointKey = (point: Point) => point.map(value => Math.round((value ?? 0) * 100)).join(',');
const detourSignature = (position: Point, path: Point[], people: CrowdPerson[]) => [pointKey(position), pointKey(path[0]), pointKey(path.at(-1)!), ...people.map(person => person.id + ':' + pointKey(person.position) + ':' + Number(person.moving)).sort()].join('|');
export const crowdClear=(candidate:Point, previous:Point, occupiedPoints:Point[],radius=BODY_SPACE)=>occupiedPoints.every(point=>Math.abs(elevation(point)-elevation(candidate))>=.46||pointDistance(candidate,point)>=radius||pointDistance(candidate,point)>=pointDistance(previous,point)-.001);
const clearSegment = (a: Point, b: Point) => Array.from({ length: 5 }, (_, i) => (i + 1) / 5).every(t => isWalkable([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, elevation(a) + (elevation(b) - elevation(a)) * t]));
export function moveInCrowd(position: Point, path: Point[], distance: number, people: CrowdPerson[], id: number) {
  if(path.some(onStairs)){
    const ascending=elevation(path.at(-1)!)>elevation(position)+.00001;
    const original=path.filter((point,i,all)=>!i||!onStairs(point)||!onStairs(all[i-1])||Math.abs(point[1]-all[i-1][1])>.00001);
    const atSideLanding=onStairs(position)&&(Math.abs(position[1]-STAIR_TOP[1])<.00001||Math.abs(position[1]-STAIR_BOTTOM[1])<.00001);
    path=original.flatMap((point,i)=>{if(!onStairs(point))return [point];const endpoint=Math.abs(point[1]-STAIR_TOP[1])<.00001||Math.abs(point[1]-STAIR_BOTTOM[1])<.00001;
      if(atSideLanding&&endpoint&&Math.abs(point[1]-position[1])<.00001)return [[STAIR_X,point[1],elevation(point)] as Point];
      const shifted:Point=[STAIR_X+(ascending?.28:-.28),point[1],elevation(point)];return endpoint&&original[i+1]&&!onStairs(original[i+1])?[shifted,[STAIR_X,point[1],elevation(point)] as Point]:[shifted];});
  }
  const intended = moveAlong(position, path, distance);
  if(!isWalkable(intended.position))return {position,path:findPath(position,path.at(-1)!),distanceUsed:0};
  if (!path.length || intended.distanceUsed <= .00001) return intended;
  const near = people.filter(p => p.id !== id && Math.abs(elevation(p.position) - elevation(position)) < .46 && pointDistance(position, p.position) < distance + 1.3);
  const blocker = near.find(p => pointDistance(intended.position, p.position) < BODY_SPACE && pointDistance(intended.position, p.position) < pointDistance(position, p.position) - .001);
  if (!blocker) { failedDetours.delete(id); return intended; }
  const signature = detourSignature(position, path, people.filter(person => person.id !== id));
  const cached = failedDetours.get(id), now = performance.now();
  // A blocked avatar can request the same route every rendered frame. Retry promptly when any body moves.
  if (cached?.signature === signature && cached.expiresAt > now) return { position, path, distanceUsed: 0 };
  if(!onStairs(position)){
    const detour=findPath(position,path.at(-1)!,people.filter(p=>p.id!==id&&(!p.moving||p.id<id||p.id===blocker.id)).map(p=>p.position));
    if(detour.length){const moved=moveAlong(position,detour,distance);if(crowdClear(moved.position,position,near.map(p=>p.position))){failedDetours.delete(id);return moved;}}
  }
  // The later actor yields sideways while the leader keeps its route. A stationary person always has priority.
  if (!onStairs(position) && (!blocker.moving || id > blocker.id)) {
    const dx = intended.position[0] - position[0], dz = intended.position[1] - position[1], length = Math.hypot(dx, dz);
    if (length > .00001) for (const side of [1, -1]) {
      const amount = Math.min(distance, .3), candidate: Point = [position[0] - dz / length * amount * side, position[1] + dx / length * amount * side, elevation(position)];
      if (!clearSegment(position, candidate) || near.some(p => pointDistance(candidate, p.position) < BODY_SPACE && pointDistance(candidate, p.position) < pointDistance(position, p.position) - .001)) continue;
      const end = path.at(-1)!, route = findPath(candidate, end);
      if (route.length) { failedDetours.delete(id); return { position: candidate, path: route, distanceUsed: amount }; }
    }
  }
  if (failedDetours.size >= 32) failedDetours.delete(failedDetours.keys().next().value!);
  failedDetours.set(id, { signature, expiresAt: now + 200 });
  return { position, path, distanceUsed: 0 };
}
