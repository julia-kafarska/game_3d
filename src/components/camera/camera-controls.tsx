import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RefObject, MutableRefObject } from "react";
import { useTerrainStore } from "../../store/terrain-store";
import { useCameraStore } from "../../store/camera-store";
import { cameraSettings } from "../../constants/settings";

interface CameraControlsProps {
  playerRef: RefObject<THREE.Object3D>;
  angleRef: MutableRefObject<number>;
  pitchRef?: MutableRefObject<number>;
}

export function CameraControls({
  playerRef,
  angleRef,
  pitchRef,
}: CameraControlsProps) {
  const { camera } = useThree();
  const getHeightAt = useTerrainStore((state) => state.getHeightAt);
  const cameraMode = useCameraStore((state) => state.mode);

  useFrame(() => {
    if (!playerRef.current) return;

    const playerPos = playerRef.current.position;
    const yaw = angleRef.current;

    switch (cameraMode) {
      case 1: // Third-person (behind player)
        updateThirdPerson(camera, playerPos, yaw, pitchRef, getHeightAt);
        break;

      case 2: // Isometric
        updateIsometric(camera, playerPos, yaw, getHeightAt);
        break;

      case 3: // First-person
        updateFirstPerson(camera, playerPos, yaw, pitchRef, getHeightAt);
        break;
    }
  });

  return null;
}

function updateThirdPerson(
  camera: THREE.Camera,
  playerPos: THREE.Vector3,
  yaw: number,
  pitchRef: MutableRefObject<number> | undefined,
  getHeightAt: (x: number, z: number) => number,
) {
  const { thirdPerson } = cameraSettings;
  const pitch = pitchRef?.current || thirdPerson.initialPitch;

  // Spherical coordinates for camera position around player
  const camX =
    playerPos.x + Math.sin(yaw) * Math.cos(pitch) * thirdPerson.offsetBehind;
  let camY =
    playerPos.y +
    thirdPerson.offsetUp +
    Math.sin(pitch) * thirdPerson.offsetBehind;
  const camZ =
    playerPos.z + Math.cos(yaw) * Math.cos(pitch) * thirdPerson.offsetBehind;

  // Ensure camera stays above terrain
  const terrainHeight = getHeightAt(camX, camZ);
  const minCamY = terrainHeight + thirdPerson.minHeightAboveTerrain;
  camY = Math.max(camY, minCamY);

  camera.position.set(camX, camY, camZ);
  camera.lookAt(
    playerPos.x,
    playerPos.y + thirdPerson.lookAtOffsetY,
    playerPos.z,
  );
}

function updateIsometric(
  camera: THREE.Camera,
  playerPos: THREE.Vector3,
  yaw: number,
  getHeightAt: (x: number, z: number) => number,
) {
  const { isometric } = cameraSettings;

  // Isometric camera position - fixed angle above and behind
  const cameraYaw = isometric.followRotation
    ? yaw + isometric.rotationOffset
    : isometric.rotationOffset;

  // Calculate camera position using isometric angle
  const horizontalDist = Math.cos(isometric.angle) * isometric.distance;
  const verticalDist = Math.sin(isometric.angle) * isometric.distance;

  const camX = playerPos.x + Math.sin(cameraYaw) * horizontalDist;
  let camY = playerPos.y + verticalDist;
  const camZ = playerPos.z + Math.cos(cameraYaw) * horizontalDist;

  // Ensure camera stays above terrain
  const terrainHeight = getHeightAt(camX, camZ);
  camY = Math.max(camY, terrainHeight + 2);

  camera.position.set(camX, camY, camZ);
  camera.lookAt(playerPos.x, playerPos.y, playerPos.z);
}

function updateFirstPerson(
  camera: THREE.Camera,
  playerPos: THREE.Vector3,
  yaw: number,
  pitchRef: MutableRefObject<number> | undefined,
  _getHeightAt: (x: number, z: number) => number,
) {
  const { firstPerson } = cameraSettings;
  const pitch = pitchRef?.current || 0;

  // Camera at player's eye level
  const camX = playerPos.x;
  const camY = playerPos.y + firstPerson.eyeHeight;
  const camZ = playerPos.z;

  camera.position.set(camX, camY, camZ);

  // Look in the direction the player is facing, with pitch adjustment
  const lookAtX = camX - Math.sin(yaw) * firstPerson.lookAtDistance;
  const lookAtY = camY - Math.sin(pitch) * firstPerson.lookAtDistance;
  const lookAtZ = camZ - Math.cos(yaw) * firstPerson.lookAtDistance;

  camera.lookAt(lookAtX, lookAtY, lookAtZ);
}
