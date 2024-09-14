import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { useBox } from "@react-three/cannon";
import CameraControls from "../Camera/Camera.tsx";
import * as THREE from "three";
import { Html } from "@react-three/drei";

import {
  axisMapping,
  buttonMapping,
  useGamepad,
} from "../gameControllers/padHook.ts";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { mix } from "three/examples/jsm/nodes/math/MathNode";
let movementSpeed = 0.02;

const rotationSpeed = 0.05;
const MockPlayer = ({ position }) => {
  const gamepad = useGamepad();
  const [ref, api] = useBox(() => ({
    mass: 1,
    position,
  }));

  const angleRef = useRef(0); //
  const angleRef2 = useRef(3); //
  const [coord, setCoord] = useState({
    position,
  });
  const [modelX, setModelX] = useState(null);
  const [mixer, setMixer] = useState<THREE.AnimationMixer | null>(null);
  const [currentAction, setCurrentAction] = useState(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      "../../models/Xbot.glb",
      (gltf: { scene: any; animations: THREE.AnimationClip[] }) => {
        const model = gltf.scene;
        model.position.x = position[0]; // 0;
        model.position.y = position[1]; // -0.5;
        model.position.z = position[2]; // 0;
        model.traverse(function (node: {
          isMesh: any;
          castShadow: boolean;
          receiveShadow: boolean;
        }) {
          if (node.isMesh) {
            node.castShadow = true; // ensure every mesh can cast shadows
            node.receiveShadow = true; // optional if model needs to receive shadows too
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
    );
  }, []);

  useFrame(() => {
    if (mixer && gamepad) {
      const rX = gamepad.axes[axisMapping.L_STICK_X];
      const lY = gamepad.axes[axisMapping.L_STICK_Y];
      // const rX = gamepad.axes[axisMapping.R_STICK_X];
      const leftStickPress = gamepad.buttons[buttonMapping.L_STICK];

      // Get current position and rotation
      const currentPosition = ref.current.position;

      ref.current.rotation.y = angleRef.current + Math.PI;

      if (Math.abs(rX) > 0.05) {
        if (leftStickPress.pressed) {
          movementSpeed = 0.09;
        }

        let moveZ = -1;
        // Calculate new position
        const move = new THREE.Vector3(0, 0, moveZ);
        move.applyQuaternion(ref.current.quaternion); // Apply current rotation
        move.normalize();

        currentPosition.add(move.multiplyScalar(lY * movementSpeed));
      }
      // Rotate the box based on the right stick's x-axis
      // if (Math.abs(rX) > 0.1) {
      //   currentRotation.y += rX * rotationSpeed;
      // }

      setCoord({
        position: {
          ...currentPosition,
          y: currentPosition.y + 2,
        },
      });

      mixer.update(0.016); // Update the mixer with a fixed time step

      // api.position.set(currentPosition.x, currentPosition.y, currentPosition.z);
      // api.rotation.set(currentRotation.x, currentRotation.y, currentRotation.z);
    }
  });

  useEffect(() => {
    if (mixer && gamepad) {
      const rX = gamepad?.axes[axisMapping.L_STICK_X];
      const leftStickPress = gamepad.buttons[buttonMapping.L_STICK];

      if (Math.abs(rX) > 0.05) {
        if (leftStickPress.pressed) {
          changeAction(mixer._actions[1]);
        } else {
          changeAction(mixer._actions[2]);
        }
      } else {
        changeAction(mixer._actions[0]);
      }
    }
  }, [gamepad]);

  const changeAction = (toAction) => {
    if (toAction !== currentAction) {
      currentAction?.fadeOut(0.1);
      toAction.reset().fadeIn(0.1).play();
      setCurrentAction(toAction);
    }
  };

  useEffect(() => {
    const a = Math.abs(coord.position.x) >= 5;
    const b = Math.abs(coord.position.z) >= 5;
    if (a || b) {
    }
  }, [coord.position.x, coord.position.z]);

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
      {modelX && (
        <mesh>
          <primitive object={modelX} ref={ref} />
        </mesh>
      )}
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
