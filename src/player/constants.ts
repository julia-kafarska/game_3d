export const BASE_SPEED = 0.022;

export const ANIMATION_INDICES = {
  IDLE: 2,
  WALK: 6,
  RUN: 3,
} as const;

export const KEY_CODES = {
  FORWARD: "KeyW",
  LEFT: "KeyA",
  BACKWARD: "KeyS",
  RIGHT: "KeyD",
  RUN: "ShiftLeft",
} as const;
