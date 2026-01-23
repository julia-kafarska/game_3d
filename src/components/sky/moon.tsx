import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useDayNightStore } from "../../store/day-night-store";

export function Moon() {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.DirectionalLight>(null);

  const getMoonPosition = useDayNightStore((state) => state.getMoonPosition);
  const getMoonIntensity = useDayNightStore((state) => state.getMoonIntensity);

  useFrame(() => {
    const position = getMoonPosition();
    const intensity = getMoonIntensity();

    if (meshRef.current) {
      meshRef.current.position.set(position.x, position.y, position.z);
      // Only show moon when above horizon
      meshRef.current.visible = position.y > -20;
    }

    if (lightRef.current) {
      lightRef.current.position.set(position.x, position.y, position.z);
      lightRef.current.intensity = intensity;
    }
  });

  return (
    <>
      {/* Moon sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[8, 32, 32]} />
        <meshBasicMaterial color="#f5f5dc" />
      </mesh>

      {/* Moon light - soft bluish light */}
      <directionalLight
        ref={lightRef}
        color="#b4c7dc"
        intensity={0}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={500}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
    </>
  );
}
