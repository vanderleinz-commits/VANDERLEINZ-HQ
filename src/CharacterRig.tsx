import { useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type Pose = 'idle' | 'walk' | 'work' | 'talk' | 'wave' | 'coffee' | 'think';
type Props = { color: string; hair: string; pose: Pose | RefObject<Pose>; speed: number; reducedMotion: boolean; variant?: number };

// A small procedural skeleton: shoulders, hips and head share the same rig for NPCs and Avatar.
export function CharacterRig({ color, hair, pose, speed, reducedMotion, variant = 0 }: Props) {
  const root = useRef<THREE.Group>(null), head = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null), rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null), rightLeg = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null), mug = useRef<THREE.Group>(null), tablet = useRef<THREE.Group>(null);
  const time = useRef(variant * 0.7);
  useFrame((_, delta) => {
    if (!root.current || !head.current || !leftArm.current || !rightArm.current || !leftLeg.current || !rightLeg.current) return;
    if (speed === 0) return;
    const state = typeof pose === 'string' ? pose : pose.current;
    const dt = Math.min(delta, 0.1);
    time.current += dt * Math.min(speed, 2);
    const t = time.current, cycle = Math.sin(t * 9), subtle = reducedMotion ? 0 : 1;
    const walking = state === 'walk', chatting = state === 'talk', waving = state === 'wave', thinking = state === 'think';
    const working = state === 'work', coffee = state === 'coffee';
    const blend = 1 - Math.exp(-14 * dt);
    const lerp = (current: number, target: number) => THREE.MathUtils.lerp(current, target, blend);
    root.current.position.y = lerp(root.current.position.y, walking ? Math.abs(cycle) * 0.045 * subtle : Math.sin(t * 2) * 0.012 * subtle);
    root.current.rotation.z = lerp(root.current.rotation.z, walking ? Math.sin(t * 4.5) * 0.035 * subtle : 0);
    leftLeg.current.rotation.x = lerp(leftLeg.current.rotation.x, walking ? cycle * 0.55 * subtle : 0);
    rightLeg.current.rotation.x = lerp(rightLeg.current.rotation.x, walking ? -cycle * 0.55 * subtle : 0);
    leftArm.current.rotation.x = lerp(leftArm.current.rotation.x, walking ? -cycle * 0.45 * subtle : working ? -0.95 + Math.sin(t * 10) * 0.09 * subtle : chatting ? -0.4 + Math.sin(t * 3) * 0.2 * subtle : 0.08);
    rightArm.current.rotation.x = lerp(rightArm.current.rotation.x, walking ? cycle * 0.45 * subtle : working ? -0.95 - Math.sin(t * 10) * 0.09 * subtle : coffee ? -1.1 + Math.sin(t * 1.7) * 0.15 * subtle : thinking ? -1.25 : chatting ? -0.55 + Math.cos(t * 3) * 0.24 * subtle : 0.08);
    leftArm.current.rotation.z = lerp(leftArm.current.rotation.z, chatting ? 0.25 : 0.06);
    rightArm.current.rotation.z = lerp(rightArm.current.rotation.z, waving ? 2.3 + Math.sin(t * 8) * 0.25 * subtle : thinking ? -0.25 : -0.06);
    head.current.rotation.x = lerp(head.current.rotation.x, chatting ? Math.sin(t * 4) * 0.08 * subtle : working ? 0.14 : thinking ? -0.08 : 0);
    head.current.rotation.z = lerp(head.current.rotation.z, thinking ? 0.14 : Math.sin(t * 1.5) * 0.03 * subtle);
    if (eyes.current) eyes.current.scale.y = !reducedMotion && t % 4.8 > 4.65 ? 0.15 : 1;
    if (mug.current) mug.current.visible = coffee;
    if (tablet.current) tablet.current.visible = working;
  });
  return <group ref={root}>
    <mesh position={[0, 0.76, 0]} castShadow><capsuleGeometry args={[0.21, 0.31, 4, 10]} /><meshStandardMaterial color={color} roughness={0.9} /></mesh>
    <mesh position={[0, 0.98, 0.09]}><boxGeometry args={[0.08, 0.09, 0.035]} /><meshStandardMaterial color="#fbf2d8" /></mesh>
    <group ref={head} position={[0, 1.21, 0]}>
      <mesh castShadow><sphereGeometry args={[0.205, 16, 12]} /><meshStandardMaterial color="#edc7a8" /></mesh>
      <mesh position={[0, 0.08, -0.025]} castShadow><sphereGeometry args={[0.21, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.58]} /><meshStandardMaterial color={hair} /></mesh>
      <group ref={eyes} position={[0, 0.015, 0.19]}>{[-0.073, 0.073].map((x) => <mesh key={x} position={[x, 0, 0]}><sphereGeometry args={[0.022, 8, 6]} /><meshStandardMaterial color="#374a50" /></mesh>)}</group>
      <mesh position={[0, -0.075, 0.187]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.045, 0.008, 4, 12, Math.PI]} /><meshStandardMaterial color="#ab7466" /></mesh>
    </group>
    <group ref={leftArm} position={[-0.25, 0.95, 0]}><Arm color={color} /></group>
    <group ref={rightArm} position={[0.25, 0.95, 0]}><Arm color={color} /><group ref={mug} position={[0, -0.39, 0.065]} visible={false}><mesh><cylinderGeometry args={[0.07, 0.06, 0.11, 10]} /><meshStandardMaterial color="#fcf6e6" /></mesh><mesh position={[0.065, 0, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.035, 0.012, 4, 10]} /><meshStandardMaterial color="#fcf6e6" /></mesh></group></group>
    <group ref={leftLeg} position={[-0.11, 0.5, 0]}><Leg /></group>
    <group ref={rightLeg} position={[0.11, 0.5, 0]}><Leg /></group>
    <group ref={tablet} position={[0, 0.82, 0.32]} rotation={[-0.45, 0, 0]} visible={typeof pose === 'string' && pose === 'work'}><mesh castShadow><boxGeometry args={[0.38, 0.27, 0.035]} /><meshStandardMaterial color="#425c6b" /></mesh><mesh position={[0, 0, 0.023]}><boxGeometry args={[0.32, 0.2, 0.012]} /><meshStandardMaterial color="#b4d8da" emissive="#89bac7" emissiveIntensity={0.25} /></mesh></group>
  </group>;
}
function Arm({ color }: { color: string }) {
  return <><mesh position={[0, -0.14, 0]} castShadow><capsuleGeometry args={[0.072, 0.19, 3, 8]} /><meshStandardMaterial color={color} /></mesh><mesh position={[0, -0.34, 0]} castShadow><sphereGeometry args={[0.072, 10, 8]} /><meshStandardMaterial color="#edc7a8" /></mesh></>;
}
function Leg() {
  return <><mesh position={[0, -0.16, 0]} castShadow><capsuleGeometry args={[0.075, 0.21, 3, 8]} /><meshStandardMaterial color="#61747e" /></mesh><mesh position={[0, -0.35, 0.045]} castShadow><boxGeometry args={[0.16, 0.11, 0.26]} /><meshStandardMaterial color="#435b68" /></mesh></>;
}
