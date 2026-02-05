/**
 * Volumetric terrain generator
 * Combines terrain height with cave carving to create density field
 */

import { IVolumetricChunk, IMeshData } from "../../types/volumetric";
import { generateMarchingCubesMesh, chunkHasSurface } from "./marching-cubes";
import { getCaveDensity, CaveConfig } from "./cave-generator";
import { getTerrainHeight, getTerrainColor } from "./terrain-generator";
import { volumetricSettings } from "../../constants/settings";

/**
 * Get chunk key from chunk coordinates
 */
export function getChunkKey(
  chunkX: number,
  chunkY: number,
  chunkZ: number,
): string {
  return `${chunkX}_${chunkY}_${chunkZ}`;
}

/**
 * Parse chunk key back to coordinates
 */
export function parseChunkKey(key: string): {
  x: number;
  y: number;
  z: number;
} {
  const [x, y, z] = key.split("_").map(Number);
  return { x, y, z };
}

/**
 * Get world position from chunk coordinates
 */
export function chunkToWorld(
  chunkX: number,
  chunkY: number,
  chunkZ: number,
): { worldX: number; worldY: number; worldZ: number } {
  return {
    worldX: chunkX * volumetricSettings.chunkSize,
    worldY: chunkY * volumetricSettings.chunkHeight,
    worldZ: chunkZ * volumetricSettings.chunkSize,
  };
}

/**
 * Get chunk coordinates from world position
 */
export function worldToChunk(
  worldX: number,
  worldY: number,
  worldZ: number,
): { chunkX: number; chunkY: number; chunkZ: number } {
  return {
    chunkX: Math.floor(worldX / volumetricSettings.chunkSize),
    chunkY: Math.floor(worldY / volumetricSettings.chunkHeight),
    chunkZ: Math.floor(worldZ / volumetricSettings.chunkSize),
  };
}

/**
 * Calculate density at a world position
 * Negative = solid terrain, Positive = air
 *
 * @param worldX - World X position
 * @param worldY - World Y position
 * @param worldZ - World Z position
 * @param caveConfig - Optional cave configuration
 */
export function getDensity(
  worldX: number,
  worldY: number,
  worldZ: number,
  caveConfig?: Partial<CaveConfig>,
): number {
  // Get surface height from terrain generator
  const surfaceHeight = getTerrainHeight(worldX, worldZ);

  // Base density: negative below surface (solid), positive above (air)
  // worldY - surfaceHeight: 0 at surface, negative below, positive above
  let density = worldY - surfaceHeight;

  // Apply tunnel carving if enabled
  if (volumetricSettings.caveEnabled || caveConfig?.enabled) {
    const tunnelDensity = getCaveDensity(
      worldX,
      worldY,
      worldZ,
      surfaceHeight,
      {
        enabled: volumetricSettings.caveEnabled,
        minHeight: volumetricSettings.minCaveHeight,
        maxHeight: volumetricSettings.maxCaveHeight,
        ...caveConfig,
      },
    );

    // Carving adds positive values (creates air)
    density += tunnelDensity;
  }

  return density;
}

/**
 * Generate density field for a chunk
 */
export function generateDensityField(
  chunkX: number,
  chunkY: number,
  chunkZ: number,
): Float32Array {
  const { chunkSize, chunkHeight, resolution } = volumetricSettings;

  // Calculate grid dimensions
  // Add 1 to include the edge vertices for marching cubes
  const gridSizeX = Math.ceil(chunkSize * resolution) + 1;
  const gridSizeY = Math.ceil(chunkHeight * resolution) + 1;
  const gridSizeZ = Math.ceil(chunkSize * resolution) + 1;

  const voxelSize = 1 / resolution;

  // World position of chunk corner
  const { worldX, worldY, worldZ } = chunkToWorld(chunkX, chunkY, chunkZ);

  // Create density field array
  const densityField = new Float32Array(gridSizeX * gridSizeY * gridSizeZ);

  // Sample density at each grid point
  let idx = 0;
  for (let z = 0; z < gridSizeZ; z++) {
    for (let y = 0; y < gridSizeY; y++) {
      for (let x = 0; x < gridSizeX; x++) {
        const wx = worldX + x * voxelSize;
        const wy = worldY + y * voxelSize;
        const wz = worldZ + z * voxelSize;

        densityField[idx++] = getDensity(wx, wy, wz);
      }
    }
  }

  return densityField;
}

/**
 * Generate a complete volumetric chunk with mesh
 */
export function generateVolumetricChunk(
  chunkX: number,
  chunkY: number,
  chunkZ: number,
): IVolumetricChunk {
  const key = getChunkKey(chunkX, chunkY, chunkZ);
  const { worldX, worldY, worldZ } = chunkToWorld(chunkX, chunkY, chunkZ);

  // Generate density field
  const densityField = generateDensityField(chunkX, chunkY, chunkZ);

  // Check if chunk has any surface
  const { hasSurface, isEmpty, isSolid } = chunkHasSurface(
    densityField,
    volumetricSettings.isoLevel,
  );

  let meshData: IMeshData | null = null;

  if (hasSurface) {
    const { chunkSize, chunkHeight, resolution } = volumetricSettings;

    const gridSizeX = Math.ceil(chunkSize * resolution) + 1;
    const gridSizeY = Math.ceil(chunkHeight * resolution) + 1;
    const gridSizeZ = Math.ceil(chunkSize * resolution) + 1;

    const voxelSize = 1 / resolution;

    // Generate mesh with vertex colors from terrain
    meshData = generateMarchingCubesMesh(
      densityField,
      gridSizeX,
      gridSizeY,
      gridSizeZ,
      worldX,
      worldY,
      worldZ,
      voxelSize,
      volumetricSettings.isoLevel,
      (wx, wy, wz) => getTerrainColor(wx, wy, wz),
    );
  }

  return {
    key,
    worldX,
    worldY,
    worldZ,
    densityField,
    meshData,
    isEmpty,
    isSolid,
    createdAt: Date.now(),
  };
}

/**
 * Find the ground height at a position by sampling the density field
 * This raymarches down to find where density crosses from positive to negative
 *
 * @param worldX - World X position
 * @param worldZ - World Z position
 * @param startY - Y position to start searching from
 * @param maxDepth - Maximum depth to search
 * @returns The Y height of the ground, or null if not found
 */
export function findGroundHeight(
  worldX: number,
  worldZ: number,
  startY: number,
  maxDepth: number = 200,
): number | null {
  const step = 0.25; // Finer sample step size for better precision

  let prevY = startY;
  let prevDensity = getDensity(worldX, startY, worldZ);

  // March downward
  for (let y = startY - step; y > startY - maxDepth; y -= step) {
    const density = getDensity(worldX, y, worldZ);

    // Found surface crossing (from air to solid)
    if (prevDensity >= 0 && density < 0) {
      // Binary search refinement for precise height
      let low = y;
      let high = prevY;
      for (let i = 0; i < 8; i++) {
        const mid = (low + high) / 2;
        const midDensity = getDensity(worldX, mid, worldZ);
        if (midDensity < 0) {
          low = mid;
        } else {
          high = mid;
        }
      }
      return (low + high) / 2;
    }

    prevY = y;
    prevDensity = density;
  }

  return null;
}

/**
 * Find the ceiling height at a position (for caves)
 * Raymarches up to find where density crosses from positive to negative
 *
 * @param worldX - World X position
 * @param worldZ - World Z position
 * @param startY - Y position to start searching from
 * @param maxHeight - Maximum height to search
 * @returns The Y height of the ceiling, or null if open sky
 */
export function findCeilingHeight(
  worldX: number,
  worldZ: number,
  startY: number,
  maxHeight: number = 200,
): number | null {
  const step = 0.5;

  let prevDensity = getDensity(worldX, startY, worldZ);

  // March upward
  for (let y = startY + step; y < startY + maxHeight; y += step) {
    const density = getDensity(worldX, y, worldZ);

    // Found surface crossing (from air to solid)
    if (prevDensity >= 0 && density < 0) {
      // Interpolate for more precise height
      const t = prevDensity / (prevDensity - density);
      return y - step * t;
    }

    prevDensity = density;
  }

  return null;
}

/**
 * Get all required chunk coordinates for a given player position
 */
export function getRequiredChunks(
  playerX: number,
  playerY: number,
  playerZ: number,
  loadDistanceH: number, // Horizontal load distance in chunks
  loadDistanceV: number, // Vertical load distance in chunks
): Array<{ chunkX: number; chunkY: number; chunkZ: number }> {
  const { chunkX, chunkY, chunkZ } = worldToChunk(playerX, playerY, playerZ);

  const chunks: Array<{ chunkX: number; chunkY: number; chunkZ: number }> = [];

  for (let dx = -loadDistanceH; dx <= loadDistanceH; dx++) {
    for (let dy = -loadDistanceV; dy <= loadDistanceV; dy++) {
      for (let dz = -loadDistanceH; dz <= loadDistanceH; dz++) {
        chunks.push({
          chunkX: chunkX + dx,
          chunkY: chunkY + dy,
          chunkZ: chunkZ + dz,
        });
      }
    }
  }

  return chunks;
}
