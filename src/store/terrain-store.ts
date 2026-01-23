import { create } from "zustand";
import { ILoadedSector } from "../types/sector";
import { sectorSize, heightmapResolution } from "../constants/settings";

interface TerrainState {
  sectors: Map<string, ILoadedSector>;
  setSectors: (sectors: ILoadedSector[]) => void;
  getHeightAt: (worldX: number, worldZ: number) => number;
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

export const useTerrainStore = create<TerrainState>((set, get) => ({
  sectors: new Map(),

  setSectors: (sectors: ILoadedSector[]) => {
    const sectorMap = new Map<string, ILoadedSector>();
    sectors.forEach((sector) => {
      sectorMap.set(sector.key, sector);
    });
    set({ sectors: sectorMap });
  },

  getHeightAt: (worldX: number, worldZ: number): number => {
    const { sectors } = get();
    const key = getSectorKey(worldX, worldZ);
    const sector = sectors.get(key);

    if (!sector || !sector.heightmap || sector.heightmap.length === 0) {
      return 0; // Default height if sector not loaded
    }

    // Calculate local position within sector (0 to sectorSize)
    const localX = worldX - sector.worldX;
    const localZ = worldZ - sector.worldZ;

    // Convert to heightmap grid coordinates using ratio for precision
    const gridX = (localX / sectorSize) * (heightmapResolution - 1);
    const gridZ = (localZ / sectorSize) * (heightmapResolution - 1);

    // Get integer grid indices
    const x0 = Math.floor(gridX);
    const z0 = Math.floor(gridZ);
    const x1 = Math.min(x0 + 1, heightmapResolution - 1);
    const z1 = Math.min(z0 + 1, heightmapResolution - 1);

    // Clamp to valid range
    const clampedX0 = Math.max(0, Math.min(x0, heightmapResolution - 1));
    const clampedZ0 = Math.max(0, Math.min(z0, heightmapResolution - 1));
    const clampedX1 = Math.max(0, Math.min(x1, heightmapResolution - 1));
    const clampedZ1 = Math.max(0, Math.min(z1, heightmapResolution - 1));

    // Get fractional parts for interpolation
    const xFrac = gridX - x0;
    const zFrac = gridZ - z0;

    // Get heights at four corners (heightmap is row-major: z * width + x)
    const h00 = sector.heightmap[clampedZ0 * heightmapResolution + clampedX0];
    const h10 = sector.heightmap[clampedZ0 * heightmapResolution + clampedX1];
    const h01 = sector.heightmap[clampedZ1 * heightmapResolution + clampedX0];
    const h11 = sector.heightmap[clampedZ1 * heightmapResolution + clampedX1];

    // Bilinear interpolation for smooth height
    return bilinearInterpolate(h00, h01, h10, h11, xFrac, zFrac);
  },
}));
