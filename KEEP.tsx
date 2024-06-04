import React, { useRef, useEffect, useState } from "react";

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const AdditiveBlendingExample = () => {
  const ref = useRef();

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load("../../models/Xbot.glb", (gltf) => {
      const model = gltf.scene;

      const mixer = new THREE.AnimationMixer(model);
      const idleAction = mixer.clipAction(gltf.animations[0]);
      const walkAction = mixer.clipAction(gltf.animations[1]);
      const runAction = mixer.clipAction(gltf.animations[2]);

      idleAction.play();

      let currentAction = idleAction;
      const actions = [idleAction, walkAction, runAction];

      actions.forEach((action) => {
        action.loop = THREE.LoopRepeat;
        action.clampWhenFinished = true;
      });

      const changeAction = (toAction) => {
        if (toAction !== currentAction) {
          currentAction.fadeOut(0.5);
          toAction.reset().fadeIn(0.5).play();
          currentAction = toAction;
        }
      };

      const clock = new THREE.Clock();
      const animate = () => {
        requestAnimationFrame(animate);
        mixer.update(clock.getDelta());
      };
      animate();
    });
  }, []);

  return <mesh ref={ref}>;
    };

    export default AdditiveBlendingExample;
