import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useDayNightStore } from "../../store/day-night-store";

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
      const sunHeight = position.y / 200;
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
      const sunHeight = position.y / 200;
      if (sunHeight < 0) {
        // Night - blue tint
        ambientRef.current.color.setRGB(0.4, 0.5, 0.7);
      } else if (sunHeight < 0.2) {
        // Twilight - purple/orange tint
        const t = sunHeight / 0.2;
        ambientRef.current.color.setRGB(
          0.6 + t * 0.4,
          0.5 + t * 0.4,
          0.6 + t * 0.3,
        );
      } else {
        // Day - neutral
        ambientRef.current.color.setRGB(1, 1, 1);
      }
    }
  });

  return (
    <>
      {/* Ambient light for overall scene illumination */}
      <ambientLight ref={ambientRef} intensity={0.5} />

      {/* Sun sphere (visual) */}
      <mesh ref={sunMeshRef}>
        <sphereGeometry args={[15, 32, 32]} />
        <meshBasicMaterial color="#fff5e0" />
      </mesh>

      {/* Sun directional light */}
      <directionalLight
        ref={sunLightRef}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={500}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
        shadow-bias={-0.0001}
      />
    </>
  );
};

export default Sun;
