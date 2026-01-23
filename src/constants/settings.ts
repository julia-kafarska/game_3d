// Sector settings
export const sectorSize = 100; // World units per sector
export const heightmapResolution = 64; // Points per sector edge (higher = smoother terrain)
export const loadDistance = 2; // Load sectors within N sectors of player
export const unloadDistance = 4; // Unload sectors beyond N sectors

// Terrain generation settings
export const terrainSeed = "world-seed-12345"; // Seed for reproducible terrain
export const terrainAmplitude = 15; // Max height variation for base terrain
export const terrainFrequency = 0.012; // Base noise frequency
export const terrainOctaves = 4; // Number of noise layers
export const terrainPersistence = 0.5; // Amplitude decay per octave

// Mountain generation settings
export const mountainAmplitude = 50; // Additional height for mountains
export const mountainFrequency = 0.005; // Lower frequency for large mountain ranges
export const ridgeSharpness = 2.2; // How sharp the mountain ridges are (1-3)
export const continentalFrequency = 0.002; // Very low frequency for continents/regions
export const continentalInfluence = 0.75; // How much continental noise affects terrain (0-1)
export const warpStrength = 40; // Domain warping strength for natural shapes

// Object generation settings
export const objectDensity = 0.5; // Base objects per unit area (0-1)

// Biome object density settings (0-1 multiplier)
export const biomeDensity = {
  water: {
    tree: 0,
    rock: 0,
    bush: 0,
    grass: 0,
  },
  beach: {
    tree: 0.05,
    rock: 0.2,
    bush: 0.1,
    grass: 0.3,
  },
  desert: {
    tree: 0.02,
    rock: 0.4,
    bush: 0.05,
    grass: 0.05,
  },
  savanna: {
    tree: 0.2,
    rock: 0.15,
    bush: 0.3,
    grass: 0.7,
  },
  plains: {
    tree: 0.3,
    rock: 0.1,
    bush: 0.5,
    grass: 1.0,
  },
  forest: {
    tree: 1.0,
    rock: 0.1,
    bush: 0.7,
    grass: 0.8,
  },
  hills: {
    tree: 0.4,
    rock: 0.5,
    bush: 0.3,
    grass: 0.5,
  },
  mountains: {
    tree: 0.1,
    rock: 0.8,
    bush: 0.05,
    grass: 0.1,
  },
  tundra: {
    tree: 0.02,
    rock: 0.6,
    bush: 0.1,
    grass: 0.2,
  },
};

// Water settings
export const waterLevel = -1; // Sea level height
