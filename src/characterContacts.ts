/** Dimensions match the shared miniature rig, in world metres. */
export const CONTACT_DIMENSIONS = { hip: .8, thigh: .31, shin: .415, soleDrop: .072, seatedHip: .64, upperArm: .235, lowerArm: .255 } as const;

export function legSoleHeight(hip: number, thigh: number, knee: number) {
  return hip - CONTACT_DIMENSIONS.thigh * Math.cos(thigh) - CONTACT_DIMENSIONS.shin * Math.cos(thigh + knee) - CONTACT_DIMENSIONS.soleDrop;
}

/** The shin stays vertical and the soles meet the floor at the chair's cushion height. */
export function seatedLegContact(seatHeight = CONTACT_DIMENSIONS.seatedHip) {
  const thigh = -Math.acos(Math.max(-1, Math.min(1, (seatHeight - CONTACT_DIMENSIONS.shin - CONTACT_DIMENSIONS.soleDrop) / CONTACT_DIMENSIONS.thigh)));
  return { thigh, knee: -thigh };
}

/** Solve an arm in its forward plane, avoiding elbows that hyperextend through desks. */
export function solveArmContact(shoulderHeight: number, handHeight: number, handForward: number) {
  const upper = CONTACT_DIMENSIONS.upperArm, lower = CONTACT_DIMENSIONS.lowerArm;
  const down = shoulderHeight - handHeight;
  const reach = Math.min(upper + lower - .001, Math.max(.03, Math.hypot(down, handForward)));
  const bend = Math.acos(Math.max(-1, Math.min(1, (reach * reach - upper * upper - lower * lower) / (2 * upper * lower))));
  const direction = Math.atan2(handForward, down);
  return { shoulder: -(direction - Math.atan2(lower * Math.sin(bend), upper + lower * Math.cos(bend))), elbow: -bend };
}

export function armContactPoint(shoulderHeight: number, shoulder: number, elbow: number) {
  const { upperArm: upper, lowerArm: lower } = CONTACT_DIMENSIONS;
  return { height: shoulderHeight - upper * Math.cos(shoulder) - lower * Math.cos(shoulder + elbow), forward: -upper * Math.sin(shoulder) - lower * Math.sin(shoulder + elbow) };
}
