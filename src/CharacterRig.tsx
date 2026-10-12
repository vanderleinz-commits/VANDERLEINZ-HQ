import { useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type Pose = 'idle' | 'walk' | 'work' | 'talk' | 'wave' | 'coffee' | 'think' | 'eat'
  | 'read' | 'repair' | 'cook' | 'sign' | 'inspect' | 'stairs' | 'toilet';
type Props = {
  color: string; hair: string; pose: Pose | RefObject<Pose>; speed: number;
  reducedMotion: boolean; variant?: number; seated?: boolean;
};
const HIP = 0.88, SEATED_HIP = 0.64, THIGH = 0.29, SHIN = 0.52, UPPER_ARM = 0.25, FOREARM = 0.24;
const SKIN_TONES = ['#dfb798', '#e9c3a5', '#edc9af', '#c89673', '#bc8d70', '#d5ad8f', '#e5bda1', '#c99e7b', '#d3b49c'];

// Actors face local +z. Furniture owns the chair; the same articulated rig sits or stands.
export function CharacterRig({ color, hair, pose, speed, reducedMotion, variant = 0, seated = false }: Props) {
  const root = useRef<THREE.Group>(null), head = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null), rightArm = useRef<THREE.Group>(null);
  const leftForearm = useRef<THREE.Group>(null), rightForearm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null), rightLeg = useRef<THREE.Group>(null);
  const leftKnee = useRef<THREE.Group>(null), rightKnee = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null), mug = useRef<THREE.Group>(null), tablet = useRef<THREE.Group>(null);
  const bowl = useRef<THREE.Group>(null), spoon = useRef<THREE.Group>(null);
  const book = useRef<THREE.Group>(null), tool = useRef<THREE.Group>(null);
  const pan = useRef<THREE.Group>(null), pen = useRef<THREE.Group>(null);
  const time = useRef(variant * 0.73), sitting = useRef(seated ? 1 : 0);
  // A paused save mounts in its saved posture; later changes blend smoothly.
  const initial = useRef({ seated, pose: typeof pose === 'string' ? pose : pose.current });
  const skin = SKIN_TONES[((Math.floor(variant) % SKIN_TONES.length) + SKIN_TONES.length) % SKIN_TONES.length];
  const feminine = variant === 1 || variant === 2 || variant === 6;
  const founder = variant === 7, visitor = variant === 8;
  const jacket = founder ? '#344a67' : visitor ? '#777f87' : color;
  const trousers = founder ? '#2c3a50' : visitor ? '#515963' : feminine ? '#526471' : variant === 4 ? '#716854' : '#485d6a';
  useFrame((_, delta) => {
    if (!root.current || !head.current || !leftArm.current || !rightArm.current || !leftForearm.current || !rightForearm.current
      || !leftLeg.current || !rightLeg.current || !leftKnee.current || !rightKnee.current || speed === 0) return;
    const state = typeof pose === 'string' ? pose : pose.current;
    const dt = Math.min(delta, 0.1);
    time.current += dt * Math.min(speed, 2);
    const t = time.current, stairWalking = state === 'stairs' && !seated;
    const cycle = Math.sin(t * (stairWalking ? 4 : 5)), subtle = reducedMotion ? 0 : 1;
    const walking = (state === 'walk' || stairWalking) && !seated, chatting = state === 'talk';
    const working = state === 'work', thinking = state === 'think', coffee = state === 'coffee', eating = state === 'eat';
    const reading = state === 'read', repairing = state === 'repair', cooking = state === 'cook', signing = state === 'sign', inspecting = state === 'inspect';
    const blend = 1 - Math.exp(-10 * dt);
    const ease = (value: number, target: number) => THREE.MathUtils.lerp(value, target, blend);
    sitting.current = ease(sitting.current, seated ? 1 : 0);
    const sit = sitting.current;
    root.current.position.y = ease(root.current.position.y,
      (SEATED_HIP - HIP) * sit + (walking ? Math.abs(cycle) * (stairWalking ? 0.018 : 0.02) : Math.sin(t * 1.8) * 0.005) * subtle);
    root.current.rotation.z = ease(root.current.rotation.z, walking ? Math.sin(t * (stairWalking ? 2 : 2.5)) * 0.02 * subtle : 0);
    root.current.rotation.x = ease(root.current.rotation.x, seated && working ? 0.035 : stairWalking ? -0.035 : 0);
    leftLeg.current.rotation.x = ease(leftLeg.current.rotation.x, -Math.PI / 2 * sit + (walking ? cycle * (stairWalking ? 0.47 : 0.34) * subtle : 0));
    rightLeg.current.rotation.x = ease(rightLeg.current.rotation.x, -Math.PI / 2 * sit + (walking ? -cycle * (stairWalking ? 0.47 : 0.34) * subtle : 0));
    leftKnee.current.rotation.x = ease(leftKnee.current.rotation.x, Math.PI / 2 * sit + (walking ? Math.max(0, -cycle) * (stairWalking ? 0.65 : 0.3) * subtle : 0));
    rightKnee.current.rotation.x = ease(rightKnee.current.rotation.x, Math.PI / 2 * sit + (walking ? Math.max(0, cycle) * (stairWalking ? 0.65 : 0.3) * subtle : 0));
    leftLeg.current.rotation.z = ease(leftLeg.current.rotation.z, seated ? -0.025 : 0);
    rightLeg.current.rotation.z = ease(rightLeg.current.rotation.z, seated ? 0.025 : 0);
    const { leftShoulder, rightShoulder, leftElbow, rightElbow, leftSpread, rightSpread } = armTargets(state, seated, t, subtle);
    leftArm.current.rotation.x = ease(leftArm.current.rotation.x, leftShoulder);
    rightArm.current.rotation.x = ease(rightArm.current.rotation.x, rightShoulder);
    leftArm.current.rotation.z = ease(leftArm.current.rotation.z, leftSpread);
    rightArm.current.rotation.z = ease(rightArm.current.rotation.z, rightSpread);
    leftForearm.current.rotation.x = ease(leftForearm.current.rotation.x, leftElbow);
    rightForearm.current.rotation.x = ease(rightForearm.current.rotation.x, rightElbow);
    rightForearm.current.rotation.y = ease(rightForearm.current.rotation.y, cooking ? Math.cos(t * 2.8) * 0.13 * subtle : signing ? Math.sin(t * 4) * 0.06 * subtle : 0);
    head.current.rotation.x = ease(head.current.rotation.x,
      working || reading || signing ? 0.16 + Math.sin(t * 1.3) * 0.025 * subtle : repairing || cooking ? 0.1 : chatting ? Math.sin(t * 3.1) * 0.055 * subtle : thinking ? 0.06 : eating ? 0.045 : 0);
    head.current.rotation.y = ease(head.current.rotation.y, inspecting ? Math.sin(t * 0.8) * 0.12 * subtle : chatting ? Math.sin(t * 1.5) * 0.06 * subtle : 0);
    head.current.rotation.z = ease(head.current.rotation.z, thinking ? 0.09 : Math.sin(t * 1.2) * 0.015 * subtle);
    if (eyes.current) eyes.current.scale.y = !reducedMotion && t % 5.1 > 4.96 ? 0.12 : 1;
    if (mug.current) mug.current.visible = coffee;
    if (tablet.current) tablet.current.visible = working && !seated || repairing || inspecting;
    if (bowl.current) bowl.current.visible = eating;
    if (spoon.current) spoon.current.visible = eating || cooking;
    if (book.current) book.current.visible = reading;
    if (tool.current) tool.current.visible = repairing;
    if (pan.current) pan.current.visible = cooking;
    if (pen.current) pen.current.visible = signing;
  });
  const mountPose = initial.current.pose, mountSeated = initial.current.seated;
  const mountArms = armTargets(mountPose, mountSeated, 0, 0);
  return <group ref={root} position={[0, initial.current.seated ? SEATED_HIP - HIP : 0, 0]}>
    <mesh position={[0, HIP, 0]} scale={[1, 0.65, 0.85]} castShadow><capsuleGeometry args={[0.17, 0.04, 4, 12]} /><meshStandardMaterial color={trousers} roughness={0.9} /></mesh>
    <mesh position={[0, HIP + 0.205, 0]} scale={[1, 0.68, 0.76]} castShadow><capsuleGeometry args={[feminine ? 0.176 : 0.19, 0.15, 4, 12]} /><meshStandardMaterial color={jacket} roughness={0.86} /></mesh>
    <mesh position={[0, HIP + 0.31, 0.139]}><boxGeometry args={[0.105, 0.125, 0.02]} /><meshStandardMaterial color="#f7efe1" roughness={0.85} /></mesh>
    <mesh position={[0, HIP + 0.25, 0.151]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.045, 0.045, 0.012]} /><meshStandardMaterial color={variant === 6 || founder ? '#ddb575' : visitor ? '#5e646f' : '#9ec3d1'} metalness={0.2} roughness={0.6} /></mesh>
    {(founder || visitor) && <>
      {[-1, 1].map(side => <mesh key={`lapel-${side}`} position={[side * 0.079, HIP + 0.28, 0.153]} rotation={[0, 0, side * 0.31]}><boxGeometry args={[0.037, 0.15, 0.014]} /><meshStandardMaterial color={founder ? '#253950' : '#626a73'} roughness={0.9} /></mesh>)}
      {[0, 1].map(i => <mesh key={`button-${i}`} position={[0, HIP + 0.16 - i * 0.047, 0.15]}><sphereGeometry args={[0.008, 6, 4]} /><meshStandardMaterial color={founder ? '#c8b184' : '#3f4c56'} metalness={0.3} /></mesh>)}
      {visitor && <mesh position={[0, HIP + 0.3, 0.163]}><boxGeometry args={[0.023, 0.09, 0.009]} /><meshStandardMaterial color="#535c6b" /></mesh>}
    </>}
    <mesh position={[0.107, HIP + 0.22, 0.145]}><boxGeometry args={[0.048, 0.07, 0.012]} /><meshStandardMaterial color="#fbf4e9" /></mesh>
    <mesh position={[0.107, HIP + 0.235, 0.153]}><boxGeometry args={[0.034, 0.009, 0.005]} /><meshStandardMaterial color="#688ca1" /></mesh>
    <mesh position={[0, HIP + 0.41, 0]}><cylinderGeometry args={[0.057, 0.064, 0.13, 10]} /><meshStandardMaterial color={skin} roughness={0.9} /></mesh>
    <group ref={head} position={[0, HIP + 0.505, 0]} rotation={['work','read','sign'].includes(mountPose) ? [0.16, 0, 0] : [0, 0, mountPose === 'think' ? 0.09 : 0]}>
      <mesh scale={[founder ? 1.02 : visitor ? 0.91 : 0.94, founder ? 0.99 : 1.04, 0.95]} castShadow><sphereGeometry args={[0.192, 18, 14]} /><meshStandardMaterial color={skin} roughness={0.83} /></mesh>
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
      {(variant === 3 || variant === 4 || variant === 5 || founder) && <Glasses founder={founder} />}
      {founder && <mesh position={[0, -0.096, 0.127]} scale={[1.3, 0.44, 0.26]}><sphereGeometry args={[0.072, 12, 8]} /><meshStandardMaterial color={hair} transparent opacity={0.27} roughness={1} /></mesh>}
      {variant === 6 && [-1, 1].map(side => <mesh key={`earring-${side}`} position={[side * 0.193, -0.044, 0.003]}><sphereGeometry args={[0.012, 8, 6]} /><meshStandardMaterial color="#d8b879" metalness={0.65} roughness={0.35} /></mesh>)}
    </group>
    <group ref={leftArm} position={[-0.222, HIP + 0.31, 0]} rotation={[mountArms.leftShoulder, 0, mountArms.leftSpread]}>
      <UpperArm color={jacket} skin={skin} />
      <group ref={leftForearm} position={[0, -UPPER_ARM, 0]} rotation={[mountArms.leftElbow, 0, 0]}>
        <Forearm color={jacket} skin={skin} />
        <group ref={bowl} position={[0, -FOREARM - 0.01, 0.075]} visible={initial.current.pose === 'eat'}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.1, 0.066, 0.04, 14]} /><meshStandardMaterial color="#f6e6c6" roughness={0.7} /></mesh>
          <mesh position={[0, 0, 0.024]} scale={[1, 1, 0.5]}><sphereGeometry args={[0.068, 10, 8]} /><meshStandardMaterial color="#b5bc78" roughness={1} /></mesh>
        </group>
        <group ref={pan} position={[0.04, -FOREARM - 0.01, 0.08]} rotation={[Math.PI / 2, 0, 0]} visible={mountPose === 'cook'}>
          <mesh><cylinderGeometry args={[0.115, 0.093, 0.035, 14]} /><meshStandardMaterial color="#61747a" metalness={0.55} roughness={0.58} /></mesh>
          <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.102, 0.102, 0.006, 14]} /><meshStandardMaterial color="#b4a872" roughness={0.95} /></mesh>
          <mesh position={[-0.13, 0, 0]}><boxGeometry args={[0.15, 0.025, 0.029]} /><meshStandardMaterial color="#394851" roughness={0.75} /></mesh>
        </group>
      </group>
    </group>
    <group ref={rightArm} position={[0.222, HIP + 0.31, 0]} rotation={[mountArms.rightShoulder, 0, mountArms.rightSpread]}>
      <UpperArm color={jacket} skin={skin} />
      <group ref={rightForearm} position={[0, -UPPER_ARM, 0]} rotation={[mountArms.rightElbow, 0, 0]}>
        <Forearm color={jacket} skin={skin} />
        <group ref={mug} position={[0, -FOREARM - 0.035, 0.07]} rotation={[Math.PI / 2, 0, 0]} visible={initial.current.pose === 'coffee'}>
          <mesh><cylinderGeometry args={[0.052, 0.046, 0.105, 12]} /><meshStandardMaterial color={variant === 6 ? '#ead7c7' : '#fbf3df'} roughness={0.58} /></mesh>
          <mesh position={[0, 0.054, 0]}><cylinderGeometry args={[0.044, 0.044, 0.004, 12]} /><meshStandardMaterial color="#6f4936" roughness={0.6} /></mesh>
          <mesh position={[0.055, 0, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.031, 0.009, 6, 12]} /><meshStandardMaterial color="#fbf3df" /></mesh>
        </group>
        <group ref={spoon} position={[0, -FOREARM - 0.085, 0.055]} visible={mountPose === 'eat' || mountPose === 'cook'}>
          <mesh><boxGeometry args={[0.012, 0.11, 0.01]} /><meshStandardMaterial color="#bac8cd" metalness={0.65} roughness={0.4} /></mesh>
          <mesh position={[0, -0.065, 0]} scale={[0.7, 1, 0.25]}><sphereGeometry args={[0.024, 10, 8]} /><meshStandardMaterial color="#bac8cd" metalness={0.65} roughness={0.4} /></mesh>
        </group>
        <group ref={tool} position={[0, -FOREARM - 0.07, 0.045]} visible={mountPose === 'repair'}>
          <mesh><boxGeometry args={[0.018, 0.14, 0.013]} /><meshStandardMaterial color="#bac4c8" metalness={0.65} roughness={0.4} /></mesh>
          <mesh position={[0, -0.077, 0]}><torusGeometry args={[0.027, 0.009, 5, 12, Math.PI * 1.65]} /><meshStandardMaterial color="#bac4c8" metalness={0.65} roughness={0.4} /></mesh>
          <mesh position={[0, 0.023, 0]}><boxGeometry args={[0.022, 0.042, 0.018]} /><meshStandardMaterial color="#657e8c" roughness={0.8} /></mesh>
        </group>
        <group ref={pen} position={[0.015, -FOREARM - 0.064, 0.055]} rotation={[0, 0, -0.15]} visible={mountPose === 'sign'}>
          <mesh><cylinderGeometry args={[0.007, 0.007, 0.11, 8]} /><meshStandardMaterial color="#314756" roughness={0.5} /></mesh>
          <mesh position={[0, -0.064, 0]}><coneGeometry args={[0.007, 0.018, 8]} /><meshStandardMaterial color="#b7c4c9" metalness={0.45} /></mesh>
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
    <group ref={tablet} position={[0, HIP + 0.12, 0.29]} rotation={[-0.35, 0, 0]} visible={mountPose === 'work' && !mountSeated || mountPose === 'repair' || mountPose === 'inspect'}>
      <mesh castShadow><boxGeometry args={[0.29, 0.19, 0.02]} /><meshStandardMaterial color="#425c6b" roughness={0.7} /></mesh>
      <mesh position={[0, 0, 0.013]}><boxGeometry args={[0.255, 0.155, 0.005]} /><meshStandardMaterial color="#b4d8da" emissive="#89bac7" emissiveIntensity={0.2} /></mesh>
    </group>
    <group ref={book} position={[0, HIP + 0.105, 0.36]} rotation={[-0.65, 0, 0]} visible={mountPose === 'read'}>
      {[-1, 1].map(side => <group key={`page-${side}`} position={[side * 0.08, 0, 0]} rotation={[0, side * -0.12, 0]}>
        <mesh><boxGeometry args={[0.158, 0.18, 0.018]} /><meshStandardMaterial color="#667c78" roughness={0.9} /></mesh>
        <mesh position={[0, 0, 0.015]}><boxGeometry args={[0.141, 0.163, 0.015]} /><meshStandardMaterial color="#f2ebd8" roughness={0.95} /></mesh>
        {[0,1,2,3].map(line => <mesh key={line} position={[0, 0.049 - line * 0.025, 0.024]}><boxGeometry args={[0.102, 0.003, 0.002]} /><meshStandardMaterial color="#b5b4a9" /></mesh>)}
      </group>)}
    </group>
  </group>;
}
// Share pose targets with the mount posture so a paused save displays every activity correctly.
function armTargets(state: Pose, seated: boolean, t: number, subtle: number) {
  let leftShoulder = 0.035, rightShoulder = 0.035, leftElbow = -0.08, rightElbow = -0.08;
  let leftSpread = 0.06, rightSpread = -0.06;
  const walking = (state === 'walk' || state === 'stairs') && !seated;
  if (walking) {
    const cycle = Math.sin(t * (state === 'stairs' ? 4 : 5));
    leftShoulder = -cycle * (state === 'stairs' ? 0.24 : 0.29) * subtle;
    rightShoulder = cycle * (state === 'stairs' ? 0.24 : 0.29) * subtle;
    leftElbow = rightElbow = -0.15;
  } else if (state === 'work') {
    leftShoulder = rightShoulder = seated ? -0.95 : -0.7;
    leftElbow = (seated ? -0.62 : -0.65) + Math.sin(t * 10) * 0.04 * subtle;
    rightElbow = (seated ? -0.62 : -0.65) + Math.cos(t * 9) * 0.04 * subtle;
    leftSpread = 0.13; rightSpread = -0.13;
  } else if (state === 'talk') {
    leftShoulder = -0.3 + Math.sin(t * 2.7) * 0.12 * subtle;
    rightShoulder = -0.4 + Math.cos(t * 2.3) * 0.16 * subtle;
    leftElbow = -0.7 + Math.sin(t * 2) * 0.15 * subtle;
    rightElbow = -0.9 + Math.cos(t * 2.6) * 0.22 * subtle;
    leftSpread = 0.2; rightSpread = -0.18;
  } else if (state === 'coffee' || state === 'eat') {
    const raised = subtle === 0 || Math.sin(t * (state === 'eat' ? 1.2 : 0.8)) > 0.05;
    rightShoulder = -0.6; rightElbow = raised ? -1.95 : -0.95;
    leftShoulder = state === 'eat' ? -0.65 : seated ? -0.38 : 0.035;
    leftElbow = state === 'eat' ? -0.95 : seated ? -0.7 : -0.08;
    rightSpread = -0.08;
  } else if (state === 'think') {
    rightShoulder = -0.65; rightElbow = -1.85; rightSpread = 0.15;
    leftShoulder = seated ? -0.4 : -0.05; leftElbow = seated ? -0.75 : -0.15;
  } else if (state === 'read') {
    leftShoulder = rightShoulder = -0.65;
    leftElbow = rightElbow = -0.92;
    leftSpread = 0.1; rightSpread = -0.1;
  } else if (state === 'repair') {
    leftShoulder = -0.65; leftElbow = -0.92;
    rightShoulder = -0.74 + Math.sin(t * 2.2) * 0.035 * subtle;
    rightElbow = -1.08 + Math.sin(t * 4) * 0.08 * subtle;
    leftSpread = 0.11; rightSpread = -0.15;
  } else if (state === 'inspect') {
    leftShoulder = -0.65; leftElbow = -0.92;
    rightShoulder = -0.5; rightElbow = -1.05 + Math.sin(t * 1.6) * 0.04 * subtle;
    leftSpread = 0.1; rightSpread = -0.15;
  } else if (state === 'cook') {
    leftShoulder = -0.72; leftElbow = -0.8; leftSpread = 0.08;
    rightShoulder = -0.77 + Math.sin(t * 2.8) * 0.045 * subtle;
    rightElbow = -0.8 + Math.cos(t * 2.8) * 0.08 * subtle;
    rightSpread = -0.43 + Math.sin(t * 2.8) * 0.04 * subtle;
  } else if (state === 'sign') {
    leftShoulder = -0.82; leftElbow = -0.7; leftSpread = 0.12;
    rightShoulder = -0.95; rightElbow = -0.62 + Math.sin(t * 4.8) * 0.045 * subtle; rightSpread = -0.12;
  } else if (state === 'toilet' || seated) {
    leftShoulder = rightShoulder = state === 'toilet' ? -0.26 : -0.4;
    leftElbow = rightElbow = state === 'toilet' ? -0.75 : -0.65;
  }
  if (state === 'wave') {
    rightShoulder = -0.15; rightSpread = 2.05 + Math.sin(t * 7) * 0.16 * subtle; rightElbow = -0.35;
  }
  return { leftShoulder, rightShoulder, leftElbow, rightElbow, leftSpread, rightSpread };
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
    {variant === 7 && <>
      <mesh position={[-0.04, 0.18, 0.015]} rotation={[0.14, 0, -0.18]} scale={[1.45, 0.61, 0.9]} castShadow><sphereGeometry args={[0.093, 14, 10]} /><meshStandardMaterial color={hair} roughness={0.94} /></mesh>
      <mesh position={[0.115, 0.091, 0.055]} rotation={[0, 0, 0.25]} scale={[0.6, 1.15, 0.45]} castShadow><sphereGeometry args={[0.075, 10, 8]} /><meshStandardMaterial color={hair} roughness={0.96} /></mesh>
    </>}
    {variant === 8 && <mesh position={[0.06, 0.143, 0.031]} rotation={[0.05, 0, 0.2]} scale={[1.1, 0.48, 1.0]} castShadow><sphereGeometry args={[0.09, 12, 8]} /><meshStandardMaterial color={hair} roughness={0.96} /></mesh>}
  </>;
}
function Glasses({ founder = false }: { founder?: boolean }) {
  const frame = founder ? '#b69c6c' : '#526978';
  return <group position={[0, 0.009, 0.192]}>
    {[-0.068, 0.068].map(x => <mesh key={x} position={[x, 0, 0]} scale={[founder ? 1.15 : 1.12, founder ? 0.96 : 0.86, 1]}><torusGeometry args={[0.042, founder ? 0.0055 : 0.0045, 5, 14]} /><meshStandardMaterial color={frame} metalness={0.35} roughness={0.5} /></mesh>)}
    <mesh><boxGeometry args={[0.046, 0.006, 0.008]} /><meshStandardMaterial color={frame} /></mesh>
    {[-1, 1].map(side => <mesh key={side} position={[side * 0.131, 0, -0.041]} rotation={[0, side * 0.4, 0]}><boxGeometry args={[0.007, 0.006, 0.092]} /><meshStandardMaterial color={frame} /></mesh>)}
  </group>;
}
