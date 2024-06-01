import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { AnimationMixer, Clock } from "three";

const Player = () => {
  const group = useRef();
  const clock = new Clock();
  const [model, setModel] = useState();
  const [mixer, setMixer] = useState();
  const [position, setPosition] = useState([0, 0, 0]);

  // Load the FBX model
  useEffect(() => {
    const loader = new FBXLoader();

    loader.load(["../../models/bot.fbx"], (fbx) => {
      fbx.scale.set(0.01, 0.01, 0.01);
      setModel(fbx);
      const animMixer = new AnimationMixer(fbx);
      setMixer(animMixer);
      const action = animMixer.clipAction(fbx.animations[2]);
      action.play();
    });
  }, []);

  // Handle gamepad input
  useEffect(() => {
    const handleGamepadInput = () => {
      const gamepads = navigator.getGamepads();
      if (!gamepads[0]) return;

      const gp = gamepads[0];
      const x = gp.axes[0];
      const y = gp.axes[1];

      const speed = 0.1;
      setPosition(([px, py, pz]) => [px + x * speed, py, pz + y * speed]);

      requestAnimationFrame(handleGamepadInput);
    };

    window.addEventListener("gamepadconnected", handleGamepadInput);
    return () =>
      window.removeEventListener("gamepadconnected", handleGamepadInput);
  }, []);

  useFrame(() => {
    if (mixer) mixer.update(clock.getDelta());
    if (model) model.position.set(...position);
  });

  return model ? <primitive ref={group} object={model} /> : null;
};

export default Player;
