import { useEffect, useState } from "react";
import { useDevStore } from "../../store/dev-store";

export interface KeyState {
  KeyW: boolean;
  KeyA: boolean;
  KeyS: boolean;
  KeyD: boolean;
  ShiftLeft: boolean;
}

const initialKeyState: KeyState = {
  KeyW: false,
  KeyA: false,
  KeyS: false,
  KeyD: false,
  ShiftLeft: false,
};

export function useKeyboardInput() {
  const [keys, setKeys] = useState<KeyState>(initialKeyState);
  const { speedMultiplier, toggleDevSpeed } = useDevStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code in initialKeyState) {
        setKeys((prev) => ({ ...prev, [e.code]: true }));
      }
      // Toggle dev speed with 'P' key
      if (e.code === "KeyP") {
        toggleDevSpeed();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code in initialKeyState) {
        setKeys((prev) => ({ ...prev, [e.code]: false }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [toggleDevSpeed]);

  const isMoving = keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD;
  const isRunning = keys.ShiftLeft;
  const isMovingBackward = keys.KeyS && !keys.KeyW;
  const devSpeedEnabled = speedMultiplier > 1;

  return { keys, isMoving, isRunning, isMovingBackward, devSpeedEnabled };
}
