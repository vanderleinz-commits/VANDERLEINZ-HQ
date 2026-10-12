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

/** Employee indexes match the NPC roster; guest appearances follow in slots 8–10. */
export const characterProfiles: readonly CharacterProfile[] = [
  { name: 'ATLAS', role: 'Office manager', silhouette: 'Neat side part, rounded jacket shoulders', clothing: 'Corporate blue knit jacket, cloud shirt, midnight trousers', personality: 'Composed, attentive, reassuring', color: PALETTE.corporate, hair: '#26384A', skin: '#DEB394', trousers: '#344963', accent: PALETTE.sky },
  { name: 'NOVA', role: 'Creative director', silhouette: 'Asymmetric sculpted bob, cropped overshirt', clothing: 'Lavender overshirt, cream collar, soft charcoal trousers', personality: 'Inventive, expressive, playful', color: PALETTE.lavender, hair: '#755046', skin: '#ECC5A7', trousers: '#586279', accent: PALETTE.sand },
  { name: 'LYRA', role: 'People & culture', silhouette: 'Low ponytail, soft blouse, lavender hair clasp', clothing: 'Dusty blue blouse, warm cream collar, slate trousers', personality: 'Kind, observant, curious', color: '#7394BD', hair: '#30364D', skin: '#E7BEA1', trousers: '#546278', accent: PALETTE.lavender },
  { name: 'ORION', role: 'Research analyst', silhouette: 'Clustered curls, round spectacles, relaxed cardigan', clothing: 'Muted teal cardigan, cream shirt, moss slate trousers', personality: 'Curious, precise, quietly enthusiastic', color: PALETTE.teal, hair: '#38483B', skin: '#C89571', trousers: '#4B625F', accent: PALETTE.sky },
  { name: 'SAGE', role: 'Community host', silhouette: 'Swept textured hair, relaxed rolled sleeves', clothing: 'Warm sand overshirt, pale blue collar, earthy trousers', personality: 'Warm, easygoing, generous', color: '#C6A26F', hair: '#615042', skin: '#BB896A', trousers: '#6D6858', accent: PALETTE.teal },
  { name: 'NEXUS', role: 'Systems engineer', silhouette: 'Tapered quiff, slim glasses, compact technical overshirt', clothing: 'Deep teal overshirt, cloud tee, midnight trousers', personality: 'Focused, patient, resourceful', color: '#397C83', hair: '#283B46', skin: '#D6A98A', trousers: '#35485C', accent: PALETTE.sky },
  { name: 'Amanda', role: 'Receptionist', silhouette: 'Low bun, tidy collar, small warm gold pin', clothing: 'Sky blue uniform jacket, cream shirt, navy trousers', personality: 'Welcoming, poised, cheerful', color: '#83B1CF', hair: '#594B42', skin: '#E4B89A', trousers: '#435B77', accent: PALETTE.sand },
  { name: 'Felin', role: 'Recruitment & development', silhouette: 'Soft low bun, tailored people-team jacket', clothing: 'Muted lavender jacket, cloud blouse, slate trousers', personality: 'Empathetic, organized, encouraging', color: PALETTE.lavender, hair: '#423A3D', skin: '#D7A889', trousers: '#53556B', accent: PALETTE.sand },
  { name: 'Maya', role: 'Visiting client', silhouette: 'Gentle side part, warm sand blazer', clothing: 'Dusty blue jacket, cream blouse, navy trousers', personality: 'Friendly, curious, composed', color: '#788DAB', hair: '#524A43', skin: '#D5AE91', trousers: '#4C5B71', accent: PALETTE.teal },
  { name: 'Raka', role: 'Visiting client', silhouette: 'Short textured hair, muted teal jacket', clothing: 'Muted teal blazer, cloud shirt, slate trousers', personality: 'Direct, thoughtful, collaborative', color: '#528A88', hair: '#394840', skin: '#BB896A', trousers: '#425A62', accent: PALETTE.sky },
  { name: 'Nadia', role: 'Visiting client', silhouette: 'Rounded bob, soft lavender collar', clothing: 'Warm sand jacket, pale blue blouse, ink trousers', personality: 'Open, attentive, imaginative', color: '#C19C76', hair: '#3D3536', skin: '#E5B99B', trousers: '#525D70', accent: PALETTE.lavender },
];

export function characterProfile(variant: number): CharacterProfile {
  return characterProfiles[((Math.floor(variant) % characterProfiles.length) + characterProfiles.length) % characterProfiles.length];
}
