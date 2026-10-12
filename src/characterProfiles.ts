import { PALETTE } from './artDirection.ts';

export type CharacterProfile = {
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
};

/** Indexes match the office staff, with the guest in slot 8. All share one rig. */
export const characterProfiles: readonly CharacterProfile[] = [
  { name: 'ATLAS', role: 'Office manager', silhouette: 'Neat side part, rounded jacket shoulders', clothing: 'Corporate blue knit jacket, cloud shirt, midnight trousers', personality: 'Composed, attentive, reassuring', color: PALETTE.corporate, hair: '#26384A', skin: '#DEB394', trousers: '#344963', accent: PALETTE.sky },
  { name: 'NOVA', role: 'Creative director', silhouette: 'Asymmetric sculpted bob, cropped overshirt', clothing: 'Lavender overshirt, cream collar, soft charcoal trousers', personality: 'Inventive, expressive, playful', color: PALETTE.lavender, hair: '#755046', skin: '#ECC5A7', trousers: '#586279', accent: PALETTE.sand },
  { name: 'LYRA', role: 'People & culture', silhouette: 'Low ponytail, soft blouse, lavender hair clasp', clothing: 'Dusty blue blouse, warm cream collar, slate trousers', personality: 'Kind, observant, curious', color: '#7394BD', hair: '#30364D', skin: '#E7BEA1', trousers: '#546278', accent: PALETTE.lavender },
  { name: 'ORION', role: 'Research analyst', silhouette: 'Clustered curls, round spectacles, relaxed cardigan', clothing: 'Muted teal cardigan, cream shirt, moss slate trousers', personality: 'Curious, precise, quietly enthusiastic', color: PALETTE.teal, hair: '#38483B', skin: '#C89571', trousers: '#4B625F', accent: PALETTE.sky },
  { name: 'SAGE', role: 'Community host', silhouette: 'Swept textured hair, relaxed rolled sleeves', clothing: 'Warm sand overshirt, pale blue collar, earthy trousers', personality: 'Warm, easygoing, generous', color: '#C6A26F', hair: '#615042', skin: '#BB896A', trousers: '#6D6858', accent: PALETTE.teal },
  { name: 'NEXUS', role: 'Systems engineer', silhouette: 'Tapered quiff, slim glasses, compact technical overshirt', clothing: 'Deep teal overshirt, cloud tee, midnight trousers', personality: 'Focused, patient, resourceful', color: '#397C83', hair: '#283B46', skin: '#D6A98A', trousers: '#35485C', accent: PALETTE.sky },
  { name: 'Amanda', role: 'Receptionist', silhouette: 'Low bun, tidy collar, small warm gold pin', clothing: 'Sky blue uniform jacket, cream shirt, navy trousers', personality: 'Welcoming, poised, cheerful', color: '#83B1CF', hair: '#594B42', skin: '#E4B89A', trousers: '#435B77', accent: PALETTE.sand },
  { name: 'Akbar', role: 'Founder', silhouette: 'Swept back hair, soft blazer, warm metal glasses', clothing: 'Midnight blazer, cream open collar, blue slate trousers', personality: 'Thoughtful, approachable, confident', color: PALETTE.midnight, hair: '#302C2A', skin: '#CAA07D', trousers: '#314561', accent: PALETTE.sand },
  { name: 'Guest', role: 'Visiting collaborator', silhouette: 'Short side part, relaxed soft blazer', clothing: 'Dusty slate jacket, pale blue shirt, navy trousers', personality: 'Friendly, inquisitive, open', color: '#788DAB', hair: '#524A43', skin: '#D5AE91', trousers: '#4C5B71', accent: PALETTE.teal },
];

export function characterProfile(variant: number): CharacterProfile {
  return characterProfiles[((Math.floor(variant) % characterProfiles.length) + characterProfiles.length) % characterProfiles.length];
}
