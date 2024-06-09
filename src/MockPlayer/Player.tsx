import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { useBox } from "@react-three/cannon";
import CameraControls from "../Camera/Camera.tsx";
import * as THREE from "three";
import { Html } from "@react-three/drei";

import { axisMapping, buttonMapping } from "../gameControllers/padHook.ts";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
let movementSpeed = 0.1;

const MockPlayer = ({ position, gamepad }) => {
  const [ref, api] = useBox(() => ({
    mass: 1,
    position,
  }));
  const angleRef = useRef(0); //
  const angleRef2 = useRef(3); //
  const [coord, setCoord] = useState({
    position: { x: 0, y: 0, z: 0 },
  });
  const [modelX, setModelX] = useState(null);
  const [mixer, setMixer] = useState(null);
  const [currentAction, setCurrentAction] = useState(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load("../../models/Xbot.glb", (gltf) => {
      const model = gltf.scene;

      const mixer = new THREE.AnimationMixer(model);

      const idleAction = mixer.clipAction(gltf.animations[2]);
      const walkAction = mixer.clipAction(gltf.animations[6]);
      const runAction = mixer.clipAction(gltf.animations[3]);

      idleAction.play();

      const actions = [idleAction, walkAction, runAction];
      actions.forEach((action) => {
        action.loop = THREE.LoopRepeat;
        action.clampWhenFinished = true;
      });

      setCurrentAction(idleAction);
      setModelX(model);
      setMixer(mixer);
    });
  }, []);

  useFrame(() => {
    if (mixer && gamepad) {
      const rX = gamepad.axes[axisMapping.L_STICK_X];
      const lY = gamepad.axes[axisMapping.L_STICK_Y];
      // const rX = gamepad.axes[axisMapping.R_STICK_X];
      const leftStickPress = gamepad.buttons[buttonMapping.L_STICK];
      //
      // if (Math.abs(lX) <= 0.1 || Math.abs(rX) <= 0.1) {
      //   changeAction(mixer._actions[0]);
      // }

      const rotationSpeed = 0.05;

      // Get current position and rotation
      const currentPosition = ref.current.position;

      ref.current.rotation.y = angleRef.current + Math.PI;

      if (Math.abs(lY) > 0.1) {
        if (leftStickPress.pressed) {
          movementSpeed = 0.09;
          changeAction(mixer._actions[2]);
        } else {
          movementSpeed = 0.03;
          changeAction(mixer._actions[1]);
        }
        // // Calculate new position
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(ref.current.quaternion); // Apply current rotation
        forward.normalize();

        currentPosition.add(forward.multiplyScalar(lY * movementSpeed));
      } else {
        changeAction(mixer._actions[0]);
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

  const changeAction = (toAction) => {
    if (toAction !== currentAction) {
      currentAction?.fadeOut(0.5);
      toAction.reset().fadeIn(0.5).play();
      setCurrentAction(toAction);
    }
  };

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
        <mesh castShadow receiveShadow>
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
