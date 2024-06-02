import { memo, useEffect } from "react";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { axisMapping } from "../gameControllers/padHook.ts";
import * as THREE from "three";
import { Vector3 } from "three";

const radiusInit = 10;

const CameraControls = ({ gamepad, playerRef, angleRef, angleRef2 }) => {
  const { camera } = useThree();
  useFrame(() => {
    if (gamepad && playerRef.current && playerRef.current) {
      // const lX = gamepad.axes[axisMapping.L_STICK_X];
      // const lY = gamepad.axes[axisMapping.L_STICK_Y];

      const rX = gamepad.axes[axisMapping.R_STICK_X];
      const rY = gamepad.axes[axisMapping.R_STICK_Y]; // left up and down

      let radius = radiusInit;
      const rotationSpeed = 0.05;

      const playerPosition = playerRef.current.position;

      if (Math.abs(rX) > 0.1) {
        angleRef.current += rX * rotationSpeed;
      }
      if (Math.abs(rY) > 0.1) {
        //* rotationSpeed2
        const newAngle2 = angleRef2.current + rY;
        if (newAngle2 >= 3 && newAngle2 < 18) {
          angleRef2.current = newAngle2;
        }
      }

      // Calculate the new camera position based on the angle and radius
      camera.position.x =
        playerPosition.x + radius * Math.sin(angleRef.current);
      camera.position.y = Math.PI * angleRef2.current;
      camera.position.z =
        playerPosition.z + radius * Math.cos(angleRef.current);
      camera.lookAt(playerPosition);
    }
  });

  useEffect(() => {
    camera.position.x = radiusInit * Math.sin(angleRef.current);
    camera.position.y = Math.PI * angleRef2.current;
    camera.position.z = 1 + radiusInit * Math.cos(angleRef.current);

    camera.lookAt(camera.position);
  }, []);

  return (
    <>
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
