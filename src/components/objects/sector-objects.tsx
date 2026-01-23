import { memo, useMemo } from "react";
import * as THREE from "three";
import { ISectorObject, SectorObjectType } from "../../types/sector";

interface SectorObjectsProps {
  objects: ISectorObject[];
}

interface ObjectMeshProps {
  object: ISectorObject;
}

const objectColors: Record<SectorObjectType, string> = {
  tree: "#2d5a27",
  rock: "#6b6b6b",
  bush: "#3d7a35",
  grass: "#4a8c3f",
};

function TreeMesh({ object }: ObjectMeshProps) {
  const { x, y, z, scale, rotation } = object;

  return (
    <group position={[x, y, z]} rotation={[0, rotation, 0]} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 2, 8]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      {/* Foliage */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <coneGeometry args={[1, 2, 8]} />
        <meshStandardMaterial color={objectColors.tree} />
      </mesh>
      <mesh position={[0, 3.5, 0]} castShadow>
        <coneGeometry args={[0.7, 1.5, 8]} />
        <meshStandardMaterial color={objectColors.tree} />
      </mesh>
    </group>
  );
}

function RockMesh({ object }: ObjectMeshProps) {
  const { x, y, z, scale, rotation } = object;

  const geometry = useMemo(() => {
    const geom = new THREE.DodecahedronGeometry(0.5, 0);
    geom.scale(1, 0.6, 1);
    return geom;
  }, []);

  return (
    <mesh
      position={[x, y + 0.2 * scale, z]}
      rotation={[0, rotation, 0]}
      scale={scale}
      castShadow
    >
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial color={objectColors.rock} roughness={0.9} />
    </mesh>
  );
}

function BushMesh({ object }: ObjectMeshProps) {
  const { x, y, z, scale, rotation } = object;

  return (
    <group position={[x, y, z]} rotation={[0, rotation, 0]} scale={scale}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <sphereGeometry args={[0.4, 8, 6]} />
        <meshStandardMaterial color={objectColors.bush} />
      </mesh>
      <mesh position={[0.25, 0.25, 0.1]} castShadow>
        <sphereGeometry args={[0.3, 8, 6]} />
        <meshStandardMaterial color={objectColors.bush} />
      </mesh>
      <mesh position={[-0.2, 0.2, -0.15]} castShadow>
        <sphereGeometry args={[0.25, 8, 6]} />
        <meshStandardMaterial color={objectColors.bush} />
      </mesh>
    </group>
  );
}

function GrassMesh({ object }: ObjectMeshProps) {
  const { x, y, z, scale, rotation } = object;

  return (
    <group position={[x, y, z]} rotation={[0, rotation, 0]} scale={scale * 0.5}>
      {/* Simple grass blades */}
      <mesh position={[0, 0.2, 0]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[0.02, 0.4, 0.02]} />
        <meshStandardMaterial color={objectColors.grass} />
      </mesh>
      <mesh position={[0.05, 0.18, 0.02]} rotation={[0, 0.5, -0.1]}>
        <boxGeometry args={[0.02, 0.35, 0.02]} />
        <meshStandardMaterial color={objectColors.grass} />
      </mesh>
      <mesh position={[-0.04, 0.15, -0.03]} rotation={[0, -0.3, 0.15]}>
        <boxGeometry args={[0.02, 0.3, 0.02]} />
        <meshStandardMaterial color={objectColors.grass} />
      </mesh>
    </group>
  );
}

const objectComponents: Record<SectorObjectType, React.FC<ObjectMeshProps>> = {
  tree: TreeMesh,
  rock: RockMesh,
  bush: BushMesh,
  grass: GrassMesh,
};

function SectorObjects({ objects }: SectorObjectsProps) {
  if (!objects || objects.length === 0) {
    return null;
  }

  return (
    <>
      {objects.map((obj) => {
        const ObjectComponent = objectComponents[obj.type];
        return <ObjectComponent key={obj.id} object={obj} />;
      })}
    </>
  );
}

export default memo(SectorObjects);
