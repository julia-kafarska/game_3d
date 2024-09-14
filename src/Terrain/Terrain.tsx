import { useLoader } from "@react-three/fiber";
import * as THREE from "three";

import { ITerrain } from "../Interfaces/Terrain.ts";
import { TextureLoader, Vector3 } from "three";
import { useEffect, useState } from "react";
import { useParticle } from "@react-three/cannon";
import { sectorSize } from "../const/settings.ts";

const initVector = new Vector3(0, Infinity, 0);

const Terrain = ({ onLeftClick }: ITerrain) => {
  const [refParticle] = useParticle(() => ({
    position: [10, 10, 10],
  }));

  const [hovered, setHover] = useState<Vector3>(initVector);

  const [colorMap, normalMap, roughnessMap] = useLoader(TextureLoader, [
    "../../textures/pavingStones/PavingStones139_1K-JPG/PavingStones139_1K-JPG_Color.jpg",
    "../../textures/pavingStones/PavingStones139_1K-JPG/PavingStones139_1K-JPG_NormalGL.jpg",
    "../../textures/pavingStones/PavingStones139_1K-JPG/PavingStones139_1K-JPG_Roughness.jpg",
  ]);

  // Adjust texture settings
  if (colorMap && normalMap && roughnessMap) {
    colorMap.wrapS = colorMap.wrapT = THREE.RepeatWrapping;
    normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
    colorMap.repeat.set(sectorSize / 10, sectorSize / 10);
    normalMap.repeat.set(sectorSize / 10, sectorSize / 10);
    roughnessMap.repeat.set(sectorSize / 10, sectorSize / 120);
  }

  // Map data structure with neighbors
  const mapData = {
    "0x0": {
      neighbours: [
        `0x${sectorSize}`, // Above
        `${sectorSize}x${sectorSize}`, // Top-right
        `${sectorSize}x0`, // Right
        `${sectorSize}x-${sectorSize}`, // Bottom-right
        `0x-${sectorSize}`, // Below
        `-${sectorSize}x-${sectorSize}`, // Bottom-left
        `-${sectorSize}x0`, // Left
        `-${sectorSize}x${sectorSize}`, // Top-left
      ],
    },
  };

  // Helper function to parse coordinates
  const parseCoordinates = (coordString) => {
    const [x, y] = coordString.split("x").map(Number);
    return { x, y };
  };

  function Tile({ position }) {
    return (
      <mesh
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
        position={position}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[sectorSize, sectorSize]} />
        <meshStandardMaterial
          map={colorMap}
          normalMap={normalMap}
          roughnessMap={roughnessMap}
        />
      </mesh>
    );
  }

  function Map() {
    const [loadedTiles, setLoadedTiles] = useState(["0x0"]);

    // Load new tiles based on the current center tile and its neighbors
    useEffect(() => {
      const currentTile = "0x0"; // You can update this based on player movement later
      const neighbours = mapData[currentTile]?.neighbours || [];

      // Load neighboring tiles dynamically
      setLoadedTiles((prevTiles) => {
        const newTiles = new Set(prevTiles);
        neighbours.forEach((neighbor) => newTiles.add(neighbor));
        return Array.from(newTiles);
      });
    }, []);

    return (
      <>
        {loadedTiles.map((tileKey) => {
          const { x, y } = parseCoordinates(tileKey);
          return <Tile key={tileKey} position={[x, -0.5, y]} />;
        })}
      </>
    );
  }

  return (
    <>
      {/* Hovering indicator */}
      <mesh position={hovered} visible={hovered.y !== Infinity}>
        <boxGeometry attach="geometry" args={[1, 0.1, 1]} />
        <meshBasicMaterial color={"red"} transparent={true} opacity={0.3} />
      </mesh>

      <Map />

      {/* Particle for visualization */}
      <mesh ref={refParticle}>
        <meshBasicMaterial color={"red"} />
      </mesh>
    </>
  );
};

export default Terrain;
