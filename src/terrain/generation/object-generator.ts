import { createNoise2D } from "simplex-noise";
import alea from "alea";
import { ISectorObject, SectorObjectType } from "../../types/sector";
import {
  sectorSize,
  terrainSeed,
  objectDensity,
  heightmapResolution,
  waterLevel,
  biomeDensity,
} from "../../constants/settings";

// Use different seed for object placement
const objectPrng = alea(terrainSeed + "-objects");
const objectNoise = createNoise2D(objectPrng);

// Separate noise for variety
const varietyPrng = alea(terrainSeed + "-variety");
const varietyNoise = createNoise2D(varietyPrng);

// All possible object types
const allObjectTypes: SectorObjectType[] = ["tree", "rock", "bush", "grass"];

function sampleHeightAt(
  heightmap: number[],
  localX: number,
  localZ: number,
): number {
  // Use ratio-based calculation for precision at edges
  const gridX = Math.floor((localX / sectorSize) * (heightmapResolution - 1));
  const gridZ = Math.floor((localZ / sectorSize) * (heightmapResolution - 1));

  const clampedX = Math.max(0, Math.min(gridX, heightmapResolution - 1));
  const clampedZ = Math.max(0, Math.min(gridZ, heightmapResolution - 1));

  return heightmap[clampedZ * heightmapResolution + clampedX] || 0;
}

export function generateSectorObjects(
  sectorX: number,
  sectorZ: number,
  heightmap: number[],
  biome: string,
): ISectorObject[] {
  const objects: ISectorObject[] = [];

  // Get density config for this biome, default to plains
  const densityConfig =
    biomeDensity[biome as keyof typeof biomeDensity] || biomeDensity.plains;

  // Check if any objects should spawn in this biome
  const hasAnyObjects = allObjectTypes.some((type) => densityConfig[type] > 0);
  if (!hasAnyObjects) {
    return objects;
  }

  const gridSize = Math.floor(Math.sqrt(objectDensity * 100));
  if (gridSize === 0) return objects;

  const cellSize = sectorSize / gridSize;

  for (let gx = 0; gx < gridSize; gx++) {
    for (let gz = 0; gz < gridSize; gz++) {
      // Use noise to determine if object should spawn
      const worldX = sectorX + gx * cellSize + cellSize / 2;
      const worldZ = sectorZ + gz * cellSize + cellSize / 2;

      const spawnNoise = objectNoise(worldX * 0.1, worldZ * 0.1);

      // Only spawn if noise exceeds threshold
      if (spawnNoise < 0.2) continue;

      // Add randomness to position within cell
      const offsetX = varietyNoise(worldX * 0.5, worldZ * 0.5) * cellSize * 0.4;
      const offsetZ =
        varietyNoise(worldX * 0.5 + 100, worldZ * 0.5) * cellSize * 0.4;

      const finalX = worldX + offsetX;
      const finalZ = worldZ + offsetZ;

      // Get local position for height sampling
      const localX = finalX - sectorX;
      const localZ = finalZ - sectorZ;

      // Skip if outside sector bounds
      if (
        localX < 0 ||
        localX >= sectorSize ||
        localZ < 0 ||
        localZ >= sectorSize
      ) {
        continue;
      }

      const height = sampleHeightAt(heightmap, localX, localZ);

      // Skip objects below water level
      if (height < waterLevel) {
        continue;
      }

      // Select object type based on noise and biome density
      const typeNoise =
        (varietyNoise(worldX * 0.3 + 200, worldZ * 0.3) + 1) / 2; // 0-1

      // Build weighted selection based on biome densities
      let totalWeight = 0;
      const weights: { type: SectorObjectType; weight: number }[] = [];

      for (const objType of allObjectTypes) {
        const density = densityConfig[objType];
        if (density > 0) {
          weights.push({ type: objType, weight: density });
          totalWeight += density;
        }
      }

      if (weights.length === 0 || totalWeight === 0) continue;

      // Select type based on weighted random
      let selectedType: SectorObjectType = weights[0].type;
      let accumulated = 0;
      const threshold = typeNoise * totalWeight;

      for (const { type, weight } of weights) {
        accumulated += weight;
        if (threshold <= accumulated) {
          selectedType = type;
          break;
        }
      }

      // Additional per-object density check
      const objectDensityNoise =
        (varietyNoise(worldX * 0.7 + 500, worldZ * 0.7) + 1) / 2;
      if (objectDensityNoise > densityConfig[selectedType]) {
        continue;
      }

      // Generate scale and rotation
      const scale =
        0.5 + ((varietyNoise(worldX * 0.2, worldZ * 0.2 + 300) + 1) / 2) * 1.0;
      const rotation =
        ((varietyNoise(worldX * 0.4 + 400, worldZ * 0.4) + 1) / 2) *
        Math.PI *
        2;

      objects.push({
        id: `${sectorX}x${sectorZ}-${gx}-${gz}`,
        type: selectedType,
        x: finalX,
        y: height,
        z: finalZ,
        scale,
        rotation,
      });
    }
  }

  return objects;
}
