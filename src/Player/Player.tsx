import { useRef, useEffect, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Mesh, Vector3 } from "three";

type keyEvent = { key: string };
const Player = () => {
  const ballRef = useRef<Mesh>(null);
  const { camera } = useThree();

  const [ballPosition, setBallPosition] = useState([0, 0, 1]);
  const [ballVelocity, setBallVelocity] = useState([0, 0, 0]);

  const handleKeyDown = (event: keyEvent) => {
    const [x, y, z] = ballVelocity;
    switch (event.key) {
      case "ArrowUp":
        setBallVelocity([x, y, z + 0.1]);
        break;
      case "ArrowDown":
        setBallVelocity([x, y, z - 0.1]);
        break;
      case "ArrowLeft":
        setBallVelocity([x - 0.1, y, z]);
        break;
      case "ArrowRight":
        setBallVelocity([x + 0.1, y, z]);
        break;
      case " ":
        setBallVelocity([x, y + 0.2, z]);
        break;
      default:
        break;
    }
  };

  const handleKeyUp = (event: keyEvent) => {
    switch (event.key) {
      case "ArrowUp":
      case "ArrowDown":
      case "ArrowLeft":
      case "ArrowRight":
      case " ":
        setBallVelocity([0, 0, 0]);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [ballVelocity]);

  useFrame(() => {
    if (!ballRef.current) return;

    // Update ball position based on velocity
    setBallPosition(([x, y, z]) => {
      const newX = x + ballVelocity[0];
      const newY = y + ballVelocity[1];
      const newZ = z + ballVelocity[2]; // 0.5 is radius of the ball

      return [newX, newY, newZ];
    });

    // Move camera to follow the ball
    const ballPos = new Vector3(...ballPosition);
    camera.position.lerp(
      new Vector3(ballPos.x, camera.position.y, ballPos.z),
      0.1,
    );
    camera.lookAt(ballPos);

    if (ballRef.current) {
      ballRef.current.position.set(...ballPosition);
    }
  });

  return (
    <mesh ref={ballRef} position={ballPosition} castShadow>
      <sphereGeometry attach="geometry" args={[0.5, 32, 32]} />
      <meshStandardMaterial color="blue" />
    </mesh>
  );
};

export default Player;
