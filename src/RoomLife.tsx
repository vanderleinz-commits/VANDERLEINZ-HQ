import { useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Room } from './worldData';
import { officeOpen, officePower, computerBroken } from './simulation';
import type { Simulation } from './simulation';
import { roomAt } from './navigation';
import type { Point } from './navigation';
import { desks, roomLocal, roomRotation, FLOOR_HEIGHT } from './officeLayout';

export function daylight(minute: number): number {
  return Math.max(0, Math.min(1, Math.sin((minute / 1440 - 0.25) * Math.PI * 2) * 1.3));
}
export function OfficeLighting({ minute, simulation }: { minute: number; simulation?: Simulation }) {
  const sun = daylight(minute), power = simulation ? officePower(simulation) : Number(officeOpen(minute));
  return <>
    <hemisphereLight args={['#fff8eb', '#668293', 0.46 + sun * 1.1]} />
    <ambientLight color={sun > 0.2 ? '#f9f3e8' : '#a7bed8'} intensity={0.16 + sun * 0.26} />
    <directionalLight castShadow position={[-9, 18, 11]} color={sun > 0.3 ? '#fff4dd' : '#a6c5e1'} intensity={0.28 + sun * 1.8} shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-22} shadow-camera-right={22} shadow-camera-top={18} shadow-camera-bottom={-18} shadow-bias={-0.0002} />
    <pointLight position={[0, 2.9, 1.8]} color="#f2f5ed" intensity={power * 42} distance={28} decay={2} />
    <pointLight position={[0, 6.6, -2.7]} color="#f1f4ec" intensity={power * 38} distance={24} decay={2} />
  </>;
}
type Props = { room: Room; simulation: Simulation; speed: number; reducedMotion: boolean; avatar: RefObject<Point>; avatarActive: boolean };
export function RoomLife({ room, simulation, speed, reducedMotion, avatar, avatarActive }: Props) {
  const door = useRef<THREE.Group>(null), rotor = useRef<THREE.Group>(null), steam = useRef<THREE.Group>(null);
  const mobile = useRef<THREE.Group>(null), clockHand = useRef<THREE.Group>(null);
  const screens = useRef<(THREE.MeshStandardMaterial | null)[]>([]), lamp = useRef<THREE.MeshStandardMaterial>(null);
  const ceiling = useRef<THREE.MeshStandardMaterial>(null), phase = useRef(room.id * 0.4);
  const roomDesks = desks.filter((d) => d.roomId === room.id);
  const power = officePower(simulation);
  const floorHeight = room.floor * FLOOR_HEIGHT;
  const occupied = simulation.npcs.some((n) => roomAt(n.position) === room.id);
  useFrame((_, delta) => {
    const t = phase.current;
    if (speed > 0) phase.current += Math.min(delta, 0.1) * Math.min(speed, 2);
    const threshold = roomLocal(room.id, 0, room.depth / 2);
    const sameFloor = (point: Point) => Math.abs((point[2] ?? 0) - floorHeight) < .55;
    const near = simulation.npcs.some((n) => sameFloor(n.position) && Math.hypot(n.position[0] - threshold[0], n.position[1] - threshold[1]) < 1.25) || avatarActive && sameFloor(avatar.current) && Math.hypot(avatar.current[0] - threshold[0], avatar.current[1] - threshold[1]) < 1.25;
    if (door.current && (speed > 0 || avatarActive)) door.current.rotation.y = reducedMotion ? (near ? -Math.PI / 2 : 0) : THREE.MathUtils.damp(door.current.rotation.y, near ? -Math.PI / 2 : 0, 9, delta);
    if (lamp.current) lamp.current.emissiveIntensity = power * (0.18 + (1 - daylight(simulation.gameMinute)) * 0.7);
    if (ceiling.current) ceiling.current.emissiveIntensity = power * 0.62;
    screens.current.forEach((material, index) => {
      if (!material) return;
      const d = roomDesks[index], employee = simulation.npcs[d.staffIndex];
      const broken = computerBroken(simulation, d.staffIndex);
      const active = employee?.activity === 'work' && employee.path.length === 0 && roomAt(employee.position) === room.id;
      material.color.set(power ? broken ? '#945e73' : active ? '#91bac2' : '#45636f' : '#263c48');
      material.emissive.set(broken ? '#bb7888' : '#7cb3c4');
      material.emissiveIntensity = power * (broken ? .3 : active ? 0.34 + (!reducedMotion && speed > 0 ? Math.sin(t * 1.5) * 0.04 : 0) : 0.055);
    });
    if (clockHand.current) clockHand.current.rotation.z = -(simulation.gameMinute % 60) / 60 * Math.PI * 2;
    if (speed === 0) return;
    const motion = reducedMotion ? 0 : power;
    if (rotor.current) rotor.current.rotation.z = t * 4 * motion;
    if (mobile.current) { mobile.current.rotation.y = Math.sin(t * 0.5) * 0.12 * motion; mobile.current.position.y = 1.52 + Math.sin(t * 1.2) * 0.035 * motion; }
    if (steam.current) { steam.current.visible = power > 0 && occupied; steam.current.children.forEach((particle, i) => { const p = (t * 0.28 + i / 3) % 1; particle.position.y = p * 0.36; particle.position.x = Math.sin(t * 1.6 + i) * 0.035 * motion; particle.scale.setScalar(reducedMotion ? 0.65 : 0.35 + p * 0.6); }); }
  });
  return <>
    {roomDesks.map((d, index) => <group key={d.staffIndex} position={[d.x, d.y, d.z]} rotation={[0, d.rotation, 0]}>
      <mesh position={[0, 1.13, -0.145]}><boxGeometry args={[0.517, 0.287, 0.005]} /><meshStandardMaterial ref={(material) => { screens.current[index] = material; }} color={power ? '#91bac2' : '#263c48'} emissive="#7cb3c4" emissiveIntensity={power * 0.24} roughness={0.5} /></mesh>
      {power > 0 && (computerBroken(simulation, d.staffIndex) ? <>{[-1, 1].map((side) => <mesh key={side} position={[0, 1.13, -.137]} rotation={[0, 0, side * Math.PI / 4]}><boxGeometry args={[.135, .022, .003]} /><meshBasicMaterial color="#f5dbe2" /></mesh>)}</> : <>{[0, 1, 2].map((i) => <mesh key={i} position={[-0.13 + i * 0.05, 1.19 - i * 0.06, -0.139]}><boxGeometry args={[0.18 + i * 0.06, 0.012, 0.003]} /><meshBasicMaterial color={i === 0 ? '#e4eee9' : '#c2dbe0'} /></mesh>)}<mesh position={[0.15, 1.11, -0.138]}><boxGeometry args={[0.075, 0.125, 0.003]} /><meshBasicMaterial color="#6e9ba6" /></mesh></>)}
    </group>)}
    <group position={[room.center[0], floorHeight, room.center[1]]} rotation={[0, roomRotation(room.id), 0]}>
      <group position={[-0.75, 0, room.depth / 2]}>
        <group ref={door}>
          <mesh position={[0.75, 1.04, 0]}><boxGeometry args={[1.46, 1.94, 0.045]} /><meshStandardMaterial color={[9, 10].includes(room.id) ? '#7ea3bf' : '#b1d1e4'} transparent={![9, 10].includes(room.id)} opacity={[9, 10].includes(room.id) ? 1 : .22} roughness={[9, 10].includes(room.id) ? .75 : .15} depthWrite={[9, 10].includes(room.id)} /></mesh>
          {[9, 10].includes(room.id) && <group position={[.75, 1.35, .03]}><mesh><boxGeometry args={[.22, .28, .012]} /><meshStandardMaterial color="#ecf5fa" /></mesh><mesh position={[0, .053, .012]}><circleGeometry args={[.034, 12]} /><meshStandardMaterial color="#406785" /></mesh><mesh position={[0, -.037, .012]}><boxGeometry args={[.055, .103, .009]} /><meshStandardMaterial color="#406785" /></mesh></group>}
          {[0.075, 2.03].map((y) => <mesh key={y} position={[0.75, y, 0]}><boxGeometry args={[1.49, 0.045, 0.065]} /><meshStandardMaterial color="#819eaa" metalness={0.25} roughness={0.4} /></mesh>)}
          {[0.025, 1.475].map((x) => <mesh key={x} position={[x, 1.05, 0]}><boxGeometry args={[0.045, 2.01, 0.065]} /><meshStandardMaterial color="#819eaa" metalness={0.25} roughness={0.4} /></mesh>)}
          <mesh position={[1.31, 1.02, 0.056]}><boxGeometry args={[0.025, 0.26, 0.035]} /><meshStandardMaterial color="#ba9c71" metalness={0.3} /></mesh>
          <mesh position={[0.75, 0.85, 0.029]}><boxGeometry args={[1.43, 0.045, 0.01]} /><meshStandardMaterial color="#e7e8dc" /></mesh>
        </group>
      </group>
      {![9, 10].includes(room.id) && <group position={[-room.width / 2 + .3, 0, -room.depth / 2 + .55]}>
        <mesh position={[0, 0.14, 0]}><cylinderGeometry args={[0.17, 0.17, 0.055, 12]} /><meshStandardMaterial color="#b8a484" /></mesh>
        <mesh position={[0, 1.04, 0]} castShadow><cylinderGeometry args={[0.021, 0.021, 1.8, 8]} /><meshStandardMaterial color="#b89b77" /></mesh>
        <mesh position={[0, 1.9, 0]}><cylinderGeometry args={[0.16, 0.24, 0.26, 12, 1, true]} /><meshStandardMaterial ref={lamp} color="#efe3ca" emissive="#f4d396" emissiveIntensity={power * 0.4} side={THREE.DoubleSide} /></mesh>
      </group>}
      <mesh position={[0, 1.79, -room.depth / 2 + .09]}><boxGeometry args={[Math.min(2.55, room.width - .3), .045, .1]} /><meshStandardMaterial ref={ceiling} color={power ? '#edf3f4' : '#a9bdcb'} emissive="#f9edcb" emissiveIntensity={power * 0.62} /></mesh>
      {(room.id === 0 || room.id === 7) && <group position={[room.id === 0 ? -1.65 : 1.58, 1.57, -2.33]}>
        <mesh><torusGeometry args={[0.22, 0.022, 8, 32]} /><meshStandardMaterial color="#b89770" /></mesh><mesh><circleGeometry args={[0.207, 32]} /><meshStandardMaterial color="#fbf4e2" side={THREE.DoubleSide} /></mesh>
        {Array.from({ length: 12 }, (_, i) => <mesh key={i} position={[Math.sin(i * Math.PI / 6) * 0.18, Math.cos(i * Math.PI / 6) * 0.18, 0.015]} rotation={[0, 0, -i * Math.PI / 6]}><boxGeometry args={[0.008, 0.027, 0.007]} /><meshStandardMaterial color="#5d7882" /></mesh>)}
        <group ref={clockHand}><mesh position={[0, 0.072, 0.025]}><boxGeometry args={[0.012, 0.147, 0.01]} /><meshStandardMaterial color="#5e8290" /></mesh></group><mesh position={[0, 0, 0.03]}><sphereGeometry args={[0.025, 8, 6]} /><meshStandardMaterial color="#c09f6d" /></mesh>
      </group>}
      {room.id === 3 && <group ref={mobile} position={[1.3, 1.52, -1.27]}>{[0, 1, 2].map((i) => <mesh key={i} position={[Math.cos(i * 2.1) * 0.16, Math.sin(i * 2.1) * 0.12, 0]}><icosahedronGeometry args={[0.065, 0]} /><meshStandardMaterial color={['#d4aa87', '#9dbab4', '#b6a8bd'][i]} roughness={0.75} /></mesh>)}</group>}
      {room.id === 5 && <group ref={steam} visible={power > 0 && occupied} position={[-1.42, 1.14, -2.25]}>{[0, 1, 2].map((i) => <mesh key={i}><sphereGeometry args={[0.046, 8, 6]} /><meshBasicMaterial color="#fffaf0" transparent opacity={0.15} depthWrite={false} /></mesh>)}</group>}
      {room.id === 6 && <group position={[-1.2, 1.58, -.82]}><mesh><circleGeometry args={[0.08, 16]} /><meshStandardMaterial color="#354e5e" /></mesh><group ref={rotor}>{[0, 1, 2].map((i) => <mesh key={i} rotation={[0, 0, i * Math.PI / 3]}><boxGeometry args={[0.014, 0.13, 0.01]} /><meshStandardMaterial color="#9ebcbf" /></mesh>)}</group></group>}
    </group>
  </>;
}
