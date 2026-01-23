import { create } from "zustand";
import { ILoadedSector } from "../types/sector";
import { ILoadedVolumetricChunk } from "../types/volumetric";
import { sectorSize, heightmapResolution } from "../constants/settings";
import {
  getDensity,
  findGroundHeight,
} from "../terrain/generation/volumetric-generator";

interface TerrainState {
  // Legacy sector data (for backwards compatibility and objects)
  sectors: Map<string, ILoadedSector>;
  setSectors: (sectors: ILoadedSector[]) => void;

  // Volumetric chunk data
  volumetricChunks: Map<string, ILoadedVolumetricChunk>;
  setVolumetricChunks: (chunks: ILoadedVolumetricChunk[]) => void;

  // Whether to use volumetric terrain for height sampling
  useVolumetric: boolean;
  setUseVolumetric: (use: boolean) => void;

  // Height sampling functions
  getHeightAt: (worldX: number, worldZ: number, currentY?: number) => number;
  getHeightAtLegacy: (worldX: number, worldZ: number) => number;
}

function getSectorKey(worldX: number, worldZ: number): string {
  const sectorX = Math.floor(worldX / sectorSize) * sectorSize;
  const sectorZ = Math.floor(worldZ / sectorSize) * sectorSize;
  return `${sectorX}x${sectorZ}`;
}

function bilinearInterpolate(
  q11: number,
  q12: number,
  q21: number,
  q22: number,
  xFrac: number,
  zFrac: number,
): number {
  const r1 = q11 * (1 - xFrac) + q21 * xFrac;
  const r2 = q12 * (1 - xFrac) + q22 * xFrac;
  return r1 * (1 - zFrac) + r2 * zFrac;
}

/**
 * Find the ground height using volumetric density sampling
 * This raymarches downward to find where density crosses from positive (air) to negative (solid)
 */
function getVolumetricHeight(
  worldX: number,
  worldZ: number,
  currentY: number,
): number {
  // Use the volumetric generator's findGroundHeight function
  // Start searching from current Y position (or a reasonable height above if not provided)
  const startY = currentY + 5; // Start slightly above current position
  const maxDepth = 100; // Maximum depth to search

  const groundHeight = findGroundHeight(worldX, worldZ, startY, maxDepth);

  if (groundHeight !== null) {
    return groundHeight;
  }

  // Fallback: if no ground found, use density sampling at current position
  // This handles edge cases at world boundaries
  const density = getDensity(worldX, currentY, worldZ);
  if (density < 0) {
    // We're inside solid terrain, search upward
    for (let y = currentY; y < currentY + maxDepth; y += 0.5) {
      if (getDensity(worldX, y, worldZ) >= 0) {
        return y;
      }
    }
  }

  return currentY;
}

export const useTerrainStore = create<TerrainState>((set, get) => ({
  sectors: new Map(),
  volumetricChunks: new Map(),
  useVolumetric: true, // Default to volumetric terrain

  setSectors: (sectors: ILoadedSector[]) => {
    const sectorMap = new Map<string, ILoadedSector>();
    sectors.forEach((sector) => {
      sectorMap.set(sector.key, sector);
    });
    set({ sectors: sectorMap });
  },

  setVolumetricChunks: (chunks: ILoadedVolumetricChunk[]) => {
    const chunkMap = new Map<string, ILoadedVolumetricChunk>();
    chunks.forEach((chunk) => {
      chunkMap.set(chunk.key, chunk);
    });
    set({ volumetricChunks: chunkMap });
  },

  setUseVolumetric: (use: boolean) => {
    set({ useVolumetric: use });
  },

  // Legacy height sampling from 2D heightmap (for backwards compatibility)
  getHeightAtLegacy: (worldX: number, worldZ: number): number => {
    const { sectors } = get();
    const key = getSectorKey(worldX, worldZ);
    const sector = sectors.get(key);

    if (!sector || !sector.heightmap || sector.heightmap.length === 0) {
      return 0;
    }

    const localX = worldX - sector.worldX;
    const localZ = worldZ - sector.worldZ;

    const gridX = (localX / sectorSize) * (heightmapResolution - 1);
    const gridZ = (localZ / sectorSize) * (heightmapResolution - 1);

    const x0 = Math.floor(gridX);
    const z0 = Math.floor(gridZ);
    const x1 = Math.min(x0 + 1, heightmapResolution - 1);
    const z1 = Math.min(z0 + 1, heightmapResolution - 1);

    const clampedX0 = Math.max(0, Math.min(x0, heightmapResolution - 1));
    const clampedZ0 = Math.max(0, Math.min(z0, heightmapResolution - 1));
    const clampedX1 = Math.max(0, Math.min(x1, heightmapResolution - 1));
    const clampedZ1 = Math.max(0, Math.min(z1, heightmapResolution - 1));

    const xFrac = gridX - x0;
    const zFrac = gridZ - z0;

    const h00 = sector.heightmap[clampedZ0 * heightmapResolution + clampedX0];
    const h10 = sector.heightmap[clampedZ0 * heightmapResolution + clampedX1];
    const h01 = sector.heightmap[clampedZ1 * heightmapResolution + clampedX0];
    const h11 = sector.heightmap[clampedZ1 * heightmapResolution + clampedX1];

    return bilinearInterpolate(h00, h01, h10, h11, xFrac, zFrac);
  },

  // Main height sampling function - uses volumetric if enabled
  getHeightAt: (worldX: number, worldZ: number, currentY?: number): number => {
    const { useVolumetric } = get();

    if (useVolumetric && currentY !== undefined) {
      return getVolumetricHeight(worldX, worldZ, currentY);
    }

    // Fall back to legacy heightmap sampling
    return get().getHeightAtLegacy(worldX, worldZ);
  },
}));
