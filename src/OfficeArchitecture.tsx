import { useEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Room } from './worldData';
import type { Point } from './navigation';
import type { Simulation } from './simulation';
import { officePower } from './simulation';
import { desks, workSeat, meetingSeat, lunchSeat, roomRotation, librarySeat, interviewSeat, clientMeetingSeat, ownerDeskPoint, ownerDeskSeat, RECEPTION_DESK_POINT, FLOOR_HEIGHT, FLOOR_SURFACE_HEIGHT, HR_TABLE_LOCAL, HR_TABLE_SIZE, FOUNDER_SOFAS, FOUNDER_COFFEE_LOCAL, ownerDeskRotation, LUNCH_TABLE_LOCAL, LUNCH_TABLE_SIZE, CLIENT_TABLE_SIZE, ENTRY_POINT } from './officeLayout';
import { BRAND, PALETTE } from './artDirection';
import { RoundedBlock, SkyArtwork, FourPointStar } from './VisualPrimitives';
import { StaticFurnitureBatch } from './StaticFurnitureBatch';

const wood = PALETTE.wood, cream = PALETTE.cream, metal = '#637C99';
const woodColors = new Set([wood, PALETTE.woodLight, PALETTE.woodDark, '#c5a17b', '#cfaf88', '#b99873', '#c3a17d', '#a98560', '#cbaa84']);
type Vec3 = [number, number, number];


function Box({ position, size, color, radius = .018, metalness = 0, fabric = false }: { position: Vec3; size: Vec3; color: string; radius?: number; metalness?: number; fabric?: boolean }) {
  const surface = woodColors.has(color) ? 'wood' : fabric ? 'fabric' : metalness ? 'trim' : 'plaster';
  return <RoundedBlock position={position} size={size} color={woodColors.has(color) ? (color === '#a98560' ? PALETTE.woodDark : color === '#cfaf88' ? PALETTE.woodLight : color) : color} radius={radius} surface={surface} metalness={metalness} />;
}

function Cylinder({ position, radius, height, color, bottom = radius }: { position: Vec3; radius: number; height: number; color: string; bottom?: number }) {
  return <mesh position={position} castShadow receiveShadow><cylinderGeometry args={[radius, bottom, height, 12]} /><meshStandardMaterial color={color} roughness={0.74} /></mesh>;
}

function Sign({ text, width, height, color = PALETTE.midnight, background = PALETTE.cream }: { text: string; width: number; height: number; color?: string; background?: string }) {
  const map = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = Math.round(1024 * height / width);
    const context = canvas.getContext('2d');
    if (context) { context.fillStyle = background; context.fillRect(0, 0, canvas.width, canvas.height); context.fillStyle = color; context.textAlign = 'center'; context.textBaseline = 'middle'; context.font = `600 ${Math.min(canvas.height * 0.43, canvas.width / text.length * 1.45)}px Arial`; context.fillText(text, canvas.width / 2, canvas.height / 2, canvas.width * .92); }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
  }, [text, width, height, color, background]);
  useEffect(() => () => map.dispose(), [map]);
  return <mesh><planeGeometry args={[width, height]} /><meshStandardMaterial map={map} roughness={0.8} side={THREE.DoubleSide} /></mesh>;
}

export function OfficePlant({ position, small = false }: { position: Vec3; small?: boolean }) {
  return <group position={position} scale={small ? 0.42 : 1}>
    <Cylinder position={[0, 0.24, 0]} radius={0.19} bottom={0.145} height={0.43} color={PALETTE.sand} />
    <Cylinder position={[0, 0.465, 0]} radius={0.17} height={0.025} color="#6e5c47" />
    {[0, 1, 2, 3, 4].map((i) => <group key={i} rotation={[0, i * 2.1, 0]}><Cylinder position={[0.035, 0.68 + i * 0.045, 0]} radius={0.016} height={0.54 + i * 0.035} color="#59785d" /><mesh position={[0.1, 0.8 + i * 0.075, 0]} rotation={[0, 0, -0.7]} scale={[0.55, 1.3, 0.38]} castShadow><sphereGeometry args={[0.19, 10, 8]} /><meshStandardMaterial color={i % 2 ? PALETTE.leaf : '#A4BE96'} roughness={0.95} /></mesh></group>)}
  </group>;
}


export function OfficeChair({ position, rotation, color = '#83a7c1', dining = false }: { position: Point; rotation: number; color?: string; dining?: boolean }) {
  return <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]}>
    <Box position={[0, 0.48, 0]} size={[0.55, 0.09, 0.51]} color={dining ? wood : PALETTE.midnight} radius={0.04} />
    <Box position={[0, 0.53, 0]} size={[0.53, 0.075, 0.48]} color={color} radius={0.035} fabric />
    <Box position={[0, 0.86, -0.235]} size={[0.54, 0.58, 0.14]} color={dining ? wood : PALETTE.midnight} radius={0.064} />
    <Box position={[0, 0.87, -0.149]} size={[0.46, 0.48, 0.055]} color={color} radius={0.024} fabric />
    {dining ? <>{[-1, 1].flatMap((x) => [-1, 1].map((z) => <Box key={`${x}${z}`} position={[x * 0.21, 0.25, z * 0.18]} size={[0.04, 0.42, 0.04]} color={wood} />))}</> : <>
      {[-1, 1].map((s) => <group key={s}><Box position={[s * 0.29, 0.69, -0.01]} size={[0.065, 0.045, 0.37]} color="#576e77" radius={0.02} /><Box position={[s * 0.25, 0.59, -0.13]} size={[0.04, 0.22, 0.05]} color={metal} /></group>)}
      <Cylinder position={[0, 0.28, 0]} radius={0.045} height={0.33} color="#566970" />
      {[0, 1, 2, 3, 4].map((i) => <group key={i} rotation={[0, i * Math.PI * 2 / 5, 0]}><Box position={[0, 0.075, 0.145]} size={[0.055, 0.045, 0.28]} color={metal} radius={0.02} /><mesh position={[0, 0.056, 0.28]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.045, 0.045, 0.07, 8]} /><meshStandardMaterial color="#3f535a" /></mesh></group>)}
    </>}
  </group>;
}


export function ComputerDesk({ position, rotation, variant }: { position: Point; rotation: number; variant: number }) {
  return <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]}>
    <Box position={[0, 0.78, 0]} size={[1.45, 0.09, 0.76]} color={wood} radius={0.044} />
    {[-0.64, 0.64].map((x) => <group key={x}><Box position={[x, 0.4, 0]} size={[0.055, 0.72, 0.55]} color={cream} radius={0.018} /><Box position={[x, 0.055, 0]} size={[0.12, 0.045, 0.62]} color={metal} radius={0.01} /></group>)}
    <Box position={[0, 0.92, -0.19]} size={[0.045, 0.23, 0.045]} color="#586a72" />
    <Box position={[0, 0.842, -0.19]} size={[0.28, 0.027, 0.17]} color="#63777f" radius={0.01} />
    <Box position={[0, 1.125, -0.19]} size={[0.59, 0.37, 0.055]} color={PALETTE.midnight} radius={0.025} />
    <Box position={[0, 1.13, -0.157]} size={[0.535, 0.305, 0.012]} color="#263b47" radius={0.009} />
    <Box position={[-0.11, 0.837, 0.21]} size={[0.44, 0.025, 0.16]} color="#71818a" radius={0.01} />
    {Array.from({ length: 3 }, (_, row) => <Box key={row} position={[-0.11, 0.854, 0.163 + row * 0.044]} size={[0.38, 0.006, 0.021]} color="#dee5e1" />)}
    <Box position={[0.365, 0.833, 0.19]} size={[0.24, 0.011, 0.24]} color="#7f9aa3" radius={0.02} />
    <Box position={[0.37, 0.856, 0.17]} size={[0.075, 0.042, 0.105]} color="#efe8d9" radius={0.02} />
    <Box position={[-0.57, 0.59, -0.08]} size={[0.25, 0.4, 0.38]} color={cream} radius={0.03} />
    {[0.46, 0.58, 0.7].map((y) => <group key={y}><Box position={[-0.57, y, 0.118]} size={[0.21, 0.1, 0.018]} color="#e4d8c1" /><Box position={[-0.57, y, 0.136]} size={[0.07, 0.012, 0.022]} color={metal} /></group>)}

    <Box position={[-0.49, 0.834, 0.2]} size={[0.2, 0.014, 0.26]} color={[PALETTE.sky, PALETTE.lavender, PALETTE.teal][variant % 3]} radius={0.006} />
    <Box position={[-0.48, 0.845, 0.2]} size={[0.014, 0.014, 0.19]} color="#667987" />
    {variant === 1 && <><Box position={[0.44, 0.837, -0.29]} size={[0.19, 0.028, 0.11]} color="#bd9bb5" /><Box position={[0.43, 0.857, -0.29]} size={[0.02, 0.01, 0.1]} color="#ede4d0" /></>}
    {variant === 3 && <Cylinder position={[-0.56, 0.97, -0.23]} radius={0.043} height={0.25} color="#a5bec1" />}
    {variant === 5 && <Box position={[-0.54, 0.946, -0.24]} size={[0.13, 0.24, 0.1]} color="#506977" />}
  </group>;
}

function Rug({ width, depth, color, z = 0 }: { width: number; depth: number; color: string; z?: number }) {
  return <><Box position={[0, .018, z]} size={[width, 0.018, depth]} color={color} radius={0.008} fabric />{[-1, 1].map((side) => <Box key={side} position={[0, .031, z + side * (depth / 2 - 0.12)]} size={[width - 0.2, 0.006, 0.025]} color={PALETTE.cream} radius={0} />)}</>;
}

function WallShelf({ x = 1.7, z = -1.92, books = false, width = .6, depth = .43 }: { x?: number; z?: number; books?: boolean; width?: number; depth?: number }) {
  return <group position={[x, 0, z]}><Box position={[0, 0.65, 0]} size={[width, 1.1, depth]} color={wood} radius={0.035} />{[0.36, 0.72, 1.08].map((y, row) => <group key={row}><Box position={[0, y, depth / 2 + .007]} size={[width - .1, 0.29, 0.015]} color={PALETTE.cream} />{[0, 1, 2].map((i) => books ? <Box key={i} position={[-width / 3 + i * width / 3, y + 0.01, depth / 2 + .05]} size={[0.075, 0.24, 0.1]} color={[PALETTE.corporate, PALETTE.lavender, PALETTE.teal][(i + row) % 3]} /> : <Cylinder key={i} position={[-width / 3 + i * width / 3, y + 0.02, depth / 2 + .05]} radius={0.045} height={0.16} color={i % 2 ? PALETTE.teal : PALETTE.sand} />)}</group>)}</group>;
}

function SharedTable({ dining = false, client = false }: { dining?: boolean; client?: boolean }) {
  const width = dining ? LUNCH_TABLE_SIZE[0] : client ? CLIENT_TABLE_SIZE[0] : 1.35;
  const depth = dining ? LUNCH_TABLE_SIZE[1] : client ? CLIENT_TABLE_SIZE[1] : 2.5;
  const z = dining ? LUNCH_TABLE_LOCAL[1] : client ? 0 : -.1;
  const rows = dining ? [-1.3, -.35, .6, 1.55] : client ? [-1.35, -.45, .45, 1.35] : [-1, 0, 1];
  return <group position={[0, 0, z]}>
    <Box position={[0, .78, 0]} size={[width, .1, depth]} color={dining ? PALETTE.woodLight : wood} radius={.048} />
    {[-1, 1].map(side => <group key={side}><Box position={[0, .42, side * (depth / 2 - .35)]} size={[.065, .7, .06]} color={metal} /><Box position={[0, .12, side * (depth / 2 - .35)]} size={[width - .29, .06, .11]} color={metal} radius={.02} /></group>)}
    {rows.flatMap(row => [-1, 1].map(side => <group key={`${row}${side}`} position={[side * (width / 2 - .26), .839, row]}>
      {dining ? <><Cylinder position={[0, .005, 0]} radius={.17} height={.018} color="#faf4e6" /><Box position={[side * .2, .015, 0]} size={[.022, .012, .18]} color="#a2b1b1" /></> : <><Box position={[0, 0, 0]} size={[.23, .012, .3]} color="#f6f1e4" /><Box position={[side * .12, .02, .01]} size={[.012, .015, .2]} color="#728d9b" /></>}
    </group>))}
    {!dining && <><Box position={[0, .846, 0]} size={[.3, .035, .21]} color="#6c8590" radius={.015} /><Cylinder position={[0, .892, 0]} radius={.075} height={.045} color="#b7c9cc" /></>}
  </group>;
}

function KitchenCounter() {
  return <>
    <group position={[1.3, 0, -2.75]}>
      <Box position={[0, .53, 0]} size={[2, .82, .55]} color="#6c95b4" radius={.025} /><Box position={[0, .98, 0]} size={[2, .08, .55]} color="#e6edf0" radius={.02} />
      {[-.3, .3].map((x) => <group key={x}><Box position={[x, .57, .26]} size={[.54, .68, .025]} color="#86a8c3" radius={.015} /><Box position={[x, .82, .285]} size={[.16, .018, .026]} color="#c5d9e7" /></group>)}
      <Box position={[.26, 1.04, -.01]} size={[.46, .025, .34]} color="#547286" radius={.018} />{[-.1, .15].map((z) => <mesh key={z} position={[.26, 1.06, z]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[.073, .012, 6, 14]} /><meshStandardMaterial color="#a4b9c5" metalness={.25} /></mesh>)}
      <Cylinder position={[.26, 1.14, -.1]} radius={.093} height={.14} color="#b0c2c9" /><Box position={[.37, 1.14, -.1]} size={[.09, .025, .035]} color="#657b8a" />
      <Box position={[-.3, 1.027, -.01]} size={[.43, .017, .32]} color="#b5cad4" radius={.015} /><Box position={[-.3, 1.04, -.01]} size={[.28, .008, .2]} color="#71939f" radius={.008} />
      <mesh position={[-.3, 1.14, -.1]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.1, .016, 6, 14, Math.PI]} /><meshStandardMaterial color="#a3b9c4" metalness={.55} roughness={.25} /></mesh>
      <group position={[0, 1.66, -.27]}><Sign text="FRESH LUNCH" width={1.13} height={.22} color="#386382" background="#e3edf4" /></group>
    </group>
    <group position={[-2.2, 0, -2.8]}>
      <Box position={[0, .94, 0]} size={[.75, .09, .4]} color="#b7d0df" radius={.015} />
      <Box position={[0, 1.18, -.015]} size={[.29, .39, .18]} color="#375f7d" radius={.025} /><Box position={[0, 1.19, .085]} size={[.22, .15, .013]} color="#a5cedf" />
      <group position={[0, 1.65, -.07]}><Sign text="DRINK PREPARATION" width={.84} height={.2} /></group>
    </group>
  </>;
}

function ReceptionCounter() {
  return <group position={[RECEPTION_DESK_POINT[0], 0, RECEPTION_DESK_POINT[1]]}>
    <Box position={[0, 0.61, 0]} size={[2.15, 0.98, 0.72]} color={wood} radius={0.065} />
    {Array.from({ length: 12 }, (_, i) => <Box key={i} position={[-0.97 + i * 0.176, 0.62, 0.367]} size={[0.025, 0.77, 0.025]} color={PALETTE.woodDark} />)}
    <Box position={[0, 1.13, 0]} size={[2.23, 0.09, 0.82]} color={PALETTE.cream} radius={0.044} />
    <Box position={[0, .7, .399]} size={[1.56, .32, .022]} color={PALETTE.midnight} radius={.011} />
    <group position={[0, 0.7, 0.413]}><Sign text={BRAND.shortName} width={1.4} height={0.24} color={PALETTE.sand} background={PALETTE.midnight} /></group>
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
  return <group position={[x, 0, -1.95]}>
    <Box position={[0, 1.07, 0]} size={[0.65, 1.96, 0.9]} color="#597a9a" radius={0.035} />
    <Box position={[0, 1.08, 0.451]} size={[0.6, 1.76, 0.035]} color="#425b6b" radius={0.015} />
    {[0.48, 0.82, 1.16, 1.5, 1.84].map((y) => <group key={y}><Box position={[0, y, 0.478]} size={[0.55, 0.24, 0.025]} color="#6b8190" /><Box position={[-0.11, y, 0.495]} size={[0.26, 0.075, 0.013]} color="#394d5a" />{[0.07, 0.17, 0.23].map((x) => <Cylinder key={x} position={[x, y, 0.512]} radius={0.012} height={0.024} color="#b7c4ba" />)}</group>)}
  </group>;
}


function SmallTable({ width, depth, x = 0, z, reading = false }: { width: number; depth: number; x?: number; z: number; reading?: boolean }) {
  return <group position={[x, 0, z]}><Box position={[0, .78, 0]} size={[width, .085, depth]} color={PALETTE.woodLight} radius={.038} />{[-1, 1].flatMap((x) => [-1, 1].map((dz) => <Box key={`${x}${dz}`} position={[x * (width / 2 - .1), .43, dz * (depth / 2 - .09)]} size={[.04, .66, .04]} color={metal} />))}{[-Math.min(.75,width*.25), Math.min(.75,width*.25)].map((x) => <group key={x}><Box position={[x, .831, .08]} size={[.34, .014, .29]} color={PALETTE.cream} /><Box position={[x, .843, .08]} size={[.016, .012, .29]} color={reading ? PALETTE.corporate : PALETTE.sky} />{reading && <Box position={[x - .2, .845, -.15]} size={[.19, .026, .25]} color={PALETTE.corporate} />}</group>)}</group>;
}

function ProjectCoffeeTable() {
  return <group position={[FOUNDER_COFFEE_LOCAL[0], 0, FOUNDER_COFFEE_LOCAL[1]]}>
    <Box position={[0, .53, 0]} size={[1.15, .06, .8]} color="#b9cedf" radius={.025} />
    {[-1, 1].flatMap((x) => [-1, 1].map((z) => <Box key={`${x}${z}`} position={[x * .47, .29, z * .31]} size={[.028, .49, .028]} color={metal} />))}
    <Box position={[0, .565, 0]} size={[.32, .01, .23]} color="#edf4f8" radius={.006} />
    <group position={[0, .692, -.034]} rotation={[-Math.PI / 2, 0, 0]}><Sign text="PROJECT PLAN" width={.2} height={.045} background="#edf4f8" color="#587d99" /></group>

  </group>;
}

function FounderSofa() {
  return <>{FOUNDER_SOFAS.map((sofa, index) => <group key={index} position={[sofa.x, 0, sofa.z]} rotation={[0, sofa.rotation, 0]}>
    <Box position={[0, .34, 0]} size={[2.2, .34, .8]} color="#6486a8" radius={.09} fabric />
    <Box position={[0, .73, -.44]} size={[2.2, .78, .16]} color="#52779c" radius={.085} fabric />
    {[-1.04, 1.04].map(x => <Box key={x} position={[x, .55, 0]} size={[.14, .48, .8]} color="#52779c" radius={.065} fabric />)}
    {[-.68, 0, .68].map((x, i) => <Box key={x} position={[x, .535, .035]} size={[.64, .15, .62]} color={i === 1 ? '#87a7c4' : '#7898b8'} radius={.065} fabric />)}
    <Box position={[.75, .36, .82]} size={[.65, .38, .85]} color="#6486a8" radius={.07} fabric />
    <Box position={[.75, .565, .82]} size={[.62, .13, .81]} color="#87a7c4" radius={.07} fabric />
    <Box position={[-.67, .86, -.31]} size={[.28, .27, .09]} color={index ? PALETTE.sand : PALETTE.cream} radius={.065} fabric />
    {[-.8, .8].flatMap(x => [-.22, .25].map(z => <Box key={`${x}${z}`} position={[x, .13, z]} size={[.07, .25, .07]} color={wood} radius={.02} />))}
  </group>)}</>;
}

function LibraryBooks() {
  return <>{[-1, 1].map((side) => <group key={side} position={[side * 2.6, 0, -1]} rotation={[0, side < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}><Box position={[0, .9, 0]} size={[2.8, 1.56, .35]} color={wood} radius={.038} /><Box position={[0, .94, .185]} size={[2.68, 1.41, .016]} color={PALETTE.cream} />{[.4, .82, 1.24].map((y, row) => <group key={row}><Box position={[0, y - .13, .2]} size={[2.75, .032, .27]} color={PALETTE.woodLight} />{Array.from({ length: 12 }, (_, i) => <Box key={i} position={[-.89 + i * .16, y + (i % 3) * .018, .23]} size={[.08 + (i % 3) * .012, .25 + (i % 4) * .02, .12]} color={[PALETTE.midnight, PALETTE.corporate, PALETTE.sand, PALETTE.lavender, PALETTE.teal][(i + row) % 5]} />)}</group>)}</group>)}</>;
}

function LobbyLounge() {
  return <group position={[4.8, 0, -.5]} rotation={[0, -Math.PI / 2, 0]}>
    <Box position={[0, .36, 0]} size={[3.5, .35, .75]} color={PALETTE.sky} radius={.08} fabric />
    <Box position={[0, .75, -.36]} size={[3.5, .72, .14]} color={PALETTE.corporate} radius={.065} fabric />
    {[-1, 0, 1].map((x, i) => <group key={x}><Box position={[x, .565, 0]} size={[.95, .14, .59]} color="#9abfd9" radius={.06} fabric /><Box position={[x, .82, -.24]} size={[.3, .28, .1]} color={i === 1 ? PALETTE.sand : PALETTE.cream} radius={.06} fabric /></group>)}
    {[-1.45, 1.45].map(x => <Box key={x} position={[x, .15, 0]} size={[.07, .25, .52]} color={wood} />)}
  </group>;
}

function StorageRoom() {
  return <>
    <Rug width={3.2} depth={2.2} color="#cfdfdc" z={1.05} />
    <group position={[-2.4, 0, -1.3]}>
      <Box position={[0, 1.06, 0]} size={[.75, 1.95, 2.4]} color={PALETTE.woodDark} radius={.035} />
      {[.35, .9, 1.45].map((y, row) => <group key={y}><Box position={[.4, y, 0]} size={[.035, .06, 2.3]} color={PALETTE.woodLight} />{[-.8, 0, .8].map((z, i) => <group key={z}><Box position={[.4, y + .19, z]} size={[.32, .33, .62]} color={(i + row) % 2 ? '#c9b694' : '#adbdc7'} radius={.02} /><Box position={[.566, y + .2, z]} size={[.012, .08, .21]} color={PALETTE.cream} /></group>)}</group>)}
    </group>
    <group position={[1.2, 0, -2.65]}>{[-.8, 0, .8].map((x, i) => <group key={x}><Box position={[x, .32, 0]} size={[.7, .55, .6]} color={PALETTE.sand} radius={.025} /><Box position={[x, .605, 0]} size={[.09, .015, .6]} color="#ab8c66" /><Box position={[x, .93, 0]} size={[.62, .58, .55]} color={i % 2 ? '#bdcdd5' : '#d4bd98'} radius={.025} /><Box position={[x, .93, .283]} size={[.26, .11, .012]} color={PALETTE.cream} /></group>)}</group>
    <group position={[2.35, 0, -.8]}>
      <Box position={[0, .33, 0]} size={[.7, .11, 1.15]} color="#6a8a94" radius={.035} />
      <Box position={[0, .94, -.5]} size={[.68, .045, .06]} color={metal} />
      {[-.29, .29].map(x => <Box key={x} position={[x, .63, -.5]} size={[.04, .63, .04]} color={metal} />)}
      <Cylinder position={[0, .55, -.13]} radius={.22} bottom={.18} height={.4} color={PALETTE.teal} />
      <Box position={[0, .9, .28]} size={[.035, 1.2, .035]} color={wood} />
      <Box position={[0, .285, .28]} size={[.48, .08, .19]} color="#8faeb4" radius={.02} />
      {[-1, 1].flatMap(x => [-1, 1].map(z => <Cylinder key={`${x}${z}`} position={[x * .28, .21, z * .44]} radius={.065} height={.07} color={metal} />))}
    </group>
    <group position={[-1.2, 0, -2.7]}>
      {[-.2, .2].map((x, i) => <group key={x}><Box position={[x, .96, 0]} size={[.03, 1.65, .03]} color={wood} /><Box position={[x, .15, .02]} size={[.3, .16, .12]} color={i ? '#a8b8b1' : '#af987b'} radius={.025} /></group>)}
    </group>
    <SmallTable width={1.55} depth={.55} z={.75} />
    <group position={[0, 1.6, -3.02]}><Sign text="OFFICE CARE  /  SUPPLIES" width={2.8} height={.3} /></group>
    <group position={[0, 1.33, -3.02]}><Sign text="A LITTLE REST BETWEEN TASKS" width={2.25} height={.18} /></group>
  </>;
}

function Restroom({ id }: { id: number }) {
  return <>
    <group position={[0, 0, -1.8]}>
      <Box position={[0, .73, -.25]} size={[.55, .66, .2]} color="#edf4f7" radius={.055} />
      <Cylinder position={[0, .335, .06]} radius={.235} bottom={.165} height={.38} color="#eef4f7" />
      <mesh position={[0, .537, .09]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1.25, 1]}><circleGeometry args={[.146, 18]} /><meshStandardMaterial color="#96b5c3" /></mesh>
      <mesh position={[0, .553, .09]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1.25, 1]}><torusGeometry args={[.177, .037, 8, 20]} /><meshStandardMaterial color="#f5f8fa" roughness={.35} /></mesh>
      <Box position={[.15, .985, -.25]} size={[.066, .018, .026]} color="#92aabb" metalness={.5} />
    </group>
    <group position={[.95, 0, -.8]}><Box position={[0, .48, 0]} size={[.31, .73, .42]} color="#82a5bf" radius={.025} /><Box position={[0, .86, 0]} size={[.35, .09, .5]} color="#e6eff5" radius={.045} /><mesh position={[0, .907, .04]} rotation={[-Math.PI / 2, 0, 0]} scale={[.75, 1, 1]}><circleGeometry args={[.125, 18]} /><meshStandardMaterial color="#96b7c5" /></mesh><mesh position={[0, 1.0, -.16]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.085, .014, 6, 14, Math.PI]} /><meshStandardMaterial color="#b4c5cc" metalness={.6} roughness={.23} /></mesh><Box position={[0, 1.29, -.245]} size={[.32, .48, .03]} color="#95b9ce" radius={.015} /><Box position={[0, 1.29, -.224]} size={[.27, .43, .014]} color="#c7e2ed" metalness={.55} /></group>
    <group position={[-.75, 1.32, -2.7]}><Sign text={id === 9 ? 'WC 01  /  PRIVATE' : 'WC 02  /  PRIVATE'} width={.92} height={.2} /></group>
    {[-1.1, 1.1].map((x) => <Box key={x} position={[x, .2, -1.8]} size={[.035, .07, 1.9]} color="#7a9fb8" />)}
  </>;
}


export function OfficeFurnishings({ room }: { room: Room }) {
  const roomDesks = desks.filter((d) => d.roomId === room.id);
  return <group position={[0, room.floor * FLOOR_HEIGHT + FLOOR_SURFACE_HEIGHT, 0]} userData={{ cameraObstacle: true }}><StaticFurnitureBatch>
    {roomDesks.map((d) => <group key={d.staffIndex}><ComputerDesk position={[d.x, d.z]} rotation={d.rotation} variant={d.staffIndex} /><OfficeChair {...workSeat(d.staffIndex)} color={room.id === 3 ? '#315d83' : room.id === 7 ? '#5c809e' : '#83a7c2'} /></group>)}
    {room.id === 3 && <><ComputerDesk position={ownerDeskPoint} rotation={ownerDeskRotation} variant={0} /><OfficeChair {...ownerDeskSeat} color={PALETTE.midnight} /></>}
    {room.id === 0 && <ReceptionCounter />}
    {(room.id === 2 || room.id === 5) && Array.from({ length: room.id === 5 ? 10 : 7 }, (_, i) => <OfficeChair key={i} {...(room.id === 2 ? meetingSeat(i) : lunchSeat(i))} color={room.id === 2 ? '#7399b7' : '#91b2c8'} dining={room.id === 5} />)}
    {room.id === 8 && [0, 1, 2].map((i) => <OfficeChair key={i} {...librarySeat(i)} color="#83a5be" />)}
    {room.id === 4 && [0, 1].map((i) => <OfficeChair key={i} {...interviewSeat(i)} color="#96b7cd" />)}
    {room.id === 11 && Array.from({ length: 8 }, (_, i) => <OfficeChair key={i} {...clientMeetingSeat(i)} color={i < 2 ? '#8297b4' : '#96b7c1'} />)}
    {room.id === 12 && [8, 9].map(index => <OfficeChair key={index} {...workSeat(index)} color="#7fa3a5" dining />)}
    <group position={[room.center[0], 0, room.center[1]]} rotation={[0, roomRotation(room.id), 0]}>
      {room.id === 0 && <><LobbyLounge /><Rug width={3.5} depth={2.8} color="#d4e4ee" z={-.1} /><WallShelf x={-4.8} z={-2.3} width={1.5} depth={.55} books /><OfficePlant position={[5.55, 0, 2.25]} /><OfficePlant position={[5.55, 0, -2.25]} /><group position={[0, 1.5, -3.02]} rotation={[0, Math.PI, 0]}><Sign text="WELCOME TO YOUR LITTLE SPACE" width={3.4} height={.32} /></group><group position={[-3.6, 1.5, -3.02]} rotation={[0, Math.PI, 0]}><SkyArtwork position={[0, 0, 0]} width={1.8} height={.9} /></group><group position={[3.2, 1.3, -3.02]} rotation={[0, Math.PI, 0]}><Sign text="MEET  ·  CREATE  ·  BELONG" width={2.2} height={.26} /></group></>}
      {room.id === 1 && <><Rug width={11.2} depth={5.3} color="#cbdfeb" z={.1} /><WallShelf x={5.5} z={-2.45} width={1} depth={.45} books /><group position={[-3.85, 1.53, -3.02]}><Sign text="CREATE  ·  CONNECT  ·  GROW" width={1.53} height={.25} /></group>{[-3.9, 0, 3.9].map((x) => <Box key={x} position={[x, .031, .08]} size={[.02, .005, 3.38]} color="#b7d0e1" />)}</>}
      {room.id === 2 && <><Rug width={4.8} depth={4.9} color="#cfdfeb" z={-.15} /><SharedTable /><group position={[0, 1.43, -3.02]}><Box position={[0, 0, 0]} size={[1.72, .85, .065]} color="#8da8bd" radius={.025} /><Box position={[0, 0, .04]} size={[1.6, .74, .017]} color="#e7f0f6" /><group position={[0, .24, .055]}><Sign text="TEAM IDEAS" width={1.3} height={.13} /></group>{[0, 1, 2].map((i) => <Box key={i} position={[-.47 + i * .37, -.14 + i * .07, .06]} size={[.2, .2 + i * .1, .015]} color={['#a7c5d7', '#739cb7', '#4d789d'][i]} />)}</group></>}
      {room.id === 3 && <><FounderSofa /><Rug width={4.9} depth={3.65} color="#C5D8E5" z={.55} /><ProjectCoffeeTable /><WallShelf x={2.65} z={-2.55} width={.55} depth={.45} books /><group position={[-.55, 1.6, -3.02]}><Sign text="BLUE AND SPACE  /  FOUNDER" width={2.55} height={.31} background={PALETTE.midnight} color={PALETTE.sand} /></group></>}
      {room.id === 4 && <><Rug width={4.9} depth={3.4} color="#d5e6ef" z={.3} /><SmallTable x={HR_TABLE_LOCAL[0]} z={HR_TABLE_LOCAL[1]} width={HR_TABLE_SIZE[0]} depth={HR_TABLE_SIZE[1]} /><WallShelf x={2.65} z={-2.1} width={.45} depth={.8} books /><group position={[0, 1.56, -3.02]}><Sign text="PEOPLE & GROWTH" width={2.7} height={.29} /></group></>}
      {room.id === 5 && <><Rug width={4.25} depth={5.6} color="#d7e5ec" z={.1} /><SharedTable dining /><KitchenCounter /></>}
      {room.id === 6 && <><Rug width={5.1} depth={2.3} color="#bdcfdf" z={.86} /><ServerRack x={-2.3} /><ServerRack x={-1.35} /><group position={[-.75, 2.15, -1.3]}><Sign text="DATABASE  /  SYSTEMS" width={1.8} height={.2} background="#416b89" color="#e6f3fa" /></group></>}
      {room.id === 7 && <><Rug width={4.9} depth={3.5} color="#ccdeeb" z={.25} /><WallShelf x={2.65} z={-2.45} width={.5} depth={.65} books /><group position={[0, 1.54, -3.02]}><Sign text="OPERATIONS" width={2.25} height={.29} /></group></>}
      {room.id === 8 && <><Rug width={4.9} depth={3.6} color="#d2e1eb" z={.5} /><LibraryBooks /><SmallTable width={3.6} depth={.9} z={-.5} reading /><group position={[0, 1.62, -3.02]}><Sign text="A LITTLE SPACE TO THINK" width={2.45} height={.3} /></group></>}
      {room.id === 11 && <><Rug width={4.3} depth={4.65} color="#d9d9e9" z={-.05} /><SharedTable client /><WallShelf x={2.7} z={-1.7} width={.42} depth={.5} books /><group position={[0, 1.58, -3.02]}><Sign text="CLIENT MEETINGS" width={2.3} height={.29} /></group></>}
      {room.id === 12 && <StorageRoom />}
      {[9, 10].includes(room.id) && <><Restroom id={room.id} />{[-.8, 0, .8].flatMap((x) => [-1.8, -.9, 0, .9, 1.8].map((z) => <Box key={`${x}${z}`} position={[x, .005, z]} size={[.74, .008, .8]} color={(Math.round(z * 10) + Math.round(x * 10)) % 2 ? '#d0e2ed' : '#e5eff5'} />))}</>}
      {[0, 1, 3, 4, 7, 8].includes(room.id) && <group position={[room.width / 2 - .1, 1.15, room.id === 1 ? .1 : .85]} rotation={[0, -Math.PI / 2, 0]}><SkyArtwork position={[0, 0, 0]} width={room.id === 1 ? 1.12 : .8} height={.62} /></group>}
      {[1, 2, 3, 5, 7, 8].includes(room.id) && <OfficePlant position={[-room.width / 2 + .38, .13, -room.depth / 2 + .72]} small={room.id === 8} />}
    </group>
  </StaticFurnitureBatch></group>;
}


type EntranceProps = { simulation: Simulation; speed: number; reducedMotion: boolean; avatarPosition: RefObject<Point>; avatarActive?: boolean };

export function OfficeEntrance({ simulation, speed, reducedMotion, avatarPosition, avatarActive = false }: EntranceProps) {
  const left = useRef<THREE.Group>(null), right = useRef<THREE.Group>(null), lamps = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const threshold: Point = [ENTRY_POINT[0], 7.43, 0];
  useFrame((_, delta) => {
    const avatarNear = avatarActive && Math.abs(avatarPosition.current[2] ?? 0) < .5 && Math.hypot(avatarPosition.current[0] - threshold[0], avatarPosition.current[1] - threshold[1]) < 1.6;
    const near = simulation.npcs.some((n) => Math.abs(n.position[2] ?? 0) < .5 && Math.hypot(n.position[0] - threshold[0], n.position[1] - threshold[1]) < 1.65) || simulation.clients.some((client) => client.phase !== 'offsite' && Math.hypot(client.position[0] - threshold[0], client.position[1] - threshold[1]) < 1.65) || avatarNear;
    const target = near ? 1.28 : 0;
    if (left.current && right.current && (speed > 0 || avatarActive)) { const amount = reducedMotion ? 1 : 1 - Math.exp(-9 * delta); left.current.rotation.y = THREE.MathUtils.lerp(left.current.rotation.y, target, amount); right.current.rotation.y = THREE.MathUtils.lerp(right.current.rotation.y, -target, amount); }
    lamps.current.forEach((lamp) => { if (lamp) lamp.emissiveIntensity = officePower(simulation) * 0.32; });
  });
  const leaf = (side: number) => <group><mesh position={[side * 0.625, 1.09, 0]}><boxGeometry args={[1.22, 2.06, 0.038]} /><meshStandardMaterial color="#b7d6dc" transparent opacity={0.24} roughness={0.12} metalness={0.08} depthWrite={false} /></mesh>{[0.045, 2.14].map((y) => <Box key={y} position={[side * 0.625, y, 0]} size={[1.24, 0.05, 0.065]} color="#70919d" metalness={0.35} />)}{[0.04, 1.22].map((x) => <Box key={x} position={[side * x, 1.09, 0]} size={[0.045, 2.1, 0.065]} color="#70919d" metalness={0.35} />)}<Box position={[side * 1.05, 1.05, 0.06]} size={[0.025, 0.4, 0.035]} color="#d1b181" metalness={0.3} /><Box position={[side * 0.625, 0.87, 0.025]} size={[1.19, 0.04, 0.012]} color="#edf0e7" /></group>;
  return <group>
    <group position={[ENTRY_POINT[0], 0, 7.43]}>
      <Box position={[0, 0.077, 0]} size={[2.55, 0.08, 0.25]} color="#b49c7b" />
      <group ref={left} position={[-1.25, 0, 0]}>{leaf(1)}</group><group ref={right} position={[1.25, 0, 0]}>{leaf(-1)}</group>
      {[-1.3, 1.3].map((x) => <Box key={x} position={[x, 1.13, 0]} size={[0.1, 2.2, 0.16]} color="#6b8b99" metalness={0.25} />)}
      <Box position={[0, 2.27, 0]} size={[3.6, 0.28, 0.25]} color={PALETTE.midnight} radius={0.04} />
      <group position={[0, 2.32, 0.144]}><Sign text="BLUE AND SPACE" width={2.63} height={0.14} color={PALETTE.sand} background={PALETTE.midnight} /><group position={[0, -.112, .002]}><Sign text="HEADQUARTERS" width={1.55} height={0.078} color={PALETTE.cloud} background={PALETTE.midnight} /></group></group>
      <FourPointStar position={[-1.53, 2.27, .14]} size={.085} /><FourPointStar position={[1.53, 2.27, .14]} size={.085} />
      <Box position={[0, 2.46, 0.4]} size={[3.66, 0.1, 0.76]} color={PALETTE.woodLight} radius={0.035} />
      {[-1.65, 1.65].map((x, i) => <group key={x}><Box position={[x, 1.08, 0.42]} size={[0.12, 2.18, 0.12]} color={PALETTE.corporate} /><Box position={[x, 1.74, .502]} size={[.16, .36, .12]} color={PALETTE.midnight} radius={.025} /><mesh position={[x, 1.73, 0.572]}><boxGeometry args={[0.095, 0.26, 0.025]} /><meshStandardMaterial ref={(material) => { lamps.current[i] = material; }} color={PALETTE.cream} emissive={PALETTE.sand} emissiveIntensity={officePower(simulation) * 0.32} roughness={.8} /></mesh></group>)}
      <Box position={[0, 0.1, 0.82]} size={[2.15, 0.018, 0.7]} color={PALETTE.corporate} radius={0.008} fabric />
      <group position={[0, 0.12, 0.82]} rotation={[-Math.PI / 2, 0, 0]}><Sign text="A LITTLE SPACE FOR YOU" width={1.68} height={0.23} background={PALETTE.corporate} color={PALETTE.cloud} /></group>
    </group>
    <OfficePlant position={[ENTRY_POINT[0] - 2.2, .06, 8.4]} /><OfficePlant position={[ENTRY_POINT[0] + 2.2, .06, 8.4]} />
    <group position={[ENTRY_POINT[0] + 2.7, 0, 8.8]}><Box position={[0, 0.56, 0]} size={[0.12, 0.94, 0.12]} color="#7d9bb1" /><group position={[0, 1.25, 0]}><Sign text="07:00 – 17:00" width={1.08} height={0.29} /><group position={[0, -0.25, 0]}><Sign text="OFFICE HOURS" width={1.08} height={0.18} /></group></group></group>
  </group>;
}


export function OfficeLandscape() {
  return <group>
    <Box position={[ENTRY_POINT[0], -.03, 9.03]} size={[5.9, .14, 3.3]} color="#c7dbe8" radius={.03} />
    {[-1, 1].map(side => <Box key={side} position={[ENTRY_POINT[0] + side * 2.84, .02, 9.03]} size={[.08, .12, 3.3]} color="#779bb6" />)}
    <Box position={[ENTRY_POINT[0], -.14, 10.8]} size={[6.15, .12, .25]} color="#aac6d8" />
    {[0, 1, 2, 3, 4].map(i => <Box key={i} position={[ENTRY_POINT[0], .052, 7.65 + i * .6]} size={[2.8, .011, .027]} color="#a2bdcf" />)}
    <Box position={[.8, -.15, -7.85]} size={[33.45, .17, .2]} color="#8aa9bf" />
    {[-15.98, 17.58].map(x => <Box key={x} position={[x, -.08, 0]} size={[.12, .2, 15.8]} color="#7d9bb4" />)}
    {[[-16.3, -5.5], [17.9, -5.5], [17.9, 5.5]].map(([x, z], i) => <group key={i}><Box position={[x, -.06, z]} size={[.5, .32, 2.0]} color="#86a8be" radius={.04} />{[-.65, 0, .65].map(dz => <OfficePlant key={dz} position={[x, .08, z + dz]} small />)}</group>)}
  </group>;
}
