import { useCallback, RefObject, MutableRefObject } from "react";
import * as THREE from "three";
import {
  BASE_SPEED,
  RUN_MULTIPLIER,
  DEV_SPEED_MULTIPLIER,
  ROTATION_SPEED,
} from "../constants";
import type { KeyState } from "./use-keyboard-input";
import { useTerrainStore } from "../../store/terrain-store";

interface MovementParams {
  keys: KeyState;
  isRunning: boolean;
  devSpeedEnabled: boolean;
  angleRef: MutableRefObject<number>;
  meshRef: RefObject<THREE.Object3D>;
}

export function usePlayerMovement() {
  const getHeightAt = useTerrainStore((state) => state.getHeightAt);

  const updateMovement = useCallback(
    ({
      keys,
      isRunning,
      devSpeedEnabled,
      angleRef,
      meshRef,
    }: MovementParams): THREE.Vector3 | null => {
      if (!meshRef.current) return null;

      let speed = isRunning ? BASE_SPEED * RUN_MULTIPLIER : BASE_SPEED;
      if (devSpeedEnabled) {
        speed *= DEV_SPEED_MULTIPLIER;
      }

      // Rotate with A/D
      if (keys.KeyA) {
        angleRef.current += ROTATION_SPEED;
      }
      if (keys.KeyD) {
        angleRef.current -= ROTATION_SPEED;
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

      // Sample terrain height at current X/Z position and set Y
      const terrainHeight = getHeightAt(currentPosition.x, currentPosition.z);
      currentPosition.y = terrainHeight;

      return currentPosition.clone();
    },
    [getHeightAt],
  );

  return { updateMovement };
}
