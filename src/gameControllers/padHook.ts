import { useEffect, useState } from "react";
export const buttonMapping = {
  A: 0, // Usually the 'A' button
  B: 1, // Usually the 'B' button
  X: 2, // Usually the 'X' button
  Y: 3, // Usually the 'Y' button
  LB: 4, // Left bumper
  RB: 5, // Right bumper
  LT: 6, // Left trigger
  RT: 7, // Right trigger
  SELECT: 8, // Select button
  START: 9, // Start button
  L_STICK: 10, // Left stick press
  R_STICK: 11, // Right stick press
  D_UP: 12, // D-pad up
  D_DOWN: 13, // D-pad down
  D_LEFT: 14, // D-pad left
  D_RIGHT: 15, // D-pad right
};

export const axisMapping = {
  L_STICK_X: 0, // Left stick X-axis
  L_STICK_Y: 1, // Left stick Y-axis
  R_STICK_X: 2, // Right stick X-axis
  R_STICK_Y: 3, // Right stick Y-axis
};

export const useGamepad = () => {
  const [gamepad, setGamepad] = useState(null);

  useEffect(() => {
    const connectHandler = (event) => {
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
