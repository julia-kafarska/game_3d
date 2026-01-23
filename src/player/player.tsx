import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { useBox } from "@react-three/cannon";
import * as THREE from "three";

import { usePlayerContext } from "../store/player-context";
import { CameraControls } from "../components/camera/camera-controls";
import { useKeyboardInput } from "./hooks/use-keyboard-input";
import { usePlayerAnimation } from "./hooks/use-player-animation";
import { usePlayerMovement } from "./hooks/use-player-movement";
import { useMouseLook } from "./hooks/use-mouse-look";
import { PlayerModel } from "./components/player-model";
import { cameraSettings, playerSettings } from "../constants/settings";
import { useCameraStore } from "../store/camera-store";

const Player = () => {
  const { player, updatePlayer } = usePlayerContext();
  const playerAngleRef = useRef(0); // Player facing direction (mouse controls this)
  const pitchRef = useRef(cameraSettings.thirdPerson.initialPitch); // Camera pitch (mouse vertical)
  const cameraMode = useCameraStore((state) => state.mode);

  const [ref] = useBox(() => ({
    mass: 1,
    position: [player.position.x, player.position.y, player.position.z],
  }));

  const { keys, isMoving, isRunning, isMovingBackward, devSpeedEnabled } =
    useKeyboardInput();
  const { initializeAnimations, updateAnimation, mixer } = usePlayerAnimation();
  const { updateMovement } = usePlayerMovement();

  // Mouse controls player direction
  useMouseLook({
    angleRef: playerAngleRef,
    pitchRef,
    sensitivity: playerSettings.mouseSensitivity,
  });

  const handleModelLoaded = (model: THREE.Group, gltf: any) => {
    initializeAnimations(model, gltf);
  };

  useFrame(() => {
    if (!mixer || !ref.current) return;

    const newPosition = updateMovement({
      keys,
      isRunning,
      devSpeedEnabled,
      angleRef: playerAngleRef,
      meshRef: ref,
    });

    if (newPosition) {
      updatePlayer({
        position: {
          x: newPosition.x,
          y: newPosition.y,
          z: newPosition.z,
        },
        rotation: playerAngleRef.current,
      });
    }

    updateAnimation(isMoving, isRunning, isMovingBackward);
  });

  return (
    <>
      <CameraControls
        playerRef={ref}
        angleRef={playerAngleRef}
        pitchRef={pitchRef}
      />

      <PlayerModel
        initialPosition={player.position}
        meshRef={ref}
        onModelLoaded={handleModelLoaded}
        visible={cameraMode !== 3}
      />
    </>
  );
};

export default Player;
