import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { MutableRef3dObject } from "../Interfaces/Player.ts";
import { useRef } from "react";
import { useBox } from "@react-three/cannon";
import CameraControls from "../Camera/Camera.tsx";
import { axisMapping } from "../gameControllers/padHook.ts";
const MockPlayer = ({ position, gamepad }) => {
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

      const movementSpeed = 0.1;
      const rotationSpeed = 0.05;

      // Get current position and rotation
      const currentPosition = ref.current.position;
      const currentRotation = ref.current.rotation;

      // Calculate new position
      if (Math.abs(lX) > 0.1) {
        currentPosition.x += lX * movementSpeed;
      }
      if (Math.abs(lY) > 0.1) {
        currentPosition.z += lY * movementSpeed;
      }

      if (Math.abs(rX) > 0.1) {
        currentRotation.y += rX * rotationSpeed;
      }

      // Update the box's position
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

      <CameraControls playerRef={ref} gamepad={gamepad} />
    </>
  );
};

export default MockPlayer;
