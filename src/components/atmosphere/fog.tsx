import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useDayNightStore } from "../../store/day-night-store";
import { useControls } from "leva";
import { fogSettings } from "../../constants/settings";

export function Fog() {
  const { scene } = useThree();
  const fogRef = useRef<THREE.Fog | null>(null);

  const getSunPosition = useDayNightStore((state) => state.getSunPosition);

  const fogConfig = useControls("Fog", {
    near: { value: fogSettings.near, min: 10, max: 500, step: 10 },
    far: { value: fogSettings.far, min: 50, max: 1500, step: 50 },
    enabled: { value: fogSettings.enabled },
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
    const { colors } = fogSettings;

    if (sunHeight < -0.1) {
      // Night - dark blue fog
      color.setRGB(colors.night.r, colors.night.g, colors.night.b);
    } else if (sunHeight < 0.1) {
      // Twilight - blend between night and sunrise/sunset
      const t = (sunHeight + 0.1) / 0.2;
      color.setRGB(
        colors.night.r + t * (colors.twilight.r - colors.night.r),
        colors.night.g + t * (colors.twilight.g - colors.night.g),
        colors.night.b + t * (colors.twilight.b - colors.night.b),
      );
    } else if (sunHeight < 0.3) {
      // Sunrise/sunset - blend to day
      const t = (sunHeight - 0.1) / 0.2;
      color.setRGB(
        colors.twilight.r + t * (colors.day.r - colors.twilight.r),
        colors.twilight.g + t * (colors.day.g - colors.twilight.g),
        colors.twilight.b + t * (colors.day.b - colors.twilight.b),
      );
    } else {
      // Day - light blue/white fog
      color.setRGB(colors.day.r, colors.day.g, colors.day.b);
    }

    fogRef.current.color = color;
  });

  return null;
}
