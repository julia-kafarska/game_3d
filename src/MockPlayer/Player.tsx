import { useFrame } from "@react-three/fiber";
import { SetStateAction, useEffect, useRef, useState } from "react";
import { useBox } from "@react-three/cannon";
import CameraControls from "../Camera/Camera.tsx";
import * as THREE from "three";
import { Html } from "@react-three/drei";

import { axisMapping, buttonMapping, useGamepad } from "../store/gamePad.ts";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// import { mix } from "three/examples/jsm/nodes/math/MathNode";
import { usePlayerContext } from "../store/player.tsx";

const movementSpeed = 0.015;
const MockPlayer = () => {
  const { player, updatePlayer } = usePlayerContext();
  const gamepad = useGamepad();
  const [ref] = useBox(() => ({
    mass: 1,
    position: [player.position.x, player.position.y, player.position.z],
  }));

  const angleRef = useRef(0); //
  const angleRef2 = useRef(3); //
  const [modelX, setModelX] = useState(null);
  const [mixer, setMixer] = useState<THREE.AnimationMixer | null>(null);
  const [currentAction, setCurrentAction] = useState(null);

  // TODO models loader
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      "http://localhost:5173/Xbot.glb",
      (gltf: { scene: any; animations: THREE.AnimationClip[] }) => {
        console.log(gltf);
        const model = gltf.scene;
        model.position.set(
          player.position.x,
          player.position.y,
          player.position.z,
        );
        model.rotation.y = Math.PI;

        model.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });

        const mixer = new THREE.AnimationMixer(model);

        const idleAction = mixer.clipAction(gltf.animations[2]);
        const walkAction = mixer.clipAction(gltf.animations[6]);
        const runAction = mixer.clipAction(gltf.animations[3]);

        const actions = [idleAction, walkAction, runAction];
        actions.forEach((action) => {
          action.loop = THREE.LoopRepeat;
          action.clampWhenFinished = true;
        });

        idleAction.play();
        mixer.update(0);
        setModelX(model);
        setMixer(mixer);
      },
      (p) => {
        console.log(p);
      },
      (error) => {
        console.error("An error occurred while loading the model:", error);
      },
    );
  }, []);

  // useFrame(() => {
  //   if (mixer && gamepad) {
  //     const rX = gamepad.axes[axisMapping.L_STICK_X];
  //     const lY = gamepad.axes[axisMapping.L_STICK_Y];
  //     // const rX = gamepad.axes[axisMapping.R_STICK_X];
  //     const leftStickPress = gamepad.buttons[buttonMapping.L_STICK];
  //
  //     // Get current position and rotation
  //     const currentPosition = ref.current.position;
  //     const currentRotation = ref.current.rotation;
  //
  //     ref.current.rotation.y = angleRef.current + Math.PI;
  //
  //     if (leftStickPress.pressed) {
  //       movementSpeed = 0.04;
  //     } else {
  //       movementSpeed = 0.015;
  //     }
  //     if (Math.abs(rX) > 0.05) {
  //       const move = new THREE.Vector3(0, 0, -1);
  //       move.applyQuaternion(ref.current.quaternion);
  //       move.normalize();
  //
  //       currentPosition.add(
  //         move.multiplyScalar(Math.round(lY) * movementSpeed),
  //       );
  //
  //       updatePlayer({
  //         position: {
  //           x: currentPosition.x,
  //           y: currentPosition.y,
  //           z: currentPosition.z,
  //         },
  //       });
  //     }
  //     mixer.update(0.016); // Update the mixer with a fixed time step
  //   }
  // });

  // useEffect(() => {
  //   if (mixer && gamepad) {
  //     const rX = gamepad?.axes[axisMapping.L_STICK_X];
  //     const leftStickPress = gamepad.buttons[buttonMapping.L_STICK];
  //
  //     if (Math.abs(rX) > 0.05) {
  //       if (leftStickPress.pressed) {
  //         changeAction(mixer._actions[1]);
  //       } else {
  //         changeAction(mixer._actions[2]);
  //       }
  //     } else {
  //       changeAction(mixer._actions[0]);
  //     }
  //   }
  // }, [gamepad]);

  // const changeAction = (toAction: SetStateAction<null>) => {
  //   if (toAction !== currentAction) {
  //     currentAction?.fadeOut(0.2);
  //     toAction.reset().fadeIn(0.2).play();
  //     setCurrentAction(toAction);
  //   }
  // };

  // useEffect(() => {
  //   const a = Math.abs(player.position.x) >= 5;
  //   const b = Math.abs(player.position.z) >= 5;
  //   if (a || b) {
  //   }
  // }, [player.position.x, player.position.z]);

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
          {player.position.x !== null
            ? `x: ${Math.round(player.position.x)} `
            : null}
          {player.position.z !== null
            ? `z: ${Math.round(player.position.z)}`
            : null}
        </div>
      </Html>
      {modelX && (
        <mesh>
          <primitive object={modelX} ref={ref} />
        </mesh>
      )}
    </>
  );
};

export default MockPlayer;
