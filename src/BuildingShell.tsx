import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { rooms, FLOOR_HEIGHT } from './worldData';
import type { Room } from './worldData';

export type FloorView = 0 | 1 | 'all';
type Vec3 = [number, number, number];

function Block({ position, size, color, metalness = 0 }: { position: Vec3; size: Vec3; color: string; metalness?: number }) {
  return <mesh position={position} castShadow receiveShadow><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={metalness ? 0.4 : 0.85} metalness={metalness} /></mesh>;
}
function Rail({ from, to, radius = 0.028, color = '#607e99' }: { from: Vec3; to: Vec3; radius?: number; color?: string }) {
  const start = new THREE.Vector3(...from), end = new THREE.Vector3(...to), direction = end.clone().sub(start);
  const midpoint = start.add(end).multiplyScalar(0.5), rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  return <mesh position={midpoint} quaternion={rotation} castShadow><cylinderGeometry args={[radius, radius, direction.length(), 8]} /><meshStandardMaterial color={color} metalness={0.35} roughness={0.4} /></mesh>;
}
function RoomLabel({ room, selected }: { room: Room; selected: boolean }) {
  const text = `${room.icon}  ${room.name}`;
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = selected ? '#234b70' : '#f3f7fa'; context.beginPath(); context.roundRect(2, 2, 764, 124, 24); context.fill();
      context.lineWidth = 3; context.strokeStyle = selected ? '#a9cde9' : '#b5cddd'; context.stroke();
      context.fillStyle = selected ? '#f4f9fc' : '#45667f'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.font = '600 46px Arial'; context.fillText(text, 384, 67, 706);
    }
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; return map;
  }, [text, selected]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <sprite scale={[Math.max(1.85, Math.min(3.7, text.length * 0.125 + 0.4)), 0.42, 1]} renderOrder={10}><spriteMaterial map={texture} transparent depthTest={false} depthWrite={false} toneMapped={false} /></sprite>;
}
function RoomWalls({ room, selected, onSelect }: { room: Room; selected: boolean; onSelect: () => void }) {
  const [x, z] = room.center, width = room.width, depth = room.depth, y = room.floor * FLOOR_HEIGHT;
  const side = z < 0 ? 1 : -1, height = 1.72, doorWidth = 1.5, segment = (width - doorWidth) / 2;
  const wallColor = selected ? '#e3eff8' : room.id === 3 || room.id === 7 ? '#d7e6f0' : '#dce9f1';
  return <group position={[x, y, z]}>
    <mesh onClick={(event) => { event.stopPropagation(); if (event.delta < 5) onSelect(); }} position={[0, 0.055, 0]} receiveShadow><boxGeometry args={[width, 0.12, depth]} /><meshStandardMaterial color={room.tint} roughness={0.95} emissive={selected ? '#a8c3d9' : '#000000'} emissiveIntensity={selected ? 0.15 : 0} /></mesh>
    {room.id === 0 ? [-1, 1].map((s) => <Block key={s} position={[s * (width + 2.65) / 4, height / 2, -side * depth / 2]} size={[(width - 2.65) / 2, height, 0.14]} color={wallColor} />) : <Block position={[0, height / 2, -side * depth / 2]} size={[width, height, 0.14]} color={wallColor} />}
    {[-1, 1].map((s) => <group key={s}>
      <Block position={[s * width / 2, height / 2, 0]} size={[0.14, height, depth]} color={wallColor} />
      <Block position={[s * (width + doorWidth) / 4, height / 2, side * depth / 2]} size={[segment, height, 0.14]} color={wallColor} />
      <Block position={[s * width / 2, 0.24, 0]} size={[0.17, 0.15, depth]} color="#92aec2" />
      <Block position={[s * width / 2, height + 0.01, 0]} size={[0.2, 0.07, depth]} color="#b3cadb" />
      <Block position={[s * (width + doorWidth) / 4, 0.24, side * depth / 2]} size={[segment, 0.15, 0.17]} color="#91aec3" />
    </group>)}
    <Block position={[0, 0.08, side * depth / 2]} size={[doorWidth, 0.04, 0.19]} color="#9eb8cc" />
    {room.id !== 0 && <>
      <Block position={[0, height + 0.01, -side * depth / 2]} size={[width, 0.07, 0.2]} color="#b3cadb" />
      <Block position={[0, 0.24, -side * depth / 2]} size={[width, 0.15, 0.17]} color="#91aec3" />
      {![9, 10].includes(room.id) && <group position={[0, 1.09, -side * (depth / 2 - 0.084)]}>
        <mesh><boxGeometry args={[Math.min(2.05, width - 0.65), 0.68, 0.032]} /><meshStandardMaterial color="#a3c9de" metalness={0.12} roughness={0.22} /></mesh>
        <Block position={[0, 0, side * 0.02]} size={[0.035, 0.71, 0.047]} color="#edf4f7" />
        {[-0.35, 0.35].map((dy) => <Block key={dy} position={[0, dy, side * 0.02]} size={[Math.min(2.12, width - 0.58), 0.04, 0.055]} color="#c9dce9" />)}
      </group>}
    </>}
    <group position={[0, 2.11, side * (depth / 2 - 0.21)]}><RoomLabel room={room} selected={selected} /></group>
  </group>;
}
function Stairs() {
  const count = 18, length = 4.8, rise = FLOOR_HEIGHT / count;
  return <group>
    {Array.from({ length: count }, (_, i) => {
      const height = (i + 1) * rise, z = 5.3 - (i + 0.5) * length / count;
      return <group key={i}><Block position={[10.5, height / 2, z]} size={[1.8, height, length / count + 0.006]} color="#afc3d5" /><Block position={[10.5, height + 0.01, z]} size={[1.85, 0.03, length / count + 0.02]} color="#d6e5ee" /><Block position={[10.5, height + 0.029, z + length / count / 2 - 0.025]} size={[1.74, 0.009, 0.018]} color="#6588a3" /></group>;
    })}
    {[-1, 1].map((side) => <group key={side}>
      <Rail from={[10.5 + side * 0.96, 1.02, 5.26]} to={[10.5 + side * 0.96, FLOOR_HEIGHT + 1.02, 0.47]} radius={0.036} color="#668ca9" />
      {[0, 3, 6, 9, 12, 15, 17].map((i) => { const height = (i + 1) * rise, z = 5.3 - (i + 0.5) * length / count; return <Rail key={i} from={[10.5 + side * 0.96, height, z]} to={[10.5 + side * 0.96, height + 0.9, z]} radius={0.024} />; })}
    </group>)}
    <Block position={[10.5, 0.08, 5.52]} size={[2.2, 0.15, 0.46]} color="#a0bace" />
  </group>;
}
function BalconyRails() {
  return <group>
    {[{ x: -1.45, w: 21.7 }, { x: 11.95, w: 0.7 }].map(({ x, w }) => <group key={x}>
      <mesh position={[x, FLOOR_HEIGHT + 0.57, 0.94]}><boxGeometry args={[w, 0.87, 0.034]} /><meshStandardMaterial color="#c0dceb" transparent opacity={0.28} roughness={0.18} depthWrite={false} /></mesh>
      <Block position={[x, FLOOR_HEIGHT + 1.04, 0.94]} size={[w, 0.055, 0.075]} color="#7395ae" metalness={0.2} />
      {Array.from({ length: Math.ceil(w / 2.2) + 1 }, (_, i) => <Block key={i} position={[x - w / 2 + i * w / Math.ceil(w / 2.2), FLOOR_HEIGHT + 0.6, 0.94]} size={[0.043, 0.99, 0.065]} color="#7596ad" metalness={0.15} />)}
    </group>)}
  </group>;
}

export function BuildingShell({ floorView, selectedRoom, onSelectRoom }: { floorView: FloorView; selectedRoom: number; onSelectRoom: (id: number) => void }) {
  const upper = floorView !== 0;
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.49, 0]} receiveShadow><planeGeometry args={[200, 200]} /><meshStandardMaterial color="#b9d1dc" roughness={1} /></mesh>
    <Block position={[0, -0.25, 0]} size={[25.0, 0.48, 12.15]} color="#7198b5" />
    <Block position={[0, 0.025, 0]} size={[24.6, 0.085, 11.8]} color="#e4edf3" />
    <Block position={[0, -0.04, 5.94]} size={[24.85, 0.15, 0.12]} color="#386582" />
    {upper && <>
      <Block position={[-1.4, FLOOR_HEIGHT - 0.16, -2.5]} size={[21.8, 0.28, 6.8]} color="#9eb7cb" />
      <Block position={[11.95, FLOOR_HEIGHT - 0.16, -2.5]} size={[0.7, 0.28, 6.8]} color="#9eb7cb" />
      <Block position={[10.5, FLOOR_HEIGHT - 0.16, -2.7]} size={[2.0, 0.28, 6.4]} color="#9eb7cb" />
      <Block position={[-1.4, FLOOR_HEIGHT + 0.014, -2.5]} size={[21.8, 0.06, 6.8]} color="#e7eff5" />
      <Block position={[11.95, FLOOR_HEIGHT + 0.014, -2.5]} size={[0.7, 0.06, 6.8]} color="#e7eff5" />
      <Block position={[10.5, FLOOR_HEIGHT + 0.014, -2.7]} size={[2.0, 0.06, 6.4]} color="#e7eff5" />
      <Block position={[-1.4, FLOOR_HEIGHT - 0.23, 0.86]} size={[21.8, 0.35, 0.22]} color="#6e92ad" />
      {[-12.14, 12.14].flatMap((x) => [-5.75, 0.7].map((z) => <Block key={`${x}${z}`} position={[x, FLOOR_HEIGHT / 2 - 0.08, z]} size={[0.18, FLOOR_HEIGHT - 0.08, 0.18]} color="#98b4c8" />))}
      <BalconyRails />
    </>}
    {rooms.filter((room) => floorView === 'all' || room.floor === floorView).map((room) => <RoomWalls key={room.id} room={room} selected={selectedRoom === room.id} onSelect={() => onSelectRoom(room.id)} />)}
    <Stairs />
  </group>;
}
