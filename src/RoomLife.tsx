import { useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Room } from './worldData';
import { officeOpen, officePower, computerBroken } from './simulation';
import type { Simulation } from './simulation';
import { roomAt } from './navigation';
import type { Point } from './navigation';
import { desks, roomRotation, ownerDeskPoint, ownerDeskSeat, FLOOR_HEIGHT, FLOOR_SURFACE_HEIGHT, INTERIOR_DOOR_WIDTH } from './officeLayout';
import { willUseDoor } from './doors';
import { GRAPHICS, PALETTE } from './artDirection';
import type { GraphicsQuality } from './artDirection';
import { FourPointStar } from './VisualPrimitives';
import { screenMap } from './visualTextures';

export function daylight(minute: number): number {
  return Math.max(0, Math.min(1, Math.sin((minute / 1440 - 0.25) * Math.PI * 2) * 1.3));
}
export function OfficeLighting({ minute, simulation, quality = 'high' }: { minute: number; simulation?: Simulation; quality?: GraphicsQuality }) {
  const sun = daylight(minute), power = simulation ? officePower(simulation) : Number(officeOpen(minute));
  const shadowMap = GRAPHICS[quality].shadowMap;
  return <>
    <hemisphereLight args={['#F4E9D5', '#929C96', 0.54 + sun * .88]} />
    <ambientLight color={sun > 0.2 ? PALETTE.cream : '#A6BCD7'} intensity={0.23 + sun * .19} />
    <directionalLight key={quality} castShadow position={[-14, 22, 16]} color={sun > 0.3 ? '#FFF1DA' : '#A6C5E1'} intensity={0.28 + sun * 1.35} shadow-mapSize-width={shadowMap} shadow-mapSize-height={shadowMap} shadow-camera-left={-25} shadow-camera-right={25} shadow-camera-top={22} shadow-camera-bottom={-22} shadow-camera-near={2} shadow-camera-far={70} shadow-bias={-0.0003} shadow-normalBias={.045} shadow-radius={3} />
    <directionalLight position={[12, 8, -6]} color="#F5E4C8" intensity={.15 + sun * .38} />
    <pointLight position={[0, 2.9, 1.8]} color="#FFE8C8" intensity={power * 22} distance={34} decay={2} />
    <pointLight position={[0, 6.6, -3.5]} color="#FFF0D8" intensity={power * 19} distance={30} decay={2} />
  </>;
}
type Props = { room: Room; simulation: Simulation; speed: number; reducedMotion: boolean; avatar: RefObject<Point>; avatarActive: boolean };
export function RoomLife({ room, simulation, speed, reducedMotion, avatar, avatarActive }: Props) {
  const leftDoor = useRef<THREE.Group>(null), rightDoor = useRef<THREE.Group>(null), rotor = useRef<THREE.Group>(null), steam = useRef<THREE.Group>(null);
  const mobile = useRef<THREE.Group>(null), clockHand = useRef<THREE.Group>(null);
  const screens = useRef<(THREE.MeshStandardMaterial | null)[]>([]), lamp = useRef<THREE.MeshStandardMaterial>(null);
  const ceiling = useRef<THREE.MeshStandardMaterial>(null), phase = useRef(room.id * 0.4);
  const roomDesks = desks.filter((d) => d.roomId === room.id);
  if (room.id === 3) roomDesks.push({roomId:3,x:ownerDeskPoint[0],z:ownerDeskPoint[1],y:FLOOR_HEIGHT,floor:1,rotation:ownerDeskSeat.rotation+Math.PI,staffIndex:-1});
  const power = officePower(simulation);
  const floorHeight = room.floor * FLOOR_HEIGHT + FLOOR_SURFACE_HEIGHT;
  const previousAvatar = useRef<Point>([...avatar.current]);
  const occupied = simulation.npcs.some((n) => roomAt(n.position) === room.id);
  useFrame((_, delta) => {
    const t = phase.current;
    if (speed > 0 && !reducedMotion) phase.current += Math.min(delta, 0.1) * Math.min(speed, 2);
    const avatarMotion: [number,number] = [avatar.current[0]-previousAvatar.current[0],avatar.current[1]-previousAvatar.current[1]];
    const shouldOpen = simulation.npcs.some((n) => n.presence !== 'offsite' && willUseDoor(room.id,n.position,n.path.at(-1)))
      || simulation.clients.some((client) => client.phase !== 'offsite' && willUseDoor(room.id,client.position,client.path.at(-1)))
      || avatarActive && willUseDoor(room.id,avatar.current,undefined,avatarMotion);
    previousAvatar.current=[...avatar.current];
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
      const active = d.staffIndex===-1 ? simulation.ownerActive&&simulation.ownerRoom===3&&simulation.ownerActivity==='work' : employee?.activity === 'work' && employee.path.length === 0 && roomAt(employee.position) === room.id;
      material.color.set(power ? broken ? '#C49AA9' : active ? '#FFFFFF' : '#849B9E' : '#1C2E35');
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
    {roomDesks.map((d, index) => <group key={d.staffIndex} position={[d.x, d.y + FLOOR_SURFACE_HEIGHT, d.z]} rotation={[0, d.rotation, 0]}>
      <mesh position={[0, 1.19, -0.145]}><boxGeometry args={[0.7, 0.4, 0.005]} /><meshStandardMaterial map={screenMap()} ref={(material) => { screens.current[index] = material; }} color={power ? '#FFFFFF' : '#263c48'} emissive="#7cb3c4" emissiveIntensity={power * 0.16} roughness={0.5} /></mesh>
      {power > 0 && (computerBroken(simulation, d.staffIndex) ? <>{[-1, 1].map((side) => <mesh key={side} position={[0, 1.13, -.137]} rotation={[0, 0, side * Math.PI / 4]}><boxGeometry args={[.135, .022, .003]} /><meshBasicMaterial color="#f5dbe2" /></mesh>)}</> : <>{[0, 1, 2].map((i) => <mesh key={i} position={[-0.13 + i * 0.05, 1.19 - i * 0.06, -0.139]}><boxGeometry args={[0.18 + i * 0.06, 0.012, 0.003]} /><meshBasicMaterial color={i === 0 ? '#e4eee9' : '#c2dbe0'} /></mesh>)}<mesh position={[0.15, 1.11, -0.138]}><boxGeometry args={[0.075, 0.125, 0.003]} /><meshBasicMaterial color="#6e9ba6" /></mesh></>)}
    </group>)}
    <group position={[room.center[0], floorHeight, room.center[1]]} rotation={[0, roomRotation(room.id), 0]}>
      <group position={[-INTERIOR_DOOR_WIDTH/2, 0, room.depth / 2 + .09]} scale={[INTERIOR_DOOR_WIDTH/1.5,1,1]} userData={{ cameraObstacle: true }}>
        <mesh position={[.75,2.1,0]}><boxGeometry args={[3,.08,.14]} /><meshStandardMaterial color={PALETTE.corporate} roughness={.7} /></mesh>
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
          {[9, 10].includes(room.id) && <group position={[.75, 1.35, .03]}><mesh><boxGeometry args={[.35, .44, .012]} /><meshStandardMaterial color="#f2ebdf" /></mesh><mesh position={[0, .085, .012]}><circleGeometry args={[.043, 12]} /><meshStandardMaterial color={room.id===9?'#8D6C79':PALETTE.midnight} /></mesh><mesh position={[0, -.015, .012]}>{room.id===9?<coneGeometry args={[.085,.15,3]}/>:<boxGeometry args={[.075,.13,.009]}/>}<meshStandardMaterial color={room.id===9?'#8D6C79':PALETTE.midnight} /></mesh>{[-1,1].map(side=><mesh key={side} position={[side*.027,-.12,.012]}><boxGeometry args={[.022,.08,.012]}/><meshStandardMaterial color={room.id===9?'#8D6C79':PALETTE.midnight}/></mesh>)}</group>}
        </group>
      </group>
      {![9, 10].includes(room.id) && <group position={[-room.width / 2 + .3, 0, -room.depth / 2 + .55]}>
        <mesh position={[0, 0.14, 0]}><cylinderGeometry args={[0.17, 0.17, 0.055, 12]} /><meshStandardMaterial color="#b8a484" /></mesh>
        <mesh position={[0, 1.04, 0]} castShadow><cylinderGeometry args={[0.021, 0.021, 1.8, 8]} /><meshStandardMaterial color="#b89b77" /></mesh>
        <mesh position={[0, 1.9, 0]}><cylinderGeometry args={[0.16, 0.24, 0.26, 12, 1, true]} /><meshStandardMaterial ref={lamp} color="#efe3ca" emissive="#f4d396" emissiveIntensity={power * 0.4} side={THREE.DoubleSide} /></mesh>
      </group>}
      <mesh position={[0, 2.03, -room.depth / 2 + .09]}><boxGeometry args={[Math.min(2.55, room.width - .3), .045, .1]} /><meshStandardMaterial ref={ceiling} color={power ? '#F2E8D4' : '#a9bdcb'} emissive="#f9edcb" emissiveIntensity={power * 0.62} /></mesh>
      {![6,9,10,12].includes(room.id)&&(room.id===1?[-3.25,3.25]:[0]).map(x=><group key={x} position={[x,2.28,room.id===0?-.8:-.25]}>
        <mesh position={[0,.22,0]}><cylinderGeometry args={[.008,.008,.44,6]}/><meshStandardMaterial color={PALETTE.midnight}/></mesh>
        <mesh><cylinderGeometry args={[.12,.29,.19,16,1,true]}/><meshStandardMaterial color={PALETTE.corporate} side={THREE.DoubleSide} roughness={.64}/></mesh>
        <mesh position={[0,-.095,0]} rotation={[Math.PI/2,0,0]}><circleGeometry args={[.28,16]}/><meshStandardMaterial color="#E9DDC0" emissive="#FFE3B2" emissiveIntensity={power*.7}/></mesh>
      </group>)}
      {(room.id === 0 || room.id === 7) && <group position={[room.id === 0 ? -1.65 : 1.58, 1.57, -room.depth/2+.07]}>
        <mesh><torusGeometry args={[0.22, 0.022, 8, 32]} /><meshStandardMaterial color="#b89770" /></mesh><mesh><circleGeometry args={[0.207, 32]} /><meshStandardMaterial color="#fbf4e2" side={THREE.DoubleSide} /></mesh>
        {Array.from({ length: 12 }, (_, i) => <mesh key={i} position={[Math.sin(i * Math.PI / 6) * 0.18, Math.cos(i * Math.PI / 6) * 0.18, 0.015]} rotation={[0, 0, -i * Math.PI / 6]}><boxGeometry args={[0.008, 0.027, 0.007]} /><meshStandardMaterial color="#5d7882" /></mesh>)}
        <group ref={clockHand}><mesh position={[0, 0.072, 0.025]}><boxGeometry args={[0.012, 0.147, 0.01]} /><meshStandardMaterial color="#5e8290" /></mesh></group><mesh position={[0, 0, 0.03]}><sphereGeometry args={[0.025, 8, 6]} /><meshStandardMaterial color="#c09f6d" /></mesh>
      </group>}
      {room.id === 3 && <group ref={mobile} position={[1.3, 1.52, -room.depth/2+.15]}>
        <mesh position={[0,.38,0]}><boxGeometry args={[.5,.025,.06]} /><meshStandardMaterial color={PALETTE.wood} roughness={.8} /></mesh>
        {[0, 1, 2].map((i) => {const x=Math.cos(i*2.1)*.16,y=Math.sin(i*2.1)*.12;return <group key={i}>
          <mesh position={[x,(.38+y)/2,0]}><cylinderGeometry args={[.005,.005,.38-y,4]} /><meshStandardMaterial color={PALETTE.cream} roughness={.9} /></mesh>
          <FourPointStar position={[x,y,0]} size={.065} color={[PALETTE.sand, PALETTE.teal, PALETTE.lavender][i]} />
        </group>;})}
      </group>}
      {room.id === 5 && <group ref={steam} visible={power > 0 && occupied} position={[-1.42, 1.14, -2.25]}>{[0, 1, 2].map((i) => <mesh key={i}><sphereGeometry args={[0.046, 8, 6]} /><meshBasicMaterial color="#fffaf0" transparent opacity={0.15} depthWrite={false} /></mesh>)}</group>}
      {room.id === 6 && <group position={[-2.3, 1.58, -1.42]}><mesh><circleGeometry args={[0.08, 16]} /><meshStandardMaterial color="#354e5e" /></mesh><group ref={rotor}>{[0, 1, 2].map((i) => <mesh key={i} rotation={[0, 0, i * Math.PI / 3]}><boxGeometry args={[0.014, 0.13, 0.01]} /><meshStandardMaterial color="#9ebcbf" /></mesh>)}</group></group>}
    </group>
  </>;
}
