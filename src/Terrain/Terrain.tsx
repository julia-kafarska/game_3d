import { useLoader } from "@react-three/fiber";
import * as THREE from "three";

import { ITerrain } from "../Interfaces/Terrain.ts";
import { TextureLoader, Vector3 } from "three";
import { useState } from "react";
import { useBox, usePlane } from "@react-three/cannon";

const initVector = new Vector3(0, 100, 0);
const Terrain = ({ onLeftClick }: ITerrain) => {
  const [ref] = usePlane(() => ({
    type: "Static",
    position: [0, -0.5, 0],
    rotation: [Math.PI * -0.5, 0, 0],
  }));
  const [hovered, setHover] = useState<Vector3>(initVector);
  const [colorMap, normalMap, roughnessMap] = useLoader(TextureLoader, [
    "../../textures/pavingStones/PavingStones139_1K-JPG/PavingStones139_1K-JPG_Color.jpg",
    "../../textures/pavingStones/PavingStones139_1K-JPG/PavingStones139_1K-JPG_NormalGL.jpg",
    "../../textures/pavingStones/PavingStones139_1K-JPG/PavingStones139_1K-JPG_Roughness.jpg",
  ]);
  if (colorMap && normalMap && roughnessMap) {
    colorMap.wrapS = colorMap.wrapT = THREE.RepeatWrapping;
    normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
    colorMap.repeat.set(10, 10); // Repeat the texture 4 times in both the horizontal and vertical directions
    normalMap.repeat.set(10, 10); // Repeat the texture 4 times in both the horizontal and vertical directions
    roughnessMap.repeat.set(10, 10); // Repeat the texture 4 times in both the horizontal and vertical directions
  }

  return (
    <>
      <mesh position={hovered}>
        <boxGeometry attach="geometry" args={[1, 0.1, 1]} />
        <meshBasicMaterial color={"red"} />
      </mesh>
      <mesh
        ref={ref}
        receiveShadow
        onPointerMove={(e) => {
          setHover(
            new Vector3(Math.round(e.point.x), -0.5, Math.round(e.point.z)),
          );
        }}
        onPointerOut={() => {
          setHover(initVector);
        }}
        onClick={(e) => {
          onLeftClick({
            x: Math.round(e.point.x),
            y: 0,
            z: Math.round(e.point.z),
            action: "1",
          });
          setHover(initVector);
        }}
      >
        <planeGeometry args={[250, 250]} />
        <meshStandardMaterial
          map={colorMap}
          normalMap={normalMap}
          roughnessMap={roughnessMap}
        />
      </mesh>
    </>
  );
};

export default Terrain;
