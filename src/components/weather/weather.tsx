import { useControls } from "leva";
import { a, useSpring } from "@react-spring/three";
import Clouds from "./clouds";

const Weather = () => {
  const { fog } = useControls({
    fog: true,
  });

  const { near } = useSpring({
    near: fog ? 1 : 150,
    config: {
      duration: 2000,
      easing: (t: number) => t * (2 - t),
    },
  });

  return (
    <>
      <a.fog attach="fog" color="white" near={near} far={150} />
      <Clouds />
    </>
  );
};

export default Weather;
