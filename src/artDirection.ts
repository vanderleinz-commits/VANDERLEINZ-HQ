/** Shared visual contract for the office, characters, and interface. */
export const BRAND = {
  name: 'Blue and Space Headquarters',
  shortName: 'Blue and Space',
  caption: 'A little office. A world of possibility.',
  phase: 'Warm Workspace · Visual Design',
} as const;

export const PALETTE = {
  midnight: '#203C52', corporate: '#315770', sky: '#B5CED7', cloud: '#E9EFEE',
  sand: '#D8C29B', lavender: '#A9A1B7', teal: '#779B97',
  cream: '#F3EDE1', wood: '#A17D57', woodLight: '#C0A37B', woodDark: '#705338',
  leaf: '#587757', ink: '#2F4856', shadow: '#89928F',
} as const;

export const SURFACES = {
  plaster: { roughness: 0.93, metalness: 0 },
  wood: { roughness: 0.78, metalness: 0 },
  fabric: { roughness: 0.96, metalness: 0 },
  skin: { roughness: 0.84, metalness: 0 },
  ceramic: { roughness: 0.6, metalness: 0 },
  stone: { roughness: 0.79, metalness: 0 },
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
