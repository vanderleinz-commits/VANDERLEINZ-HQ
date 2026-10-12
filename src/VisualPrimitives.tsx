import { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { PALETTE, SURFACES } from './artDirection';

export type Vec3 = [number, number, number];
type Surface = keyof typeof SURFACES;
// Repeated furniture parts share GPU resources across rooms and floor changes.
const geometries = new Map<string, THREE.BufferGeometry>();
const materials = new Map<string, THREE.MeshStandardMaterial>();
const woodMaps = new Map<string, THREE.CanvasTexture>();

function woodMap(color: string) {
  if (woodMaps.has(color)) return woodMaps.get(color)!;
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color; ctx.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 32; i++) {
    const y = i * 4 + Math.sin(i * 1.7);
    ctx.strokeStyle = i % 3 === 0 ? 'rgba(86,54,28,.09)' : 'rgba(255,247,226,.09)';
    ctx.lineWidth = .7;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(78, y + Math.sin(i) * 2, 174, y - Math.cos(i) * 2, 256, y); ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace; texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  woodMaps.set(color, texture); return texture;
}

export function RoundedBlock({ position, size, color, radius = .02, metalness, surface = 'plaster', roughness }: {
  position: Vec3; size: Vec3; color: string; radius?: number; metalness?: number; surface?: Surface; roughness?: number;
}) {
  const geometry = useMemo(() => {
    const r = Math.max(0, Math.min(radius, Math.min(...size) * .48));
    const key = `${size.join(',')}:${r}`;
    if (!geometries.has(key)) geometries.set(key, r ? new RoundedBoxGeometry(...size, 1, r) : new THREE.BoxGeometry(...size));
    return geometries.get(key)!;
  }, [size[0], size[1], size[2], radius]);
  const material = useMemo(() => {
    const m = metalness ?? SURFACES[surface].metalness, r = roughness ?? SURFACES[surface].roughness;
    const key = `${color}:${surface}:${r}:${m}`;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({
      color: surface === 'wood' ? '#ffffff' : color, map: surface === 'wood' ? woodMap(color) : null,
      roughness: r, metalness: m,
    }));
    return materials.get(key)!;
  }, [color, surface, metalness, roughness]);
  const castsShadow = Math.min(...size) >= .035 && Math.max(...size) > .35;
  return <mesh position={position} geometry={geometry} material={material} castShadow={castsShadow} receiveShadow dispose={null} />;
}

export function SkyArtwork({ position, width = .95, height = .68 }: { position: Vec3; width?: number; height?: number }) {
  return <group position={position}>
    <RoundedBlock position={[0, 0, 0]} size={[width + .09, height + .09, .055]} color={PALETTE.woodLight} surface="wood" radius={.035} />
    <RoundedBlock position={[0, 0, .033]} size={[width, height, .014]} color={PALETTE.sky} radius={.018} />
    <mesh position={[width * .25, height * .2, .049]}><circleGeometry args={[height * .13, 16]} /><meshStandardMaterial color={PALETTE.sand} roughness={.92} /></mesh>
    {[-1, 1].map((side) => <mesh key={side} position={[side * width * .22, -height * .1 + side * .035, .052]} scale={[2.25, .7, .15]}><sphereGeometry args={[height * .1, 12, 8]} /><meshStandardMaterial color={PALETTE.cream} roughness={1} /></mesh>)}
    <RoundedBlock position={[0, -height * .28, .045]} size={[width * .9, height * .12, .018]} color={PALETTE.corporate} radius={.015} />
  </group>;
}

export function FourPointStar({ position, size = .09, color = PALETTE.sand }: { position: Vec3; size?: number; color?: string }) {
  return <group position={position}>
    <mesh scale={[.35, 1, .17]} rotation={[0, 0, Math.PI / 4]}><octahedronGeometry args={[size, 0]} /><meshStandardMaterial color={color} roughness={.8} /></mesh>
    <mesh scale={[.35, 1, .17]} rotation={[0, 0, -Math.PI / 4]}><octahedronGeometry args={[size, 0]} /><meshStandardMaterial color={color} roughness={.8} /></mesh>
  </group>;
}
