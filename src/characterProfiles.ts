import { PALETTE } from './artDirection.ts';

export type CharacterProfile = {
  gender: 'male' | 'female';
  name: string;
  role: string;
  silhouette: string;
  clothing: string;
  personality: string;
  color: string;
  hair: string;
  skin: string;
  trousers: string;
  accent: string;
  hairStyle: HairStyle;
  garment: Garment;
  eyeColor: string;
  eyeShape: 'round' | 'almond';
  faceShape: 'soft' | 'round' | 'narrow';
  glasses: boolean;
};

export type HairStyle = 'sidepart' | 'bob' | 'ponytail' | 'curls' | 'quiff' | 'bun' | 'textured';
export type Garment = 'jacket' | 'overshirt' | 'polo' | 'apron';
export const EMPLOYEE_PROFILE_COUNT = 10;
export const CLIENT_VARIANT_START = 10;
export const OWNER_PROFILE_INDEX = 13;
export const CHARACTER_CUSTOMIZATION_KEY = 'blue-and-space-character-appearance-v1';

/** Stable roster indexes are shared by simulation, signage, and the reusable rig. */
const identities = [
  { name: 'ATLAS', role: 'Office manager', silhouette: 'Neat side part, rounded jacket shoulders', clothing: 'Corporate blue knit jacket, cloud shirt, midnight trousers', personality: 'Composed, attentive, reassuring', color: PALETTE.corporate, hair: '#26384A', skin: '#DEB394', trousers: '#344963', accent: PALETTE.sky },
  { name: 'NOVA', role: 'Creative director', silhouette: 'Asymmetric sculpted bob, cropped overshirt', clothing: 'Lavender overshirt, cream collar, soft charcoal trousers', personality: 'Inventive, expressive, playful', color: PALETTE.lavender, hair: '#755046', skin: '#ECC5A7', trousers: '#586279', accent: PALETTE.sand },
  { name: 'LYRA', role: 'People & culture', silhouette: 'Low ponytail, soft blouse, lavender hair clasp', clothing: 'Dusty blue blouse, warm cream collar, slate trousers', personality: 'Kind, observant, curious', color: '#7394BD', hair: '#30364D', skin: '#E7BEA1', trousers: '#546278', accent: PALETTE.lavender },
  { name: 'ORION', role: 'Research analyst', silhouette: 'Clustered curls, round spectacles, relaxed cardigan', clothing: 'Muted teal cardigan, cream shirt, moss slate trousers', personality: 'Curious, precise, quietly enthusiastic', color: PALETTE.teal, hair: '#38483B', skin: '#C89571', trousers: '#4B625F', accent: PALETTE.sky },
  { name: 'SAGE', role: 'Community host', silhouette: 'Swept textured hair, relaxed rolled sleeves', clothing: 'Warm sand overshirt, pale blue collar, earthy trousers', personality: 'Warm, easygoing, generous', color: '#C6A26F', hair: '#615042', skin: '#BB896A', trousers: '#6D6858', accent: PALETTE.teal },
  { name: 'NEXUS', role: 'Systems engineer', silhouette: 'Tapered quiff, slim glasses, compact technical overshirt', clothing: 'Deep teal overshirt, cloud tee, midnight trousers', personality: 'Focused, patient, resourceful', color: '#397C83', hair: '#283B46', skin: '#D6A98A', trousers: '#35485C', accent: PALETTE.sky },
  { name: 'Amanda', role: 'Receptionist', silhouette: 'Low bun, tidy collar, small warm gold pin', clothing: 'Sky blue uniform jacket, cream shirt, navy trousers', personality: 'Welcoming, poised, cheerful', color: '#83B1CF', hair: '#594B42', skin: '#E4B89A', trousers: '#435B77', accent: PALETTE.sand },
  { name: 'Felin', role: 'Recruitment & development', silhouette: 'Soft low bun, tailored people-team jacket', clothing: 'Muted lavender jacket, cloud blouse, slate trousers', personality: 'Empathetic, organized, encouraging', color: PALETTE.lavender, hair: '#423A3D', skin: '#D7A889', trousers: '#53556B', accent: PALETTE.sand },
  { name: 'Yati', role: 'Catering & hospitality', silhouette: 'Tidy bun, warm cream apron, welcoming stance', clothing: 'Soft blue blouse and warm sand service apron', personality: 'Caring, cheerful, thoughtful', color: '#7CA5BC', hair: '#584438', skin: '#D5A383', trousers: '#536B7B', accent: PALETTE.sand },
  { name: 'Deno', role: 'Office care', silhouette: 'Full soft curls, rolled sleeves, practical work polo', clothing: 'Muted teal polo and midnight work trousers', personality: 'Diligent, relaxed, helpful', color: '#62AAA5', hair: '#3C312D', skin: '#BE8D6C', trousers: '#3F5268', accent: PALETTE.sky },
  { name: 'Maya', role: 'Visiting client', silhouette: 'Gentle side part, warm sand blazer', clothing: 'Dusty blue jacket, cream blouse, navy trousers', personality: 'Friendly, curious, composed', color: '#788DAB', hair: '#524A43', skin: '#D5AE91', trousers: '#4C5B71', accent: PALETTE.teal },
  { name: 'Raka', role: 'Visiting client', silhouette: 'Short textured hair, muted teal jacket', clothing: 'Muted teal blazer, cloud shirt, slate trousers', personality: 'Direct, thoughtful, collaborative', color: '#528A88', hair: '#394840', skin: '#BB896A', trousers: '#425A62', accent: PALETTE.sky },
  { name: 'Nadia', role: 'Visiting client', silhouette: 'Rounded bob, soft lavender collar', clothing: 'Warm sand jacket, pale blue blouse, ink trousers', personality: 'Open, attentive, imaginative', color: '#C19C76', hair: '#3D3536', skin: '#E5B99B', trousers: '#525D70', accent: PALETTE.lavender },
  { name: 'Founder', role: 'Owner avatar', silhouette: 'Relaxed side part, soft blue tailored jacket', clothing: 'Corporate blue jacket and warm cream shirt', personality: 'Curious, welcoming, creative', color: PALETTE.corporate, hair: '#33435A', skin: '#D8AD8C', trousers: '#344963', accent: PALETTE.sand },
];

const defaultHair: HairStyle[] = ['sidepart', 'bob', 'ponytail', 'curls', 'textured', 'quiff', 'bun', 'bun', 'bun', 'curls', 'sidepart', 'textured', 'bob', 'sidepart'];
const defaultGarment: Garment[] = ['jacket', 'overshirt', 'overshirt', 'jacket', 'overshirt', 'overshirt', 'overshirt', 'jacket', 'apron', 'polo', 'jacket', 'jacket', 'jacket', 'jacket'];
export const defaultCharacterProfiles: readonly CharacterProfile[] = identities.map((identity, index) => ({
  ...identity, gender:[1,2,6,7,8,10,12].includes(index)?'female':'male', hairStyle: defaultHair[index], garment: defaultGarment[index],
  eyeColor: [2, 3, 7, 9].includes(index) ? '#54726B' : '#415C71', eyeShape: 'round', faceShape: 'soft', glasses: [3, 5].includes(index),
}));
export type CharacterAppearance = Pick<CharacterProfile, 'gender' | 'name' | 'color' | 'hair' | 'skin' | 'trousers' | 'accent' | 'hairStyle' | 'garment' | 'eyeColor' | 'eyeShape' | 'faceShape' | 'glasses'>;
const hairStyles: readonly string[] = ['sidepart', 'bob', 'ponytail', 'curls', 'quiff', 'bun', 'textured'];
const garments: readonly string[] = ['jacket', 'overshirt', 'polo', 'apron'];
const appearanceKeys = ['gender', 'name', 'color', 'hair', 'skin', 'trousers', 'accent', 'hairStyle', 'garment', 'eyeColor', 'eyeShape', 'faceShape', 'glasses'] as const;
type ProfileStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** Allow only bounded identity and appearance fields; jobs and room assignments are fixed. */
export function validateCharacterAppearance(value: unknown): Partial<CharacterAppearance> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const input = value as Record<string, unknown>, result: Record<string, unknown> = {};
  for (const key of appearanceKeys) {
    const field = input[key];
    if (key === 'name' && typeof field === 'string') {
      const name = field.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 24);
      if (name) result.name = name;
    } else if (['color', 'hair', 'skin', 'trousers', 'accent', 'eyeColor'].includes(key) && typeof field === 'string' && /^#[\da-fA-F]{6}$/.test(field)) result[key] = field.toUpperCase();
    else if (key === 'gender' && (field==='male'||field==='female')) result[key]=field;
    else if (key === 'hairStyle' && typeof field === 'string' && hairStyles.includes(field)) result[key] = field;
    else if (key === 'garment' && typeof field === 'string' && garments.includes(field)) result[key] = field;
    else if (key === 'eyeShape' && typeof field === 'string' && ['round', 'almond'].includes(field)) result[key] = field;
    else if (key === 'faceShape' && typeof field === 'string' && ['soft', 'round', 'narrow'].includes(field)) result[key] = field;
    else if (key === 'glasses' && typeof field === 'boolean') result[key] = field;
  }
  return result as Partial<CharacterAppearance>;
}

export function readCharacterProfiles(storage?: ProfileStorage): CharacterProfile[] {
  const profiles = defaultCharacterProfiles.map(profile => ({ ...profile }));
  if (!storage) return profiles;
  try {
    const saved: unknown = JSON.parse(storage.getItem(CHARACTER_CUSTOMIZATION_KEY) ?? 'null');
    if (!saved || typeof saved !== 'object' || (saved as { version?: number }).version !== 1) return profiles;
    const overrides = (saved as { profiles?: unknown }).profiles;
    if (!Array.isArray(overrides)) return profiles;
    overrides.slice(0, profiles.length).forEach((override, index) => Object.assign(profiles[index], validateCharacterAppearance(override)));
  } catch { /* A malformed or unavailable local save keeps the official appearance. */ }
  return profiles;
}

function localStorageAvailable(): ProfileStorage | undefined {
  try { return typeof window === 'undefined' ? undefined : window.localStorage; } catch { return undefined; }
}
export const characterProfiles = readCharacterProfiles(localStorageAvailable());
let revision = 0;
const listeners = new Set<() => void>();
export const getCharacterRevision = () => revision;
export function subscribeCharacterRevision(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }

function persistProfiles() {
  let saved = true;
  try {
    const storage = localStorageAvailable();
    if (!storage) saved = false;
    else storage.setItem(CHARACTER_CUSTOMIZATION_KEY, JSON.stringify({ version: 1, profiles: characterProfiles.map(profile => Object.fromEntries(appearanceKeys.map(key => [key, profile[key]]))) }));
  } catch { saved = false; }
  revision += 1; listeners.forEach(listener => listener());
  return saved;
}
export function updateCharacterAppearance(index: number, patch: unknown) {
  if (!Number.isInteger(index) || index < 0 || index >= characterProfiles.length) return false;
  Object.assign(characterProfiles[index], validateCharacterAppearance(patch));
  return persistProfiles();
}
export function resetCharacterAppearance(index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= characterProfiles.length) return false;
  Object.assign(characterProfiles[index], defaultCharacterProfiles[index]);
  return persistProfiles();
}

export function characterProfile(variant: number): CharacterProfile {
  const index = Number.isFinite(variant) ? Math.floor(variant) : 0;
  return characterProfiles[((index % characterProfiles.length) + characterProfiles.length) % characterProfiles.length];
}
