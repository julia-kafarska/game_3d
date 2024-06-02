import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState } from "react";
import { useBox } from "@react-three/cannon";
import CameraControls from "../Camera/Camera.tsx";
import * as THREE from "three";
import { Html } from "@react-three/drei";

import { axisMapping, buttonMapping } from "../gameControllers/padHook.ts";
let movementSpeed = 0.1;

const MockPlayer = ({ position, gamepad }) => {
  const angleRef = useRef(0); //
  const angleRef2 = useRef(3); //
  const [coord, setCoord] = useState({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
  });
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

      setCoord({
        position: {
          ...currentPosition,
          y: currentPosition.y + 2,
        },
        rotation: currentRotation,
      });

      api.position.set(currentPosition.x, currentPosition.y, currentPosition.z);
      api.rotation.set(currentRotation.x, currentRotation.y, currentRotation.z);
    }
  });

  return (
    <>
      <Html>
        <div
          style={{
            background: "rgba(255,0,0, 0.2)",
            width: "100px",
            height: "30px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
          }}
        >
          {coord.position.x !== null
            ? `x: ${Math.round(coord.position.x)} `
            : null}
          {coord.position.z !== null
            ? `z: ${Math.round(coord.position.z)}`
            : null}
        </div>
      </Html>
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
