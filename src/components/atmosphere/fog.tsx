import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useDayNightStore } from "../../store/day-night-store";
import { useControls } from "leva";

export function Fog() {
  const { scene } = useThree();
  const fogRef = useRef<THREE.Fog | null>(null);

  const getSunPosition = useDayNightStore((state) => state.getSunPosition);

  const fogConfig = useControls("Fog", {
    near: { value: 200, min: 50, max: 500, step: 25 },
    far: { value: 600, min: 300, max: 1500, step: 50 },
    enabled: { value: true },
  });

  useEffect(() => {
    if (fogConfig.enabled) {
      fogRef.current = new THREE.Fog("#87CEEB", fogConfig.near, fogConfig.far);
      scene.fog = fogRef.current;
    } else {
      scene.fog = null;
    }

    return () => {
      scene.fog = null;
    };
  }, [scene, fogConfig.enabled]);

  useEffect(() => {
    if (fogRef.current) {
      fogRef.current.near = fogConfig.near;
      fogRef.current.far = fogConfig.far;
    }
  }, [fogConfig.near, fogConfig.far]);

  useFrame(() => {
    if (!fogRef.current || !fogConfig.enabled) return;

    const sunPosition = getSunPosition();
    const sunHeight = sunPosition.y / 200; // Normalized -1 to 1

    // Fog color changes with time of day
    const color = new THREE.Color();

    if (sunHeight < -0.1) {
      // Night - dark blue fog
      color.setRGB(0.05, 0.08, 0.15);
    } else if (sunHeight < 0.1) {
      // Twilight - blend between night and sunrise/sunset
      const t = (sunHeight + 0.1) / 0.2;
      color.setRGB(
        0.05 + t * 0.55, // 0.05 -> 0.6
        0.08 + t * 0.32, // 0.08 -> 0.4
        0.15 + t * 0.25, // 0.15 -> 0.4
      );
    } else if (sunHeight < 0.3) {
      // Sunrise/sunset - orange/pink fog
      const t = (sunHeight - 0.1) / 0.2;
      color.setRGB(
        0.6 + t * 0.27, // 0.6 -> 0.87
        0.4 + t * 0.41, // 0.4 -> 0.81
        0.4 + t * 0.47, // 0.4 -> 0.87
      );
    } else {
      // Day - light blue/white fog
      color.setRGB(0.87, 0.81, 0.87);
    }

    fogRef.current.color = color;
  });

  return null;
}
