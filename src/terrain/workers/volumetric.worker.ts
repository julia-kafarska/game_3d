/**
 * Web Worker for volumetric terrain generation
 * Handles CPU-intensive density field and mesh generation off the main thread
 */

/* eslint-disable no-restricted-globals */

import { createNoise2D, createNoise3D } from "simplex-noise";
import alea from "alea";
import {
  EDGE_TABLE,
  TRI_TABLE,
  EDGE_VERTICES,
  CUBE_VERTICES,
} from "../generation/marching-cubes-tables";

// ============================================
// CONFIGURATION (passed from main thread)
// ============================================
interface WorkerConfig {
  terrainSeed: string;
  chunkSize: number;
  chunkHeight: number;
  resolution: number;
  isoLevel: number;
  caveEnabled: boolean;
  caveThreshold: number;
  caveFrequency: number;
  minCaveHeight: number;
  maxCaveHeight: number;
  // Terrain settings
  terrainAmplitude: number;
  terrainFrequency: number;
  terrainOctaves: number;
  terrainPersistence: number;
  mountainAmplitude: number;
  mountainFrequency: number;
  ridgeSharpness: number;
  continentalFrequency: number;
  continentalInfluence: number;
  warpStrength: number;
}

let config: WorkerConfig | null = null;

// Noise functions (initialized when config is received)
let noise2D: ReturnType<typeof createNoise2D>;
let warpNoise: ReturnType<typeof createNoise2D>;
let ridgeNoise: ReturnType<typeof createNoise2D>;
let continentalNoise: ReturnType<typeof createNoise2D>;
let caveNoise3D: ReturnType<typeof createNoise3D>;
let caveNoise3D_2: ReturnType<typeof createNoise3D>;
let tunnelNoise3D: ReturnType<typeof createNoise3D>;

function initializeNoise(seed: string) {
  const prng = alea(seed);
  noise2D = createNoise2D(prng);

  const prng2 = alea(seed + "-warp");
  warpNoise = createNoise2D(prng2);

  const prng3 = alea(seed + "-ridge");
  ridgeNoise = createNoise2D(prng3);

  const prng4 = alea(seed + "-continental");
  continentalNoise = createNoise2D(prng4);

  const cavePrng = alea(seed + "-caves");
  caveNoise3D = createNoise3D(cavePrng);

  const cavePrng2 = alea(seed + "-caves-secondary");
  caveNoise3D_2 = createNoise3D(cavePrng2);

  const tunnelPrng = alea(seed + "-tunnels");
  tunnelNoise3D = createNoise3D(tunnelPrng);
}

// ============================================
// TERRAIN HEIGHT GENERATION
// ============================================

function fbm(x: number, z: number): number {
  if (!config) return 0;
  let value = 0;
  let amplitude = 1;
  let frequency = config.terrainFrequency;
  let maxValue = 0;

  for (let i = 0; i < config.terrainOctaves; i++) {
    value += amplitude * noise2D(x * frequency, z * frequency);
    maxValue += amplitude;
    amplitude *= config.terrainPersistence;
    frequency *= 2;
  }

  return value / maxValue;
}

function ridgedNoise(x: number, z: number): number {
  if (!config) return 0;
  let value = 0;
  let amplitude = 1;
  let frequency = config.mountainFrequency;
  let maxValue = 0;

  for (let i = 0; i < 5; i++) {
    let n = ridgeNoise(x * frequency, z * frequency);
    n = 1 - Math.abs(n);
    n = Math.pow(n, config.ridgeSharpness);
    value += amplitude * n;
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return value / maxValue;
}

function getContinentalValue(x: number, z: number): number {
  if (!config) return 0.5;
  let value = continentalNoise(
    x * config.continentalFrequency,
    z * config.continentalFrequency,
  );
  value +=
    0.5 *
    continentalNoise(
      x * config.continentalFrequency * 2,
      z * config.continentalFrequency * 2,
    );
  value /= 1.5;
  return (value + 1) * 0.5;
}

function warpedCoords(x: number, z: number): { wx: number; wz: number } {
  if (!config) return { wx: x, wz: z };
  const warpX = warpNoise(x * 0.01, z * 0.01) * config.warpStrength;
  const warpZ = warpNoise(x * 0.01 + 100, z * 0.01 + 100) * config.warpStrength;
  return { wx: x + warpX, wz: z + warpZ };
}

function getTerrainHeight(x: number, z: number): number {
  if (!config) return 0;

  const { wx, wz } = warpedCoords(x, z);
  const continental = getContinentalValue(x, z);
  const baseTerrain = fbm(wx, wz) * config.terrainAmplitude;
  const mountains = ridgedNoise(wx, wz) * config.mountainAmplitude;
  const mountainBlend = Math.pow(continental, 2) * config.continentalInfluence;
  const height =
    baseTerrain * (1 - mountainBlend * 0.5) + mountains * mountainBlend;
  const continentalElevation = (continental - 0.5) * 15;

  return height + continentalElevation;
}

// ============================================
// CAVE GENERATION
// ============================================

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function getWormNoise(
  x: number,
  y: number,
  z: number,
  frequency: number,
): number {
  const noise1 = caveNoise3D(x * frequency, y * frequency, z * frequency);
  const noise2 = caveNoise3D_2(
    x * frequency * 1.5,
    y * frequency * 1.5,
    z * frequency * 1.5,
  );

  let worm = 1 - Math.abs(noise1);
  worm *= 1 - Math.abs(noise2) * 0.4;
  worm = Math.pow(worm, 2);

  return worm;
}

function getCavernNoise(
  x: number,
  y: number,
  z: number,
  frequency: number,
): number {
  const noise = tunnelNoise3D(
    x * frequency * 0.3,
    y * frequency * 0.5,
    z * frequency * 0.3,
  );
  return Math.pow(Math.max(0, noise), 2);
}

function getCaveDensity(
  worldX: number,
  worldY: number,
  worldZ: number,
): number {
  if (!config || !config.caveEnabled) return 0;

  const bottomFade = 15;
  const topFade = 5;
  const heightFade =
    smoothstep(
      config.minCaveHeight,
      config.minCaveHeight + bottomFade,
      worldY,
    ) *
    (1 -
      smoothstep(config.maxCaveHeight - topFade, config.maxCaveHeight, worldY));

  if (heightFade < 0.01) return 0;

  const worm = getWormNoise(worldX, worldY, worldZ, config.caveFrequency);
  const cavern = getCavernNoise(worldX, worldY, worldZ, config.caveFrequency);
  const combinedCave = worm * 0.8 + cavern * 0.4;

  if (combinedCave < config.caveThreshold) return 0;

  const carveAmount =
    ((combinedCave - config.caveThreshold) / (1 - config.caveThreshold)) *
    8 *
    heightFade;

  return carveAmount;
}

// ============================================
// DENSITY FIELD
// ============================================

function getDensity(worldX: number, worldY: number, worldZ: number): number {
  const surfaceHeight = getTerrainHeight(worldX, worldZ);
  let density = worldY - surfaceHeight;
  density += getCaveDensity(worldX, worldY, worldZ);
  return density;
}

// ============================================
// COLOR GENERATION
// ============================================

const HEIGHT_WATER = -2;
const HEIGHT_SAND = 1;
const HEIGHT_GRASS = 8;
const HEIGHT_ROCK = 20;

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

const terrainColors = {
  water: { r: 0.204, g: 0.596, b: 0.859 },
  sand: { r: 0.957, g: 0.816, b: 0.247 },
  grass: { r: 0.18, g: 0.8, b: 0.443 },
  hill: { r: 0.545, g: 0.451, b: 0.333 },
  rock: { r: 0.498, g: 0.549, b: 0.553 },
  snow: { r: 0.925, g: 0.941, b: 0.945 },
};

function getColorForHeight(height: number): {
  r: number;
  g: number;
  b: number;
} {
  if (height < HEIGHT_WATER) {
    return terrainColors.water;
  } else if (height < HEIGHT_SAND) {
    const t = (height - HEIGHT_WATER) / (HEIGHT_SAND - HEIGHT_WATER);
    return lerpColor(terrainColors.water, terrainColors.sand, t);
  } else if (height < HEIGHT_GRASS) {
    const t = (height - HEIGHT_SAND) / (HEIGHT_GRASS - HEIGHT_SAND);
    return lerpColor(terrainColors.sand, terrainColors.grass, t);
  } else if (height < HEIGHT_ROCK) {
    const t = (height - HEIGHT_GRASS) / (HEIGHT_ROCK - HEIGHT_GRASS);
    return lerpColor(terrainColors.grass, terrainColors.hill, t);
  } else if (height < 35) {
    const t = (height - HEIGHT_ROCK) / 15;
    return lerpColor(terrainColors.hill, terrainColors.rock, Math.min(t, 1));
  } else {
    const t = (height - 35) / 20;
    return lerpColor(terrainColors.rock, terrainColors.snow, Math.min(t, 1));
  }
}

function getTerrainColor(
  _worldX: number,
  worldY: number,
  _worldZ: number,
): { r: number; g: number; b: number } {
  return getColorForHeight(worldY);
}

// ============================================
// MARCHING CUBES
// ============================================

function interpolateVertex(
  x1: number,
  y1: number,
  z1: number,
  x2: number,
  y2: number,
  z2: number,
  val1: number,
  val2: number,
  isoLevel: number,
): [number, number, number] {
  if (Math.abs(val1 - val2) < 0.00001) {
    return [x1, y1, z1];
  }
  const t = (isoLevel - val1) / (val2 - val1);
  return [x1 + t * (x2 - x1), y1 + t * (y2 - y1), z1 + t * (z2 - z1)];
}

function calculateNormal(
  v0: [number, number, number],
  v1: [number, number, number],
  v2: [number, number, number],
): [number, number, number] {
  const e1x = v1[0] - v0[0];
  const e1y = v1[1] - v0[1];
  const e1z = v1[2] - v0[2];
  const e2x = v2[0] - v0[0];
  const e2y = v2[1] - v0[1];
  const e2z = v2[2] - v0[2];

  const nx = e1y * e2z - e1z * e2y;
  const ny = e1z * e2x - e1x * e2z;
  const nz = e1x * e2y - e1y * e2x;

  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  if (len < 0.00001) return [0, 1, 0];
  return [nx / len, ny / len, nz / len];
}

function generateChunk(
  chunkX: number,
  chunkY: number,
  chunkZ: number,
): {
  key: string;
  worldX: number;
  worldY: number;
  worldZ: number;
  meshData: {
    positions: Float32Array;
    normals: Float32Array;
    colors: Float32Array;
    indices: Uint32Array;
    vertexCount: number;
    triangleCount: number;
  } | null;
  isEmpty: boolean;
  isSolid: boolean;
} {
  if (!config) throw new Error("Worker not initialized");

  const { chunkSize, chunkHeight, resolution, isoLevel } = config;

  const worldX = chunkX * chunkSize;
  const worldY = chunkY * chunkHeight;
  const worldZ = chunkZ * chunkSize;

  const gridSizeX = Math.ceil(chunkSize * resolution) + 1;
  const gridSizeY = Math.ceil(chunkHeight * resolution) + 1;
  const gridSizeZ = Math.ceil(chunkSize * resolution) + 1;
  const voxelSize = 1 / resolution;

  // Generate density field
  const densityField = new Float32Array(gridSizeX * gridSizeY * gridSizeZ);
  let hasPositive = false;
  let hasNegative = false;

  let idx = 0;
  for (let z = 0; z < gridSizeZ; z++) {
    for (let y = 0; y < gridSizeY; y++) {
      for (let x = 0; x < gridSizeX; x++) {
        const wx = worldX + x * voxelSize;
        const wy = worldY + y * voxelSize;
        const wz = worldZ + z * voxelSize;
        const d = getDensity(wx, wy, wz);
        densityField[idx++] = d;

        if (d >= isoLevel) hasPositive = true;
        else hasNegative = true;
      }
    }
  }

  const key = `${chunkX}_${chunkY}_${chunkZ}`;
  const isEmpty = hasPositive && !hasNegative;
  const isSolid = hasNegative && !hasPositive;

  if (!hasPositive || !hasNegative) {
    return { key, worldX, worldY, worldZ, meshData: null, isEmpty, isSolid };
  }

  // Generate mesh using marching cubes
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const cubeValues = new Float32Array(8);
  const edgeVertices: ([number, number, number] | null)[] = new Array(12).fill(
    null,
  );
  let vertexIndex = 0;

  const getDensityIndex = (x: number, y: number, z: number) =>
    x + y * gridSizeX + z * gridSizeX * gridSizeY;

  for (let z = 0; z < gridSizeZ - 1; z++) {
    for (let y = 0; y < gridSizeY - 1; y++) {
      for (let x = 0; x < gridSizeX - 1; x++) {
        for (let i = 0; i < 8; i++) {
          const [vx, vy, vz] = CUBE_VERTICES[i];
          cubeValues[i] = densityField[getDensityIndex(x + vx, y + vy, z + vz)];
        }

        let cubeIndex = 0;
        for (let i = 0; i < 8; i++) {
          if (cubeValues[i] < isoLevel) cubeIndex |= 1 << i;
        }

        if (EDGE_TABLE[cubeIndex] === 0) continue;

        const cubeWorldX = worldX + x * voxelSize;
        const cubeWorldY = worldY + y * voxelSize;
        const cubeWorldZ = worldZ + z * voxelSize;

        const edges = EDGE_TABLE[cubeIndex];
        for (let i = 0; i < 12; i++) {
          if (edges & (1 << i)) {
            const [v0, v1] = EDGE_VERTICES[i];
            const [vx0, vy0, vz0] = CUBE_VERTICES[v0];
            const [vx1, vy1, vz1] = CUBE_VERTICES[v1];

            edgeVertices[i] = interpolateVertex(
              cubeWorldX + vx0 * voxelSize,
              cubeWorldY + vy0 * voxelSize,
              cubeWorldZ + vz0 * voxelSize,
              cubeWorldX + vx1 * voxelSize,
              cubeWorldY + vy1 * voxelSize,
              cubeWorldZ + vz1 * voxelSize,
              cubeValues[v0],
              cubeValues[v1],
              isoLevel,
            );
          } else {
            edgeVertices[i] = null;
          }
        }

        const triEntry = TRI_TABLE[cubeIndex];
        for (let i = 0; triEntry[i] !== -1; i += 3) {
          const v0 = edgeVertices[triEntry[i]];
          const v1 = edgeVertices[triEntry[i + 1]];
          const v2 = edgeVertices[triEntry[i + 2]];

          if (!v0 || !v1 || !v2) continue;

          const normal = calculateNormal(v0, v1, v2);

          for (const v of [v0, v1, v2]) {
            positions.push(v[0], v[1], v[2]);
            normals.push(normal[0], normal[1], normal[2]);

            const c = getTerrainColor(v[0], v[1], v[2]);
            colors.push(c.r, c.g, c.b);
            indices.push(vertexIndex++);
          }
        }
      }
    }
  }

  if (positions.length === 0) {
    return {
      key,
      worldX,
      worldY,
      worldZ,
      meshData: null,
      isEmpty: true,
      isSolid: false,
    };
  }

  return {
    key,
    worldX,
    worldY,
    worldZ,
    meshData: {
      positions: new Float32Array(positions),
      normals: new Float32Array(normals),
      colors: new Float32Array(colors),
      indices: new Uint32Array(indices),
      vertexCount: positions.length / 3,
      triangleCount: indices.length / 3,
    },
    isEmpty: false,
    isSolid: false,
  };
}

// ============================================
// MESSAGE HANDLER
// ============================================

// Type assertion for worker context
const ctx: Worker = self as unknown as Worker;

ctx.onmessage = (e: MessageEvent) => {
  const { type, data } = e.data;

  switch (type) {
    case "init":
      config = data.config;
      initializeNoise(config!.terrainSeed);
      ctx.postMessage({ type: "ready" });
      break;

    case "generateChunk":
      const { chunkX, chunkY, chunkZ, requestId } = data;
      try {
        const result = generateChunk(chunkX, chunkY, chunkZ);

        // Transfer arrays for better performance
        const transferables: Transferable[] = [];
        if (result.meshData) {
          transferables.push(
            result.meshData.positions.buffer,
            result.meshData.normals.buffer,
            result.meshData.colors.buffer,
            result.meshData.indices.buffer,
          );
        }

        ctx.postMessage(
          { type: "chunkGenerated", requestId, result },
          transferables,
        );
      } catch (error) {
        ctx.postMessage({
          type: "error",
          requestId,
          error: (error as Error).message,
        });
      }
      break;
  }
};
