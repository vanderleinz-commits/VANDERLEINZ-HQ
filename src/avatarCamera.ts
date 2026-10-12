export const FOLLOW_OFFSET = [2.8, 3.6, 4.4] as const;

/** The input basis stays fixed while camera clearance changes. */
export function avatarDirection(horizontal: number, vertical: number): [number, number] {
  const length = Math.hypot(FOLLOW_OFFSET[0], FOLLOW_OFFSET[2]);
  const x = horizontal * FOLLOW_OFFSET[2] / length + vertical * FOLLOW_OFFSET[0] / length;
  const z = -horizontal * FOLLOW_OFFSET[0] / length + vertical * FOLLOW_OFFSET[2] / length;
  const magnitude = Math.hypot(x, z);
  return magnitude ? [x / magnitude, z / magnitude] : [0, 0];
}

export const followWeight = (delta: number, rate = 6) => 1 - Math.exp(-rate * Math.min(.1, Math.max(0, delta)));
