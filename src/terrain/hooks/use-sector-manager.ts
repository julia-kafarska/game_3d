import { useState, useEffect, useCallback, useRef } from "react";
import { ILoadedSector, ISectorCoord } from "../../types/sector";
import { getSector, saveSector } from "../db/terrain-db";
import {
  generateSector,
  parseSectorKey,
} from "../generation/terrain-generator";
import { generateSectorObjects } from "../generation/object-generator";
import {
  sectorSize,
  loadDistance,
  unloadDistance,
} from "../../constants/settings";
import { useTerrainStore } from "../../store/terrain-store";

interface UseSectorManagerOptions {
  playerX: number;
  playerZ: number;
}

function getSectorCoordFromPosition(
  worldX: number,
  worldZ: number,
): ISectorCoord {
  return {
    x: Math.floor(worldX / sectorSize) * sectorSize,
    z: Math.floor(worldZ / sectorSize) * sectorSize,
  };
}

function getNearbySectorKeys(
  centerX: number,
  centerZ: number,
  distance: number,
): string[] {
  const keys: string[] = [];

  for (let dx = -distance; dx <= distance; dx++) {
    for (let dz = -distance; dz <= distance; dz++) {
      const sectorX = centerX + dx * sectorSize;
      const sectorZ = centerZ + dz * sectorSize;
      keys.push(`${sectorX}x${sectorZ}`);
    }
  }

  return keys;
}

function sectorDistance(
  sectorKey: string,
  centerX: number,
  centerZ: number,
): number {
  const { x, z } = parseSectorKey(sectorKey);
  const dx = Math.abs(x - centerX) / sectorSize;
  const dz = Math.abs(z - centerZ) / sectorSize;
  return Math.max(dx, dz);
}

export function useSectorManager({
  playerX,
  playerZ,
}: UseSectorManagerOptions) {
  const [loadedSectors, setLoadedSectors] = useState<
    Map<string, ILoadedSector>
  >(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const loadingRef = useRef<Set<string>>(new Set());
  const setSectors = useTerrainStore((state) => state.setSectors);

  const loadOrGenerateSector = useCallback(
    async (sectorX: number, sectorZ: number): Promise<ILoadedSector | null> => {
      const key = `${sectorX}x${sectorZ}`;

      // Skip if already loading
      if (loadingRef.current.has(key)) {
        return null;
      }

      loadingRef.current.add(key);

      try {
        // Try to load from IndexedDB first
        let sector = await getSector(key);

        // Generate if not found
        if (!sector) {
          sector = generateSector(sectorX, sectorZ);
          await saveSector(sector);
        } else if (!sector.objects) {
          // Migrate old sectors: generate objects if missing
          sector.objects = generateSectorObjects(
            sectorX,
            sectorZ,
            sector.heightmap,
            sector.biome,
          );
          await saveSector(sector);
        }

        const loadedSector: ILoadedSector = {
          ...sector,
          worldX: sectorX,
          worldZ: sectorZ,
        };

        return loadedSector;
      } catch (error) {
        console.error(`Failed to load/generate sector ${key}:`, error);
        return null;
      } finally {
        loadingRef.current.delete(key);
      }
    },
    [],
  );

  // Load sectors based on player position
  useEffect(() => {
    const currentSector = getSectorCoordFromPosition(playerX, playerZ);
    const requiredKeys = getNearbySectorKeys(
      currentSector.x,
      currentSector.z,
      loadDistance,
    );

    // Find sectors that need to be loaded
    const sectorsToLoad = requiredKeys.filter(
      (key) => !loadedSectors.has(key) && !loadingRef.current.has(key),
    );

    // Find sectors that should be unloaded
    const sectorsToUnload = Array.from(loadedSectors.keys()).filter((key) => {
      const distance = sectorDistance(key, currentSector.x, currentSector.z);
      return distance > unloadDistance;
    });

    // Unload distant sectors
    if (sectorsToUnload.length > 0) {
      setLoadedSectors((prev) => {
        const next = new Map(prev);
        sectorsToUnload.forEach((key) => next.delete(key));
        return next;
      });
    }

    // Load new sectors
    if (sectorsToLoad.length > 0) {
      setIsLoading(true);

      Promise.all(
        sectorsToLoad.map((key) => {
          const { x, z } = parseSectorKey(key);
          return loadOrGenerateSector(x, z);
        }),
      ).then((newSectors) => {
        setLoadedSectors((prev) => {
          const next = new Map(prev);
          newSectors.forEach((sector) => {
            if (sector) {
              next.set(sector.key, sector);
            }
          });
          return next;
        });
        setIsLoading(false);
      });
    } else if (isLoading && loadingRef.current.size === 0) {
      setIsLoading(false);
    }
  }, [playerX, playerZ, loadedSectors, loadOrGenerateSector, isLoading]);

  // Sync loaded sectors to terrain store for height sampling
  useEffect(() => {
    setSectors(Array.from(loadedSectors.values()));
  }, [loadedSectors, setSectors]);

  return {
    sectors: Array.from(loadedSectors.values()),
    isLoading,
  };
}
