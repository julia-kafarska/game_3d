// CameraControls.tsx
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { MutableRefObject } from "react";

interface CameraControlsProps {
  /** The ref to your player's Object3D (from useRef or R3F physics) */
  playerRef: MutableRefObject<THREE.Object3D | undefined>;
  /** The ref to the current Y rotation angle (angleRef.current) */
  angleRef: MutableRefObject<number>;
  /** Distance behind the player */
  offsetBehind?: number;
  /** Height above the player */
  offsetUp?: number;
}

/**
 * A simple chase-cam that always keeps the camera behind (and slightly above)
 * the player, based on the player's angleRef rotation.
 */
export function CameraControls({
  playerRef,
  angleRef,
  offsetBehind = 5,
  offsetUp = 2,
}: CameraControlsProps) {
  const { camera } = useThree();

  useFrame(() => {
    if (!playerRef.current) return;

    // Current player position
    const currentPosition = playerRef.current.position;

    // Compute the player's forward direction based on angleRef
    const forwardDir = new THREE.Vector3(0, 0, -1);
    forwardDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleRef.current);

    // Position camera behind the player
    camera.position.set(
      currentPosition.x - forwardDir.x * offsetBehind,
      currentPosition.y + offsetUp,
      currentPosition.z - forwardDir.z * offsetBehind,
    );

    // Always look at the player's position
    camera.lookAt(currentPosition.x, currentPosition.y, currentPosition.z);
  });

  // This is a "logic" component only, no UI
  return null;
}
