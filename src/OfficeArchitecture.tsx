import { useEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { Room } from './worldData';
import type { Point } from './navigation';
import type { Simulation } from './simulation';
import { officePower } from './simulation';
import { desks, workSeat, meetingSeat, lunchSeat, roomRotation } from './officeLayout';

const wood = '#bd9871', cream = '#f3ebda', metal = '#71848b';
type Vec3 = [number, number, number];

function Box({ position, size, color, radius = 0, metalness = 0 }: { position: Vec3; size: Vec3; color: string; radius?: number; metalness?: number }) {
  const material = <meshStandardMaterial color={color} roughness={metalness ? 0.38 : 0.72} metalness={metalness} />;
  return radius ? <RoundedBox position={position} args={size} radius={radius} smoothness={2} castShadow receiveShadow>{material}</RoundedBox> : <mesh position={position} castShadow receiveShadow><boxGeometry args={size} />{material}</mesh>;
}
function Cylinder({ position, radius, height, color, bottom = radius }: { position: Vec3; radius: number; height: number; color: string; bottom?: number }) {
  return <mesh position={position} castShadow receiveShadow><cylinderGeometry args={[radius, bottom, height, 12]} /><meshStandardMaterial color={color} roughness={0.74} /></mesh>;
}
function Sign({ text, width, height, color = '#526e79', background = '#f1eadd' }: { text: string; width: number; height: number; color?: string; background?: string }) {
  const map = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = Math.round(1024 * height / width);
    const context = canvas.getContext('2d');
    if (context) { context.fillStyle = background; context.fillRect(0, 0, canvas.width, canvas.height); context.fillStyle = color; context.textAlign = 'center'; context.textBaseline = 'middle'; context.font = `600 ${Math.min(canvas.height * 0.43, canvas.width / text.length * 1.45)}px Arial`; context.fillText(text, canvas.width / 2, canvas.height / 2); }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
  }, [text, width, height, color, background]);
  useEffect(() => () => map.dispose(), [map]);
  return <mesh><planeGeometry args={[width, height]} /><meshStandardMaterial map={map} roughness={0.8} side={THREE.DoubleSide} /></mesh>;
}
function Mug({ position, color = '#f7f0df' }: { position: Vec3; color?: string }) {
  return <group position={position}><Cylinder position={[0, 0.06, 0]} radius={0.065} bottom={0.055} height={0.12} color={color} /><mesh position={[0, 0.124, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.052, 16]} /><meshStandardMaterial color="#695342" /></mesh><mesh position={[0.075, 0.065, 0]}><torusGeometry args={[0.042, 0.013, 6, 12]} /><meshStandardMaterial color={color} /></mesh></group>;
}
export function OfficePlant({ position, small = false }: { position: Vec3; small?: boolean }) {
  return <group position={position} scale={small ? 0.42 : 1}>
    <Cylinder position={[0, 0.24, 0]} radius={0.19} bottom={0.145} height={0.43} color="#cbaa84" />
    <Cylinder position={[0, 0.465, 0]} radius={0.17} height={0.025} color="#6e5c47" />
    {[0, 1, 2, 3, 4].map((i) => <group key={i} rotation={[0, i * 2.1, 0]}><Cylinder position={[0.035, 0.68 + i * 0.045, 0]} radius={0.016} height={0.54 + i * 0.035} color="#59785d" /><mesh position={[0.1, 0.8 + i * 0.075, 0]} rotation={[0, 0, -0.7]} scale={[0.55, 1.3, 0.38]} castShadow><sphereGeometry args={[0.19, 10, 8]} /><meshStandardMaterial color={i % 2 ? '#769d79' : '#91b394'} roughness={0.9} /></mesh></group>)}
  </group>;
}

export function OfficeChair({ position, rotation, color = '#7595a3', dining = false }: { position: Point; rotation: number; color?: string; dining?: boolean }) {
  return <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]}>
    <Box position={[0, 0.5, 0]} size={[0.54, 0.12, 0.5]} color={color} radius={0.055} />
    <Box position={[0, 0.82, -0.235]} size={[0.53, 0.58, 0.115]} color={color} radius={0.055} />
    <Box position={[0, 0.8, -0.302]} size={[0.4, 0.33, 0.022]} color={dining ? '#cfb18c' : '#617e8b'} radius={0.01} />
    {dining ? <>{[-1, 1].flatMap((x) => [-1, 1].map((z) => <Box key={`${x}${z}`} position={[x * 0.21, 0.25, z * 0.18]} size={[0.04, 0.42, 0.04]} color={wood} />))}</> : <>
      {[-1, 1].map((s) => <group key={s}><Box position={[s * 0.29, 0.69, -0.01]} size={[0.065, 0.045, 0.37]} color="#576e77" radius={0.02} /><Box position={[s * 0.25, 0.59, -0.13]} size={[0.04, 0.22, 0.05]} color={metal} /></group>)}
      <Cylinder position={[0, 0.28, 0]} radius={0.045} height={0.33} color="#566970" />
      {[0, 1, 2, 3, 4].map((i) => <group key={i} rotation={[0, i * Math.PI * 2 / 5, 0]}><Box position={[0, 0.075, 0.145]} size={[0.055, 0.045, 0.28]} color={metal} radius={0.02} /><mesh position={[0, 0.056, 0.28]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.045, 0.045, 0.07, 8]} /><meshStandardMaterial color="#3f535a" /></mesh></group>)}
    </>}
  </group>;
}

function ComputerDesk({ position, rotation, variant }: { position: Point; rotation: number; variant: number }) {
  return <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]}>
    <Box position={[0, 0.78, 0]} size={[1.45, 0.09, 0.76]} color="#c5a17b" radius={0.045} />
    {[-0.64, 0.64].map((x) => <group key={x}><Box position={[x, 0.4, 0]} size={[0.055, 0.72, 0.55]} color={cream} radius={0.018} /><Box position={[x, 0.055, 0]} size={[0.12, 0.045, 0.62]} color={metal} radius={0.01} /></group>)}
    <Box position={[0, 0.92, -0.19]} size={[0.045, 0.23, 0.045]} color="#586a72" />
    <Box position={[0, 0.842, -0.19]} size={[0.28, 0.027, 0.17]} color="#63777f" radius={0.01} />
    <Box position={[0, 1.125, -0.19]} size={[0.59, 0.37, 0.055]} color="#526a74" radius={0.02} />
    <Box position={[0, 1.13, -0.157]} size={[0.535, 0.305, 0.012]} color="#263b47" radius={0.009} />
    <Box position={[-0.11, 0.837, 0.21]} size={[0.44, 0.025, 0.16]} color="#71818a" radius={0.01} />
    {Array.from({ length: 3 }, (_, row) => <Box key={row} position={[-0.11, 0.854, 0.163 + row * 0.044]} size={[0.38, 0.006, 0.021]} color="#dee5e1" />)}
    <Box position={[0.365, 0.833, 0.19]} size={[0.24, 0.011, 0.24]} color="#7f9aa3" radius={0.02} />
    <Box position={[0.37, 0.856, 0.17]} size={[0.075, 0.042, 0.105]} color="#efe8d9" radius={0.02} />
    <Box position={[-0.57, 0.59, -0.08]} size={[0.25, 0.4, 0.38]} color="#ece2ce" radius={0.03} />
    {[0.46, 0.58, 0.7].map((y) => <group key={y}><Box position={[-0.57, y, 0.118]} size={[0.21, 0.1, 0.018]} color="#e4d8c1" /><Box position={[-0.57, y, 0.136]} size={[0.07, 0.012, 0.022]} color={metal} /></group>)}
    <Mug position={[0.57, 0.826, -0.15]} color={variant % 2 ? '#cbdcd7' : '#ecdfcb'} />
    <Box position={[-0.49, 0.834, 0.2]} size={[0.2, 0.014, 0.26]} color={['#c2d6de', '#d8bbb1', '#b8c7a9'][variant % 3]} radius={0.015} />
    <Box position={[-0.48, 0.845, 0.2]} size={[0.014, 0.014, 0.19]} color="#667987" />
    {variant === 1 && <><Box position={[0.44, 0.837, -0.29]} size={[0.19, 0.028, 0.11]} color="#bd9bb5" /><Box position={[0.43, 0.857, -0.29]} size={[0.02, 0.01, 0.1]} color="#ede4d0" /></>}
    {variant === 3 && <Cylinder position={[-0.56, 0.97, -0.23]} radius={0.043} height={0.25} color="#a5bec1" />}
    {variant === 5 && <Box position={[-0.54, 0.946, -0.24]} size={[0.13, 0.24, 0.1]} color="#506977" />}
  </group>;
}
function Rug({ width, depth, color, z = 0 }: { width: number; depth: number; color: string; z?: number }) {
  return <><Box position={[0, 0.143, z]} size={[width, 0.012, depth]} color={color} radius={0.006} />{[-1, 1].map((side) => <Box key={side} position={[0, 0.153, z + side * (depth / 2 - 0.09)]} size={[width - 0.14, 0.006, 0.015]} color="#e5d7bc" />)}</>;
}
function WallShelf({ x = 1.7, z = -1.92, books = false }: { x?: number; z?: number; books?: boolean }) {
  return <group position={[x, 0, z]}><Box position={[0, 0.65, 0]} size={[0.6, 1.1, 0.43]} color="#c4a27d" radius={0.025} />{[0.36, 0.72, 1.08].map((y, row) => <group key={row}><Box position={[0, y, 0.223]} size={[0.49, 0.29, 0.015]} color="#ded1ba" />{[0, 1, 2].map((i) => books ? <Box key={i} position={[-0.16 + i * 0.14, y + 0.01, 0.265]} size={[0.075, 0.24, 0.1]} color={['#92aeba', '#c59483', '#a9b8a0'][(i + row) % 3]} /> : <Cylinder key={i} position={[-0.15 + i * 0.15, y + 0.02, 0.264]} radius={0.045} height={0.16} color={i % 2 ? '#91bdba' : '#ddc99e'} />)}</group>)}</group>;
}
function SharedTable({ dining = false }: { dining?: boolean }) {
  return <group position={[0, 0, -0.1]}>
    <Box position={[0, 0.78, 0]} size={[1.35, 0.1, 2.5]} color={dining ? '#cfaf88' : '#b99873'} radius={0.045} />
    {[-0.9, 0.9].map((z) => <group key={z}><Box position={[0, 0.42, z]} size={[0.065, 0.7, 0.06]} color={metal} /><Box position={[0, 0.12, z]} size={[1.06, 0.06, 0.11]} color={metal} radius={0.02} /></group>)}
    {[-0.93, 0.07, 1.07].flatMap((z) => [-1, 1].map((side) => <group key={`${z}${side}`} position={[side * 0.45, 0.839, z]}>
      {dining ? <><Cylinder position={[0, 0.005, 0]} radius={0.17} height={0.018} color="#faf4e6" /><Cylinder position={[0, 0.019, 0]} radius={0.105} height={0.016} color="#d6a270" /><mesh position={[0.034, 0.04, 0]} scale={[1, 0.5, 0.75]}><sphereGeometry args={[0.043, 8, 6]} /><meshStandardMaterial color="#a8bf7f" /></mesh><Box position={[side * 0.2, 0.015, 0]} size={[0.022, 0.012, 0.18]} color="#a2b1b1" /><Mug position={[-side * 0.11, 0, -0.25]} color="#dae3de" /></> : <><Box position={[0, 0, 0]} size={[0.23, 0.012, 0.3]} color="#f6f1e4" /><Box position={[side * 0.12, 0.02, 0.01]} size={[0.012, 0.015, 0.2]} color="#728d9b" /><Mug position={[-side * 0.1, 0, -0.26]} /></>}
    </group>))}
    {!dining && <><Box position={[0, 0.846, 0]} size={[0.3, 0.035, 0.21]} color="#6c8590" radius={0.015} /><Cylinder position={[0, 0.892, 0]} radius={0.075} height={0.045} color="#b7c9cc" /></>}
  </group>;
}
function KitchenCounter() {
  return <group position={[0, 0, -1.96]}>
    <Box position={[0, 0.52, 0]} size={[3.55, 0.83, 0.57]} color="#d8c6a8" radius={0.025} />
    <Box position={[0, 0.98, 0]} size={[3.68, 0.08, 0.64]} color="#f0e8d6" radius={0.025} />
    {[-1.2, -0.4, 0.4, 1.2].map((x) => <group key={x}><Box position={[x, 0.57, 0.3]} size={[0.72, 0.68, 0.022]} color="#e9dfcd" radius={0.018} /><Box position={[x, 0.79, 0.327]} size={[0.18, 0.019, 0.025]} color={metal} /></group>)}
    <Box position={[-1.25, 1.22, 0]} size={[0.44, 0.43, 0.39]} color="#536975" radius={0.04} />
    <Box position={[-1.25, 1.23, 0.205]} size={[0.31, 0.16, 0.02]} color="#bacbd1" radius={0.018} />
    <Cylinder position={[-1.25, 1.4, -0.02]} radius={0.07} height={0.08} color="#c4b08d" />
    <Mug position={[-1.25, 1.02, 0.17]} />
    <Box position={[0.35, 1.03, 0]} size={[0.73, 0.018, 0.41]} color="#98aaa9" radius={0.014} />
    <Box position={[0.35, 1.042, 0]} size={[0.55, 0.009, 0.28]} color="#657f84" radius={0.012} />
    <mesh position={[0.43, 1.13, -0.08]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.12, 0.018, 6, 16, Math.PI]} /><meshStandardMaterial color="#9baead" metalness={0.5} roughness={0.28} /></mesh>
    <Cylinder position={[1.25, 1.055, 0]} radius={0.22} height={0.035} color="#e9d3b0" />
    {[0, 1, 2].map((i) => <mesh key={i} position={[1.13 + i * 0.11, 1.12, 0.02]} castShadow><sphereGeometry args={[0.073, 10, 8]} /><meshStandardMaterial color={['#ce9372', '#d9ba73', '#acc288'][i]} /></mesh>)}
    <group position={[0.5, 1.62, -0.3]}><Sign text="COFFEE  ·  FRESH LUNCH" width={1.75} height={0.26} /></group>
  </group>;
}
function ReceptionCounter() {
  return <group position={[-7.35, 0, 3.5]}>
    <Box position={[0, 0.61, 0]} size={[2.15, 0.98, 0.72]} color="#c3a17d" radius={0.055} />
    {Array.from({ length: 16 }, (_, i) => <Box key={i} position={[-0.98 + i * 0.131, 0.62, 0.367]} size={[0.026, 0.77, 0.025]} color="#a98560" />)}
    <Box position={[0, 1.13, 0]} size={[2.23, 0.09, 0.82]} color="#eee3cb" radius={0.045} />
    <group position={[0, 0.7, 0.397]}><Sign text="VANDERLEINZ" width={1.3} height={0.21} color="#eff2e7" background="#678b96" /></group>
    <Box position={[-0.5, 1.335, -0.18]} size={[0.38, 0.28, 0.042]} color="#617d87" radius={0.02} />
    <Box position={[-0.5, 1.18, -0.18]} size={[0.2, 0.025, 0.15]} color="#789099" />
    <Box position={[-0.45, 1.185, -0.32]} size={[0.34, 0.015, 0.11]} color="#a3b6bd" />
    <Cylinder position={[0.56, 1.21, 0.18]} radius={0.075} height={0.06} color="#d0b080" />
    <mesh position={[0.56, 1.255, 0.18]}><sphereGeometry args={[0.059, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#c8a364" metalness={0.4} roughness={0.3} /></mesh>
    <group position={[0.34, 1.27, 0.31]}><Sign text="WELCOME" width={0.6} height={0.15} /></group>
    <OfficePlant position={[0.9, 1.175, -0.09]} small />
  </group>;
}
function ServerRack({ x }: { x: number }) {
  return <group position={[x, 0, -1.23]}>
    <Box position={[0, 1.07, 0]} size={[0.7, 1.96, 0.87]} color="#778b99" radius={0.035} />
    <Box position={[0, 1.08, 0.451]} size={[0.6, 1.76, 0.035]} color="#425b6b" radius={0.015} />
    {[0.48, 0.82, 1.16, 1.5, 1.84].map((y) => <group key={y}><Box position={[0, y, 0.478]} size={[0.55, 0.24, 0.025]} color="#6b8190" /><Box position={[-0.11, y, 0.495]} size={[0.26, 0.075, 0.013]} color="#394d5a" />{[0.07, 0.17, 0.23].map((x) => <Cylinder key={x} position={[x, y, 0.512]} radius={0.012} height={0.024} color="#b7c4ba" />)}</group>)}
  </group>;
}

export function OfficeFurnishings({ room }: { room: Room }) {
  const roomDesks = desks.filter((d) => d.roomId === room.id);
  return <>
    {roomDesks.map((d) => <group key={d.staffIndex}><ComputerDesk position={[d.x, d.z]} rotation={d.rotation} variant={d.staffIndex} /><OfficeChair {...workSeat(d.staffIndex)} color={room.id === 3 ? '#bf9bab' : room.id === 4 ? '#85a995' : room.id === 7 ? '#ac9474' : '#7595a3'} /></group>)}
    {room.id === 0 && <ReceptionCounter />}
    {(room.id === 2 || room.id === 5) && Array.from({ length: 6 }, (_, i) => <OfficeChair key={i} {...(room.id === 2 ? meetingSeat(i) : lunchSeat(i))} color={room.id === 2 ? '#7898a5' : '#c0a389'} dining={room.id === 5} />)}
    <group position={[room.center[0], 0, room.center[1]]} rotation={[0, roomRotation(room.id), 0]}>
      {room.id === 0 && <><group position={[1.68, 0, 0.3]} rotation={[0, -Math.PI / 2, 0]}><Box position={[0, 0.49, 0]} size={[1.42, 0.22, 0.5]} color="#95b1b6" radius={0.06} /><Box position={[0, 0.76, -0.2]} size={[1.42, 0.48, 0.12]} color="#91acb3" radius={0.05} />{[-0.55, 0.55].map((x) => <Box key={x} position={[x, 0.27, 0]} size={[0.04, 0.37, 0.36]} color={wood} />)}</group><OfficePlant position={[-1.83, 0.1, -1.85]} /><group position={[1.4, 1.5, -2.34]} rotation={[0, Math.PI, 0]}><Sign text="YOUR NEXT CHAPTER" width={1.3} height={0.28} /></group></>}
      {[1, 3, 4, 6, 7].includes(room.id) && <Rug width={3.9} depth={1.4} color={room.id === 3 ? '#e2d3df' : room.id === 4 ? '#d9e6d7' : '#cddfe1'} z={0.7} />}
      {room.id === 1 && <><WallShelf x={1.7} books /><OfficePlant position={[-1.83, 0.1, -1.91]} /></>}
      {room.id === 2 && <><Rug width={3.75} depth={3.48} color="#d2e0e3" z={-0.1} /><SharedTable /><OfficePlant position={[1.8, 0.1, -1.97]} /><group position={[0, 1.43, -2.34]}><Box position={[0, 0, 0]} size={[1.58, 0.88, 0.07]} color="#96a8ac" radius={0.025} /><Box position={[0, 0, 0.043]} size={[1.46, 0.77, 0.018]} color="#f4f2e8" /><group position={[0, 0.26, 0.057]}><Sign text="IDEAS IN PROGRESS" width={1.22} height={0.14} /></group>{[0, 1, 2].map((i) => <Box key={i} position={[-0.46 + i * 0.37, -0.12 + i * 0.07, 0.06]} size={[0.19, 0.2 + i * 0.1, 0.018]} color={['#ccaa82', '#95b1a6', '#8cacbf'][i]} />)}</group></>}
      {room.id === 3 && <><OfficePlant position={[-1.8, 0.1, -1.95]} /><group position={[1.3, 0, -1.3]}><Box position={[0, 1.2, 0]} size={[1.03, 1.12, 0.08]} color="#c7ae8a" /><Box position={[0, 1.2, 0.055]} size={[0.92, 1.0, 0.03]} color="#f0e3d6" />{[0, 1, 2].map((i) => <mesh key={i} position={[-0.24 + i * 0.21, 1.16 + (i % 2) * 0.16, 0.085]} rotation={[0, 0, i * 0.7]}><boxGeometry args={[0.14, 0.43, 0.01]} /><meshStandardMaterial color={['#c89691', '#8babbd', '#a4b58d'][i]} /></mesh>)}{[-0.37, 0.37].map((x) => <Box key={x} position={[x, 0.63, 0]} size={[0.045, 1.04, 0.045]} color={wood} />)}</group><WallShelf x={1.75} z={0.3} books /></>}
      {room.id === 4 && <><OfficePlant position={[-1.84, 0.1, -1.95]} /><WallShelf x={1.74} z={-1.25} /><group position={[-0.6, 1.64, -2.34]}><Sign text="RESEARCH  /  DISCOVERY" width={1.8} height={0.25} /></group></>}
      {room.id === 5 && <><Rug width={3.74} depth={3.24} color="#ead9c3" z={0.15} /><SharedTable dining /><KitchenCounter /></>}
      {room.id === 6 && <><ServerRack x={-1.2} /><ServerRack x={-0.25} /><group position={[-0.68, 2.13, -1.23]}><Sign text="SYSTEMS  •  HQ" width={1.64} height={0.18} /></group></>}
      {room.id === 7 && <><OfficePlant position={[-1.82, 0.1, -1.95]} /><WallShelf x={1.8} books /><group position={[1.5, 0, -0.65]} rotation={[0, -Math.PI / 2, 0]}><Box position={[0, 0.49, 0]} size={[1.25, 0.24, 0.54]} color="#bba185" radius={0.07} /><Box position={[0, 0.81, -0.22]} size={[1.25, 0.45, 0.15]} color="#b49a7e" radius={0.06} /></group><group position={[0, 1.55, -2.34]}><Sign text="MAKE GOOD THINGS HAPPEN" width={2.35} height={0.3} /></group></>}
    </group>
  </>;
}

type EntranceProps = { simulation: Simulation; speed: number; reducedMotion: boolean; avatarPosition: RefObject<Point>; avatarActive?: boolean };
export function OfficeEntrance({ simulation, speed, reducedMotion, avatarPosition, avatarActive = false }: EntranceProps) {
  const left = useRef<THREE.Group>(null), right = useRef<THREE.Group>(null), lamps = useRef<THREE.MeshStandardMaterial>(null);
  const threshold: Point = [-7.35, 5.48];
  useFrame((_, delta) => {
    const avatarNear = avatarActive && Math.hypot(avatarPosition.current[0] - threshold[0], avatarPosition.current[1] - threshold[1]) < 1.6;
    const near = simulation.npcs.some((n) => Math.hypot(n.position[0] - threshold[0], n.position[1] - threshold[1]) < 1.65) || avatarNear;
    const target = near ? 1.28 : 0;
    if (left.current && right.current && (speed > 0 || avatarActive)) { const amount = reducedMotion ? 1 : 1 - Math.exp(-9 * delta); left.current.rotation.y = THREE.MathUtils.lerp(left.current.rotation.y, target, amount); right.current.rotation.y = THREE.MathUtils.lerp(right.current.rotation.y, -target, amount); }
    if (lamps.current) lamps.current.emissiveIntensity = officePower(simulation) * 0.55;
  });
  const leaf = (side: number) => <group><mesh position={[side * 0.625, 1.09, 0]}><boxGeometry args={[1.22, 2.06, 0.038]} /><meshStandardMaterial color="#b7d6dc" transparent opacity={0.24} roughness={0.12} metalness={0.08} depthWrite={false} /></mesh>{[0.045, 2.14].map((y) => <Box key={y} position={[side * 0.625, y, 0]} size={[1.24, 0.05, 0.065]} color="#70919d" metalness={0.35} />)}{[0.04, 1.22].map((x) => <Box key={x} position={[side * x, 1.09, 0]} size={[0.045, 2.1, 0.065]} color="#70919d" metalness={0.35} />)}<Box position={[side * 1.05, 1.05, 0.06]} size={[0.025, 0.4, 0.035]} color="#d1b181" metalness={0.3} /><Box position={[side * 0.625, 0.87, 0.025]} size={[1.19, 0.04, 0.012]} color="#edf0e7" /></group>;
  return <group>
    <group position={[-7.35, 0, 5.48]}>
      <Box position={[0, 0.077, 0]} size={[2.55, 0.08, 0.25]} color="#b49c7b" />
      <group ref={left} position={[-1.25, 0, 0]}>{leaf(1)}</group><group ref={right} position={[1.25, 0, 0]}>{leaf(-1)}</group>
      {[-1.3, 1.3].map((x) => <Box key={x} position={[x, 1.13, 0]} size={[0.1, 2.2, 0.16]} color="#6b8b99" metalness={0.25} />)}
      <Box position={[0, 2.25, 0]} size={[3.6, 0.2, 0.25]} color="#c4ac89" radius={0.015} />
      <group position={[0, 2.29, 0.144]}><Sign text="VANDERLEINZ  HQ" width={2.46} height={0.18} color="#f5f0e3" background="#688793" /></group>
      <Box position={[0, 2.4, 0.4]} size={[3.66, 0.09, 0.76]} color="#e7d6b6" radius={0.02} />
      {[-1.65, 1.65].map((x) => <group key={x}><Box position={[x, 1.08, 0.42]} size={[0.12, 2.18, 0.12]} color="#bba181" /><mesh position={[x, 1.73, 0.495]}><boxGeometry args={[0.095, 0.29, 0.095]} /><meshStandardMaterial ref={x < 0 ? lamps : undefined} color="#eadcc0" emissive="#ffe3a8" emissiveIntensity={officePower(simulation) * 0.55} /></mesh></group>)}
      <Box position={[0, 0.1, 0.82]} size={[2.15, 0.018, 0.7]} color="#819a9a" radius={0.008} />
      <group position={[0, 0.12, 0.82]} rotation={[-Math.PI / 2, 0, 0]}><Sign text="WELCOME" width={1.45} height={0.25} background="#819a9a" color="#e5e7d9" /></group>
    </group>
    <OfficePlant position={[-9.13, 0.06, 6.55]} /><OfficePlant position={[-5.6, 0.06, 6.55]} />
    <group position={[-4.95, 0, 7.0]}><Box position={[0, 0.56, 0]} size={[0.12, 0.94, 0.12]} color="#a68d6c" /><group position={[0, 1.25, 0]}><Sign text="07:00 – 17:00" width={1.08} height={0.29} /><group position={[0, -0.25, 0]}><Sign text="OFFICE HOURS" width={1.08} height={0.18} /></group></group></group>
  </group>;
}

export function OfficeLandscape() {
  return <group>
    <Box position={[-7.35, -0.03, 6.8]} size={[5.5, 0.14, 2.74]} color="#d5c5aa" radius={0.03} />
    {[-1, 1].map((side) => <Box key={side} position={[-7.35 + side * 2.64, 0.02, 6.8]} size={[0.08, 0.12, 2.74]} color="#a99478" />)}
    <Box position={[-7.35, -0.14, 8.28]} size={[5.75, 0.12, 0.25]} color="#c8b598" />
    {[0, 1, 2, 3, 4].map((i) => <Box key={i} position={[-7.35, 0.052, 5.8 + i * 0.46]} size={[2.8, 0.011, 0.027]} color="#b4a186" />)}
    <Box position={[0, -0.15, -5.76]} size={[20.2, 0.17, 0.28]} color="#bda589" />
    {[-10.04, 10.04].map((x) => <Box key={x} position={[x, -0.08, 0]} size={[0.12, 0.2, 11.55]} color="#b7a082" />)}
    {[[-10.35, -4.1], [10.35, -4.1], [10.35, 4.1]].map(([x, z], i) => <group key={i}><Box position={[x, -0.06, z]} size={[0.5, 0.32, 2.0]} color="#b9a68c" radius={0.04} />{[-0.65, 0, 0.65].map((dz) => <OfficePlant key={dz} position={[x, 0.08, z + dz]} small />)}</group>)}
  </group>;
}
