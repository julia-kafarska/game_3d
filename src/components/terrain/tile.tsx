import { useEffect, useRef, useMemo, MutableRefObject } from "react";
import * as THREE from "three";
import { createNoise2D } from "simplex-noise";
import alea from "alea";
import {
  sectorSize,
  heightmapResolution,
  terrainSeed,
} from "../../constants/settings";

// Create moisture and temperature noise matching terrain-generator
const moisturePrng = alea(terrainSeed + "-moisture");
const moistureNoise = createNoise2D(moisturePrng);

const tempPrng = alea(terrainSeed + "-temperature");
const temperatureNoise = createNoise2D(tempPrng);

interface TileProps {
  position: [number, number, number];
  colorMap: THREE.Texture;
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
  interactableObjects: MutableRefObject<THREE.Mesh[]>;
  heightmap?: number[];
  biome?: string;
}

// Height thresholds for color transitions
const HEIGHT_WATER = -2;
const HEIGHT_SAND = 1;
const HEIGHT_GRASS = 8;
const HEIGHT_ROCK = 20;

// Get moisture value at position (0 = dry, 1 = wet)
function getMoistureValue(x: number, z: number): number {
  let value = moistureNoise(x * 0.005, z * 0.005);
  value += 0.5 * moistureNoise(x * 0.01, z * 0.01);
  value /= 1.5;
  return (value + 1) * 0.5;
}

// Get temperature value at position (0 = cold, 1 = hot)
function getTemperatureValue(x: number, z: number, height: number): number {
  let value = temperatureNoise(x * 0.004, z * 0.004);
  value = (value + 1) * 0.5;
  const altitudeEffect = Math.max(0, height) * 0.05;
  return Math.max(0, Math.min(1, value - altitudeEffect));
}

// Get biome weights for blending (returns weights for each biome)
function getBiomeWeights(
  height: number,
  moisture: number,
  temperature: number,
): Record<string, number> {
  const weights: Record<string, number> = {};

  // Water
  if (height < HEIGHT_WATER) {
    weights.water = 1;
    return weights;
  }

  // Beach - near water, blend with adjacent biomes
  if (height < HEIGHT_SAND) {
    const beachWeight =
      1 - (height - HEIGHT_WATER) / (HEIGHT_SAND - HEIGHT_WATER);
    weights.beach = beachWeight;

    // Blend with what would be above
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

  // Very high - tundra
  if (height > 35) {
    weights.tundra = 1;
    return weights;
  }

  // High - mountains with blend to tundra
  if (height > 20) {
    const mountainWeight = 1 - (height - 20) / 15;
    const tundraWeight = (height - 20) / 15;
    weights.mountains = Math.max(0, mountainWeight);
    weights.tundra = Math.min(1, tundraWeight);
    return weights;
  }

  // Mid elevation - hills blending
  if (height > 8) {
    const hillBlend = (height - 8) / 12; // 0 at height 8, 1 at height 20

    if (moisture > 0.6) {
      weights.forest = 1 - hillBlend;
      weights.hills = hillBlend;
    } else {
      weights.hills = hillBlend;
      // Blend lower biome
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

  // Low elevation - based on moisture and temperature with smooth blending
  if (moisture < 0.3 && temperature > 0.5) {
    // Desert with blend edges
    const desertStrength =
      (((0.3 - moisture) / 0.3) * (temperature - 0.5)) / 0.5;
    weights.desert = desertStrength;
    weights.savanna = 1 - desertStrength;
  } else if (moisture > 0.6) {
    // Forest with blend
    const forestStrength = (moisture - 0.6) / 0.4;
    weights.forest = forestStrength;
    weights.plains = 1 - forestStrength;
  } else if (moisture > 0.4) {
    // Plains
    const plainsStrength = (moisture - 0.4) / 0.2;
    weights.plains = plainsStrength;
    weights.savanna = 1 - plainsStrength;
  } else {
    // Savanna
    weights.savanna = 1;
  }

  return weights;
}

// Base colors for different height levels
const baseColors = {
  water: new THREE.Color(0x3498db),
  sand: new THREE.Color(0xf4d03f),
  grass: new THREE.Color(0x2ecc71),
  hill: new THREE.Color(0x8b7355),
  rock: new THREE.Color(0x7f8c8d),
  snow: new THREE.Color(0xecf0f1),
};

// Biome-specific color palettes
const biomeColors: Record<string, typeof baseColors> = {
  water: baseColors,
  beach: {
    water: new THREE.Color(0x3498db),
    sand: new THREE.Color(0xf5deb3), // Lighter sand
    grass: new THREE.Color(0x90ee90), // Light green
    hill: new THREE.Color(0x8b7355),
    rock: new THREE.Color(0x7f8c8d),
    snow: new THREE.Color(0xecf0f1),
  },
  desert: {
    water: new THREE.Color(0x3498db),
    sand: new THREE.Color(0xd2b48c), // Tan
    grass: new THREE.Color(0xbdb76b), // Dark khaki (sparse vegetation)
    hill: new THREE.Color(0xcd853f), // Peru (orange-brown)
    rock: new THREE.Color(0xa0522d), // Sienna
    snow: new THREE.Color(0xdeb887), // Burlywood (light rock)
  },
  savanna: {
    water: new THREE.Color(0x3498db),
    sand: new THREE.Color(0xdaa520), // Goldenrod
    grass: new THREE.Color(0x9acd32), // Yellow-green
    hill: new THREE.Color(0x8b4513), // Saddle brown
    rock: new THREE.Color(0x6b4423),
    snow: new THREE.Color(0xecf0f1),
  },
  plains: baseColors,
  forest: {
    water: new THREE.Color(0x3498db),
    sand: new THREE.Color(0x8b4513), // Saddle brown (forest floor)
    grass: new THREE.Color(0x228b22), // Forest green
    hill: new THREE.Color(0x006400), // Dark green
    rock: new THREE.Color(0x556b2f), // Dark olive
    snow: new THREE.Color(0xecf0f1),
  },
  hills: {
    water: new THREE.Color(0x3498db),
    sand: new THREE.Color(0xdaa520),
    grass: new THREE.Color(0x6b8e23), // Olive drab
    hill: new THREE.Color(0x8b7355),
    rock: new THREE.Color(0x696969), // Dim gray
    snow: new THREE.Color(0xecf0f1),
  },
  mountains: {
    water: new THREE.Color(0x3498db),
    sand: new THREE.Color(0xa9a9a9), // Gray
    grass: new THREE.Color(0x4a7c59), // Muted green
    hill: new THREE.Color(0x708090), // Slate gray
    rock: new THREE.Color(0x5f5f5f),
    snow: new THREE.Color(0xfffafa), // Snow white
  },
  tundra: {
    water: new THREE.Color(0x4682b4), // Steel blue (frozen)
    sand: new THREE.Color(0x778899), // Light slate gray
    grass: new THREE.Color(0x8fbc8f), // Dark sea green (lichen)
    hill: new THREE.Color(0x708090),
    rock: new THREE.Color(0x696969),
    snow: new THREE.Color(0xf0ffff), // Azure white
  },
};

function getColorForHeightAndBiome(
  height: number,
  colors: typeof baseColors,
): THREE.Color {
  if (height < HEIGHT_WATER) {
    return colors.water.clone();
  } else if (height < HEIGHT_SAND) {
    const t = (height - HEIGHT_WATER) / (HEIGHT_SAND - HEIGHT_WATER);
    return colors.water.clone().lerp(colors.sand, t);
  } else if (height < HEIGHT_GRASS) {
    const t = (height - HEIGHT_SAND) / (HEIGHT_GRASS - HEIGHT_SAND);
    return colors.sand.clone().lerp(colors.grass, t);
  } else if (height < HEIGHT_ROCK) {
    const t = (height - HEIGHT_GRASS) / (HEIGHT_ROCK - HEIGHT_GRASS);
    return colors.grass.clone().lerp(colors.hill, t);
  } else if (height < 35) {
    const t = (height - HEIGHT_ROCK) / 15;
    return colors.hill.clone().lerp(colors.rock, Math.min(t, 1));
  } else {
    const t = (height - 35) / 20;
    return colors.rock.clone().lerp(colors.snow, Math.min(t, 1));
  }
}

function getBlendedColor(
  height: number,
  worldX: number,
  worldZ: number,
): THREE.Color {
  const moisture = getMoistureValue(worldX, worldZ);
  const temperature = getTemperatureValue(worldX, worldZ, height);
  const weights = getBiomeWeights(height, moisture, temperature);

  const finalColor = new THREE.Color(0, 0, 0);

  for (const [biomeName, weight] of Object.entries(weights)) {
    if (weight > 0) {
      const biomeColorPalette = biomeColors[biomeName] || baseColors;
      const biomeColor = getColorForHeightAndBiome(height, biomeColorPalette);
      finalColor.r += biomeColor.r * weight;
      finalColor.g += biomeColor.g * weight;
      finalColor.b += biomeColor.b * weight;
    }
  }

  return finalColor;
}

export function Tile({
  position,
  colorMap,
  normalMap,
  roughnessMap,
  interactableObjects,
  heightmap,
}: TileProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Calculate world offset from position (position is center of tile)
  const worldOffsetX = position[0] - sectorSize / 2;
  const worldOffsetZ = position[2] - sectorSize / 2;

  useEffect(() => {
    if (meshRef.current) {
      interactableObjects.current.push(meshRef.current);
    }
  }, [interactableObjects]);

  const geometry = useMemo(() => {
    const segments = heightmap ? heightmapResolution - 1 : 100;
    const geom = new THREE.PlaneGeometry(
      sectorSize,
      sectorSize,
      segments,
      segments,
    );
    geom.rotateX(-Math.PI / 2);

    // Apply heightmap to vertices if provided
    if (heightmap && heightmap.length > 0) {
      const positions = geom.attributes.position.array as Float32Array;
      const expectedVertices = (segments + 1) * (segments + 1);

      if (heightmap.length === expectedVertices) {
        // Create vertex colors array
        const colors = new Float32Array(expectedVertices * 3);

        for (let i = 0; i < heightmap.length; i++) {
          const height = heightmap[i];
          // Y is at index 1 (after rotation, Y is still up)
          positions[i * 3 + 1] = height;

          // Calculate world position for this vertex
          const gridX = i % heightmapResolution;
          const gridZ = Math.floor(i / heightmapResolution);
          const worldX =
            worldOffsetX + (gridX / (heightmapResolution - 1)) * sectorSize;
          const worldZ =
            worldOffsetZ + (gridZ / (heightmapResolution - 1)) * sectorSize;

          // Set vertex color based on height and world position (for biome blending)
          const color = getBlendedColor(height, worldX, worldZ);
          colors[i * 3] = color.r;
          colors[i * 3 + 1] = color.g;
          colors[i * 3 + 2] = color.b;
        }

        geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        geom.attributes.position.needsUpdate = true;
        geom.computeVertexNormals();
      }
    }

    return geom;
  }, [heightmap, worldOffsetX, worldOffsetZ]);

  const material = useMemo(() => {
    if (heightmap) {
      // Use vertex colors for heightmap terrain
      return new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.8,
        metalness: 0.1,
        flatShading: false,
      });
    }

    // Use texture for flat terrain (fallback)
    return new THREE.MeshStandardMaterial({
      map: colorMap,
      normalMap: normalMap,
      roughnessMap: roughnessMap,
    });
  }, [heightmap, colorMap, normalMap, roughnessMap]);

  return (
    <mesh ref={meshRef} receiveShadow position={position} name="sector">
      <primitive object={geometry} attach="geometry" />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
