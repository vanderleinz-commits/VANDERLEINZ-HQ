import { useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Room } from './worldData';
import type { Simulation } from './simulation';
import { ROOM_DEPTH, roomAt } from './navigation';
import type { Point } from './navigation';

export function daylight(minute: number): number {
  return Math.max(0, Math.min(1, Math.sin((minute / 1440 - 0.25) * Math.PI * 2) * 1.3));
}
export function OfficeLighting({ minute }: { minute: number }) {
  const sun = daylight(minute);
  return <>
    <hemisphereLight args={['#fff8e9', '#8499a2', 1.2 + sun * 0.95]} />
    <ambientLight color={sun > 0.2 ? '#f9f3e8' : '#c2d7f5'} intensity={0.45} />
    <directionalLight castShadow position={[-9, 18, 11]} color={sun > 0.3 ? '#fff4dd' : '#b7d3ef'} intensity={0.7 + sun * 1.6} shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-22} shadow-camera-right={22} shadow-camera-top={18} shadow-camera-bottom={-18} shadow-bias={-0.0002} />
    <pointLight position={[1, 10, -7]} color="#fff1cd" intensity={65 + (1 - sun) * 35} distance={34} />
  </>;
}
type Props = { room: Room; simulation: Simulation; speed: number; reducedMotion: boolean; avatar: RefObject<Point>; avatarActive: boolean };
export function RoomLife({ room, simulation, speed, reducedMotion, avatar, avatarActive }: Props) {
  const door = useRef<THREE.Group>(null), rotor = useRef<THREE.Group>(null), steam = useRef<THREE.Group>(null);
  const mobile = useRef<THREE.Group>(null), clockHand = useRef<THREE.Group>(null);
  const monitor = useRef<THREE.MeshStandardMaterial>(null), lamp = useRef<THREE.MeshStandardMaterial>(null);
  const phase = useRef(room.id * 0.4);
  const side = room.id < 4 ? 1 : -1;
  const occupied = simulation.npcs.some((n) => roomAt(n.position) === room.id);
  const collaborating = simulation.encounters.some((e) => e.roomId === room.id && e.phase === 'talking');
  useFrame((_, delta) => {
    const t = phase.current;
    if (speed > 0) phase.current += Math.min(delta, 0.1) * Math.min(speed, 2);
    const threshold: Point = [room.center[0], room.center[1] + side * ROOM_DEPTH / 2];
    const near = simulation.npcs.some((n) => Math.hypot(n.position[0] - threshold[0], n.position[1] - threshold[1]) < 1.5) || avatarActive && Math.hypot(avatar.current[0] - threshold[0], avatar.current[1] - threshold[1]) < 1.5;
    // Doors respond to the Avatar even while the office simulation is paused.
    if (door.current && (speed > 0 || avatarActive || reducedMotion)) door.current.rotation.y = reducedMotion ? (near ? -Math.PI / 2 : 0) : THREE.MathUtils.damp(door.current.rotation.y, near ? -Math.PI / 2 : 0, 9, delta);
    if (speed === 0) return;
    const motion = reducedMotion ? 0 : 1;
    if (rotor.current) rotor.current.rotation.z = t * 6 * motion;
    if (mobile.current) { mobile.current.rotation.y = Math.sin(t * 0.7) * 0.22 * motion; mobile.current.position.y = 1.2 + Math.sin(t * 1.8) * 0.08 * motion; }
    if (steam.current) steam.current.children.forEach((particle, i) => { const p = (t * 0.35 + i / 3) % 1; particle.position.y = p * 0.6; particle.position.x = Math.sin(t * 2 + i) * 0.08 * motion; particle.scale.setScalar(reducedMotion ? 0.75 : 0.4 + p); });
    if (monitor.current) monitor.current.emissiveIntensity = occupied ? 0.3 + Math.sin(t * (collaborating ? 4 : 2)) * 0.1 * motion : 0.03;
    if (lamp.current) lamp.current.emissiveIntensity = 0.15 + (1 - daylight(simulation.gameMinute)) * 0.6;
    if (clockHand.current) clockHand.current.rotation.z = -simulation.gameMinute % 60 / 60 * Math.PI * 2;
  });
  return <group position={[room.center[0], 0, room.center[1]]} rotation={[0, side === 1 ? 0 : Math.PI, 0]}>
    <group position={[-0.75, 0, ROOM_DEPTH / 2]}>
      <group ref={door}><mesh position={[0.75, 0.85, 0]}><boxGeometry args={[1.46, 1.5, 0.055]} /><meshStandardMaterial color="#aacbd0" transparent opacity={0.3} roughness={0.3} depthWrite={false} /></mesh><mesh position={[1.32, 0.85, 0.06]}><sphereGeometry args={[0.047, 8, 6]} /><meshStandardMaterial color="#b99762" /></mesh></group>
    </group>
    <mesh position={[-1.9, 1.3, -1.75]} castShadow><cylinderGeometry args={[0.035, 0.035, 2.3, 8]} /><meshStandardMaterial color="#ba9b78" /></mesh>
    <mesh position={[-1.9, 2.2, -1.75]}><coneGeometry args={[0.28, 0.28, 12]} /><meshStandardMaterial ref={lamp} color="#f7e9c7" emissive="#efcc7e" emissiveIntensity={0.25} /></mesh>
    {[1, 4, 6, 7].includes(room.id) && <mesh position={[room.id === 6 ? 1.25 : room.id === 7 ? -0.35 : room.id === 4 ? -0.95 : -0.85, 1.12, room.id === 6 ? 0.29 : room.id === 1 ? -0.86 : -1.01]}><boxGeometry args={[0.36, 0.23, 0.025]} /><meshStandardMaterial ref={monitor} color="#9ac6cc" emissive="#82c5ce" emissiveIntensity={0.3} /></mesh>}
    {(room.id === 0 || room.id === 7) && <group position={[1.4, 1.22, -2.33]}><mesh><torusGeometry args={[0.225, 0.024, 6, 24]} /><meshStandardMaterial color="#c6a175" /></mesh><mesh><circleGeometry args={[0.21, 24]} /><meshStandardMaterial color="#fbf4e2" side={THREE.DoubleSide} /></mesh><group ref={clockHand} rotation={[0, 0, -simulation.gameMinute % 60 / 60 * Math.PI * 2]}><mesh position={[0, 0.07, 0.03]}><boxGeometry args={[0.018, 0.15, 0.01]} /><meshStandardMaterial color="#5e8290" /></mesh></group></group>}
    {room.id === 2 && <group position={[1.2, 1.2, -2.33]}><mesh><boxGeometry args={[1.2, 0.65, 0.06]} /><meshStandardMaterial color="#fbf6e8" /></mesh>{[0, 1, 2].map((i) => <mesh key={i} position={[-0.35 + i * 0.34, -0.13 + i * 0.06, 0.04]}><boxGeometry args={[0.19, 0.18 + i * 0.12, 0.025]} /><meshStandardMaterial ref={i === 2 ? monitor : undefined} color={['#d3aa80', '#a7bcaa', '#91b5c2'][i]} emissive="#82c5ce" emissiveIntensity={0.15} /></mesh>)}</group>}
    {(room.id === 3 || room.id === 4) && <group ref={mobile} position={[1.15, 1.2, -1.25]}>{[0, 1, 2].map((i) => <mesh key={i} position={[Math.cos(i * 2.1) * 0.18, Math.sin(i * 2.1) * 0.15, Math.sin(i * 2.1) * 0.15]}><icosahedronGeometry args={[0.1, 0]} /><meshStandardMaterial color={['#d9af8b', '#9abeb8', '#b8a9c5'][i]} roughness={0.6} /></mesh>)}</group>}
    {room.id === 5 && <group position={[0.45, 0.63, 0.25]}><mesh><cylinderGeometry args={[0.08, 0.065, 0.12, 10]} /><meshStandardMaterial color="#f6edda" /></mesh><group ref={steam} position={[0, 0.07, 0]}>{[0, 1, 2].map((i) => <mesh key={i}><sphereGeometry args={[0.06, 8, 6]} /><meshBasicMaterial color="#fffaf0" transparent opacity={0.24} depthWrite={false} /></mesh>)}</group></group>}
    {room.id === 6 && <group position={[-1.15, 1.1, -0.7]}><mesh><circleGeometry args={[0.22, 16]} /><meshStandardMaterial color="#435a6b" /></mesh><group ref={rotor}>{[0, 1, 2].map((i) => <mesh key={i} rotation={[0, 0, i * Math.PI / 3]}><boxGeometry args={[0.035, 0.36, 0.01]} /><meshStandardMaterial color="#9ebcbf" /></mesh>)}</group></group>}
  </group>;
}
