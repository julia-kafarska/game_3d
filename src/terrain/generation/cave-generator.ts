/**
 * Cave generation using 3D noise for volumetric terrain
 */

import { createNoise3D, NoiseFunction3D } from "simplex-noise";
import alea from "alea";
import { terrainSeed } from "../../constants/settings";

// Create seeded 3D noise functions for cave generation
const cavePrng = alea(terrainSeed + "-caves");
const caveNoise3D: NoiseFunction3D = createNoise3D(cavePrng);

const cavePrng2 = alea(terrainSeed + "-caves-secondary");
const caveNoise3D_2: NoiseFunction3D = createNoise3D(cavePrng2);

const tunnelPrng = alea(terrainSeed + "-tunnels");
const tunnelNoise3D: NoiseFunction3D = createNoise3D(tunnelPrng);

/**
 * Smooth step function for smooth transitions
 */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Get worm-like tunnel noise value at a position
 * Returns a value where higher = more likely to be air (cave)
 *
 * @param x - World X position
 * @param y - World Y position
 * @param z - World Z position
 * @param frequency - Base frequency for the noise
 */
function getWormNoise(
  x: number,
  y: number,
  z: number,
  frequency: number,
): number {
  // Primary worm noise - creates the main tunnel structure
  const noise1 = caveNoise3D(x * frequency, y * frequency, z * frequency);

  // Secondary worm noise at different frequency for variation
  const noise2 = caveNoise3D_2(
    x * frequency * 1.5,
    y * frequency * 1.5,
    z * frequency * 1.5,
  );

  // Combine to create ridged/worm effect
  // Taking absolute value and inverting creates tunnel-like structures
  let worm = 1 - Math.abs(noise1);
  worm *= 1 - Math.abs(noise2) * 0.4;

  // Sharpen the worm shape using power function
  // Lower power = wider, more common tunnels
  worm = Math.pow(worm, 2);

  return worm;
}

/**
 * Get spherical cavern noise for larger cave chambers
 */
function getCavernNoise(
  x: number,
  y: number,
  z: number,
  frequency: number,
): number {
  // Low frequency noise for large caverns
  const noise = tunnelNoise3D(
    x * frequency * 0.3,
    y * frequency * 0.5,
    z * frequency * 0.3,
  );

  // Create bubble-like caverns
  // Values near 1 become caverns
  return Math.pow(Math.max(0, noise), 2);
}

export interface CaveConfig {
  enabled: boolean;
  threshold: number; // Value above which caves form (0.5 is good default)
  frequency: number; // Base noise frequency (0.02 is good default)
  minHeight: number; // Minimum Y for caves
  maxHeight: number; // Maximum Y for caves
  wormWeight: number; // Weight of worm/tunnel noise (0-1)
  cavernWeight: number; // Weight of cavern noise (0-1)
  carveStrength: number; // How much to add to density for carving
}

const defaultCaveConfig: CaveConfig = {
  enabled: true,
  threshold: 0.35, // Lower threshold = more caves
  frequency: 0.015, // Slightly lower = larger tunnels
  minHeight: -30,
  maxHeight: 60, // Higher to reach mountain surfaces
  wormWeight: 0.8, // More worm tunnels
  cavernWeight: 0.4, // More caverns too
  carveStrength: 8, // Stronger carving
};

/**
 * Get cave density contribution at a world position
 * Returns positive value if this should carve out terrain (create air)
 * Returns 0 if no cave at this position
 *
 * @param worldX - World X position
 * @param worldY - World Y position
 * @param worldZ - World Z position
 * @param config - Cave generation configuration
 */
export function getCaveDensity(
  worldX: number,
  worldY: number,
  worldZ: number,
  config: Partial<CaveConfig> = {},
): number {
  const cfg = { ...defaultCaveConfig, ...config };

  if (!cfg.enabled) {
    return 0;
  }

  // Height-based fade to prevent caves too deep
  // Note: We allow caves to reach the surface by using a smaller top fade
  const bottomFade = 15; // Units over which to fade at bottom
  const topFade = 5; // Small fade at top to allow surface entrances
  const heightFade =
    smoothstep(cfg.minHeight, cfg.minHeight + bottomFade, worldY) *
    (1 - smoothstep(cfg.maxHeight - topFade, cfg.maxHeight, worldY));

  if (heightFade < 0.01) {
    return 0;
  }

  // Get worm-like tunnel noise
  const worm = getWormNoise(worldX, worldY, worldZ, cfg.frequency);

  // Get larger cavern noise
  const cavern = getCavernNoise(worldX, worldY, worldZ, cfg.frequency);

  // Combine cave types
  const combinedCave = worm * cfg.wormWeight + cavern * cfg.cavernWeight;

  // Apply threshold - only carve if above threshold
  if (combinedCave < cfg.threshold) {
    return 0;
  }

  // Calculate carve amount with smooth transition
  const carveAmount =
    ((combinedCave - cfg.threshold) / (1 - cfg.threshold)) *
    cfg.carveStrength *
    heightFade;

  return carveAmount;
}

/**
 * Check if a position is likely inside a cave (for preview/debugging)
 */
export function isInCave(
  worldX: number,
  worldY: number,
  worldZ: number,
  config: Partial<CaveConfig> = {},
): boolean {
  return getCaveDensity(worldX, worldY, worldZ, config) > 0;
}
