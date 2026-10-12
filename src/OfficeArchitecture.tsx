import { useEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { Room } from './worldData';
import type { Point } from './navigation';
import type { Simulation } from './simulation';
import { officePower } from './simulation';
import { desks, workSeat, meetingSeat, lunchSeat, roomRotation, librarySeat, interviewSeat, founderMeetingSeat, RECEPTION_DESK_POINT, FLOOR_HEIGHT } from './officeLayout';

const wood = '#b99b76', cream = '#e5eff7', metal = '#62829a';
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

export function OfficeChair({ position, rotation, color = '#83a7c1', dining = false }: { position: Point; rotation: number; color?: string; dining?: boolean }) {
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
function WallShelf({ x = 1.7, z = -1.92, books = false, width = .6, depth = .43 }: { x?: number; z?: number; books?: boolean; width?: number; depth?: number }) {
  return <group position={[x, 0, z]}><Box position={[0, 0.65, 0]} size={[width, 1.1, depth]} color="#9cb6c9" radius={0.025} />{[0.36, 0.72, 1.08].map((y, row) => <group key={row}><Box position={[0, y, depth / 2 + .007]} size={[width - .1, 0.29, 0.015]} color="#dce8f0" />{[0, 1, 2].map((i) => books ? <Box key={i} position={[-width / 3 + i * width / 3, y + 0.01, depth / 2 + .05]} size={[0.075, 0.24, 0.1]} color={['#5c88ac', '#a6c3d5', '#536d92'][(i + row) % 3]} /> : <Cylinder key={i} position={[-width / 3 + i * width / 3, y + 0.02, depth / 2 + .05]} radius={0.045} height={0.16} color={i % 2 ? '#91bdba' : '#ddc99e'} />)}</group>)}</group>;
}
function SharedTable({ dining = false }: { dining?: boolean }) {
  return <group position={[0, 0, -0.1]}>
    <Box position={[0, 0.78, 0]} size={[1.35, 0.1, 2.5]} color={dining ? '#cfaf88' : '#b99873'} radius={0.045} />
    {[-0.9, 0.9].map((z) => <group key={z}><Box position={[0, 0.42, z]} size={[0.065, 0.7, 0.06]} color={metal} /><Box position={[0, 0.12, z]} size={[1.06, 0.06, 0.11]} color={metal} radius={0.02} /></group>)}
    {[-0.93, 0.07, 1.07].flatMap((z) => [-1, 1].map((side) => <group key={`${z}${side}`} position={[side * 0.45, 0.839, z]}>
      {dining ? <><Cylinder position={[0, 0.005, 0]} radius={0.17} height={0.018} color="#faf4e6" /><Cylinder position={[0, 0.019, 0]} radius={0.105} height={0.016} color="#d6a270" /><mesh position={[0.034, 0.04, 0]} scale={[1, 0.5, 0.75]}><sphereGeometry args={[0.043, 8, 6]} /><meshStandardMaterial color="#a8bf7f" /></mesh><Box position={[side * 0.2, 0.015, 0]} size={[0.022, 0.012, 0.18]} color="#a2b1b1" /><Mug position={[-side * 0.11, 0, -0.25]} color="#dae3de" /></> : <><Box position={[0, 0, 0]} size={[0.23, 0.012, 0.3]} color="#f6f1e4" /><Box position={[side * 0.12, 0.02, 0.01]} size={[0.012, 0.015, 0.2]} color="#728d9b" /><Mug position={[-side * 0.1, 0, -0.26]} /></>}
    </group>))}
    <group position={[0, .839, -.99]}>{dining ? <><Cylinder position={[0, .005, 0]} radius={.16} height={.018} color="#f1f7fa" /><Cylinder position={[0, .021, 0]} radius={.095} height={.016} color="#caa36f" /><Mug position={[.22, 0, .2]} color="#b8d5e5" /></> : <><Box position={[0, .005, 0]} size={[.25, .015, .23]} color="#edf4f7" /><Mug position={[.22, 0, .2]} color="#c5dce8" /></>}</group>
    {!dining && <><Box position={[0, 0.846, 0]} size={[0.3, 0.035, 0.21]} color="#6c8590" radius={0.015} /><Cylinder position={[0, 0.892, 0]} radius={0.075} height={0.045} color="#b7c9cc" /></>}
  </group>;
}
function KitchenCounter() {
  return <>
    <group position={[1.3, 0, -2.05]}>
      <Box position={[0, .53, 0]} size={[1.2, .82, .5]} color="#6c95b4" radius={.025} /><Box position={[0, .98, 0]} size={[1.2, .08, .5]} color="#e6edf0" radius={.02} />
      {[-.3, .3].map((x) => <group key={x}><Box position={[x, .57, .26]} size={[.54, .68, .025]} color="#86a8c3" radius={.015} /><Box position={[x, .82, .285]} size={[.16, .018, .026]} color="#c5d9e7" /></group>)}
      <Box position={[.26, 1.04, -.01]} size={[.46, .025, .34]} color="#547286" radius={.018} />{[-.1, .15].map((z) => <mesh key={z} position={[.26, 1.06, z]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[.073, .012, 6, 14]} /><meshStandardMaterial color="#a4b9c5" metalness={.25} /></mesh>)}
      <Cylinder position={[.26, 1.14, -.1]} radius={.093} height={.14} color="#b0c2c9" /><Box position={[.37, 1.14, -.1]} size={[.09, .025, .035]} color="#657b8a" />
      <Box position={[-.3, 1.027, -.01]} size={[.43, .017, .32]} color="#b5cad4" radius={.015} /><Box position={[-.3, 1.04, -.01]} size={[.28, .008, .2]} color="#71939f" radius={.008} />
      <mesh position={[-.3, 1.14, -.1]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.1, .016, 6, 14, Math.PI]} /><meshStandardMaterial color="#a3b9c4" metalness={.55} roughness={.25} /></mesh>
      <group position={[0, 1.66, -.27]}><Sign text="FRESH LUNCH" width={1.13} height={.22} color="#386382" background="#e3edf4" /></group>
    </group>
    <group position={[-1.65, 0, -2.25]}>
      <Box position={[0, .94, 0]} size={[.65, .09, .18]} color="#b7d0df" radius={.015} />
      <Box position={[0, 1.18, -.015]} size={[.29, .39, .18]} color="#375f7d" radius={.025} /><Box position={[0, 1.19, .085]} size={[.22, .15, .013]} color="#a5cedf" />
      <Mug position={[.23, 1.0, 0]} color="#b8d4e4" /><group position={[0, 1.65, -.07]}><Sign text="TEA  /  COFFEE" width={.84} height={.2} /></group>
    </group>
  </>;
}
function ReceptionCounter() {
  return <group position={[RECEPTION_DESK_POINT[0], 0, RECEPTION_DESK_POINT[1]]}>
    <Box position={[0, 0.61, 0]} size={[2.15, 0.98, 0.72]} color="#c3a17d" radius={0.055} />
    {Array.from({ length: 16 }, (_, i) => <Box key={i} position={[-0.98 + i * 0.131, 0.62, 0.367]} size={[0.026, 0.77, 0.025]} color="#a98560" />)}
    <Box position={[0, 1.13, 0]} size={[2.23, 0.09, 0.82]} color="#eee3cb" radius={0.045} />
    <group position={[0, 0.7, 0.397]}><Sign text="VANDERLEINZ" width={1.3} height={0.21} color="#edf6fc" background="#3c6a8d" /></group>
    <Box position={[-0.5, 1.335, -0.18]} size={[0.38, 0.28, 0.042]} color="#617d87" radius={0.02} />
    <Box position={[-0.5, 1.18, -0.18]} size={[0.2, 0.025, 0.15]} color="#789099" />
    <Box position={[-0.45, 1.185, -0.32]} size={[0.34, 0.015, 0.11]} color="#a3b6bd" />
    <Box position={[-.07, 1.19, .19]} size={[.32, .018, .29]} color="#47779a" radius={.008} />
    <Box position={[-.07, 1.202, .19]} size={[.285, .007, .25]} color="#edf4f9" />
    <group position={[-.07, 1.208, .11]} rotation={[-Math.PI / 2, 0, 0]}><Sign text="ATTENDANCE" width={.24} height={.055} background="#edf4f9" color="#4e7691" /></group>
    {[0, 1, 2].map((i) => <Box key={i} position={[-.07, 1.209, .17 + i * .043]} size={[.2, .004, .008]} color="#b5cbdc" />)}
    <Box position={[.12, 1.207, .18]} size={[.014, .014, .23]} color="#668aa6" />
    <Cylinder position={[0.56, 1.21, 0.18]} radius={0.075} height={0.06} color="#d0b080" />
    <mesh position={[0.56, 1.255, 0.18]}><sphereGeometry args={[0.059, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#c8a364" metalness={0.4} roughness={0.3} /></mesh>
    <group position={[0.34, 1.27, 0.31]}><Sign text="WELCOME" width={0.6} height={0.15} /></group>
    <OfficePlant position={[0.9, 1.175, -0.09]} small />
  </group>;
}
function ServerRack({ x }: { x: number }) {
  return <group position={[x, 0, -1.3]}>
    <Box position={[0, 1.07, 0]} size={[0.65, 1.96, 0.9]} color="#597a9a" radius={0.035} />
    <Box position={[0, 1.08, 0.451]} size={[0.6, 1.76, 0.035]} color="#425b6b" radius={0.015} />
    {[0.48, 0.82, 1.16, 1.5, 1.84].map((y) => <group key={y}><Box position={[0, y, 0.478]} size={[0.55, 0.24, 0.025]} color="#6b8190" /><Box position={[-0.11, y, 0.495]} size={[0.26, 0.075, 0.013]} color="#394d5a" />{[0.07, 0.17, 0.23].map((x) => <Cylinder key={x} position={[x, y, 0.512]} radius={0.012} height={0.024} color="#b7c4ba" />)}</group>)}
  </group>;
}

function SmallTable({ width, depth, z, reading = false }: { width: number; depth: number; z: number; reading?: boolean }) {
  return <group position={[0, 0, z]}><Box position={[0, .78, 0]} size={[width, .085, depth]} color="#b0c8d9" radius={.035} />{[-1, 1].flatMap((x) => [-1, 1].map((dz) => <Box key={`${x}${dz}`} position={[x * (width / 2 - .1), .43, dz * (depth / 2 - .09)]} size={[.04, .66, .04]} color={metal} />))}{[-.75, .75].map((x) => <group key={x}><Box position={[x, .831, .08]} size={[.34, .014, .29]} color="#eef4f7" /><Box position={[x, .843, .08]} size={[.016, .012, .29]} color={reading ? '#6286a6' : '#a1bccc'} />{reading && <Box position={[x - .2, .845, -.15]} size={[.19, .026, .25]} color="#6282a0" />}</group>)}</group>;
}
function ProjectCoffeeTable() {
  return <group position={[1.1, 0, .65]}>
    <Box position={[0, .65, 0]} size={[.4, .06, .55]} color="#b9cedf" radius={.025} />
    {[-1, 1].flatMap((x) => [-1, 1].map((z) => <Box key={`${x}${z}`} position={[x * .15, .39, z * .21]} size={[.028, .49, .028]} color={metal} />))}
    <Box position={[0, .685, 0]} size={[.22, .01, .18]} color="#edf4f8" radius={.006} />
    <group position={[0, .692, -.034]} rotation={[-Math.PI / 2, 0, 0]}><Sign text="PROJECT PLAN" width={.2} height={.045} background="#edf4f8" color="#587d99" /></group>
    <Mug position={[-.06, .684, -.17]} color="#8eb3ce" /><Mug position={[.06, .684, .17]} color="#dbe9f2" />
  </group>;
}
function LibraryBooks() {
  return <>{[-1, 1].map((side) => <group key={side} position={[side * 1.85, 0, -1]} rotation={[0, side < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}><Box position={[0, .9, 0]} size={[2.1, 1.56, .35]} color="#81a0bb" radius={.02} /><Box position={[0, .94, .185]} size={[1.98, 1.41, .016]} color="#d4e3ed" />{[.4, .82, 1.24].map((y, row) => <group key={row}><Box position={[0, y - .13, .2]} size={[2.05, .032, .27]} color="#aac4d7" />{Array.from({ length: 16 }, (_, i) => <Box key={i} position={[-.92 + i * .121, y + (i % 3) * .018, .23]} size={[.066 + (i % 3) * .011, .25 + (i % 4) * .02, .12]} color={['#315b7b', '#6c95b4', '#b0cdda', '#6d849e', '#cad8e4'][(i + row) % 5]} />)}</group>)}</group>)}</>;
}
function Restroom({ id }: { id: number }) {
  return <>
    <group position={[0, 0, -1.3]}>
      <Box position={[0, .73, -.25]} size={[.55, .66, .2]} color="#edf4f7" radius={.055} />
      <Cylinder position={[0, .335, .06]} radius={.235} bottom={.165} height={.38} color="#eef4f7" />
      <mesh position={[0, .537, .09]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1.25, 1]}><circleGeometry args={[.146, 18]} /><meshStandardMaterial color="#96b5c3" /></mesh>
      <mesh position={[0, .553, .09]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1.25, 1]}><torusGeometry args={[.177, .037, 8, 20]} /><meshStandardMaterial color="#f5f8fa" roughness={.35} /></mesh>
      <Box position={[.15, .985, -.25]} size={[.066, .018, .026]} color="#92aabb" metalness={.5} />
    </group>
    <group position={[.7, 0, -.55]}><Box position={[0, .48, 0]} size={[.31, .73, .42]} color="#82a5bf" radius={.025} /><Box position={[0, .86, 0]} size={[.35, .09, .5]} color="#e6eff5" radius={.045} /><mesh position={[0, .907, .04]} rotation={[-Math.PI / 2, 0, 0]} scale={[.75, 1, 1]}><circleGeometry args={[.125, 18]} /><meshStandardMaterial color="#96b7c5" /></mesh><mesh position={[0, 1.0, -.16]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.085, .014, 6, 14, Math.PI]} /><meshStandardMaterial color="#b4c5cc" metalness={.6} roughness={.23} /></mesh><Box position={[0, 1.29, -.245]} size={[.32, .48, .03]} color="#95b9ce" radius={.015} /><Box position={[0, 1.29, -.224]} size={[.27, .43, .014]} color="#c7e2ed" metalness={.55} /></group>
    <group position={[-.75, 1.32, -1.85]}><Sign text={id === 9 ? 'WC 01  /  PRIVATE' : 'WC 02  /  PRIVATE'} width={.92} height={.2} /></group>
    {[-1.1, 1.1].map((x) => <Box key={x} position={[x, .2, -1.3]} size={[.035, .07, 1.9]} color="#7a9fb8" />)}
  </>;
}

export function OfficeFurnishings({ room }: { room: Room }) {
  const roomDesks = desks.filter((d) => d.roomId === room.id);
  return <group position={[0, room.floor * FLOOR_HEIGHT, 0]}>
    {roomDesks.map((d) => <group key={d.staffIndex}><ComputerDesk position={[d.x, d.z]} rotation={d.rotation} variant={d.staffIndex} /><OfficeChair {...workSeat(d.staffIndex)} color={room.id === 3 ? '#315d83' : room.id === 7 ? '#5c809e' : '#83a7c2'} /></group>)}
    {room.id === 0 && <ReceptionCounter />}
    {(room.id === 2 || room.id === 5) && Array.from({ length: 7 }, (_, i) => <OfficeChair key={i} {...(room.id === 2 ? meetingSeat(i) : lunchSeat(i))} color={room.id === 2 ? '#7399b7' : '#91b2c8'} dining={room.id === 5} />)}
    {room.id === 8 && [0, 1].map((i) => <OfficeChair key={i} {...librarySeat(i)} color="#83a5be" />)}
    {room.id === 4 && [0, 1].map((i) => <OfficeChair key={i} {...interviewSeat(i)} color="#96b7cd" />)}
    {room.id === 3 && [0, 7].map((i) => <OfficeChair key={i} {...founderMeetingSeat(i)} color="#86a8c1" />)}
    <group position={[room.center[0], 0, room.center[1]]} rotation={[0, roomRotation(room.id), 0]}>
      {room.id === 0 && <><group position={[1.83, 0, .4]} rotation={[0, -Math.PI / 2, 0]}><Box position={[0, .49, 0]} size={[1.3, .22, .48]} color="#96b8ce" radius={.06} /><Box position={[0, .76, -.18]} size={[1.3, .48, .12]} color="#87a9c1" radius={.05} />{[-.5, .5].map((x) => <Box key={x} position={[x, .27, 0]} size={[.04, .37, .32]} color={metal} />)}</group><group position={[1.48, 1.46, -2.32]} rotation={[0, Math.PI, 0]}><Sign text="WELCOME TO HQ" width={1.25} height={.26} /></group></>}
      {room.id === 1 && <><Rug width={8.3} depth={3.65} color="#cbdfeb" z={.1} /><WallShelf x={3.9} z={-1.9} width={1} depth={.45} books /><group position={[-3.85, 1.53, -2.32]}><Sign text="CREATE  ·  CONNECT  ·  GROW" width={1.53} height={.25} /></group>{[-3.9, 0, 3.9].map((x) => <Box key={x} position={[x, .152, .08]} size={[.02, .005, 3.38]} color="#b7d0e1" />)}</>}
      {room.id === 2 && <><Rug width={3.7} depth={3.9} color="#cfdfeb" z={-.15} /><SharedTable /><group position={[0, 1.43, -2.32]}><Box position={[0, 0, 0]} size={[1.72, .85, .065]} color="#8da8bd" radius={.025} /><Box position={[0, 0, .04]} size={[1.6, .74, .017]} color="#e7f0f6" /><group position={[0, .24, .055]}><Sign text="TEAM IDEAS" width={1.3} height={.13} /></group>{[0, 1, 2].map((i) => <Box key={i} position={[-.47 + i * .37, -.14 + i * .07, .06]} size={[.2, .2 + i * .1, .015]} color={['#a7c5d7', '#739cb7', '#4d789d'][i]} />)}</group></>}
      {room.id === 3 && <><Rug width={3.6} depth={2.95} color="#bdcfe0" z={.25} /><ProjectCoffeeTable /><WallShelf x={1.7} z={-1.8} width={.55} depth={.45} books /><group position={[0, 1.6, -2.32]}><Sign text="VANDERLEINZ  /  FOUNDER" width={2.55} height={.31} background="#315d7e" color="#edf6fa" /></group></>}
      {room.id === 4 && <><Rug width={3.65} depth={2.6} color="#d5e6ef" z={.3} /><SmallTable width={2.2} depth={.7} z={-.6} /><WallShelf x={-1.8} z={-1.6} width={.45} depth={1} books /><group position={[0, 1.56, -2.32]}><Sign text="PEOPLE FIRST" width={2.1} height={.29} /></group></>}
      {room.id === 5 && <><Rug width={3.7} depth={3.6} color="#d7e5ec" z={.1} /><SharedTable dining /><KitchenCounter /></>}
      {room.id === 6 && <><Rug width={3.72} depth={1.32} color="#bdcfdf" z={.86} /><ServerRack x={-1.2} /><ServerRack x={-.35} /><group position={[-.75, 2.15, -1.3]}><Sign text="DATABASE  /  SYSTEMS" width={1.8} height={.2} background="#416b89" color="#e6f3fa" /></group></>}
      {room.id === 7 && <><Rug width={3.65} depth={2.65} color="#ccdeeb" z={.25} /><WallShelf x={1.65} z={-1.75} width={.5} depth={.65} books /><group position={[0, 1.54, -2.32]}><Sign text="OPERATIONS  /  ATLAS" width={2.25} height={.29} /></group></>}
      {room.id === 8 && <><Rug width={3.65} depth={2.8} color="#d2e1eb" z={.5} /><LibraryBooks /><SmallTable width={2.7} depth={.75} z={-.5} reading /><group position={[0, 1.62, -2.32]}><Sign text="A LITTLE SPACE TO THINK" width={2.45} height={.3} /></group></>}
      {[9, 10].includes(room.id) && <><Restroom id={room.id} />{[-.8, 0, .8].flatMap((x) => [-1.8, -.9, 0, .9, 1.8].map((z) => <Box key={`${x}${z}`} position={[x, .121, z]} size={[.74, .008, .8]} color={(Math.round(z * 10) + Math.round(x * 10)) % 2 ? '#d0e2ed' : '#e5eff5'} />))}</>}
    </group>
  </group>;
}

type EntranceProps = { simulation: Simulation; speed: number; reducedMotion: boolean; avatarPosition: RefObject<Point>; avatarActive?: boolean };
export function OfficeEntrance({ simulation, speed, reducedMotion, avatarPosition, avatarActive = false }: EntranceProps) {
  const left = useRef<THREE.Group>(null), right = useRef<THREE.Group>(null), lamps = useRef<THREE.MeshStandardMaterial>(null);
  const threshold: Point = [-9.8, 5.72, 0];
  useFrame((_, delta) => {
    const avatarNear = avatarActive && Math.abs(avatarPosition.current[2] ?? 0) < .5 && Math.hypot(avatarPosition.current[0] - threshold[0], avatarPosition.current[1] - threshold[1]) < 1.6;
    const near = simulation.npcs.some((n) => Math.abs(n.position[2] ?? 0) < .5 && Math.hypot(n.position[0] - threshold[0], n.position[1] - threshold[1]) < 1.65) || simulation.clients.some((client) => client.phase !== 'offsite' && Math.hypot(client.position[0] - threshold[0], client.position[1] - threshold[1]) < 1.65) || avatarNear;
    const target = near ? 1.28 : 0;
    if (left.current && right.current && (speed > 0 || avatarActive)) { const amount = reducedMotion ? 1 : 1 - Math.exp(-9 * delta); left.current.rotation.y = THREE.MathUtils.lerp(left.current.rotation.y, target, amount); right.current.rotation.y = THREE.MathUtils.lerp(right.current.rotation.y, -target, amount); }
    if (lamps.current) lamps.current.emissiveIntensity = officePower(simulation) * 0.55;
  });
  const leaf = (side: number) => <group><mesh position={[side * 0.625, 1.09, 0]}><boxGeometry args={[1.22, 2.06, 0.038]} /><meshStandardMaterial color="#b7d6dc" transparent opacity={0.24} roughness={0.12} metalness={0.08} depthWrite={false} /></mesh>{[0.045, 2.14].map((y) => <Box key={y} position={[side * 0.625, y, 0]} size={[1.24, 0.05, 0.065]} color="#70919d" metalness={0.35} />)}{[0.04, 1.22].map((x) => <Box key={x} position={[side * x, 1.09, 0]} size={[0.045, 2.1, 0.065]} color="#70919d" metalness={0.35} />)}<Box position={[side * 1.05, 1.05, 0.06]} size={[0.025, 0.4, 0.035]} color="#d1b181" metalness={0.3} /><Box position={[side * 0.625, 0.87, 0.025]} size={[1.19, 0.04, 0.012]} color="#edf0e7" /></group>;
  return <group>
    <group position={[-9.8, 0, 5.72]}>
      <Box position={[0, 0.077, 0]} size={[2.55, 0.08, 0.25]} color="#b49c7b" />
      <group ref={left} position={[-1.25, 0, 0]}>{leaf(1)}</group><group ref={right} position={[1.25, 0, 0]}>{leaf(-1)}</group>
      {[-1.3, 1.3].map((x) => <Box key={x} position={[x, 1.13, 0]} size={[0.1, 2.2, 0.16]} color="#6b8b99" metalness={0.25} />)}
      <Box position={[0, 2.25, 0]} size={[3.6, 0.2, 0.25]} color="#aecadd" radius={0.015} />
      <group position={[0, 2.29, 0.144]}><Sign text="VANDERLEINZ  HQ" width={2.46} height={0.18} color="#eef7fc" background="#315f80" /></group>
      <Box position={[0, 2.4, 0.4]} size={[3.66, 0.09, 0.76]} color="#d8e6f0" radius={0.02} />
      {[-1.65, 1.65].map((x) => <group key={x}><Box position={[x, 1.08, 0.42]} size={[0.12, 2.18, 0.12]} color="#91b4cc" /><mesh position={[x, 1.73, 0.495]}><boxGeometry args={[0.095, 0.29, 0.095]} /><meshStandardMaterial ref={x < 0 ? lamps : undefined} color="#e9edf0" emissive="#ffe3a8" emissiveIntensity={officePower(simulation) * 0.55} /></mesh></group>)}
      <Box position={[0, 0.1, 0.82]} size={[2.15, 0.018, 0.7]} color="#6f92a9" radius={0.008} />
      <group position={[0, 0.12, 0.82]} rotation={[-Math.PI / 2, 0, 0]}><Sign text="WELCOME" width={1.45} height={0.25} background="#6f92a9" color="#e5f0f7" /></group>
    </group>
    <OfficePlant position={[-11.75, 0.06, 6.8]} /><OfficePlant position={[-7.88, 0.06, 6.8]} />
    <group position={[-6.9, 0, 7.1]}><Box position={[0, 0.56, 0]} size={[0.12, 0.94, 0.12]} color="#7d9bb1" /><group position={[0, 1.25, 0]}><Sign text="07:00 – 17:00" width={1.08} height={0.29} /><group position={[0, -0.25, 0]}><Sign text="OFFICE HOURS" width={1.08} height={0.18} /></group></group></group>
  </group>;
}

export function OfficeLandscape() {
  return <group>
    <Box position={[-9.8, -0.03, 7.15]} size={[5.5, 0.14, 2.7]} color="#c7dbe8" radius={0.03} />
    {[-1, 1].map((side) => <Box key={side} position={[-9.8 + side * 2.64, 0.02, 7.15]} size={[0.08, 0.12, 2.7]} color="#779bb6" />)}
    <Box position={[-9.8, -0.14, 8.62]} size={[5.75, 0.12, 0.25]} color="#aac6d8" />
    {[0, 1, 2, 3, 4].map((i) => <Box key={i} position={[-9.8, 0.052, 6.0 + i * 0.46]} size={[2.8, 0.011, 0.027]} color="#a2bdcf" />)}
    <Box position={[0, -0.15, -5.97]} size={[24.95, 0.17, 0.2]} color="#8aa9bf" />
    {[-12.48, 12.48].map((x) => <Box key={x} position={[x, -0.08, 0]} size={[0.12, 0.2, 12.0]} color="#7d9bb4" />)}
    {[[-12.8, -4.1], [12.8, -4.1], [12.8, 4.1]].map(([x, z], i) => <group key={i}><Box position={[x, -0.06, z]} size={[0.5, 0.32, 2.0]} color="#86a8be" radius={0.04} />{[-0.65, 0, 0.65].map((dz) => <OfficePlant key={dz} position={[x, 0.08, z + dz]} small />)}</group>)}
  </group>;
}
