import { useCallback, useRef, RefObject, MutableRefObject } from "react";
import * as THREE from "three";
import {
  BASE_SPEED,
  RUN_MULTIPLIER,
  DEV_SPEED_MULTIPLIER,
  ROTATION_SPEED,
} from "../constants";
import type { KeyState } from "./use-keyboard-input";
import { useTerrainStore } from "../../store/terrain-store";
import { playerSettings } from "../../constants/settings";

interface MovementParams {
  keys: KeyState;
  isRunning: boolean;
  devSpeedEnabled: boolean;
  angleRef: MutableRefObject<number>;
  meshRef: RefObject<THREE.Object3D>;
}

const TARGET_FPS = 60;
const { gravity, terminalVelocity, groundSnapThreshold } = playerSettings;

export function usePlayerMovement() {
  const getHeightAt = useTerrainStore((state) => state.getHeightAt);
  const lastTimeRef = useRef<number>(performance.now());
  const verticalVelocityRef = useRef<number>(0);
  const isGroundedRef = useRef<boolean>(true);

  const updateMovement = useCallback(
    ({
      keys,
      isRunning,
      devSpeedEnabled,
      angleRef,
      meshRef,
    }: MovementParams): THREE.Vector3 | null => {
      if (!meshRef.current) return null;

      // Calculate delta time for frame-rate independent movement
      const now = performance.now();
      const deltaMs = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // Delta in seconds for physics
      const deltaSec = deltaMs / 1000;
      // Delta multiplier (1.0 at 60fps) for movement
      const delta = deltaSec * TARGET_FPS;

      // Calculate speed with delta time
      let speed = isRunning ? BASE_SPEED * RUN_MULTIPLIER : BASE_SPEED;
      if (devSpeedEnabled) {
        speed *= DEV_SPEED_MULTIPLIER;
      }
      speed *= delta;

      // Rotation with delta time
      const rotSpeed = ROTATION_SPEED * delta;

      // Rotate with A/D
      if (keys.KeyA) {
        angleRef.current += rotSpeed;
      }
      if (keys.KeyD) {
        angleRef.current -= rotSpeed;
      }

      // Apply player rotation to mesh
      meshRef.current.rotation.y = angleRef.current + Math.PI;

      // Calculate forward direction based on player angle
      const forwardDir = new THREE.Vector3(0, 0, -1);
      forwardDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleRef.current);

      const currentPosition = meshRef.current.position;

      // Move forward/back (W/S)
      if (keys.KeyW) {
        currentPosition.addScaledVector(forwardDir, speed);
      }
      if (keys.KeyS) {
        currentPosition.addScaledVector(forwardDir, -speed);
      }

      // Get the terrain/cave floor height at current position
      const terrainHeight = getHeightAt(
        currentPosition.x,
        currentPosition.z,
        currentPosition.y,
      );

      // Apply gravity physics
      const distanceToGround = currentPosition.y - terrainHeight;

      if (
        distanceToGround <= groundSnapThreshold &&
        verticalVelocityRef.current <= 0
      ) {
        // Close to ground and not moving up - snap to ground
        currentPosition.y = terrainHeight;
        verticalVelocityRef.current = 0;
        isGroundedRef.current = true;
      } else {
        // In the air - apply gravity
        isGroundedRef.current = false;

        // Apply gravity acceleration
        verticalVelocityRef.current -= gravity * deltaSec;

        // Clamp to terminal velocity
        if (verticalVelocityRef.current < -terminalVelocity) {
          verticalVelocityRef.current = -terminalVelocity;
        }

        // Apply vertical movement
        currentPosition.y += verticalVelocityRef.current * deltaSec;

        // Check if we've hit the ground
        if (currentPosition.y <= terrainHeight) {
          currentPosition.y = terrainHeight;
          verticalVelocityRef.current = 0;
          isGroundedRef.current = true;
        }
      }

      return currentPosition.clone();
    },
    [getHeightAt],
  );

  return { updateMovement, isGroundedRef };
}
