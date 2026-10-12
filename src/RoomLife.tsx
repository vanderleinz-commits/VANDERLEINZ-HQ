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
import { GRAPHICS, PALETTE } from './artDirection';
import type { GraphicsQuality } from './artDirection';
import { FourPointStar } from './VisualPrimitives';

export function daylight(minute: number): number {
  return Math.max(0, Math.min(1, Math.sin((minute / 1440 - 0.25) * Math.PI * 2) * 1.3));
}
export function OfficeLighting({ minute, simulation, quality = 'high' }: { minute: number; simulation?: Simulation; quality?: GraphicsQuality }) {
  const sun = daylight(minute), power = simulation ? officePower(simulation) : Number(officeOpen(minute));
  const shadowMap = GRAPHICS[quality].shadowMap;
  return <>
    <hemisphereLight args={['#FFF6E8', '#889BB4', 0.58 + sun * .68]} />
    <ambientLight color={sun > 0.2 ? PALETTE.cream : '#A6BCD7'} intensity={0.23 + sun * .19} />
    <directionalLight key={quality} castShadow position={[-9, 18, 11]} color={sun > 0.3 ? '#FFF1DA' : '#A6C5E1'} intensity={0.28 + sun * 1.35} shadow-mapSize-width={shadowMap} shadow-mapSize-height={shadowMap} shadow-camera-left={-19} shadow-camera-right={19} shadow-camera-top={16} shadow-camera-bottom={-16} shadow-camera-near={2} shadow-camera-far={55} shadow-bias={-0.0003} shadow-normalBias={.045} shadow-radius={3} />
    <directionalLight position={[12, 8, -6]} color={PALETTE.sky} intensity={.12 + sun * .18} />
    <pointLight position={[0, 2.9, 1.8]} color="#FFE8C8" intensity={power * 18} distance={26} decay={2} />
    <pointLight position={[0, 6.6, -2.7]} color="#FFF0D8" intensity={power * 16} distance={22} decay={2} />
  </>;
}
type Props = { room: Room; simulation: Simulation; speed: number; reducedMotion: boolean; avatar: RefObject<Point>; avatarActive: boolean };
export function RoomLife({ room, simulation, speed, reducedMotion, avatar, avatarActive }: Props) {
  const leftDoor = useRef<THREE.Group>(null), rightDoor = useRef<THREE.Group>(null), rotor = useRef<THREE.Group>(null), steam = useRef<THREE.Group>(null);
  const mobile = useRef<THREE.Group>(null), clockHand = useRef<THREE.Group>(null);
  const screens = useRef<(THREE.MeshStandardMaterial | null)[]>([]), lamp = useRef<THREE.MeshStandardMaterial>(null);
  const ceiling = useRef<THREE.MeshStandardMaterial>(null), phase = useRef(room.id * 0.4);
  const roomDesks = desks.filter((d) => d.roomId === room.id);
  const power = officePower(simulation);
  const floorHeight = room.floor * FLOOR_HEIGHT;
  const occupied = simulation.npcs.some((n) => roomAt(n.position) === room.id);
  useFrame((_, delta) => {
    const t = phase.current;
    if (speed > 0 && !reducedMotion) phase.current += Math.min(delta, 0.1) * Math.min(speed, 2);
    const threshold = roomLocal(room.id, 0, room.depth / 2);
    const entering = (point: Point) => Math.abs((point[2] ?? 0) - floorHeight) < .55 && roomAt(point) === room.id && Math.hypot(point[0] - threshold[0], point[1] - threshold[1]) < 1.35;
    const shouldOpen = simulation.npcs.some((n, i) => i !== 6 && n.presence !== 'offsite' && entering(n.position))
      || simulation.clients.some((client) => client.phase !== 'offsite' && entering(client.position))
      || avatarActive && entering(avatar.current);
    if (leftDoor.current && rightDoor.current && (speed > 0 || avatarActive)) {
      const distance = shouldOpen ? .76 : 0;
      leftDoor.current.position.x = reducedMotion ? -distance : THREE.MathUtils.damp(leftDoor.current.position.x, -distance, 12, delta);
      rightDoor.current.position.x = reducedMotion ? distance : THREE.MathUtils.damp(rightDoor.current.position.x, distance, 12, delta);
    }
    if (lamp.current) lamp.current.emissiveIntensity = power * (0.18 + (1 - daylight(simulation.gameMinute)) * 0.7);
    if (ceiling.current) ceiling.current.emissiveIntensity = power * 0.62;
    screens.current.forEach((material, index) => {
      if (!material) return;
      const d = roomDesks[index], employee = simulation.npcs[d.staffIndex];
      const broken = computerBroken(simulation, d.staffIndex);
      const active = employee?.activity === 'work' && employee.path.length === 0 && roomAt(employee.position) === room.id;
      material.color.set(power ? broken ? '#9C6E87' : active ? '#8CBACB' : '#45636F' : '#263C48');
      material.emissive.set(broken ? '#B8869F' : PALETTE.sky);
      material.emissiveIntensity = power * (broken ? .17 : active ? 0.18 + (!reducedMotion && speed > 0 ? Math.sin(t * 1.5) * 0.018 : 0) : 0.035);
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
      <group position={[-0.75, 0, room.depth / 2]} userData={{ cameraObstacle: true }}>
        <group>
          <group ref={leftDoor}>
          <mesh position={[0.375, 1.04, 0]}><boxGeometry args={[0.72, 1.94, 0.045]} /><meshStandardMaterial color={[9, 10].includes(room.id) ? PALETTE.corporate : PALETTE.sky} transparent={![9, 10].includes(room.id)} opacity={[9, 10].includes(room.id) ? 1 : .24} roughness={[9, 10].includes(room.id) ? .9 : .48} depthWrite={[9, 10].includes(room.id)} /></mesh>
          {[0.075, 2.03].map((y) => <mesh key={y} position={[0.375, y, 0]}><boxGeometry args={[0.74, 0.045, 0.065]} /><meshStandardMaterial color="#819eaa" metalness={0.25} roughness={0.4} /></mesh>)}
          {[0.025, 0.725].map((x) => <mesh key={x} position={[x, 1.05, 0]}><boxGeometry args={[0.045, 2.01, 0.065]} /><meshStandardMaterial color="#819eaa" metalness={0.25} roughness={0.4} /></mesh>)}
          </group>
          <group ref={rightDoor}>
          <mesh position={[1.125, 1.04, 0]}><boxGeometry args={[0.72, 1.94, 0.045]} /><meshStandardMaterial color={[9, 10].includes(room.id) ? PALETTE.corporate : PALETTE.sky} transparent={![9, 10].includes(room.id)} opacity={[9, 10].includes(room.id) ? 1 : .24} roughness={[9, 10].includes(room.id) ? .9 : .48} depthWrite={[9, 10].includes(room.id)} /></mesh>
          {[0.075, 2.03].map((y) => <mesh key={y} position={[1.125, y, 0]}><boxGeometry args={[0.74, 0.045, 0.065]} /><meshStandardMaterial color="#819eaa" metalness={0.25} roughness={0.4} /></mesh>)}
          {[0.775, 1.475].map((x) => <mesh key={x} position={[x, 1.05, 0]}><boxGeometry args={[0.045, 2.01, 0.065]} /><meshStandardMaterial color="#819eaa" metalness={0.25} roughness={0.4} /></mesh>)}
          </group>
          {[9, 10].includes(room.id) && <group position={[.75, 1.35, .03]}><mesh><boxGeometry args={[.22, .28, .012]} /><meshStandardMaterial color="#ecf5fa" /></mesh><mesh position={[0, .053, .012]}><circleGeometry args={[.034, 12]} /><meshStandardMaterial color="#406785" /></mesh><mesh position={[0, -.037, .012]}><boxGeometry args={[.055, .103, .009]} /><meshStandardMaterial color="#406785" /></mesh></group>}
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
      {room.id === 3 && <group ref={mobile} position={[1.3, 1.52, -1.27]}>{[0, 1, 2].map((i) => <FourPointStar key={i} position={[Math.cos(i * 2.1) * .16, Math.sin(i * 2.1) * .12, 0]} size={.065} color={[PALETTE.sand, PALETTE.teal, PALETTE.lavender][i]} />)}</group>}
      {room.id === 5 && <group ref={steam} visible={power > 0 && occupied} position={[-1.42, 1.14, -2.25]}>{[0, 1, 2].map((i) => <mesh key={i}><sphereGeometry args={[0.046, 8, 6]} /><meshBasicMaterial color="#fffaf0" transparent opacity={0.15} depthWrite={false} /></mesh>)}</group>}
      {room.id === 6 && <group position={[-1.2, 1.58, -.82]}><mesh><circleGeometry args={[0.08, 16]} /><meshStandardMaterial color="#354e5e" /></mesh><group ref={rotor}>{[0, 1, 2].map((i) => <mesh key={i} rotation={[0, 0, i * Math.PI / 3]}><boxGeometry args={[0.014, 0.13, 0.01]} /><meshStandardMaterial color="#9ebcbf" /></mesh>)}</group></group>}
    </group>
  </>;
}
