import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePlayerContext } from "../../store/player-context";
import { useControls } from "leva";
import { waterLevel } from "../../constants/settings";

export function WaterPlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { player } = usePlayerContext();

  const waterConfig = useControls("Water", {
    level: { value: waterLevel, min: -5, max: 5, step: 0.5 },
    opacity: { value: 0.6, min: 0, max: 1, step: 0.1 },
    color: { value: "#2980b9" },
    size: { value: 2000, min: 500, max: 5000, step: 500 },
  });

  // Keep water plane centered on player
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.x = player.position.x;
      meshRef.current.position.z = player.position.z;
    }
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, waterConfig.level, 0]}
      receiveShadow
    >
      <planeGeometry args={[waterConfig.size, waterConfig.size]} />
      <meshStandardMaterial
        color={waterConfig.color}
        transparent
        opacity={waterConfig.opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
