import { useMemo } from "react";
import * as THREE from "three";
import { useTerrainStore } from "../../store/terrain-store";
import { hoverIndicatorSettings } from "../../constants/settings";

interface HoverIndicatorProps {
  position: [number, number, number];
  size?: number;
  resolution?: number;
  heightOffset?: number;
  color?: string;
  opacity?: number;
}

export function HoverIndicator({
  position,
  size = hoverIndicatorSettings.size,
  resolution = hoverIndicatorSettings.resolution,
  heightOffset = hoverIndicatorSettings.heightOffset,
  color = hoverIndicatorSettings.color,
  opacity = hoverIndicatorSettings.opacity,
}: HoverIndicatorProps) {
  const getHeightAt = useTerrainStore((state) => state.getHeightAt);

  const geometry = useMemo(() => {
    const [centerX, , centerZ] = position;

    // Create a plane geometry with enough segments to conform to terrain
    const geo = new THREE.PlaneGeometry(size, size, resolution, resolution);

    // Rotate to be horizontal (plane is vertical by default)
    geo.rotateX(-Math.PI / 2);

    // Get the position attribute
    const positionAttr = geo.attributes.position;
    const vertices = positionAttr.array as Float32Array;

    // Sample terrain height at each vertex and adjust Y position
    // Vertices are in local space (-halfSize to +halfSize), we sample at world position
    for (let i = 0; i < positionAttr.count; i++) {
      const localX = vertices[i * 3];
      const localZ = vertices[i * 3 + 2];

      // Convert to world position for height sampling
      const worldX = localX + centerX;
      const worldZ = localZ + centerZ;

      // Sample terrain height at this point
      const terrainHeight = getHeightAt(worldX, worldZ);

      // Set the Y position to terrain height + small offset
      vertices[i * 3 + 1] = terrainHeight + heightOffset;
    }

    positionAttr.needsUpdate = true;
    geo.computeVertexNormals();

    return geo;
  }, [position, size, resolution, heightOffset, getHeightAt]);

  const [centerX, , centerZ] = position;

  return (
    <mesh geometry={geometry} position={[centerX, 0, centerZ]}>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
