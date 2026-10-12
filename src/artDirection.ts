/** Shared visual contract for the office, characters, and interface. */
export const BRAND = {
  name: 'Blue and Space Headquarters',
  shortName: 'Blue and Space',
  caption: 'A little office. A world of possibility.',
  phase: 'Phase 01 · Visual Foundation',
} as const;

export const PALETTE = {
  midnight: '#142D56', corporate: '#497FB5', sky: '#A9D5F2', cloud: '#E8F3FA',
  sand: '#F2D9B5', lavender: '#B7A3D5', teal: '#62AAA5',
  cream: '#FAF5EC', wood: '#C99D70', woodLight: '#E0BC92', woodDark: '#8C674A',
  leaf: '#769A81', ink: '#35455D', shadow: '#7589A4',
} as const;

export const SURFACES = {
  plaster: { roughness: 0.93, metalness: 0 },
  wood: { roughness: 0.78, metalness: 0 },
  fabric: { roughness: 0.96, metalness: 0 },
  skin: { roughness: 0.84, metalness: 0 },
  ceramic: { roughness: 0.6, metalness: 0 },
  trim: { roughness: 0.58, metalness: 0.16 },
} as const;

export const CHARACTER_STANDARD = {
  height: 1.62,
  headsTall: 3.75,
  forward: '+Z',
  seatHeight: 0.64,
  maxGeometrySegments: 16,
} as const;

export type GraphicsQuality = 'balanced' | 'high';
export const GRAPHICS = {
  balanced: { dpr: 1.25, shadowMap: 1024 },
  high: { dpr: 1.75, shadowMap: 2048 },
} as const;
