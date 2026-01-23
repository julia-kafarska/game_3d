import { useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useRef, useState } from "react";
import { TextureLoader } from "three";
import { sectorSize, hoverIndicatorSettings } from "../../constants/settings";
import { HoverIndicator } from "./hover-indicator";
import { usePlayerContext } from "../../store/player-context";
import { useSectorManager } from "../../terrain/hooks/use-sector-manager";
import { useVolumetricManager } from "../../terrain/hooks/use-volumetric-manager";
import { VolumetricChunk } from "./volumetric-chunk";
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

  // Use volumetric manager for 3D terrain with caves
  const { chunks: volumetricChunks, isLoading: volumetricLoading } =
    useVolumetricManager({
      playerX: player.position.x,
      playerY: player.position.y,
      playerZ: player.position.z,
    });

  // Still use sector manager for objects (trees, rocks, etc.)
  const { sectors } = useSectorManager({
    playerX: player.position.x,
    playerZ: player.position.z,
  });

  const [colorMap, normalMap, roughnessMap] = useLoader(TextureLoader, [
    "../../textures/pavingStones/PavingStones139_1K-JPG/PavingStones139_1K-JPG_Color.jpg",
    "../../textures/pavingStones/PavingStones139_1K-JPG/PavingStones139_1K-JPG_NormalGL.jpg",
    "../../textures/pavingStones/PavingStones139_1K-JPG/PavingStones139_1K-JPG_Roughness.jpg",
  ]);

  const { camera, raycaster, pointer } = useThree();
  const interactableObjects = useRef<THREE.Mesh[]>([]);

  useFrame(() => {
    raycaster.setFromCamera(pointer, camera);
    raycaster.near = camera.near;
    raycaster.far = camera.far;

    const intersects = raycaster.intersectObjects(
      interactableObjects.current,
      true,
    );

    for (const intersect of intersects) {
      // Check for both sector (legacy) and volumetric chunk names
      if (
        intersect.object.name === "sector" ||
        intersect.object.name.startsWith("volumetric-chunk")
      ) {
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
      {hoverIndicatorSettings.enabled && <HoverIndicator position={hovered} />}

      {/* Render volumetric terrain chunks */}
      {volumetricChunks.map((chunk) => (
        <VolumetricChunk
          key={chunk.key}
          chunk={chunk}
          interactableObjects={interactableObjects}
        />
      ))}

      {/* Render sector objects (trees, rocks, etc.) - still from legacy sectors */}
      {sectors.map((sector) => (
        <SectorObjects key={`objects-${sector.key}`} objects={sector.objects} />
      ))}

      {/* Loading indicator could go here */}
      {volumetricLoading && (
        <mesh
          position={[
            player.position.x,
            player.position.y + 10,
            player.position.z,
          ]}
        >
          <sphereGeometry args={[0.5, 8, 8]} />
          <meshBasicMaterial color="yellow" wireframe />
        </mesh>
      )}
    </>
  );
};

export default Terrain;
