import { createNoise2D } from "simplex-noise";
import alea from "alea";
import { ISector } from "../../types/sector";
import {
  sectorSize,
  heightmapResolution,
  terrainSeed,
  terrainAmplitude,
  terrainFrequency,
  terrainOctaves,
  terrainPersistence,
  mountainAmplitude,
  mountainFrequency,
  ridgeSharpness,
  continentalFrequency,
  continentalInfluence,
  warpStrength,
} from "../../constants/settings";
import { generateSectorObjects } from "./object-generator";

// Create seeded noise functions for reproducible terrain
const prng = alea(terrainSeed);
const noise2D = createNoise2D(prng);

// Create additional noise functions with different seeds for variety
const prng2 = alea(terrainSeed + "-warp");
const warpNoise = createNoise2D(prng2);

const prng3 = alea(terrainSeed + "-ridge");
const ridgeNoise = createNoise2D(prng3);

const prng4 = alea(terrainSeed + "-continental");
const continentalNoise = createNoise2D(prng4);

// Moisture noise for biome variety (desert vs forest)
const prng5 = alea(terrainSeed + "-moisture");
const moistureNoise = createNoise2D(prng5);

// Temperature noise for additional variation
const prng6 = alea(terrainSeed + "-temperature");
const temperatureNoise = createNoise2D(prng6);

// Basic FBM (Fractal Brownian Motion) for base terrain
function fbm(x: number, z: number): number {
  let value = 0;
  let amplitude = 1;
  let frequency = terrainFrequency;
  let maxValue = 0;

  for (let i = 0; i < terrainOctaves; i++) {
    value += amplitude * noise2D(x * frequency, z * frequency);
    maxValue += amplitude;
    amplitude *= terrainPersistence;
    frequency *= 2;
  }

  return value / maxValue;
}

// Ridged noise for mountain peaks and ridges
function ridgedNoise(x: number, z: number): number {
  let value = 0;
  let amplitude = 1;
  let frequency = mountainFrequency;
  let maxValue = 0;

  for (let i = 0; i < 5; i++) {
    // Get noise value and make it ridged
    let n = ridgeNoise(x * frequency, z * frequency);
    n = 1 - Math.abs(n); // Create ridge effect
    n = Math.pow(n, ridgeSharpness); // Sharpen the ridges

    value += amplitude * n;
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return value / maxValue;
}

// Continental noise for large-scale terrain variation
function getContinentalValue(x: number, z: number): number {
  // Very low frequency noise for continent-like shapes
  let value = continentalNoise(
    x * continentalFrequency,
    z * continentalFrequency,
  );

  // Add a second octave for more variety
  value +=
    0.5 *
    continentalNoise(
      x * continentalFrequency * 2,
      z * continentalFrequency * 2,
    );
  value /= 1.5;

  // Map from [-1, 1] to [0, 1]
  return (value + 1) * 0.5;
}

// Domain warping for more natural terrain shapes
function warpedCoords(x: number, z: number): { wx: number; wz: number } {
  const warpX = warpNoise(x * 0.01, z * 0.01) * warpStrength;
  const warpZ = warpNoise(x * 0.01 + 100, z * 0.01 + 100) * warpStrength;

  return {
    wx: x + warpX,
    wz: z + warpZ,
  };
}

// Combined terrain height function
function getTerrainHeight(x: number, z: number): number {
  // Apply domain warping for more organic shapes
  const { wx, wz } = warpedCoords(x, z);

  // Get continental value (determines if area is lowland or highland)
  const continental = getContinentalValue(x, z);

  // Base terrain using FBM
  const baseTerrain = fbm(wx, wz) * terrainAmplitude;

  // Mountain/ridge terrain
  const mountains = ridgedNoise(wx, wz) * mountainAmplitude;

  // Blend between flat and mountainous based on continental value
  // Areas with high continental value get more mountains
  const mountainBlend = Math.pow(continental, 2) * continentalInfluence;

  // Combine base terrain with mountains
  // Low continental areas are flatter (more base terrain)
  // High continental areas have mountains
  const height =
    baseTerrain * (1 - mountainBlend * 0.5) + mountains * mountainBlend;

  // Add some elevation based on continental value
  // This creates distinct highland and lowland regions
  const continentalElevation = (continental - 0.5) * 15;

  return height + continentalElevation;
}

// Get moisture value at position (0 = dry, 1 = wet)
function getMoistureValue(x: number, z: number): number {
  let value = moistureNoise(x * 0.005, z * 0.005);
  value += 0.5 * moistureNoise(x * 0.01, z * 0.01);
  value /= 1.5;
  return (value + 1) * 0.5; // Map to 0-1
}

// Get temperature value at position (0 = cold, 1 = hot)
function getTemperatureValue(x: number, z: number, height: number): number {
  let value = temperatureNoise(x * 0.004, z * 0.004);
  value = (value + 1) * 0.5; // Map to 0-1

  // Temperature decreases with altitude
  const altitudeEffect = Math.max(0, height) * 0.05;
  return Math.max(0, Math.min(1, value - altitudeEffect));
}

function determineBiome(
  avgHeight: number,
  centerX: number,
  centerZ: number,
): string {
  const moisture = getMoistureValue(centerX, centerZ);
  const temperature = getTemperatureValue(centerX, centerZ, avgHeight);

  // Water biome
  if (avgHeight < -2) {
    return "water";
  }

  // Beach - near water level
  if (avgHeight < 1) {
    return "beach";
  }

  // Very high elevation - tundra or snowy mountains
  if (avgHeight > 35) {
    return "tundra";
  }

  // High elevation - mountains
  if (avgHeight > 20) {
    return "mountains";
  }

  // Mid elevation - hills or forest hills
  if (avgHeight > 8) {
    if (moisture > 0.6) {
      return "forest";
    }
    return "hills";
  }

  // Low elevation - based on moisture and temperature
  if (moisture < 0.3 && temperature > 0.5) {
    return "desert";
  }

  if (moisture > 0.6) {
    return "forest";
  }

  if (moisture > 0.4) {
    return "plains";
  }

  // Low moisture, moderate temp - savanna/dry plains
  if (temperature > 0.4) {
    return "savanna";
  }

  return "plains";
}

export function generateSector(sectorX: number, sectorZ: number): ISector {
  const key = `${sectorX}x${sectorZ}`;
  const heightmap: number[] = [];

  // World offset for this sector
  const worldOffsetX = sectorX;
  const worldOffsetZ = sectorZ;

  let totalHeight = 0;

  // Generate heightmap grid
  // Use direct ratio calculation to avoid floating point precision issues at edges
  for (let z = 0; z < heightmapResolution; z++) {
    for (let x = 0; x < heightmapResolution; x++) {
      // World position of this heightmap point
      // Using ratio ensures edge vertices align exactly between adjacent sectors
      const worldX =
        worldOffsetX + (x / (heightmapResolution - 1)) * sectorSize;
      const worldZ =
        worldOffsetZ + (z / (heightmapResolution - 1)) * sectorSize;

      const height = getTerrainHeight(worldX, worldZ);
      heightmap.push(height);
      totalHeight += height;
    }
  }

  const avgHeight = totalHeight / heightmap.length;
  // Use sector center for biome determination
  const centerX = sectorX + sectorSize / 2;
  const centerZ = sectorZ + sectorSize / 2;
  const biome = determineBiome(avgHeight, centerX, centerZ);

  // Generate objects for this sector
  const objects = generateSectorObjects(sectorX, sectorZ, heightmap, biome);

  return {
    key,
    heightmap,
    biome,
    objects,
    createdAt: Date.now(),
  };
}

export function getSectorKey(worldX: number, worldZ: number): string {
  const sectorX = Math.floor(worldX / sectorSize) * sectorSize;
  const sectorZ = Math.floor(worldZ / sectorSize) * sectorSize;
  return `${sectorX}x${sectorZ}`;
}

export function parseSectorKey(key: string): { x: number; z: number } {
  const [x, z] = key.split("x").map(Number);
  return { x, z };
}
