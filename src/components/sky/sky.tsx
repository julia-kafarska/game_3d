import { Sky as DreiSky, Stars } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useDayNightStore } from "../../store/day-night-store";
import { useControls } from "leva";
import { useMemo } from "react";

export function Sky() {
  const { cycleSpeed, isPaused, setCycleSpeed, togglePause } =
    useDayNightStore();
  const timeOfDay = useDayNightStore((state) => state.timeOfDay);
  const tick = useDayNightStore((state) => state.tick);
  const getSunPosition = useDayNightStore((state) => state.getSunPosition);

  useControls("Day/Night Cycle", {
    speed: {
      value: cycleSpeed,
      min: 0,
      max: 100,
      step: 1,
      onChange: (v) => setCycleSpeed(v),
    },
    paused: {
      value: isPaused,
      onChange: () => togglePause(),
    },
    timeOfDay: {
      value: timeOfDay,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => useDayNightStore.getState().setTimeOfDay(v),
    },
  });

  // Update time each frame
  useFrame((_, delta) => {
    tick(delta);
  });

  const sunPosition = getSunPosition();

  // Calculate sky parameters based on time of day
  const skyParams = useMemo(() => {
    const sunHeight = sunPosition.y / 200; // Normalized sun height (-1 to 1)

    // Turbidity: hazier at sunrise/sunset
    let turbidity = 8;
    if (sunHeight > -0.1 && sunHeight < 0.3) {
      turbidity = 10; // More haze at sunrise/sunset
    }

    // Rayleigh scattering: affects blue color
    let rayleigh = 2;
    if (sunHeight < 0) {
      rayleigh = 0.5; // Less blue at night
    } else if (sunHeight < 0.2) {
      rayleigh = 1 + sunHeight * 5; // Transition
    }

    // Mie scattering: sun glow
    const mieCoefficient = sunHeight > 0 ? 0.005 : 0.001;
    const mieDirectionalG = 0.8;

    return { turbidity, rayleigh, mieCoefficient, mieDirectionalG };
  }, [sunPosition.y]);

  // Stars fade based on sun position
  const starsFade = useMemo(() => {
    const sunHeight = sunPosition.y / 200;
    if (sunHeight > 0.1) return 0; // No stars during day
    if (sunHeight < -0.1) return 1; // Full stars at night
    // Fade stars during twilight
    return 1 - (sunHeight + 0.1) / 0.2;
  }, [sunPosition.y]);

  return (
    <>
      <DreiSky
        distance={450000}
        sunPosition={[
          sunPosition.x,
          Math.max(sunPosition.y, -50),
          sunPosition.z,
        ]}
        turbidity={skyParams.turbidity}
        rayleigh={skyParams.rayleigh}
        mieCoefficient={skyParams.mieCoefficient}
        mieDirectionalG={skyParams.mieDirectionalG}
      />
      {starsFade > 0 && (
        <Stars
          radius={300}
          depth={100}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={0.5}
        />
      )}
    </>
  );
}
