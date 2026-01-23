import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RefObject, MutableRefObject } from "react";
import { useTerrainStore } from "../../store/terrain-store";

interface CameraControlsProps {
  playerRef: RefObject<THREE.Object3D>;
  angleRef: MutableRefObject<number>;
  pitchRef?: MutableRefObject<number>;
  offsetBehind?: number;
  offsetUp?: number;
  minHeightAboveTerrain?: number;
}

export function CameraControls({
  playerRef,
  angleRef,
  pitchRef,
  offsetBehind = 5,
  offsetUp = 2,
  minHeightAboveTerrain = 1.5,
}: CameraControlsProps) {
  const { camera } = useThree();
  const getHeightAt = useTerrainStore((state) => state.getHeightAt);

  useFrame(() => {
    if (!playerRef.current) return;

    const playerPos = playerRef.current.position;
    const pitch = pitchRef?.current || 0.3;
    const yaw = angleRef.current;

    // Spherical coordinates for camera position around player
    const camX = playerPos.x + Math.sin(yaw) * Math.cos(pitch) * offsetBehind;
    let camY = playerPos.y + offsetUp + Math.sin(pitch) * offsetBehind;
    const camZ = playerPos.z + Math.cos(yaw) * Math.cos(pitch) * offsetBehind;

    // Ensure camera stays above terrain
    const terrainHeight = getHeightAt(camX, camZ);
    const minCamY = terrainHeight + minHeightAboveTerrain;
    camY = Math.max(camY, minCamY);

    camera.position.set(camX, camY, camZ);

    // Look at player (slightly above ground level)
    camera.lookAt(playerPos.x, playerPos.y + 1, playerPos.z);
  });

  return null;
}
