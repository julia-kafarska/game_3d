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

// Combined terrain height function - EXPORTED for volumetric terrain
export function getTerrainHeight(x: number, z: number): number {
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

// Height thresholds for color transitions (matching tile.tsx)
const HEIGHT_WATER = -2;
const HEIGHT_SAND = 1;
const HEIGHT_GRASS = 8;
const HEIGHT_ROCK = 20;

// Base colors for terrain (RGB 0-1)
const terrainColors = {
  water: { r: 0.204, g: 0.596, b: 0.859 },
  sand: { r: 0.957, g: 0.816, b: 0.247 },
  grass: { r: 0.18, g: 0.8, b: 0.443 },
  hill: { r: 0.545, g: 0.451, b: 0.333 },
  rock: { r: 0.498, g: 0.549, b: 0.553 },
  snow: { r: 0.925, g: 0.941, b: 0.945 },
};

// Biome-specific color palettes
const biomeColorPalettes: Record<string, typeof terrainColors> = {
  water: terrainColors,
  beach: {
    water: { r: 0.204, g: 0.596, b: 0.859 },
    sand: { r: 0.961, g: 0.871, b: 0.702 },
    grass: { r: 0.565, g: 0.933, b: 0.565 },
    hill: { r: 0.545, g: 0.451, b: 0.333 },
    rock: { r: 0.498, g: 0.549, b: 0.553 },
    snow: { r: 0.925, g: 0.941, b: 0.945 },
  },
  desert: {
    water: { r: 0.204, g: 0.596, b: 0.859 },
    sand: { r: 0.824, g: 0.706, b: 0.549 },
    grass: { r: 0.741, g: 0.718, b: 0.42 },
    hill: { r: 0.804, g: 0.522, b: 0.247 },
    rock: { r: 0.627, g: 0.322, b: 0.176 },
    snow: { r: 0.871, g: 0.722, b: 0.529 },
  },
  savanna: {
    water: { r: 0.204, g: 0.596, b: 0.859 },
    sand: { r: 0.855, g: 0.647, b: 0.125 },
    grass: { r: 0.604, g: 0.804, b: 0.196 },
    hill: { r: 0.545, g: 0.271, b: 0.075 },
    rock: { r: 0.42, g: 0.267, b: 0.137 },
    snow: { r: 0.925, g: 0.941, b: 0.945 },
  },
  plains: terrainColors,
  forest: {
    water: { r: 0.204, g: 0.596, b: 0.859 },
    sand: { r: 0.545, g: 0.271, b: 0.075 },
    grass: { r: 0.133, g: 0.545, b: 0.133 },
    hill: { r: 0.0, g: 0.392, b: 0.0 },
    rock: { r: 0.333, g: 0.42, b: 0.184 },
    snow: { r: 0.925, g: 0.941, b: 0.945 },
  },
  hills: {
    water: { r: 0.204, g: 0.596, b: 0.859 },
    sand: { r: 0.855, g: 0.647, b: 0.125 },
    grass: { r: 0.42, g: 0.557, b: 0.137 },
    hill: { r: 0.545, g: 0.451, b: 0.333 },
    rock: { r: 0.412, g: 0.412, b: 0.412 },
    snow: { r: 0.925, g: 0.941, b: 0.945 },
  },
  mountains: {
    water: { r: 0.204, g: 0.596, b: 0.859 },
    sand: { r: 0.663, g: 0.663, b: 0.663 },
    grass: { r: 0.29, g: 0.486, b: 0.349 },
    hill: { r: 0.439, g: 0.502, b: 0.565 },
    rock: { r: 0.373, g: 0.373, b: 0.373 },
    snow: { r: 1.0, g: 0.98, b: 0.98 },
  },
  tundra: {
    water: { r: 0.275, g: 0.51, b: 0.706 },
    sand: { r: 0.467, g: 0.533, b: 0.6 },
    grass: { r: 0.561, g: 0.737, b: 0.561 },
    hill: { r: 0.439, g: 0.502, b: 0.565 },
    rock: { r: 0.412, g: 0.412, b: 0.412 },
    snow: { r: 0.941, g: 1.0, b: 1.0 },
  },
};

// Lerp between two colors
function lerpColor(
  c1: { r: number; g: number; b: number },
  c2: { r: number; g: number; b: number },
  t: number,
): { r: number; g: number; b: number } {
  return {
    r: c1.r + (c2.r - c1.r) * t,
    g: c1.g + (c2.g - c1.g) * t,
    b: c1.b + (c2.b - c1.b) * t,
  };
}

// Get color for height using a color palette
function getColorForHeight(
  height: number,
  colors: typeof terrainColors,
): { r: number; g: number; b: number } {
  if (height < HEIGHT_WATER) {
    return colors.water;
  } else if (height < HEIGHT_SAND) {
    const t = (height - HEIGHT_WATER) / (HEIGHT_SAND - HEIGHT_WATER);
    return lerpColor(colors.water, colors.sand, t);
  } else if (height < HEIGHT_GRASS) {
    const t = (height - HEIGHT_SAND) / (HEIGHT_GRASS - HEIGHT_SAND);
    return lerpColor(colors.sand, colors.grass, t);
  } else if (height < HEIGHT_ROCK) {
    const t = (height - HEIGHT_GRASS) / (HEIGHT_ROCK - HEIGHT_GRASS);
    return lerpColor(colors.grass, colors.hill, t);
  } else if (height < 35) {
    const t = (height - HEIGHT_ROCK) / 15;
    return lerpColor(colors.hill, colors.rock, Math.min(t, 1));
  } else {
    const t = (height - 35) / 20;
    return lerpColor(colors.rock, colors.snow, Math.min(t, 1));
  }
}

// Get biome weights for blending
function getBiomeWeights(
  height: number,
  moisture: number,
  temperature: number,
): Record<string, number> {
  const weights: Record<string, number> = {};

  if (height < HEIGHT_WATER) {
    weights.water = 1;
    return weights;
  }

  if (height < HEIGHT_SAND) {
    const beachWeight =
      1 - (height - HEIGHT_WATER) / (HEIGHT_SAND - HEIGHT_WATER);
    weights.beach = beachWeight;
    const aboveWeight = 1 - beachWeight;
    if (moisture < 0.3 && temperature > 0.5) {
      weights.desert = aboveWeight;
    } else if (moisture > 0.6) {
      weights.forest = aboveWeight;
    } else {
      weights.plains = aboveWeight;
    }
    return weights;
  }

  if (height > 35) {
    weights.tundra = 1;
    return weights;
  }

  if (height > 20) {
    const mountainWeight = 1 - (height - 20) / 15;
    const tundraWeight = (height - 20) / 15;
    weights.mountains = Math.max(0, mountainWeight);
    weights.tundra = Math.min(1, tundraWeight);
    return weights;
  }

  if (height > 8) {
    const hillBlend = (height - 8) / 12;
    if (moisture > 0.6) {
      weights.forest = 1 - hillBlend;
      weights.hills = hillBlend;
    } else {
      weights.hills = hillBlend;
      if (moisture < 0.3 && temperature > 0.5) {
        weights.desert = (1 - hillBlend) * 0.5;
        weights.savanna = (1 - hillBlend) * 0.5;
      } else if (moisture > 0.4) {
        weights.plains = 1 - hillBlend;
      } else {
        weights.savanna = 1 - hillBlend;
      }
    }
    return weights;
  }

  if (moisture < 0.3 && temperature > 0.5) {
    const desertStrength =
      (((0.3 - moisture) / 0.3) * (temperature - 0.5)) / 0.5;
    weights.desert = desertStrength;
    weights.savanna = 1 - desertStrength;
  } else if (moisture > 0.6) {
    const forestStrength = (moisture - 0.6) / 0.4;
    weights.forest = forestStrength;
    weights.plains = 1 - forestStrength;
  } else if (moisture > 0.4) {
    const plainsStrength = (moisture - 0.4) / 0.2;
    weights.plains = plainsStrength;
    weights.savanna = 1 - plainsStrength;
  } else {
    weights.savanna = 1;
  }

  return weights;
}

/**
 * Get terrain color at a world position (for volumetric terrain vertex coloring)
 * Uses the same biome blending logic as tile.tsx
 */
export function getTerrainColor(
  worldX: number,
  worldY: number,
  worldZ: number,
): { r: number; g: number; b: number } {
  // Get the terrain surface height at this XZ position
  const surfaceHeight = getTerrainHeight(worldX, worldZ);

  // Use the actual Y position for cave coloring, but blend with surface height
  // This creates a smooth transition where cave interiors use rock colors
  const effectiveHeight = worldY;

  const moisture = getMoistureValue(worldX, worldZ);
  const temperature = getTemperatureValue(worldX, worldZ, surfaceHeight);
  const weights = getBiomeWeights(surfaceHeight, moisture, temperature);

  const finalColor = { r: 0, g: 0, b: 0 };

  for (const [biomeName, weight] of Object.entries(weights)) {
    if (weight > 0) {
      const palette = biomeColorPalettes[biomeName] || terrainColors;
      const biomeColor = getColorForHeight(effectiveHeight, palette);
      finalColor.r += biomeColor.r * weight;
      finalColor.g += biomeColor.g * weight;
      finalColor.b += biomeColor.b * weight;
    }
  }

  return finalColor;
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
