export type Point = readonly [number, number];

export type Limb = readonly [Point, Point, Point];

export interface Pose {
  head: Point;
  neck: Point;
  hip: Point;
  frontArm: Limb;
  backArm: Limb;
  frontLeg: Limb;
  backLeg: Limb;
}

export const PUNCH_POSE: Pose = {
  head: [8, -94],
  neck: [6, -78],
  hip: [0, -32],
  frontArm: [
    [6, -74],
    [36, -74],
    [66, -74],
  ],
  backArm: [
    [6, -74],
    [-6, -58],
    [4, -66],
  ],
  frontLeg: [
    [0, -32],
    [20, -16],
    [28, 0],
  ],
  backLeg: [
    [0, -32],
    [-18, -14],
    [-26, 0],
  ],
};

export const HIT_POSE: Pose = {
  head: [-16, -88],
  neck: [-12, -74],
  hip: [0, -32],
  frontArm: [
    [-12, -70],
    [-2, -90],
    [8, -104],
  ],
  backArm: [
    [-12, -70],
    [-30, -84],
    [-36, -98],
  ],
  frontLeg: [
    [0, -32],
    [10, -16],
    [16, 0],
  ],
  backLeg: [
    [0, -32],
    [-16, -16],
    [-24, 0],
  ],
};
