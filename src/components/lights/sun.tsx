import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useDayNightStore } from "../../store/day-night-store";
import { sunSettings, ambientLightSettings } from "../../constants/settings";

const Sun = () => {
  const sunLightRef = useRef<THREE.DirectionalLight>(null);
  const sunMeshRef = useRef<THREE.Mesh>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);

  const getSunPosition = useDayNightStore((state) => state.getSunPosition);
  const getSunIntensity = useDayNightStore((state) => state.getSunIntensity);
  const getAmbientIntensity = useDayNightStore(
    (state) => state.getAmbientIntensity,
  );

  useFrame(() => {
    const position = getSunPosition();
    const sunIntensity = getSunIntensity();
    const ambientIntensity = getAmbientIntensity();

    if (sunLightRef.current) {
      sunLightRef.current.position.set(position.x, position.y, position.z);
      sunLightRef.current.intensity = sunIntensity;

      // Warm color at sunrise/sunset, white at noon
      const sunHeight = position.y / sunSettings.orbitRadius;
      if (sunHeight > 0 && sunHeight < 0.3) {
        // Sunrise/sunset - warm orange color
        const warmth = 1 - sunHeight / 0.3;
        sunLightRef.current.color.setRGB(
          1,
          0.9 - warmth * 0.3,
          0.7 - warmth * 0.4,
        );
      } else {
        // Daytime - warm white
        sunLightRef.current.color.setRGB(1, 0.95, 0.9);
      }
    }

    if (sunMeshRef.current) {
      sunMeshRef.current.position.set(position.x, position.y, position.z);
      // Only show sun when above horizon
      sunMeshRef.current.visible = position.y > -20;
    }

    if (ambientRef.current) {
      ambientRef.current.intensity = ambientIntensity;

      // Ambient color changes with time
      const { colors } = ambientLightSettings;
      const sunHeight = position.y / sunSettings.orbitRadius;
      if (sunHeight < 0) {
        // Night - blue tint
        ambientRef.current.color.setRGB(
          colors.night.r,
          colors.night.g,
          colors.night.b,
        );
      } else if (sunHeight < 0.2) {
        // Twilight - blend
        const t = sunHeight / 0.2;
        ambientRef.current.color.setRGB(
          colors.night.r + t * (colors.day.r - colors.night.r),
          colors.night.g + t * (colors.day.g - colors.night.g),
          colors.night.b + t * (colors.day.b - colors.night.b),
        );
      } else {
        // Day - neutral
        ambientRef.current.color.setRGB(
          colors.day.r,
          colors.day.g,
          colors.day.b,
        );
      }
    }
  });

  return (
    <>
      {/* Ambient light for overall scene illumination */}
      <ambientLight
        ref={ambientRef}
        intensity={ambientLightSettings.intensityDay}
      />

      {/* Sun sphere (visual) */}
      <mesh ref={sunMeshRef}>
        <sphereGeometry args={[sunSettings.visualSize, 32, 32]} />
        <meshBasicMaterial color={sunSettings.color} />
      </mesh>

      {/* Sun directional light */}
      <directionalLight
        ref={sunLightRef}
        castShadow
        shadow-mapSize-width={sunSettings.shadow.mapSize}
        shadow-mapSize-height={sunSettings.shadow.mapSize}
        shadow-camera-far={sunSettings.shadow.cameraFar}
        shadow-camera-left={-sunSettings.shadow.cameraBounds}
        shadow-camera-right={sunSettings.shadow.cameraBounds}
        shadow-camera-top={sunSettings.shadow.cameraBounds}
        shadow-camera-bottom={-sunSettings.shadow.cameraBounds}
        shadow-bias={sunSettings.shadow.bias}
      />
    </>
  );
};

export default Sun;
