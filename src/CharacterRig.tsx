import { useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type Pose = 'idle' | 'walk' | 'work' | 'talk' | 'wave' | 'coffee' | 'think' | 'eat';
type Props = {
  color: string; hair: string; pose: Pose | RefObject<Pose>; speed: number;
  reducedMotion: boolean; variant?: number; seated?: boolean;
};
const HIP = 0.88, SEATED_HIP = 0.64, THIGH = 0.29, SHIN = 0.52, UPPER_ARM = 0.25, FOREARM = 0.24;
const SKIN_TONES = ['#dfb798', '#e9c3a5', '#edc9af', '#c89673', '#bc8d70', '#d5ad8f', '#e5bda1'];

// Actors face local +z. Furniture owns the chair; the same articulated rig sits or stands.
export function CharacterRig({ color, hair, pose, speed, reducedMotion, variant = 0, seated = false }: Props) {
  const root = useRef<THREE.Group>(null), head = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null), rightArm = useRef<THREE.Group>(null);
  const leftForearm = useRef<THREE.Group>(null), rightForearm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null), rightLeg = useRef<THREE.Group>(null);
  const leftKnee = useRef<THREE.Group>(null), rightKnee = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null), mug = useRef<THREE.Group>(null), tablet = useRef<THREE.Group>(null);
  const bowl = useRef<THREE.Group>(null), spoon = useRef<THREE.Group>(null);
  const time = useRef(variant * 0.73), sitting = useRef(seated ? 1 : 0);
  // A paused save mounts in its saved posture; later changes blend smoothly.
  const initial = useRef({ seated, pose: typeof pose === 'string' ? pose : pose.current });
  const skin = SKIN_TONES[variant % SKIN_TONES.length];
  const feminine = variant === 1 || variant === 2 || variant === 6;
  const trousers = feminine ? '#526471' : variant === 4 ? '#716854' : '#485d6a';
  useFrame((_, delta) => {
    if (!root.current || !head.current || !leftArm.current || !rightArm.current || !leftForearm.current || !rightForearm.current
      || !leftLeg.current || !rightLeg.current || !leftKnee.current || !rightKnee.current || speed === 0) return;
    const state = typeof pose === 'string' ? pose : pose.current;
    const dt = Math.min(delta, 0.1);
    time.current += dt * Math.min(speed, 2);
    const t = time.current, cycle = Math.sin(t * 8.7), subtle = reducedMotion ? 0 : 1;
    const walking = state === 'walk' && !seated, chatting = state === 'talk', waving = state === 'wave';
    const working = state === 'work', thinking = state === 'think', coffee = state === 'coffee', eating = state === 'eat';
    const blend = 1 - Math.exp(-10 * dt);
    const ease = (value: number, target: number) => THREE.MathUtils.lerp(value, target, blend);
    sitting.current = ease(sitting.current, seated ? 1 : 0);
    const sit = sitting.current;
    root.current.position.y = ease(root.current.position.y,
      (SEATED_HIP - HIP) * sit + (walking ? Math.abs(cycle) * 0.025 : Math.sin(t * 1.8) * 0.005) * subtle);
    root.current.rotation.z = ease(root.current.rotation.z, walking ? Math.sin(t * 4.35) * 0.025 * subtle : 0);
    root.current.rotation.x = ease(root.current.rotation.x, seated && working ? 0.035 : 0);
    leftLeg.current.rotation.x = ease(leftLeg.current.rotation.x, -Math.PI / 2 * sit + (walking ? cycle * 0.38 * subtle : 0));
    rightLeg.current.rotation.x = ease(rightLeg.current.rotation.x, -Math.PI / 2 * sit + (walking ? -cycle * 0.38 * subtle : 0));
    leftKnee.current.rotation.x = ease(leftKnee.current.rotation.x, Math.PI / 2 * sit + (walking ? Math.max(0, -cycle) * 0.3 * subtle : 0));
    rightKnee.current.rotation.x = ease(rightKnee.current.rotation.x, Math.PI / 2 * sit + (walking ? Math.max(0, cycle) * 0.3 * subtle : 0));
    leftLeg.current.rotation.z = ease(leftLeg.current.rotation.z, seated ? -0.025 : 0);
    rightLeg.current.rotation.z = ease(rightLeg.current.rotation.z, seated ? 0.025 : 0);
    let leftShoulder = 0.035, rightShoulder = 0.035, leftElbow = -0.08, rightElbow = -0.08;
    let leftSpread = 0.06, rightSpread = -0.06;
    if (walking) {
      leftShoulder = -cycle * 0.32 * subtle; rightShoulder = cycle * 0.32 * subtle;
      leftElbow = rightElbow = -0.15;
    } else if (working) {
      leftShoulder = rightShoulder = seated ? -0.95 : -0.7;
      leftElbow = (seated ? -0.62 : -0.65) + Math.sin(t * 13) * 0.045 * subtle;
      rightElbow = (seated ? -0.62 : -0.65) + Math.cos(t * 11.5) * 0.045 * subtle;
      leftSpread = 0.13; rightSpread = -0.13;
    } else if (chatting) {
      leftShoulder = -0.3 + Math.sin(t * 2.7) * 0.12 * subtle;
      rightShoulder = -0.4 + Math.cos(t * 2.3) * 0.16 * subtle;
      leftElbow = -0.7 + Math.sin(t * 2) * 0.15 * subtle;
      rightElbow = -0.9 + Math.cos(t * 2.6) * 0.22 * subtle;
      leftSpread = 0.2; rightSpread = -0.18;
    } else if (coffee || eating) {
      const raised = reducedMotion || Math.sin(t * (eating ? 1.2 : 0.8)) > 0.05;
      rightShoulder = -0.6; rightElbow = raised ? -1.95 : -0.95;
      leftShoulder = eating ? -0.65 : seated ? -0.38 : 0.035;
      leftElbow = eating ? -0.95 : seated ? -0.7 : -0.08;
      rightSpread = -0.08;
    } else if (thinking) {
      rightShoulder = -0.65; rightElbow = -1.85; rightSpread = 0.15;
      leftShoulder = seated ? -0.4 : -0.05; leftElbow = seated ? -0.75 : -0.15;
    } else if (seated) {
      leftShoulder = rightShoulder = -0.4; leftElbow = rightElbow = -0.65;
    }
    if (waving) {
      rightShoulder = -0.15; rightSpread = 2.05 + Math.sin(t * 7) * 0.16 * subtle; rightElbow = -0.35;
    }
    leftArm.current.rotation.x = ease(leftArm.current.rotation.x, leftShoulder);
    rightArm.current.rotation.x = ease(rightArm.current.rotation.x, rightShoulder);
    leftArm.current.rotation.z = ease(leftArm.current.rotation.z, leftSpread);
    rightArm.current.rotation.z = ease(rightArm.current.rotation.z, rightSpread);
    leftForearm.current.rotation.x = ease(leftForearm.current.rotation.x, leftElbow);
    rightForearm.current.rotation.x = ease(rightForearm.current.rotation.x, rightElbow);
    head.current.rotation.x = ease(head.current.rotation.x,
      working ? 0.16 + Math.sin(t * 1.3) * 0.025 * subtle : chatting ? Math.sin(t * 3.1) * 0.055 * subtle : thinking ? 0.06 : eating ? 0.045 : 0);
    head.current.rotation.y = ease(head.current.rotation.y, chatting ? Math.sin(t * 1.5) * 0.06 * subtle : 0);
    head.current.rotation.z = ease(head.current.rotation.z, thinking ? 0.09 : Math.sin(t * 1.2) * 0.015 * subtle);
    if (eyes.current) eyes.current.scale.y = !reducedMotion && t % 5.1 > 4.96 ? 0.12 : 1;
    if (mug.current) mug.current.visible = coffee;
    if (tablet.current) tablet.current.visible = working && !seated;
    if (bowl.current) bowl.current.visible = eating;
    if (spoon.current) spoon.current.visible = eating;
  });
  const mountPose = initial.current.pose, mountSeated = initial.current.seated;
  const startingLeftArm = mountPose === 'work' ? mountSeated ? -0.95 : -0.7 : mountPose === 'eat' ? -0.65 : mountPose === 'talk' ? -0.3 : mountSeated ? -0.4 : 0.035;
  const startingRightArm = mountPose === 'work' ? mountSeated ? -0.95 : -0.7 : mountPose === 'coffee' || mountPose === 'eat' ? -0.6 : mountPose === 'think' ? -0.65 : mountPose === 'talk' ? -0.4 : mountPose === 'wave' ? -0.15 : mountSeated ? -0.4 : 0.035;
  const startingLeftElbow = mountPose === 'work' ? mountSeated ? -0.62 : -0.65 : mountPose === 'eat' ? -0.95 : mountPose === 'talk' ? -0.7 : mountSeated ? -0.65 : -0.08;
  const startingRightElbow = mountPose === 'work' ? mountSeated ? -0.62 : -0.65 : mountPose === 'coffee' || mountPose === 'eat' ? -1.95 : mountPose === 'think' ? -1.85 : mountPose === 'talk' ? -0.9 : mountPose === 'wave' ? -0.35 : mountSeated ? -0.65 : -0.08;
  return <group ref={root} position={[0, initial.current.seated ? SEATED_HIP - HIP : 0, 0]}>
    <mesh position={[0, HIP, 0]} scale={[1, 0.65, 0.85]} castShadow><capsuleGeometry args={[0.17, 0.04, 4, 12]} /><meshStandardMaterial color={trousers} roughness={0.9} /></mesh>
    <mesh position={[0, HIP + 0.205, 0]} scale={[1, 0.68, 0.76]} castShadow><capsuleGeometry args={[feminine ? 0.176 : 0.19, 0.15, 4, 12]} /><meshStandardMaterial color={color} roughness={0.86} /></mesh>
    <mesh position={[0, HIP + 0.31, 0.139]}><boxGeometry args={[0.105, 0.125, 0.02]} /><meshStandardMaterial color="#f7efe1" roughness={0.85} /></mesh>
    <mesh position={[0, HIP + 0.25, 0.151]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.045, 0.045, 0.012]} /><meshStandardMaterial color={variant === 6 ? '#ddb575' : '#9ec3d1'} metalness={0.2} roughness={0.6} /></mesh>
    <mesh position={[0.107, HIP + 0.22, 0.145]}><boxGeometry args={[0.048, 0.07, 0.012]} /><meshStandardMaterial color="#fbf4e9" /></mesh>
    <mesh position={[0.107, HIP + 0.235, 0.153]}><boxGeometry args={[0.034, 0.009, 0.005]} /><meshStandardMaterial color="#688ca1" /></mesh>
    <mesh position={[0, HIP + 0.41, 0]}><cylinderGeometry args={[0.057, 0.064, 0.13, 10]} /><meshStandardMaterial color={skin} roughness={0.9} /></mesh>
    <group ref={head} position={[0, HIP + 0.505, 0]} rotation={[mountPose === 'work' ? 0.16 : 0, 0, mountPose === 'think' ? 0.09 : 0]}>
      <mesh scale={[0.94, 1.04, 0.95]} castShadow><sphereGeometry args={[0.192, 18, 14]} /><meshStandardMaterial color={skin} roughness={0.83} /></mesh>
      {[-1, 1].map(side => <mesh key={`ear-${side}`} position={[side * 0.183, -0.007, -0.012]} scale={[0.6, 1, 0.85]}><sphereGeometry args={[0.046, 10, 8]} /><meshStandardMaterial color={skin} roughness={0.87} /></mesh>)}
      <Hair hair={hair} variant={variant} />
      <group ref={eyes} position={[0, 0.006, 0.181]}>{[-0.068, 0.068].map(x => <group key={x} position={[x, 0, 0]}>
        <mesh scale={[1, 0.85, 0.5]}><sphereGeometry args={[0.027, 10, 8]} /><meshStandardMaterial color="#fffaf2" /></mesh>
        <mesh position={[0, 0, 0.012]} scale={[0.78, 1, 0.5]}><sphereGeometry args={[0.018, 10, 8]} /><meshStandardMaterial color={variant === 2 ? '#578077' : '#354d58'} /></mesh>
        <mesh position={[0.005, 0.007, 0.021]}><sphereGeometry args={[0.005, 6, 4]} /><meshStandardMaterial color="#ffffff" /></mesh>
      </group>)}</group>
      {[-0.069, 0.069].map(x => <mesh key={`brow-${x}`} position={[x, 0.052, 0.177]} rotation={[0, 0, x < 0 ? 0.08 : -0.08]}><boxGeometry args={[0.047, 0.009, 0.014]} /><meshStandardMaterial color={hair} /></mesh>)}
      <mesh position={[0, -0.023, 0.185]} scale={[0.7, 1, 0.85]}><sphereGeometry args={[0.028, 10, 8]} /><meshStandardMaterial color={skin} /></mesh>
      {[-0.105, 0.105].map(x => <mesh key={`cheek-${x}`} position={[x, -0.047, 0.148]} scale={[1.2, 0.55, 0.3]}><sphereGeometry args={[0.03, 8, 6]} /><meshStandardMaterial color="#cf9788" transparent opacity={0.28} /></mesh>)}
      <mesh position={[0, -0.079, 0.165]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.033, 0.006, 5, 14, Math.PI]} /><meshStandardMaterial color="#965f58" /></mesh>
      {(variant === 3 || variant === 4 || variant === 5) && <Glasses />}
      {variant === 6 && [-1, 1].map(side => <mesh key={`earring-${side}`} position={[side * 0.193, -0.044, 0.003]}><sphereGeometry args={[0.012, 8, 6]} /><meshStandardMaterial color="#d8b879" metalness={0.65} roughness={0.35} /></mesh>)}
    </group>
    <group ref={leftArm} position={[-0.222, HIP + 0.31, 0]} rotation={[startingLeftArm, 0, mountPose === 'work' ? 0.13 : 0.06]}>
      <UpperArm color={color} skin={skin} />
      <group ref={leftForearm} position={[0, -UPPER_ARM, 0]} rotation={[startingLeftElbow, 0, 0]}>
        <Forearm color={color} skin={skin} />
        <group ref={bowl} position={[0, -FOREARM - 0.01, 0.075]} visible={initial.current.pose === 'eat'}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.1, 0.066, 0.04, 14]} /><meshStandardMaterial color="#f6e6c6" roughness={0.7} /></mesh>
          <mesh position={[0, 0, 0.024]} scale={[1, 1, 0.5]}><sphereGeometry args={[0.068, 10, 8]} /><meshStandardMaterial color="#b5bc78" roughness={1} /></mesh>
        </group>
      </group>
    </group>
    <group ref={rightArm} position={[0.222, HIP + 0.31, 0]} rotation={[startingRightArm, 0, mountPose === 'wave' ? 2.05 : mountPose === 'work' ? -0.13 : -0.06]}>
      <UpperArm color={color} skin={skin} />
      <group ref={rightForearm} position={[0, -UPPER_ARM, 0]} rotation={[startingRightElbow, 0, 0]}>
        <Forearm color={color} skin={skin} />
        <group ref={mug} position={[0, -FOREARM - 0.035, 0.07]} rotation={[Math.PI / 2, 0, 0]} visible={initial.current.pose === 'coffee'}>
          <mesh><cylinderGeometry args={[0.052, 0.046, 0.105, 12]} /><meshStandardMaterial color={variant === 6 ? '#ead7c7' : '#fbf3df'} roughness={0.58} /></mesh>
          <mesh position={[0, 0.054, 0]}><cylinderGeometry args={[0.044, 0.044, 0.004, 12]} /><meshStandardMaterial color="#6f4936" roughness={0.6} /></mesh>
          <mesh position={[0.055, 0, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.031, 0.009, 6, 12]} /><meshStandardMaterial color="#fbf3df" /></mesh>
        </group>
        <group ref={spoon} position={[0, -FOREARM - 0.085, 0.055]} visible={initial.current.pose === 'eat'}>
          <mesh><boxGeometry args={[0.012, 0.11, 0.01]} /><meshStandardMaterial color="#bac8cd" metalness={0.65} roughness={0.4} /></mesh>
          <mesh position={[0, -0.065, 0]} scale={[0.7, 1, 0.25]}><sphereGeometry args={[0.024, 10, 8]} /><meshStandardMaterial color="#bac8cd" metalness={0.65} roughness={0.4} /></mesh>
        </group>
      </group>
    </group>
    {([-1, 1] as const).map(side => <group key={`leg-${side}`} ref={side === -1 ? leftLeg : rightLeg} position={[side * 0.108, HIP, 0]} rotation={[initial.current.seated ? -Math.PI / 2 : 0, 0, 0]}>
      <mesh position={[0, -THIGH / 2, 0]} castShadow><capsuleGeometry args={[0.077, THIGH - 0.13, 4, 10]} /><meshStandardMaterial color={trousers} roughness={0.94} /></mesh>
      <group ref={side === -1 ? leftKnee : rightKnee} position={[0, -THIGH, 0]} rotation={[initial.current.seated ? Math.PI / 2 : 0, 0, 0]}>
        <mesh castShadow><sphereGeometry args={[0.074, 10, 8]} /><meshStandardMaterial color={trousers} roughness={0.94} /></mesh>
        <mesh position={[0, -SHIN / 2, 0]} castShadow><capsuleGeometry args={[0.064, SHIN - 0.12, 4, 10]} /><meshStandardMaterial color={trousers} roughness={0.94} /></mesh>
        <mesh position={[0, -SHIN + 0.003, 0.04]} scale={[1, 0.55, 1.5]} castShadow><capsuleGeometry args={[0.078, 0.035, 4, 10]} /><meshStandardMaterial color={variant === 6 ? '#725543' : '#354650'} roughness={0.7} /></mesh>
        <mesh position={[0, -SHIN - 0.037, 0.04]}><boxGeometry args={[0.147, 0.022, 0.22]} /><meshStandardMaterial color="#d9d1c3" roughness={0.95} /></mesh>
      </group>
    </group>)}
    <group ref={tablet} position={[0, HIP + 0.12, 0.29]} rotation={[-0.35, 0, 0]} visible={initial.current.pose === 'work' && !initial.current.seated}>
      <mesh castShadow><boxGeometry args={[0.29, 0.19, 0.02]} /><meshStandardMaterial color="#425c6b" roughness={0.7} /></mesh>
      <mesh position={[0, 0, 0.013]}><boxGeometry args={[0.255, 0.155, 0.005]} /><meshStandardMaterial color="#b4d8da" emissive="#89bac7" emissiveIntensity={0.2} /></mesh>
    </group>
  </group>;
}
function UpperArm({ color, skin }: { color: string; skin: string }) {
  return <>
    <mesh position={[0, -UPPER_ARM / 2, 0]} castShadow><capsuleGeometry args={[0.066, UPPER_ARM - 0.12, 4, 10]} /><meshStandardMaterial color={color} roughness={0.87} /></mesh>
    <mesh position={[0, -UPPER_ARM, 0]}><sphereGeometry args={[0.056, 10, 8]} /><meshStandardMaterial color={skin} roughness={0.9} /></mesh>
  </>;
}
function Forearm({ color, skin }: { color: string; skin: string }) {
  return <>
    <mesh position={[0, -FOREARM / 2 + 0.015, 0]} castShadow><capsuleGeometry args={[0.052, FOREARM - 0.11, 4, 10]} /><meshStandardMaterial color={color} roughness={0.87} /></mesh>
    <mesh position={[0, -FOREARM + 0.04, 0]}><cylinderGeometry args={[0.052, 0.047, 0.032, 10]} /><meshStandardMaterial color="#eee8dc" roughness={0.9} /></mesh>
    <mesh position={[0, -FOREARM - 0.018, 0]} scale={[0.8, 1.14, 0.7]} castShadow><sphereGeometry args={[0.055, 10, 8]} /><meshStandardMaterial color={skin} roughness={0.88} /></mesh>
    {[0, 1, 2].map(finger => <mesh key={finger} position={[(finger - 1) * 0.024, -FOREARM - 0.058, 0.011]}><capsuleGeometry args={[0.011, 0.025, 2, 6]} /><meshStandardMaterial color={skin} roughness={0.88} /></mesh>)}
  </>;
}
function Hair({ hair, variant }: { hair: string; variant: number }) {
  const longHair = variant === 2 || variant === 6, bob = variant === 1;
  return <>
    <mesh position={[0, 0.07, -0.021]} scale={[0.97, 1, 0.98]} castShadow><sphereGeometry args={[0.198, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.57]} /><meshStandardMaterial color={hair} roughness={0.96} /></mesh>
    <mesh position={[-0.059, 0.11, 0.115]} rotation={[0.06, 0, -0.26]} scale={[1.65, 0.5, 0.6]} castShadow><sphereGeometry args={[0.085, 12, 8]} /><meshStandardMaterial color={hair} roughness={0.96} /></mesh>
    <mesh position={[0.078, 0.11, 0.11]} rotation={[0.08, 0, 0.3]} scale={[1.1, 0.45, 0.55]} castShadow><sphereGeometry args={[0.072, 12, 8]} /><meshStandardMaterial color={hair} roughness={0.96} /></mesh>
    {(longHair || bob) && <>
      <mesh position={[0, longHair ? -0.076 : -0.015, -0.095]} scale={[1.03, longHair ? 1.25 : 0.85, 0.69]} castShadow><sphereGeometry args={[0.177, 14, 12]} /><meshStandardMaterial color={hair} roughness={0.96} /></mesh>
      {[-1, 1].map(side => <mesh key={side} position={[side * 0.166, longHair ? -0.025 : 0.005, -0.025]} scale={[0.46, longHair ? 1.75 : 1.1, 0.62]} castShadow><sphereGeometry args={[0.107, 12, 10]} /><meshStandardMaterial color={hair} roughness={0.96} /></mesh>)}
    </>}
    {variant === 2 && <mesh position={[0, -0.17, -0.215]} scale={[0.65, 1.4, 0.65]} castShadow><sphereGeometry args={[0.095, 12, 10]} /><meshStandardMaterial color={hair} roughness={0.96} /></mesh>}
    {variant === 3 && [-1, 0, 1].map(i => <mesh key={i} position={[i * 0.09, 0.18, 0.004]} castShadow><sphereGeometry args={[0.065, 10, 8]} /><meshStandardMaterial color={hair} roughness={0.98} /></mesh>)}
  </>;
}
function Glasses() {
  return <group position={[0, 0.009, 0.192]}>
    {[-0.068, 0.068].map(x => <mesh key={x} position={[x, 0, 0]} scale={[1.12, 0.86, 1]}><torusGeometry args={[0.042, 0.0045, 5, 14]} /><meshStandardMaterial color="#526978" metalness={0.35} roughness={0.5} /></mesh>)}
    <mesh><boxGeometry args={[0.046, 0.006, 0.008]} /><meshStandardMaterial color="#526978" /></mesh>
    {[-1, 1].map(side => <mesh key={side} position={[side * 0.131, 0, -0.041]} rotation={[0, side * 0.4, 0]}><boxGeometry args={[0.007, 0.006, 0.092]} /><meshStandardMaterial color="#526978" /></mesh>)}
  </group>;
}
