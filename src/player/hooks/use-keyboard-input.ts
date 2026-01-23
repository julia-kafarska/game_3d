import { useEffect, useState } from "react";
import { useDevStore } from "../../store/dev-store";
import { useCameraStore } from "../../store/camera-store";
import { useStatsStore } from "../../store/stats-store";
import { cameraSettings, statsSettings } from "../../constants/settings";

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
  const cycleMode = useCameraStore((state) => state.cycleMode);
  const setMode = useCameraStore((state) => state.setMode);
  const toggleStats = useStatsStore((state) => state.toggleVisible);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code in initialKeyState) {
        setKeys((prev) => ({ ...prev, [e.code]: true }));
      }
      // Toggle dev speed with 'P' key
      if (e.code === "KeyP") {
        toggleDevSpeed();
      }
      // Cycle camera mode with configured key (default 'V')
      if (e.code === cameraSettings.toggleKey) {
        cycleMode();
      }
      // Direct camera mode selection with 1, 2, 3 keys
      if (e.code === "Digit1") {
        setMode(1);
      }
      if (e.code === "Digit2") {
        setMode(2);
      }
      if (e.code === "Digit3") {
        setMode(3);
      }
      // Toggle performance stats with F key
      if (e.code === statsSettings.toggleKey) {
        toggleStats();
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
  }, [toggleDevSpeed, cycleMode, setMode, toggleStats]);

  const cameraMode = useCameraStore((state) => state.mode);
  const isMoving = keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD;
  const isRunning = keys.ShiftLeft;
  const isMovingBackward = keys.KeyS && !keys.KeyW;
  const devSpeedEnabled = speedMultiplier > 1;

  return {
    keys,
    isMoving,
    isRunning,
    isMovingBackward,
    devSpeedEnabled,
    cameraMode,
  };
}
