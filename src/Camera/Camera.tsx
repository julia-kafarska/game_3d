import { memo, useRef } from "react";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { axisMapping } from "../gameControllers/padHook.ts";

const CameraControls = ({ gamepad, playerRef }) => {
  const { camera } = useThree();
  const angleRef = useRef(0); // Store the current angle for the camera rotation
  useFrame(() => {
    if (gamepad && playerRef.current && playerRef.current) {
      // const lX = gamepad.axes[axisMapping.L_STICK_X];
      // const lY = gamepad.axes[axisMapping.L_STICK_Y];

      const rX = gamepad.axes[axisMapping.R_STICK_X];
      const rY = gamepad.axes[axisMapping.R_STICK_Y];

      const movementSpeed = 0.1;
      const rotationSpeed = 0.05;

      const playerPosition = playerRef.current.position;

      if (Math.abs(rX) > 0.1 || Math.abs(rY) > 0.1) {
        const forward = new THREE.Vector3(
          Math.sin(angleRef.current),
          0,
          Math.cos(angleRef.current),
        ).normalize();
        const right = new THREE.Vector3(
          Math.sin(angleRef.current + Math.PI / 2),
          0,
          Math.cos(angleRef.current + Math.PI / 2),
        ).normalize();
        playerRef.current.position.add(
          forward.multiplyScalar(rY * movementSpeed),
        );
        playerRef.current.position.add(
          right.multiplyScalar(rX * movementSpeed),
        );
      }

      // Update the angle for camera rotation if left stick is moved
      if (Math.abs(rX) > 0.1) {
        angleRef.current += rX * rotationSpeed;
      }

      // Calculate the new camera position based on the angle and radius
      const radius = 10;
      camera.position.x =
        playerPosition.x + radius * Math.sin(angleRef.current);
      camera.position.z =
        playerPosition.z + radius * Math.cos(angleRef.current);
      camera.position.y = playerPosition.y + 5; // Slightly above the player

      // Make the camera look at the player
      camera.lookAt(playerPosition);
    }
  });
  return (
    <>
      <PerspectiveCamera position={[12, 12, 12]} />
      <OrbitControls
        enableZoom={true}
        minDistance={5}
        maxDistance={70}
        minPolarAngle={0}
        maxPolarAngle={1}
      />
    </>
  );
};
export default memo(CameraControls);
