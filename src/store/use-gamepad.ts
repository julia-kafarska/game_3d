import { useEffect, useState } from "react";

export const buttonMapping = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  SELECT: 8,
  START: 9,
  L_STICK: 10,
  R_STICK: 11,
  D_UP: 12,
  D_DOWN: 13,
  D_LEFT: 14,
  D_RIGHT: 15,
} as const;

export const axisMapping = {
  L_STICK_X: 0,
  L_STICK_Y: 1,
  R_STICK_X: 2,
  R_STICK_Y: 3,
} as const;

export const useGamepad = () => {
  const [gamepad, setGamepad] = useState<Gamepad | null>(null);

  useEffect(() => {
    const connectHandler = (event: GamepadEvent) => {
      setGamepad(event.gamepad);
    };

    const disconnectHandler = () => {
      setGamepad(null);
    };

    const pollGamepad = () => {
      if (gamepad) {
        const gp = navigator.getGamepads()[gamepad.index];
        if (gp) {
          setGamepad(gp);
        }
      }
    };

    window.addEventListener("gamepadconnected", connectHandler);
    window.addEventListener("gamepaddisconnected", disconnectHandler);

    const interval = setInterval(pollGamepad, 100);

    return () => {
      window.removeEventListener("gamepadconnected", connectHandler);
      window.removeEventListener("gamepaddisconnected", disconnectHandler);
      clearInterval(interval);
    };
  }, [gamepad]);

  return gamepad;
};
