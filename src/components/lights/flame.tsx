import { useRef } from "react";
import * as THREE from "three";

const FlameLight = () => {
  const lightRef = useRef<THREE.PointLight>(null);

  return (
    <pointLight
      ref={lightRef}
      color="#ff6600"
      intensity={2}
      distance={10}
      decay={2}
      position={[0, 2, 0]}
    />
  );
};

export default FlameLight;
