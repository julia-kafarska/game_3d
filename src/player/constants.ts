import { playerSettings } from "../constants/settings";

export const BASE_SPEED = playerSettings.baseSpeed;
export const RUN_MULTIPLIER = playerSettings.runMultiplier;
export const DEV_SPEED_MULTIPLIER = playerSettings.devSpeedMultiplier;
export const ROTATION_SPEED = playerSettings.rotationSpeed;

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
