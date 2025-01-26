// MockPlayer.tsx
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { useBox } from "@react-three/cannon";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import { usePlayerContext } from "../store/player";
import { CameraControls } from "../camera/camera.tsx";

const baseSpeed = 0.022;

const MockPlayer = () => {
  const { player, updatePlayer } = usePlayerContext();

  // Setup physics box or any other R3F reference for the player
  const [ref] = useBox(() => ({
    mass: 1,
    position: [player.position.x, player.position.y, player.position.z],
  }));

  // Keep track of the player's facing angle
  const angleRef = useRef(0);

  // Model & animation state
  const [modelX, setModelX] = useState<THREE.Group | null>(null);
  const [mixer, setMixer] = useState<THREE.AnimationMixer | null>(null);
  const [currentAction, setCurrentAction] =
    useState<THREE.AnimationAction | null>(null);

  // Track WASD keys + shift
  const [keys, setKeys] = useState({
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false,
    ShiftLeft: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code in keys) {
        setKeys((prev) => ({ ...prev, [e.code]: true }));
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code in keys) {
        setKeys((prev) => ({ ...prev, [e.code]: false }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Load your model
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      "/xbot.glb", // Adjust to your model’s actual path
      (gltf) => {
        const model = gltf.scene;
        // Adjust the initial rotation if your model faces +Z or -Z
        model.rotation.y = Math.PI;
        model.position.set(
          player.position.x,
          player.position.y,
          player.position.z,
        );

        model.traverse((node: any) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });

        const newMixer = new THREE.AnimationMixer(model);

        // Indices might differ for your animations
        const idleAction = newMixer.clipAction(gltf.animations[2]);
        const walkAction = newMixer.clipAction(gltf.animations[6]);
        const runAction = newMixer.clipAction(gltf.animations[3]);

        [idleAction, walkAction, runAction].forEach((action) => {
          action.loop = THREE.LoopRepeat;
          action.clampWhenFinished = true;
        });

        idleAction.play();
        newMixer.update(0);

        setModelX(model);
        setMixer(newMixer);
        setCurrentAction(idleAction);
      },
      (progress) => {
        console.log(progress);
      },
      (error) => {
        console.error("Error loading model:", error);
      },
    );
  }, []);

  // Helper to switch animations
  const changeAction = (toAction: THREE.AnimationAction) => {
    if (toAction !== currentAction) {
      currentAction?.fadeOut(0.2);
      toAction.reset().fadeIn(0.2).play();
      setCurrentAction(toAction);
    }
  };

  useFrame(() => {
    if (!mixer || !ref.current) return;

    // Determine speed (walking vs running)
    const isRunning = keys.ShiftLeft;
    const speed = isRunning ? baseSpeed * 3 : baseSpeed;

    // Rotate with A/D
    if (keys.KeyA) {
      angleRef.current += 0.02;
    }
    if (keys.KeyD) {
      angleRef.current -= 0.02;
    }
    ref.current.rotation.y = angleRef.current + Math.PI;

    // Move forward/back (W/S) according to angleRef
    const forwardDir = new THREE.Vector3(0, 0, -1);
    forwardDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleRef.current);

    const currentPosition = ref.current.position;
    if (keys.KeyW) {
      currentPosition.addScaledVector(forwardDir, speed);
    }
    if (keys.KeyS) {
      currentPosition.addScaledVector(forwardDir, -speed);
    }

    // Update your store or any state
    updatePlayer({
      position: {
        x: currentPosition.x,
        y: currentPosition.y,
        z: currentPosition.z,
      },
    });

    // Decide which animation to use
    const anyMovement = keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD;
    if (anyMovement) {
      // If SHIFT is down, run. Otherwise, walk
      if (isRunning) {
        changeAction(mixer._actions[2]); // run
      } else {
        changeAction(mixer._actions[1]); // walk
      }
    } else {
      changeAction(mixer._actions[0]); // idle
    }

    // Update animations
    mixer.update(0.016);
  });

  return (
    <>
      {/* Camera logic is now in a separate component */}
      <CameraControls
        playerRef={ref}
        angleRef={angleRef}
        offsetBehind={6} // Adjust how far behind the character the camera sits
        offsetUp={3} // Adjust how high above the character the camera is
      />

      {/* Debug HUD (optional) */}
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
          {`x: ${Math.round(player.position.x)}, z: ${Math.round(
            player.position.z,
          )}`}
        </div>
      </Html>

      {/* Render the loaded model */}
      {modelX && (
        <mesh>
          <primitive object={modelX} ref={ref} />
        </mesh>
      )}
    </>
  );
};

export default MockPlayer;
