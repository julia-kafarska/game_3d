import { Sky as DreiSky, Stars } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useDayNightStore } from "../../store/day-night-store";
import { useControls } from "leva";
import { useMemo } from "react";
import {
  skySettings,
  starsSettings,
  sunSettings,
} from "../../constants/settings";

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
    const sunHeight = sunPosition.y / sunSettings.orbitRadius; // Normalized sun height (-1 to 1)

    // Turbidity: hazier at sunrise/sunset
    let turbidity = skySettings.turbidity;
    if (sunHeight > -0.1 && sunHeight < 0.3) {
      turbidity = skySettings.turbidityTwilight; // More haze at sunrise/sunset
    }

    // Rayleigh scattering: affects blue color
    let rayleigh = skySettings.rayleigh;
    if (sunHeight < 0) {
      rayleigh = skySettings.rayleighNight; // Less blue at night
    } else if (sunHeight < 0.2) {
      rayleigh =
        skySettings.rayleighNight +
        (sunHeight * (skySettings.rayleigh - skySettings.rayleighNight)) / 0.2; // Transition
    }

    // Mie scattering: sun glow
    const mieCoefficient =
      sunHeight > 0
        ? skySettings.mieCoefficient
        : skySettings.mieCoefficientNight;
    const mieDirectionalG = skySettings.mieDirectionalG;

    return { turbidity, rayleigh, mieCoefficient, mieDirectionalG };
  }, [sunPosition.y]);

  // Stars fade based on sun position
  const starsFade = useMemo(() => {
    const sunHeight = sunPosition.y / sunSettings.orbitRadius;
    if (sunHeight > 0.1) return 0; // No stars during day
    if (sunHeight < -0.1) return 1; // Full stars at night
    // Fade stars during twilight
    return 1 - (sunHeight + 0.1) / 0.2;
  }, [sunPosition.y]);

  return (
    <>
      <DreiSky
        distance={skySettings.distance}
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
      {starsSettings.enabled && starsFade > 0 && (
        <Stars
          radius={starsSettings.radius}
          depth={starsSettings.depth}
          count={starsSettings.count}
          factor={starsSettings.factor}
          saturation={starsSettings.saturation}
          fade
          speed={starsSettings.speed}
        />
      )}
    </>
  );
}
