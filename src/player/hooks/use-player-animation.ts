import { useState, useCallback, useRef } from "react";
import * as THREE from "three";
import { ANIMATION_INDICES } from "../constants";

interface GLTFResult {
  animations: THREE.AnimationClip[];
  scene: THREE.Group;
}

export function usePlayerAnimation() {
  const [mixer, setMixer] = useState<THREE.AnimationMixer | null>(null);
  const [currentAction, setCurrentAction] =
    useState<THREE.AnimationAction | null>(null);
  const actionsRef = useRef<THREE.AnimationAction[]>([]);

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

      const actions = actionsRef.current;
      if (isMoving) {
        if (isRunning) {
          changeAction(actions[2]); // run
          actions[2].timeScale = isMovingBackward ? -1 : 1;
        } else {
          changeAction(actions[1]); // walk
          actions[1].timeScale = isMovingBackward ? -1 : 1;
        }
      } else {
        changeAction(actions[0]); // idle
      }

      mixer.update(0.016);
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
