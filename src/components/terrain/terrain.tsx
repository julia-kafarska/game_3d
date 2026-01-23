import { useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { TextureLoader } from "three";
import { sectorSize } from "../../constants/settings";
import { Tile } from "./tile";
import { HoverIndicator } from "./hover-indicator";
import { usePlayerContext } from "../../store/player-context";
import { useSectorManager } from "../../terrain/hooks/use-sector-manager";
import SectorObjects from "../objects/sector-objects";

interface TerrainProps {
  onLeftClick?: (params: {
    x: number;
    y: number;
    z: number;
    action: string;
  }) => void;
}

const Terrain = (_props: TerrainProps) => {
  const [hovered, setHover] = useState<[number, number, number]>([0, 0, 0]);
  const { player } = usePlayerContext();

  // Use sector manager to dynamically load/unload terrain sectors
  const { sectors } = useSectorManager({
    playerX: player.position.x,
    playerZ: player.position.z,
  });

  const [colorMap, normalMap, roughnessMap] = useLoader(TextureLoader, [
    "../../textures/pavingStones/PavingStones139_1K-JPG/PavingStones139_1K-JPG_Color.jpg",
    "../../textures/pavingStones/PavingStones139_1K-JPG/PavingStones139_1K-JPG_NormalGL.jpg",
    "../../textures/pavingStones/PavingStones139_1K-JPG/PavingStones139_1K-JPG_Roughness.jpg",
  ]);

  const { camera, raycaster, scene, pointer } = useThree();
  const interactableObjects = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    return () => {
      scene.remove(axesHelper);
    };
  }, [scene]);

  useEffect(() => {
    camera.position.set(0, 10, 10);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useFrame(() => {
    raycaster.setFromCamera(pointer, camera);
    raycaster.near = camera.near;
    raycaster.far = camera.far;

    const intersects = raycaster.intersectObjects(
      interactableObjects.current,
      true,
    );

    for (const intersect of intersects) {
      if (intersect.object.name === "sector") {
        setHover([
          Math.round(intersect.point.x),
          Math.round(intersect.point.y),
          Math.round(intersect.point.z),
        ]);
        break;
      }
    }
  });

  if (colorMap && normalMap && roughnessMap) {
    colorMap.wrapS = colorMap.wrapT = THREE.RepeatWrapping;
    normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;

    colorMap.repeat.set(sectorSize / 10, sectorSize / 10);
    normalMap.repeat.set(sectorSize / 10, sectorSize / 10);
    roughnessMap.repeat.set(sectorSize / 10, sectorSize / 120);
  }

  return (
    <>
      <HoverIndicator position={hovered} />

      {sectors.map((sector) => {
        // Position at sector center (worldX + half sector size)
        const position: [number, number, number] = [
          sector.worldX + sectorSize / 2,
          0,
          sector.worldZ + sectorSize / 2,
        ];
        return (
          <group key={sector.key}>
            <Tile
              position={position}
              colorMap={colorMap}
              normalMap={normalMap}
              roughnessMap={roughnessMap}
              interactableObjects={interactableObjects}
              heightmap={sector.heightmap}
              biome={sector.biome}
            />
            <SectorObjects objects={sector.objects} />
          </group>
        );
      })}
    </>
  );
};

export default Terrain;
