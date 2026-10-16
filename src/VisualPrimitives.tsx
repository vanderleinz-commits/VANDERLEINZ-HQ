import { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { PALETTE, SURFACES } from './artDirection';
import { materialMap } from './visualTextures';

export type Vec3 = [number, number, number];
type Surface = keyof typeof SURFACES;
// Repeated furniture parts share GPU resources across rooms and floor changes.
const geometries = new Map<string, THREE.BufferGeometry>();
const materials = new Map<string, THREE.MeshStandardMaterial>();
const archShape=new THREE.Shape();archShape.moveTo(-.35,-.5);archShape.lineTo(.35,-.5);archShape.lineTo(.35,.05);archShape.absarc(0,.05,.35,0,Math.PI,false);archShape.closePath();
const archGeometry=new THREE.ShapeGeometry(archShape,12);
const archMaterials=[PALETTE.corporate,PALETTE.sky].map(color=>new THREE.MeshStandardMaterial({color,roughness:.95}));
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
      color: ['wood','fabric','stone'].includes(surface) ? '#ffffff' : color, map: surface === 'wood'||surface==='fabric'||surface==='stone' ? materialMap(surface,color) : null,
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
    <RoundedBlock position={[0, 0, .033]} size={[width, height, .014]} color={PALETTE.cream} radius={.018} />
    <mesh position={[width * .25, height * .2, .049]}><circleGeometry args={[height * .13, 16]} /><meshStandardMaterial color={PALETTE.sand} roughness={.92} /></mesh>
    <mesh position={[-width*.1,0,.052]} scale={[width*.9,height*.9,1]} geometry={archGeometry} material={archMaterials[0]} dispose={null}/>
    <mesh position={[width*.22,-height*.19,.055]} scale={[width*.55,height*.55,1]} geometry={archGeometry} material={archMaterials[1]} dispose={null}/>
  </group>;
}

export function FourPointStar({ position, size = .09, color = PALETTE.sand }: { position: Vec3; size?: number; color?: string }) {
  return <group position={position}>
    <mesh scale={[.35, 1, .17]} rotation={[0, 0, Math.PI / 4]}><octahedronGeometry args={[size, 0]} /><meshStandardMaterial color={color} roughness={.8} /></mesh>
    <mesh scale={[.35, 1, .17]} rotation={[0, 0, -Math.PI / 4]}><octahedronGeometry args={[size, 0]} /><meshStandardMaterial color={color} roughness={.8} /></mesh>
  </group>;
}
