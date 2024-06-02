import { a, useSpring } from "@react-spring/three";
import { useControls } from "leva";

const Sun = () => {
  const { dayNight } = useControls({
    dayNight: true,
  });

  const { intensity } = useSpring({
    intensity: dayNight ? 0.1 : 1,
    config: {
      duration: 2000,
      easing: (t) => t * (2 - t),
    }, // 1-second duration with an ease-out effect
  });

  // setV(Math.random());
  return (
    <>
      <a.ambientLight intensity={intensity} />
      <a.directionalLight position={[0, 10, 0]} intensity={intensity} />
      <a.pointLight
        castShadow
        position={[0, 3, 1]}
        intensity={10}
        visible={dayNight}
      />
      <a.spotLight
        castShadow
        intensity={10}
        position={[0, 10, 3]}
        angle={90}
        penumbra={10}
        decay={10}
        visible={dayNight}
      />
    </>
  );
};

export default Sun;
