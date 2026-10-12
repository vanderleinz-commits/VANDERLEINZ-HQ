import { useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { CHARACTER_STANDARD, PALETTE, SURFACES } from './artDirection';
import { characterProfile } from './characterProfiles';
import type { HairStyle } from './characterProfiles';
import { useCharacterRevision } from './useCharacterRevision';
import { legSoleHeight, seatedLegContact, solveArmContact } from './characterContacts';
import { useAnimatedCharacterBatch } from './AnimatedCharacterBatch';

export type Pose = 'idle' | 'walk' | 'work' | 'talk' | 'wave' | 'coffee' | 'think' | 'eat'
  | 'read' | 'repair' | 'cook' | 'sign' | 'inspect' | 'stairs' | 'toilet' | 'carry' | 'deliver' | 'clean' | 'phone' | 'water' | 'brew';
export type CharacterExpression = 'neutral' | 'happy' | 'focused';
type Props = {
  color: string; hair: string; pose: Pose | RefObject<Pose>; speed: number;
  reducedMotion: boolean; variant?: number; seated?: boolean; expression?: CharacterExpression;
  equipment?: 'broom' | 'tray';
};
type Surface = keyof typeof SURFACES;
type Materials = { skin: THREE.MeshStandardMaterial; hair: THREE.MeshStandardMaterial; clothing: THREE.MeshStandardMaterial;
  trousers: THREE.MeshStandardMaterial; shirt: THREE.MeshStandardMaterial; accent: THREE.MeshStandardMaterial;
  shoe: THREE.MeshStandardMaterial; sole: THREE.MeshStandardMaterial; eye: THREE.MeshStandardMaterial;
  iris: THREE.MeshStandardMaterial; dark: THREE.MeshStandardMaterial; lip: THREE.MeshStandardMaterial;
  blush: THREE.MeshStandardMaterial; metal: THREE.MeshStandardMaterial };
type Vec3 = [number, number, number];

const HIP = 0.8, THIGH = 0.31, SHIN = 0.415, UPPER_ARM = 0.235, FOREARM = 0.225;
const SEATED_HIP = CHARACTER_STANDARD.seatHeight;
// Resting biases give each personality a quiet presence without changing active gestures.
const RESTING_POSTURES = [
  { headX: 0, headY: 0, headZ: 0, leftShoulder: 0.015, rightShoulder: 0.015, leftElbow: -0.1, rightElbow: -0.1, leftSpread: 0.04, rightSpread: -0.04 },
  { headX: -0.01, headY: 0.025, headZ: -0.035, leftShoulder: 0.025, rightShoulder: -0.1, leftElbow: -0.09, rightElbow: -0.24, leftSpread: 0.075, rightSpread: -0.065 },
  { headX: 0.005, headY: -0.012, headZ: 0.027, leftShoulder: -0.045, rightShoulder: -0.025, leftElbow: -0.16, rightElbow: -0.12, leftSpread: 0.06, rightSpread: -0.055 },
  { headX: 0.018, headY: -0.025, headZ: -0.015, leftShoulder: -0.035, rightShoulder: -0.065, leftElbow: -0.13, rightElbow: -0.18, leftSpread: 0.045, rightSpread: -0.05 },
  { headX: -0.012, headY: 0.02, headZ: 0.018, leftShoulder: 0.045, rightShoulder: -0.02, leftElbow: -0.1, rightElbow: -0.14, leftSpread: 0.085, rightSpread: -0.075 },
  { headX: 0.042, headY: 0.01, headZ: -0.008, leftShoulder: -0.025, rightShoulder: -0.04, leftElbow: -0.14, rightElbow: -0.16, leftSpread: 0.035, rightSpread: -0.035 },
  { headX: -0.005, headY: 0, headZ: 0.012, leftShoulder: -0.3, rightShoulder: -0.3, leftElbow: -0.65, rightElbow: -0.61, leftSpread: 0.28, rightSpread: -0.28 },
  { headX: -0.012, headY: 0, headZ: 0, leftShoulder: 0.01, rightShoulder: -0.025, leftElbow: -0.1, rightElbow: -0.15, leftSpread: 0.045, rightSpread: -0.045 },
  { headX: 0, headY: -0.018, headZ: 0.014, leftShoulder: -0.025, rightShoulder: 0.015, leftElbow: -0.14, rightElbow: -0.1, leftSpread: 0.055, rightSpread: -0.055 },
] as const;
// Immutable mesh resources are shared by the entire cast, including the avatar.
const SHAPES = {
  sphere: new THREE.SphereGeometry(1, 16, 12),
  detail: new THREE.SphereGeometry(1, 10, 8),
  box: new RoundedBoxGeometry(1, 1, 1, 2, 0.12),
  // Broad cloth ends meet inside joints; a pill's pointed caps exposed toy-like gaps.
  limb: new THREE.LatheGeometry([
    new THREE.Vector2(0, -0.5), new THREE.Vector2(0.8, -0.5),
    new THREE.Vector2(0.86, -0.47), new THREE.Vector2(0.9, -0.39),
    new THREE.Vector2(0.94, -0.15), new THREE.Vector2(0.99, 0.25),
    new THREE.Vector2(1, 0.4), new THREE.Vector2(0.97, 0.48),
    new THREE.Vector2(0.89, 0.5), new THREE.Vector2(0, 0.5),
  ], 12),
  pelvis: new THREE.LatheGeometry([
    new THREE.Vector2(0, -0.5), new THREE.Vector2(0.73, -0.5),
    new THREE.Vector2(0.91, -0.42), new THREE.Vector2(1, -0.18),
    new THREE.Vector2(0.98, 0.15), new THREE.Vector2(0.87, 0.44),
    new THREE.Vector2(0.78, 0.5), new THREE.Vector2(0, 0.5),
  ], 16),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 12),
  ring: new THREE.TorusGeometry(1, 0.11, 5, 16),
  smile: new THREE.TorusGeometry(1, 0.12, 5, 16, Math.PI),
  hairCap: new THREE.SphereGeometry(1, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.54),
  torso: new THREE.LatheGeometry([
    new THREE.Vector2(0.09, -0.175), new THREE.Vector2(0.15, -0.17),
    new THREE.Vector2(0.163, -0.12), new THREE.Vector2(0.173, -0.025),
    new THREE.Vector2(0.188, 0.095), new THREE.Vector2(0.181, 0.145),
    new THREE.Vector2(0.146, 0.177), new THREE.Vector2(0.069, 0.185),
  ], 16),
};
const materials = new Map<string, THREE.MeshStandardMaterial>();
function material(color: string, surface: Surface = 'fabric', opacity = 1) {
  const key = `${color}/${surface}/${opacity}`;
  let result = materials.get(key);
  if (!result) {
    result = new THREE.MeshStandardMaterial({ color, ...SURFACES[surface], transparent: opacity < 1, opacity });
    materials.set(key, result);
  }
  return result;
}
const profileMaterials = new Map<number, Materials>();
function castMaterials(variant: number): Materials {
  const profile = characterProfile(variant);
  let result = profileMaterials.get(variant);
  if (!result) {
    // Editable surfaces have one material per identity, shared by its office and Studio instances.
    // Recoloring those materials avoids accumulating GPU allocations while dragging a color picker.
    result = {
    skin: material(profile.skin, 'skin').clone(), hair: material(profile.hair).clone(), clothing: material(profile.color).clone(),
    trousers: material(profile.trousers).clone(), shirt: material(PALETTE.cream), accent: material(profile.accent, 'trim').clone(),
    shoe: material(variant === 4 || variant === 6 || variant === 7 || variant === 9 ? '#76604E' : '#35475D', 'wood'), sole: material('#DAD8CC'),
    eye: material('#FFFCF6', 'skin'), iris: material(profile.eyeColor, 'skin').clone(),
    dark: material('#25394D', 'skin'), lip: material('#956454', 'skin'),
    blush: material('#D7897C', 'skin', 0.2), metal: material('#52667D', 'trim'),
    };
    profileMaterials.set(variant, result);
  }
  result.skin.color.set(profile.skin); result.hair.color.set(profile.hair); result.clothing.color.set(profile.color);
  result.trousers.color.set(profile.trousers); result.accent.color.set(profile.accent); result.iris.color.set(profile.eyeColor);
  return result;
}

// Local +Z is forward. The same proportions and joints are used in both camera modes.
export function CharacterRig({ pose, speed, reducedMotion, variant = 0, seated = false, expression = 'neutral', equipment }: Props) {
  useCharacterRevision();
  const root = useRef<THREE.Group>(null), torso = useRef<THREE.Group>(null), head = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null), rightArm = useRef<THREE.Group>(null);
  const leftForearm = useRef<THREE.Group>(null), rightForearm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null), rightLeg = useRef<THREE.Group>(null);
  const leftKnee = useRef<THREE.Group>(null), rightKnee = useRef<THREE.Group>(null);
  const leftFoot = useRef<THREE.Group>(null), rightFoot = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null), brows = useRef<THREE.Group>(null), mouth = useRef<THREE.Group>(null);
  const ponytail = useRef<THREE.Group>(null), mug = useRef<THREE.Group>(null), tablet = useRef<THREE.Group>(null);
  const waterGlass = useRef<THREE.Group>(null);
  const bowl = useRef<THREE.Group>(null), spoon = useRef<THREE.Group>(null), book = useRef<THREE.Group>(null);
  const tool = useRef<THREE.Group>(null), pan = useRef<THREE.Group>(null), pen = useRef<THREE.Group>(null);
  const tray = useRef<THREE.Group>(null), broom = useRef<THREE.Group>(null), phone = useRef<THREE.Group>(null);
  const time = useRef(variant * 0.83), sitting = useRef(seated ? 1 : 0);
  const previous = useRef({ pose: '', seated, expression, equipment });
  const mat = castMaterials(variant), profile = characterProfile(variant);
  const synchronizeMeshes = useAnimatedCharacterBatch(root, `${variant}/${profile.hairStyle}/${profile.garment}/${profile.glasses}`);
  const feminine = [1, 2, 6, 7, 8, 10, 12].includes(variant);
  const shortSleeve = profile.garment === 'polo' || profile.garment === 'overshirt';
  const faceScale: Vec3 = profile.faceShape === 'round' ? [1.06, .98, 1.02] : profile.faceShape === 'narrow' ? [.93, 1.02, .97] : [1, 1, 1];
  const resting = RESTING_POSTURES[((Math.floor(variant) % RESTING_POSTURES.length) + RESTING_POSTURES.length) % RESTING_POSTURES.length];

  function animate(delta: number, immediate = false) {
    if (!root.current || !torso.current || !head.current || !leftArm.current || !rightArm.current
      || !leftForearm.current || !rightForearm.current || !leftLeg.current || !rightLeg.current || !leftKnee.current || !rightKnee.current) return;
    const state = typeof pose === 'string' ? pose : pose.current;
    const changed = previous.current.pose !== state || previous.current.seated !== seated || previous.current.expression !== expression || previous.current.equipment !== equipment;
    if (speed === 0 && !immediate && !changed) return;
    const dt = Math.min(delta, 0.075);
    const snap = immediate || speed === 0;
    if (!snap) time.current += dt * Math.min(speed, 2);
    const t = time.current, subtle = reducedMotion ? 0 : 1;
    const walk = (state === 'walk' || state === 'stairs' || state === 'carry') && !seated;
    const cycle = Math.sin(t * (state === 'stairs' ? 3.5 : 4.2));
    const ease = (value: number, target: number) => snap ? target : THREE.MathUtils.lerp(value, target, 1 - Math.exp(-8 * dt));
    sitting.current = ease(sitting.current, seated ? 1 : 0);
    const sit = sitting.current;
    const sittingLeg = seatedLegContact();
    const stride = walk ? (state === 'stairs' ? .42 : .29) * subtle : 0;
    const thighLeft = sittingLeg.thigh * sit + cycle * stride;
    const thighRight = sittingLeg.thigh * sit - cycle * stride;
    const kneeLeft = sittingLeg.knee * sit + (walk ? Math.max(0, -cycle) * (state === 'stairs' ? .72 : .36) * subtle : 0);
    const kneeRight = sittingLeg.knee * sit + (walk ? Math.max(0, cycle) * (state === 'stairs' ? .72 : .36) * subtle : 0);
    const hipHeight = HIP + (SEATED_HIP - HIP) * sit;
    const floorCorrection = Math.max(0, -Math.min(legSoleHeight(hipHeight, thighLeft, kneeLeft), legSoleHeight(hipHeight, thighRight, kneeRight)));
    root.current.position.y = ease(root.current.position.y, (SEATED_HIP - HIP) * sit + floorCorrection);
    root.current.rotation.z = ease(root.current.rotation.z, walk ? Math.sin(t * 2.1) * 0.018 * subtle : 0);
    torso.current.rotation.y = ease(torso.current.rotation.y, walk ? cycle * 0.035 * subtle : state === 'talk' ? Math.sin(t * 1.1) * 0.025 * subtle : 0);
    torso.current.scale.y = ease(torso.current.scale.y, 1 + (!walk ? Math.sin(t * 1.7) * 0.004 * subtle : 0));
    leftLeg.current.rotation.x = ease(leftLeg.current.rotation.x, thighLeft);
    rightLeg.current.rotation.x = ease(rightLeg.current.rotation.x, thighRight);
    leftKnee.current.rotation.x = ease(leftKnee.current.rotation.x, kneeLeft);
    rightKnee.current.rotation.x = ease(rightKnee.current.rotation.x, kneeRight);
    if (leftFoot.current) leftFoot.current.rotation.x = -leftLeg.current.rotation.x - leftKnee.current.rotation.x;
    if (rightFoot.current) rightFoot.current.rotation.x = -rightLeg.current.rotation.x - rightKnee.current.rotation.x;
    const actualHip = HIP + root.current.position.y;
    const contactGap = Math.min(legSoleHeight(actualHip, leftLeg.current.rotation.x, leftKnee.current.rotation.x), legSoleHeight(actualHip, rightLeg.current.rotation.x, rightKnee.current.rotation.x));
    if (contactGap < 0) root.current.position.y -= contactGap;
    leftLeg.current.rotation.z = ease(leftLeg.current.rotation.z, -0.025 * sit);
    rightLeg.current.rotation.z = ease(rightLeg.current.rotation.z, 0.025 * sit);
    const targets = state === 'idle' && !seated ? resting : armTargets(state, seated, t, subtle);
    const holdingBroom = equipment === 'broom' && !seated && ['walk','stairs','idle'].includes(state);
    const holdingTray = equipment === 'tray' && !seated && ['walk','stairs','idle','carry'].includes(state);
    const broomGrip = holdingBroom ? solveArmContact(HIP+.35,.85,.12) : null;
    const trayGrip = holdingTray ? solveArmContact(HIP+.35,.98,.44) : null;
    leftArm.current.rotation.x = ease(leftArm.current.rotation.x, trayGrip?.shoulder ?? targets.leftShoulder);
    rightArm.current.rotation.x = ease(rightArm.current.rotation.x, trayGrip?.shoulder ?? broomGrip?.shoulder ?? targets.rightShoulder);
    leftArm.current.rotation.z = ease(leftArm.current.rotation.z, holdingTray ? -.16 : targets.leftSpread);
    rightArm.current.rotation.z = ease(rightArm.current.rotation.z, holdingTray ? .16 : holdingBroom ? .4 : targets.rightSpread);
    leftForearm.current.rotation.x = ease(leftForearm.current.rotation.x, trayGrip?.elbow ?? targets.leftElbow);
    rightForearm.current.rotation.x = ease(rightForearm.current.rotation.x, trayGrip?.elbow ?? broomGrip?.elbow ?? targets.rightElbow);
    rightForearm.current.rotation.y = ease(rightForearm.current.rotation.y,
      state === 'cook' ? Math.sin(t * 2.2) * 0.13 * subtle : state === 'sign' ? Math.sin(t * 3.8) * 0.05 * subtle : 0);
    head.current.rotation.x = ease(head.current.rotation.x, ['work', 'read', 'sign'].includes(state) ? 0.12 + Math.sin(t * 1.2) * 0.02 * subtle
      : state === 'talk' ? Math.sin(t * 2.3) * 0.04 * subtle : ['repair','cook','brew'].includes(state) ? 0.1 : state === 'idle' ? resting.headX : 0);
    head.current.rotation.y = ease(head.current.rotation.y, state === 'inspect' ? Math.sin(t * 0.7) * 0.13 * subtle
      : state === 'talk' ? Math.sin(t * 1.1) * 0.09 * subtle : walk ? -cycle * 0.02 * subtle : state === 'idle' ? resting.headY : 0);
    head.current.rotation.z = ease(head.current.rotation.z, state === 'think' ? 0.07
      : (state === 'idle' ? resting.headZ : 0) + Math.sin(t * 0.9) * 0.012 * subtle);
    if (ponytail.current) ponytail.current.rotation.x = ease(ponytail.current.rotation.x, walk ? -cycle * 0.06 * subtle : 0);
    const focused = expression === 'focused' || expression === 'neutral' && ['work', 'read', 'repair', 'sign','brew'].includes(state);
    const happy = expression === 'happy' || expression === 'neutral' && ['talk', 'wave', 'coffee', 'water'].includes(state);
    const blinkPhase = t % 4.7;
    const eyelid = !reducedMotion && speed > 0 && blinkPhase > 4.52
      ? 1 - Math.sin((blinkPhase - 4.52) / 0.18 * Math.PI) * 0.93 : 1;
    if (eyes.current) eyes.current.scale.y = (focused ? 0.84 : happy ? 0.91 : 1) * eyelid;
    if (brows.current) { brows.current.position.y = ease(brows.current.position.y, focused ? -0.008 : happy ? 0.009 : 0); brows.current.rotation.z = ease(brows.current.rotation.z, state === 'think' ? 0.05 : 0); }
    if (mouth.current) { mouth.current.scale.x = ease(mouth.current.scale.x, happy ? 1.13 : focused ? 0.8 : 1); mouth.current.scale.y = ease(mouth.current.scale.y, happy ? 1.05 : focused ? 0.34 : 0.68); }
    if (mug.current) {
      mug.current.visible = state === 'coffee';
      const sip = (Math.sin(t * 0.62) + 1) / 2 * subtle;
      mug.current.rotation.x = ease(mug.current.rotation.x,
        -rightArm.current.rotation.x - rightForearm.current.rotation.x + sip * 0.35);
    }
    if (waterGlass.current) {
      waterGlass.current.visible = state === 'water';
      const sip = (Math.sin(t * .62) + 1) / 2 * subtle;
      waterGlass.current.rotation.x = ease(waterGlass.current.rotation.x, -rightArm.current.rotation.x - rightForearm.current.rotation.x + sip * .3);
    }
    if (tablet.current) tablet.current.visible = state === 'work' && !seated || state === 'inspect';
    if (bowl.current) bowl.current.visible = state === 'eat';
    if (spoon.current) spoon.current.visible = state === 'eat' || state === 'cook';
    if (book.current) book.current.visible = state === 'read';
    if (tool.current) tool.current.visible = state === 'repair';
    if (pan.current) pan.current.visible = state === 'cook';
    if (pen.current) pen.current.visible = state === 'sign';
    if (tray.current) {
      tray.current.visible = state === 'carry' || state === 'deliver' || holdingTray;
      // The tray remains level; a small serving reach follows both hands together.
      tray.current.position.z = ease(tray.current.position.z, state === 'deliver' ? .455 + Math.sin(t * 1.3) * .006 * subtle : .44);
      tray.current.rotation.z = -root.current.rotation.z;
    }
    if (broom.current) {
      broom.current.visible = state === 'clean' || holdingBroom;
      const sweep = Math.sin(t * 1.7) * .11 * subtle;
      broom.current.position.x = ease(broom.current.position.x, holdingBroom ? .34 : .14 + sweep);
      broom.current.position.y = ease(broom.current.position.y, holdingBroom ? .12 : 0);
      broom.current.position.z = ease(broom.current.position.z, holdingBroom ? .13 : .43);
      broom.current.rotation.z = ease(broom.current.rotation.z, holdingBroom ? -.035 : -.06 + sweep * .65);
    }
    if (phone.current) phone.current.visible = state === 'phone';
    previous.current = { pose: state, seated, expression, equipment };
  }
  // Mount every saved pose exactly, even when the simulation is paused.
  useLayoutEffect(() => { animate(0, true); synchronizeMeshes(); }, []);
  useFrame((_, delta) => { animate(delta); synchronizeMeshes(); });

  return <group ref={root} dispose={null}>
    <mesh geometry={SHAPES.pelvis} material={mat.trousers} position={[0, HIP + 0.054, 0]} scale={[0.165, 0.174, 0.116]} castShadow />
    <group ref={torso} position={[0, HIP + 0.21, 0]}>
      <mesh geometry={SHAPES.torso} material={mat.clothing} scale={[feminine ? 0.93 : 1, 1, 0.72]} castShadow />
      <SoftBox position={[0, 0.122, 0.115]} scale={[0.106, 0.113, 0.019]} mat={mat.shirt} />
      {[-1, 1].map(side => <SoftBox key={`collar${side}`} position={[side * 0.038, 0.159, 0.116]} scale={[0.055, 0.054, 0.016]} rotation={[0, 0, side * 0.28]} mat={profile.garment === 'polo' ? mat.clothing : mat.shirt} />)}
      {profile.garment === 'jacket' && <>
        {[-1, 1].map(side => <SoftBox key={`lapel${side}`} position={[side * 0.073, 0.078, 0.12]} scale={[0.039, 0.157, 0.022]} rotation={[0, 0, side * 0.21]} mat={mat.clothing} />)}
        {[0, 1].map(button => <Ball key={`button${button}`} position={[0, -0.016 - button * 0.043, 0.121]} scale={[0.007, 0.007, 0.006]} mat={mat.accent} detail />)}
      </>}
      {profile.garment === 'overshirt' && [-.02, .035, .09].map(y => <Ball key={y} position={[0,y,.135]} scale={[.008,.008,.006]} mat={mat.accent} detail />)}
      {profile.garment === 'polo' && <SoftBox position={[0,.075,.139]} scale={[.026,.105,.015]} mat={mat.accent} />}
      {profile.garment === 'apron' && <>
        <SoftBox position={[0,-.015,.142]} scale={[.266,.28,.028]} mat={mat.accent} />
        {[-1,1].map(side => <SoftBox key={side} position={[side*.094,.137,.135]} scale={[.033,.13,.026]} mat={mat.accent} />)}
        <SoftBox position={[0,-.055,.163]} scale={[.16,.071,.009]} mat={mat.shirt} />
      </>}
      <SoftBox position={[0.098, 0.02, 0.132]} scale={[0.05, 0.061, 0.012]} mat={mat.shirt} />
      <SoftBox position={[0.098, 0.034, 0.14]} scale={[0.034, 0.008, 0.005]} mat={mat.accent} />
      {variant === 6 && <mesh geometry={SHAPES.smile} material={mat.accent} position={[-0.086, 0.084, 0.138]} scale={[0.018, 0.018, 0.018]} rotation={[0, 0, -0.25]} />}
      <SoftBox position={[0, -0.165, 0]} scale={[0.276, 0.018, 0.207]} mat={mat.clothing} />
    </group>
    <mesh geometry={SHAPES.cylinder} material={mat.skin} position={[0, HIP + 0.423, 0]} scale={[0.052, 0.105, 0.052]} />
    <group ref={head} position={[0, HIP + 0.583, 0]} scale={faceScale}>
      <Ball scale={[0.203, 0.212, 0.189]} mat={mat.skin} />
      <Ball position={[0, -0.097, 0.045]} scale={[0.137, 0.103, 0.129]} mat={mat.skin} />
      {[-1, 1].map(side => <group key={`ear${side}`} position={[side * 0.196, -0.008, -0.012]}>
        <Ball scale={[0.029, 0.043, 0.027]} mat={mat.skin} detail />
        <Ball position={[side * 0.016, 0, 0.012]} scale={[0.009, 0.024, 0.01]} mat={mat.blush} detail />
        {variant === 6 && <Ball position={[side * 0.012, -0.035, 0]} scale={[0.009, 0.011, 0.009]} mat={mat.accent} detail />}
      </group>)}
      <Hair mat={mat.hair} accent={mat.accent} style={profile.hairStyle} ponytail={ponytail} />
      <group ref={eyes} position={[0, 0.018, 0.178]}>
        {[-1, 1].map(side => <group key={`eye${side}`} position={[side * 0.067, 0, 0]}>
          <Ball scale={[profile.eyeShape === 'almond' ? .034 : .029, profile.eyeShape === 'almond' ? .026 : .033, .013]} mat={mat.eye} detail />
          <Ball position={[0, -0.001, 0.011]} scale={[0.018, profile.eyeShape === 'almond' ? .019 : .023, .007]} mat={mat.iris} detail />
          <Ball position={[0, -0.001, 0.015]} scale={[0.01, 0.016, 0.004]} mat={mat.dark} detail />
          <Ball position={[-0.006, 0.007, 0.019]} scale={[0.005, 0.006, 0.003]} mat={mat.eye} detail />
        </group>)}
      </group>
      <group ref={brows}>
        {[-1, 1].map(side => <SoftBox key={`brow${side}`} position={[side * 0.066, 0.069, 0.176]} rotation={[0, side * 0.16, side * -0.07]} scale={[0.051, 0.011, 0.012]} mat={mat.hair} />)}
      </group>
      <Ball position={[0, -0.021, 0.196]} scale={[0.02, 0.027, 0.025]} mat={mat.skin} detail />
      {[-1, 1].map(side => <Ball key={`cheek${side}`} position={[side * 0.107, -0.052, 0.164]} scale={[0.035, 0.018, 0.007]} mat={mat.blush} detail />)}
      <group ref={mouth} position={[0, -0.079, 0.184]}>
        <mesh geometry={SHAPES.smile} material={mat.lip} rotation={[0, 0, Math.PI]} scale={[0.032, 0.026, 0.027]} />
      </group>
      {profile.glasses && <Glasses mat={mat.metal} founder={false} />}
    </group>
    {([-1, 1] as const).map(side => <group key={`arm${side}`} ref={side === -1 ? leftArm : rightArm} position={[side * 0.194, HIP + 0.35, 0]}>
      <Ball position={[0, -0.02, 0]} scale={[0.059, 0.068, 0.058]} mat={mat.clothing} detail />
      <Limb position={[0, -UPPER_ARM / 2, 0]} radius={0.054} length={UPPER_ARM} mat={mat.clothing} />
      <group ref={side === -1 ? leftForearm : rightForearm} position={[0, -UPPER_ARM, 0]}>
        <Ball scale={[0.042, 0.043, 0.041]} mat={shortSleeve ? mat.skin : mat.clothing} detail />
        <Limb position={[0, -FOREARM / 2, 0]} radius={0.042} length={FOREARM} mat={shortSleeve ? mat.skin : mat.clothing} />
        <SoftBox position={[0, shortSleeve ? -0.038 : -FOREARM + 0.037, 0]} scale={[0.095, 0.033, 0.086]} mat={shortSleeve ? mat.clothing : mat.shirt} />
        <Hand mat={mat.skin} side={side} />
        {side === -1 ? <>
          <group ref={bowl} position={[0, -FOREARM - 0.014, 0.072]} rotation={[Math.PI / 2, 0, 0]} visible={false}>
            <mesh geometry={SHAPES.sphere} material={material(PALETTE.cream, 'ceramic')} scale={[0.087, 0.032, 0.087]} />
            <mesh geometry={SHAPES.cylinder} material={material('#A6AE72')} position={[0, 0.024, 0]} scale={[0.071, 0.007, 0.071]} />
          </group>
          <group ref={pan} position={[0.06, -FOREARM - 0.014, 0.08]} rotation={[Math.PI / 2, 0, 0]} visible={false}>
            <mesh geometry={SHAPES.cylinder} material={material('#5B6A76', 'trim')} scale={[0.1, 0.028, 0.1]} />
            <SoftBox position={[-0.14, 0, 0]} scale={[0.18, 0.025, 0.032]} mat={mat.dark} />
          </group>
        </> : <>
          <group ref={mug} position={[0.02, -FOREARM - 0.017, 0.07]} rotation={[Math.PI / 2, 0, 0]} visible={false}>
            <mesh geometry={SHAPES.cylinder} material={material(PALETTE.cream, 'ceramic')} scale={[0.044, 0.09, 0.044]} />
            <mesh geometry={SHAPES.cylinder} material={material('#71523F', 'wood')} position={[0, 0.046, 0]} scale={[0.035, 0.002, 0.035]} />
            <mesh geometry={SHAPES.ring} material={material(PALETTE.cream, 'ceramic')} position={[0.045, 0, 0]} rotation={[0, Math.PI / 2, 0]} scale={[0.029, 0.029, 0.029]} />
          </group>
          <group ref={waterGlass} position={[.02,-FOREARM-.017,.07]} rotation={[Math.PI/2,0,0]} visible={false}>
            <mesh geometry={SHAPES.cylinder} material={material('#D1E5EB','ceramic',.35)} scale={[.041,.095,.041]} />
            <mesh geometry={SHAPES.cylinder} material={material('#A3D0E3','ceramic',.72)} position={[0,-.008,0]} scale={[.035,.072,.035]} />
            <mesh geometry={SHAPES.ring} material={material('#E4F2F5','ceramic',.75)} position={[0,.048,0]} rotation={[Math.PI/2,0,0]} scale={[.039,.039,.039]} />
          </group>
          <group ref={spoon} position={[0, -FOREARM - 0.055, 0.045]} visible={false}>
            <SoftBox scale={[0.01, 0.096, 0.009]} mat={material('#BAC6CF', 'trim')} />
            <Ball position={[0, -0.055, 0]} scale={[0.017, 0.025, 0.005]} mat={material('#BAC6CF', 'trim')} detail />
          </group>
          <group ref={tool} position={[0, -FOREARM - 0.04, 0.042]} visible={false}>
            <SoftBox scale={[0.025, 0.08, 0.025]} mat={mat.accent} />
            <SoftBox position={[0, -0.052, 0]} scale={[0.011, 0.06, 0.012]} mat={mat.metal} />
          </group>
          <group ref={pen} position={[0.015, -FOREARM - 0.046, 0.054]} rotation={[0, 0, -0.15]} visible={false}>
            <mesh geometry={SHAPES.cylinder} material={mat.dark} scale={[0.006, 0.1, 0.006]} />
          </group>
        </>}
      </group>
    </group>)}
    {([-1, 1] as const).map(side => <group key={`leg${side}`} ref={side === -1 ? leftLeg : rightLeg} position={[side * 0.094, HIP, 0]}>
      <Limb position={[0, -THIGH / 2, 0]} radius={0.069} length={THIGH} mat={mat.trousers} />
      <group ref={side === -1 ? leftKnee : rightKnee} position={[0, -THIGH, 0]}>
        <Ball scale={[0.053, 0.049, 0.052]} mat={mat.trousers} detail />
        <Limb position={[0, -SHIN / 2, 0]} radius={0.055} length={SHIN} mat={mat.trousers} />
        <SoftBox position={[0, -SHIN + 0.016, 0]} scale={[0.116, 0.042, 0.11]} mat={mat.trousers} />
        <group ref={side === -1 ? leftFoot : rightFoot} position={[0,-SHIN,0]}>
          <SoftBox position={[0, -.023, .043]} scale={[.134, .086, .216]} mat={mat.shoe} />
          <SoftBox position={[0, -.06, .043]} scale={[.139, .024, .22]} mat={mat.sole} />
          <SoftBox position={[0, .019, .06]} scale={[.087, .01, .05]} mat={mat.shirt} />
        </group>
      </group>
    </group>)}
    <group ref={tablet} position={[0, HIP + 0.07, 0.305]} rotation={[-0.38, 0, 0]} visible={false}>
      <SoftBox scale={[0.258, 0.166, 0.022]} mat={mat.dark} />
      <SoftBox position={[0, 0, 0.014]} scale={[0.223, 0.132, 0.006]} mat={material(PALETTE.sky, 'ceramic')} />
      <SoftBox position={[-0.056, 0.03, 0.018]} scale={[0.08, 0.009, 0.002]} mat={mat.eye} />
    </group>
    <group ref={book} position={[0, HIP + 0.135, 0.36]} rotation={[-0.61, 0, 0]} visible={false}>
      {[-1, 1].map(side => <group key={`page${side}`} position={[side * 0.074, 0, 0]} rotation={[0, side * -0.15, 0]}>
        <SoftBox scale={[0.148, 0.176, 0.018]} mat={mat.accent} />
        <SoftBox position={[0, 0, 0.014]} scale={[0.136, 0.161, 0.012]} mat={mat.shirt} />
        {[0, 1, 2].map(line => <SoftBox key={line} position={[0, 0.041 - line * 0.025, 0.022]} scale={[0.099, 0.003, 0.002]} mat={material('#B4B5A8')} />)}
      </group>)}
    </group>
    <group ref={tray} position={[0,.965,.44]} visible={false}>
      <SoftBox scale={[.56,.027,.32]} mat={material('#B9C9D0','trim')} />
      {[-1,1].map(side => <group key={side} position={[side*.145,.055,0]}>
        <mesh geometry={SHAPES.cylinder} material={material(PALETTE.cream,'ceramic')} scale={[.048,.083,.048]} />
        <mesh geometry={SHAPES.cylinder} material={material('#765846')} position={[0,.043,0]} scale={[.039,.003,.039]} />
        <mesh geometry={SHAPES.ring} material={material(PALETTE.cream,'ceramic')} position={[side*.048,0,0]} rotation={[0,Math.PI/2,0]} scale={[.029,.029,.029]} />
      </group>)}
      {[-1,1].map(side => <SoftBox key={side} position={[side*.27,.032,0]} scale={[.025,.045,.23]} mat={material('#7D949E','trim')} />)}
    </group>
    <group ref={broom} position={[.14,0,.43]} visible={false}>
      <mesh geometry={SHAPES.cylinder} material={material(PALETTE.wood)} position={[0,.55,0]} scale={[.014,1.04,.014]} />
      <SoftBox position={[0,.045,0]} scale={[.31,.056,.13]} mat={material(PALETTE.teal)} />
      <SoftBox position={[0,.013,0]} scale={[.3,.025,.12]} mat={material('#DDD3AD')} />
    </group>
    <group ref={phone} position={[0, HIP+.12,.35]} rotation={[-.62,0,0]} visible={false}>
      <SoftBox scale={[.095,.146,.018]} mat={mat.dark} />
      <SoftBox position={[0,0,.012]} scale={[.078,.12,.007]} mat={material(PALETTE.sky,'ceramic')} />
      <SoftBox position={[0,.025,.017]} scale={[.048,.008,.002]} mat={mat.shirt} />
    </group>
  </group>;
}

function armTargets(state: Pose, seated: boolean, t: number, subtle: number) {
  let leftShoulder = 0.02, rightShoulder = 0.02, leftElbow = -0.1, rightElbow = -0.1;
  let leftSpread = 0.055, rightSpread = -0.055;
  if ((state === 'walk' || state === 'stairs') && !seated) {
    const cycle = Math.sin(t * (state === 'stairs' ? 3.5 : 4.2));
    leftShoulder = -cycle * 0.24 * subtle; rightShoulder = cycle * 0.24 * subtle;
    leftElbow = rightElbow = -0.17;
  } else if (state === 'work') {
    const contact = solveArmContact(seated ? SEATED_HIP + .35 : HIP + .35, seated ? .855 : .91, seated ? .44 : .35);
    leftShoulder = rightShoulder = contact.shoulder;
    leftElbow = contact.elbow + Math.sin(t * 7.3) * .018 * subtle;
    rightElbow = contact.elbow + Math.sin(t * 6.6 + 1.4) * .018 * subtle;
    leftSpread = 0.085; rightSpread = -0.085;
  } else if (state === 'carry' || state === 'deliver') {
    const contact = solveArmContact(HIP+.35,.98,state === 'deliver' ? .455 : .44);
    leftShoulder = rightShoulder = contact.shoulder; leftElbow = rightElbow = contact.elbow;
    leftSpread = -.16; rightSpread = .16;
  } else if (state === 'clean') {
    const sweep = Math.sin(t*1.7)*.07*subtle;
    leftShoulder = -.62; leftElbow = -1.15; leftSpread = .56+sweep;
    rightShoulder = -.5; rightElbow = -.88; rightSpread = -.05+sweep;
  } else if (state === 'brew') {
    const press = Math.sin(t*1.6)*.009*subtle;
    const leftContact = solveArmContact(HIP+.35,1,.34), rightContact = solveArmContact(HIP+.35,1.06+press,.4);
    leftShoulder = leftContact.shoulder; leftElbow = leftContact.elbow;
    rightShoulder = rightContact.shoulder; rightElbow = rightContact.elbow;
    leftSpread = .03; rightSpread = -.03;
  } else if (state === 'phone') {
    const contact = solveArmContact(seated ? SEATED_HIP+.35 : HIP+.35, seated ? .76 : .92,.35);
    leftShoulder = rightShoulder = contact.shoulder;
    leftElbow = contact.elbow; rightElbow = contact.elbow + Math.sin(t*3.4)*.025*subtle;
    leftSpread = .2; rightSpread = -.2;
  } else if (state === 'talk') {
    leftShoulder = -0.29 + Math.sin(t * 1.9) * 0.08 * subtle;
    rightShoulder = -0.42 + Math.sin(t * 1.5 + 1.4) * 0.13 * subtle;
    leftElbow = -0.78 + Math.sin(t * 1.4) * 0.12 * subtle;
    rightElbow = -1 + Math.sin(t * 1.7) * 0.17 * subtle;
    leftSpread = 0.16; rightSpread = -0.23;
  } else if (state === 'coffee' || state === 'water' || state === 'eat') {
    const drink = (Math.sin(t * (state === 'eat' ? 1.1 : 0.62)) + 1) / 2;
    rightShoulder = -0.59 - drink * (state === 'eat' ? .1 : .4) * subtle;
    rightElbow = -0.91 - drink * 1.04 * subtle;
    leftShoulder = state === 'eat' ? -0.7 : seated ? -0.32 : 0.02;
    leftElbow = state === 'eat' ? -0.99 : seated ? -0.7 : -0.1;
    rightSpread = -0.085;
  } else if (state === 'think') {
    rightShoulder = -0.62; rightElbow = -1.94; rightSpread = 0.18;
    leftShoulder = seated ? -0.32 : -0.05; leftElbow = seated ? -0.7 : -0.16;
  } else if (state === 'read') {
    leftShoulder = rightShoulder = -0.64; leftElbow = rightElbow = -1.05;
    leftSpread = 0.12; rightSpread = -0.12;
  } else if (state === 'repair' || state === 'inspect') {
    leftShoulder = -0.67; leftElbow = -0.92;
    rightShoulder = -0.74 + Math.sin(t * 1.8) * 0.035 * subtle;
    rightElbow = -1.12 + Math.sin(t * 3.2) * 0.07 * subtle;
    leftSpread = 0.1; rightSpread = -0.14;
  } else if (state === 'cook') {
    leftShoulder = -0.73; leftElbow = -0.82; leftSpread = 0.08;
    rightShoulder = -0.75 + Math.sin(t * 2.2) * 0.04 * subtle;
    rightElbow = -0.85 + Math.cos(t * 2.2) * 0.06 * subtle;
    rightSpread = -0.35 + Math.sin(t * 2.2) * 0.04 * subtle;
  } else if (state === 'sign') {
    leftShoulder = -0.82; leftElbow = -0.7; leftSpread = 0.1;
    rightShoulder = -0.9; rightElbow = -0.64 + Math.sin(t * 4) * 0.025 * subtle; rightSpread = -0.1;
  } else if (state === 'toilet' || seated) {
    leftShoulder = rightShoulder = -0.32; leftElbow = rightElbow = -0.66;
  }
  if (state === 'wave') {
    rightShoulder = -0.18; rightSpread = 2.18 + Math.sin(t * 4.4) * 0.11 * subtle; rightElbow = -0.34;
  }
  return { leftShoulder, rightShoulder, leftElbow, rightElbow, leftSpread, rightSpread };
}

function Ball({ position, scale, mat, detail = false }: { position?: Vec3; scale: Vec3; mat: THREE.Material; detail?: boolean }) {
  return <mesh geometry={detail ? SHAPES.detail : SHAPES.sphere} material={mat} position={position} scale={scale} castShadow={Math.max(...scale) > 0.045} />;
}
function SoftBox({ position, scale, rotation, mat }: { position?: Vec3; scale: Vec3; rotation?: Vec3; mat: THREE.Material }) {
  return <mesh geometry={SHAPES.box} material={mat} position={position} scale={scale} rotation={rotation} castShadow={Math.max(...scale) > 0.11} />;
}
function Limb({ position, radius, length, mat }: { position: Vec3; radius: number; length: number; mat: THREE.Material }) {
  return <mesh geometry={SHAPES.limb} material={mat} position={position} scale={[radius, length + 0.024, radius]} castShadow />;
}
function Hand({ mat, side }: { mat: THREE.Material; side: -1 | 1 }) {
  return <group position={[0, -FOREARM - 0.024, 0.004]}>
    <SoftBox scale={[0.07, 0.075, 0.039]} mat={mat} />
    <Ball position={[-side * 0.039, 0.009, 0.009]} scale={[0.018, 0.032, 0.02]} mat={mat} detail />
    {[0, 1, 2].map(finger => <Ball key={finger} position={[(finger - 1) * 0.022, -0.034, 0.007]} scale={[0.012, 0.022, 0.016]} mat={mat} detail />)}
  </group>;
}
function Hair({ mat, accent, style, ponytail }: { mat: THREE.Material; accent: THREE.Material; style: HairStyle; ponytail: RefObject<THREE.Group | null> }) {
  return <>
    <mesh geometry={SHAPES.hairCap} material={mat} position={[0, 0.028, -0.014]} scale={[0.207, 0.208, 0.197]} castShadow />
    {style === 'curls' ? <>
      {[-1,0,1].flatMap(row => [-1,0,1].map(column => <Ball key={`${row}:${column}`} position={[column*.125,.16+(1-Math.abs(column))*.045,row*.1]} scale={[.084,.078,.083]} mat={mat} detail />))}
      {[-1,1].map(side => <Ball key={side} position={[side*.188,.052,-.02]} scale={[.05,.081,.066]} mat={mat} detail />)}
    </> : <>
      <group rotation={[0, 0, style === 'quiff' ? -0.2 : -0.14]}>
        <Ball position={[-0.048, style === 'bun' ? 0.182 : 0.139, 0.116]} scale={[0.129, style === 'quiff' ? 0.082 : 0.055, 0.071]} mat={mat} />
        <Ball position={[0.082, 0.132, 0.112]} scale={[0.089, 0.043, 0.06]} mat={mat} />
      </group>
    </>}
    {style === 'bob' && <>
      <Ball position={[0, -0.017, -0.088]} scale={[0.196, 0.2, 0.137]} mat={mat} />
      {[-1, 1].map(side => <Ball key={side} position={[side * 0.171, side < 0 ? -0.037 : -0.014, -0.017]} scale={[0.062, side < 0 ? 0.157 : 0.135, 0.101]} mat={mat} />)}
    </>}
    {style === 'ponytail' && <group ref={ponytail} position={[0, 0.055, -0.179]}>
      <Ball position={[0, -0.131, -0.058]} scale={[0.064, 0.17, 0.067]} mat={mat} />
      <SoftBox position={[0, -0.024, -0.001]} scale={[0.113, 0.019, 0.051]} mat={accent} />
    </group>}
    {style === 'bun' && <>
      <Ball position={[0, -0.072, -0.196]} scale={[0.09, 0.086, 0.071]} mat={mat} />
      <Ball position={[0.052, -0.088, -0.224]} scale={[0.036, 0.015, 0.02]} mat={accent} detail />
    </>}
    {style === 'textured' && [-1, 0, 1].map(i => <Ball key={i} position={[i * 0.066, 0.171, 0.034]} scale={[0.077, 0.061, 0.098]} mat={mat} detail />)}
    {(style === 'sidepart' || style === 'quiff' || style === 'textured') && [-1, 1].map(side => <Ball key={side} position={[side * 0.171, 0.066, -0.013]} scale={[0.035, 0.088, 0.067]} mat={mat} detail />)}
  </>;
}
function Glasses({ mat, founder }: { mat: THREE.Material; founder: boolean }) {
  return <group position={[0, 0.018, 0.2]}>
    {[-1, 1].map(side => <group key={side} position={[side * 0.067, 0, 0]}>
      <mesh geometry={SHAPES.ring} material={mat} scale={[founder ? 0.046 : 0.045, founder ? 0.039 : 0.044, 0.035]} />
      <SoftBox position={[side * 0.054, 0, -0.025]} scale={[0.008, 0.008, 0.085]} mat={mat} />
    </group>)}
    <SoftBox scale={[0.044, 0.007, 0.009]} mat={mat} />
  </group>;
}
