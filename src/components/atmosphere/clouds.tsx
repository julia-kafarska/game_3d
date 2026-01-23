import { Cloud, Clouds as DreiClouds } from "@react-three/drei";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useDayNightStore } from "../../store/day-night-store";
import { useControls } from "leva";
import { usePlayerContext } from "../../store/player-context";

export function Clouds() {
  const groupRef = useRef<THREE.Group>(null);
  const { player } = usePlayerContext();
  const getSunPosition = useDayNightStore((state) => state.getSunPosition);

  const cloudConfig = useControls("Clouds", {
    enabled: { value: true },
    opacity: { value: 0.8, min: 0, max: 1, step: 0.1 },
    speed: { value: 0.2, min: 0, max: 2, step: 0.1 },
    height: { value: 80, min: 30, max: 200, step: 10 },
  });

  useFrame(() => {
    if (!groupRef.current) return;

    // Move clouds with player so they're always overhead
    groupRef.current.position.x = player.position.x;
    groupRef.current.position.z = player.position.z;
  });

  if (!cloudConfig.enabled) return null;

  const sunPosition = getSunPosition();
  const sunHeight = sunPosition.y / 200;

  // Cloud color based on time of day
  let cloudColor = "#ffffff";
  if (sunHeight < -0.1) {
    cloudColor = "#1a1a2e"; // Dark night clouds
  } else if (sunHeight < 0.1) {
    cloudColor = "#4a3f55"; // Twilight purple
  } else if (sunHeight < 0.25) {
    cloudColor = "#ffb088"; // Sunrise/sunset orange
  }

  return (
    <group ref={groupRef} position={[0, cloudConfig.height, 0]}>
      <DreiClouds material={THREE.MeshBasicMaterial}>
        {/* Main cloud layer */}
        <Cloud
          seed={1}
          scale={2}
          volume={10}
          color={cloudColor}
          fade={100}
          segments={40}
          bounds={[150, 5, 150]}
          opacity={cloudConfig.opacity}
          speed={cloudConfig.speed}
        />
        <Cloud
          seed={2}
          scale={1.5}
          volume={8}
          color={cloudColor}
          fade={100}
          segments={30}
          bounds={[120, 4, 120]}
          position={[50, 10, 30]}
          opacity={cloudConfig.opacity * 0.8}
          speed={cloudConfig.speed * 0.8}
        />
        <Cloud
          seed={3}
          scale={1.8}
          volume={6}
          color={cloudColor}
          fade={80}
          segments={25}
          bounds={[100, 3, 100]}
          position={[-40, -5, -50]}
          opacity={cloudConfig.opacity * 0.9}
          speed={cloudConfig.speed * 1.2}
        />
        <Cloud
          seed={4}
          scale={1.2}
          volume={5}
          color={cloudColor}
          fade={60}
          segments={20}
          bounds={[80, 3, 80]}
          position={[70, 15, -30]}
          opacity={cloudConfig.opacity * 0.7}
          speed={cloudConfig.speed * 0.6}
        />
      </DreiClouds>
    </group>
  );
}
