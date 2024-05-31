import { useControls } from "leva";
import { a, useSpring } from "@react-spring/three";
import Clouds from "./Clouds.tsx";

const Weather = () => {
  const { fog } = useControls({
    fog: true,
  });

  const { near } = useSpring({
    near: fog ? 1 : 150,
    config: {
      duration: 2000,
      easing: (t) => t * (2 - t),
    }, // 1-second duration with an ease-out effect
  });
  return (
    <>
      <a.fog attach="fog" color="white" near={near} far={150} />
      <Clouds />
    </>
  );
};

export default Weather;
