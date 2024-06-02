import { useFrame, useThree } from "@react-three/fiber";
import { Text, useCamera } from "@react-three/drei";
import { MutableRef3dObject } from "../Interfaces/Player.ts";
import { useRef, useState } from "react";
import { useBox } from "@react-three/cannon";
import CameraControls from "../Camera/Camera.tsx";
import * as THREE from "three";

import { axisMapping, buttonMapping } from "../gameControllers/padHook.ts";
let movementSpeed = 0.1;
const MockPlayer = ({ position, gamepad }) => {
  const angleRef = useRef(0); //
  const angleRef2 = useRef(3); //
  const coordinates = useRef<MutableRef3dObject>();
  const [ref, api] = useBox(() => ({
    type: "Kinematic",
    mass: 1,
    position,
  }));
  useFrame(() => {
    if (gamepad && ref.current) {
      const lX = gamepad.axes[axisMapping.L_STICK_X];
      const lY = gamepad.axes[axisMapping.L_STICK_Y];
      const rX = gamepad.axes[axisMapping.R_STICK_X];
      const rPress = gamepad.buttons[buttonMapping.L_STICK];

      if (rPress.pressed) {
        movementSpeed = 1;
      } else {
        movementSpeed = 0.1;
      }

      const rotationSpeed = 0.05;

      // Get current position and rotation
      const currentPosition = ref.current.position;
      const currentRotation = ref.current.rotation;

      // // Calculate new position
      const forward = new THREE.Vector3(0, 0, 1);
      forward.applyQuaternion(ref.current.quaternion); // Apply current rotation
      forward.normalize();

      const right = new THREE.Vector3(1, 0, 0);
      right.applyQuaternion(ref.current.quaternion); // Apply current rotation
      right.normalize();

      // Move the box based on the left stick
      if (Math.abs(lX) > 0.1) {
        currentPosition.add(right.multiplyScalar(lX * movementSpeed));
      }
      if (Math.abs(lY) > 0.1) {
        currentPosition.add(forward.multiplyScalar(lY * movementSpeed));
      }

      // Rotate the box based on the right stick's x-axis
      if (Math.abs(rX) > 0.1) {
        currentRotation.y += rX * rotationSpeed;
      }

      api.position.set(currentPosition.x, currentPosition.y, currentPosition.z);
      api.rotation.set(currentRotation.x, currentRotation.y, currentRotation.z);
    }
  });

  return (
    <>
      <Text fontSize={1} color="green" ref={coordinates} position={[1, 2, 1]}>
        x:{position.x ? Math.round(position.x) : "-"}
        z:{position.z ? Math.round(position.z) : "-"}
      </Text>
      <mesh ref={ref}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>

      <CameraControls
        playerRef={ref}
        gamepad={gamepad}
        angleRef={angleRef}
        angleRef2={angleRef2}
      />
    </>
  );
};

export default MockPlayer;
