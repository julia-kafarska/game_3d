import { useState, useCallback, useRef } from "react";
import * as THREE from "three";
import { ANIMATION_INDICES } from "../constants";
import { playerSettings } from "../../constants/settings";

interface GLTFResult {
  animations: THREE.AnimationClip[];
  scene: THREE.Group;
}

export function usePlayerAnimation() {
  const [mixer, setMixer] = useState<THREE.AnimationMixer | null>(null);
  const [currentAction, setCurrentAction] =
    useState<THREE.AnimationAction | null>(null);
  const actionsRef = useRef<THREE.AnimationAction[]>([]);
  const lastTimeRef = useRef<number>(performance.now());

  const initializeAnimations = useCallback(
    (model: THREE.Group, gltf: GLTFResult): THREE.AnimationMixer => {
      const newMixer = new THREE.AnimationMixer(model);

      const idleAction = newMixer.clipAction(
        gltf.animations[ANIMATION_INDICES.IDLE],
      );
      const walkAction = newMixer.clipAction(
        gltf.animations[ANIMATION_INDICES.WALK],
      );
      const runAction = newMixer.clipAction(
        gltf.animations[ANIMATION_INDICES.RUN],
      );

      [idleAction, walkAction, runAction].forEach((action) => {
        action.loop = THREE.LoopRepeat;
        action.clampWhenFinished = true;
      });

      actionsRef.current = [idleAction, walkAction, runAction];

      idleAction.play();
      newMixer.update(0);

      setMixer(newMixer);
      setCurrentAction(idleAction);

      return newMixer;
    },
    [],
  );

  const changeAction = useCallback(
    (toAction: THREE.AnimationAction) => {
      if (toAction !== currentAction) {
        currentAction?.fadeOut(0.2);
        toAction.reset().fadeIn(0.2).play();
        setCurrentAction(toAction);
      }
    },
    [currentAction],
  );

  const updateAnimation = useCallback(
    (
      isMoving: boolean,
      isRunning: boolean,
      isMovingBackward: boolean = false,
    ) => {
      if (!mixer || actionsRef.current.length === 0) return;

      // Calculate delta time for smooth animation
      const now = performance.now();
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      const actions = actionsRef.current;

      if (isMoving) {
        if (isRunning) {
          changeAction(actions[2]); // run
          const direction = isMovingBackward ? -1 : 1;
          actions[2].timeScale = direction * playerSettings.runAnimationSpeed;
        } else {
          changeAction(actions[1]); // walk
          const direction = isMovingBackward ? -1 : 1;
          actions[1].timeScale = direction * playerSettings.walkAnimationSpeed;
        }
      } else {
        changeAction(actions[0]); // idle
      }

      mixer.update(delta);
    },
    [mixer, changeAction],
  );

  return {
    mixer,
    currentAction,
    initializeAnimations,
    updateAnimation,
  };
}
