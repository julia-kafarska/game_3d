/**
 * Marching Cubes algorithm implementation for generating meshes from density fields
 */

import {
  EDGE_TABLE,
  TRI_TABLE,
  EDGE_VERTICES,
  CUBE_VERTICES,
} from "./marching-cubes-tables";
import { IMeshData, ColorFunction } from "../../types/volumetric";

/**
 * Interpolate vertex position along an edge based on density values
 */
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
  // Avoid division by zero
  if (Math.abs(val1 - val2) < 0.00001) {
    return [x1, y1, z1];
  }

  // Linear interpolation factor
  const t = (isoLevel - val1) / (val2 - val1);

  return [x1 + t * (x2 - x1), y1 + t * (y2 - y1), z1 + t * (z2 - z1)];
}

/**
 * Calculate normal for a triangle using cross product
 */
function calculateNormal(
  v0: [number, number, number],
  v1: [number, number, number],
  v2: [number, number, number],
): [number, number, number] {
  // Edge vectors
  const e1x = v1[0] - v0[0];
  const e1y = v1[1] - v0[1];
  const e1z = v1[2] - v0[2];

  const e2x = v2[0] - v0[0];
  const e2y = v2[1] - v0[1];
  const e2z = v2[2] - v0[2];

  // Cross product
  const nx = e1y * e2z - e1z * e2y;
  const ny = e1z * e2x - e1x * e2z;
  const nz = e1x * e2y - e1y * e2x;

  // Normalize
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  if (len < 0.00001) {
    return [0, 1, 0]; // Default up normal for degenerate triangles
  }

  return [nx / len, ny / len, nz / len];
}

/**
 * Get index into the 1D density array from 3D coordinates
 */
function getDensityIndex(
  x: number,
  y: number,
  z: number,
  gridSizeX: number,
  gridSizeY: number,
): number {
  return x + y * gridSizeX + z * gridSizeX * gridSizeY;
}

/**
 * Generate mesh from density field using Marching Cubes algorithm
 *
 * @param densityField - 3D density values stored in a 1D array (X varies fastest, then Y, then Z)
 * @param gridSizeX - Number of samples in X direction
 * @param gridSizeY - Number of samples in Y direction
 * @param gridSizeZ - Number of samples in Z direction
 * @param worldOffsetX - World X offset of the chunk
 * @param worldOffsetY - World Y offset of the chunk
 * @param worldOffsetZ - World Z offset of the chunk
 * @param voxelSize - Size of each voxel in world units
 * @param isoLevel - Density threshold for surface extraction (typically 0)
 * @param colorFn - Optional function to get color at world position
 */
export function generateMarchingCubesMesh(
  densityField: Float32Array,
  gridSizeX: number,
  gridSizeY: number,
  gridSizeZ: number,
  worldOffsetX: number,
  worldOffsetY: number,
  worldOffsetZ: number,
  voxelSize: number,
  isoLevel: number,
  colorFn?: ColorFunction,
): IMeshData | null {
  // Temporary arrays for building the mesh
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  // Reusable arrays for cube processing
  const cubeValues = new Float32Array(8);
  const edgeVertices: ([number, number, number] | null)[] = new Array(12).fill(
    null,
  );

  let vertexIndex = 0;

  // Process each cube in the grid (stopping one before the edge)
  for (let z = 0; z < gridSizeZ - 1; z++) {
    for (let y = 0; y < gridSizeY - 1; y++) {
      for (let x = 0; x < gridSizeX - 1; x++) {
        // Sample density at the 8 corners of the cube
        for (let i = 0; i < 8; i++) {
          const [vx, vy, vz] = CUBE_VERTICES[i];
          const idx = getDensityIndex(
            x + vx,
            y + vy,
            z + vz,
            gridSizeX,
            gridSizeY,
          );
          cubeValues[i] = densityField[idx];
        }

        // Calculate cube index based on which corners are inside/outside
        let cubeIndex = 0;
        for (let i = 0; i < 8; i++) {
          if (cubeValues[i] < isoLevel) {
            cubeIndex |= 1 << i;
          }
        }

        // Skip empty cubes (all in or all out)
        if (EDGE_TABLE[cubeIndex] === 0) {
          continue;
        }

        // Calculate world position of cube origin
        const cubeWorldX = worldOffsetX + x * voxelSize;
        const cubeWorldY = worldOffsetY + y * voxelSize;
        const cubeWorldZ = worldOffsetZ + z * voxelSize;

        // Calculate edge vertices where the surface crosses
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

        // Generate triangles from the lookup table
        const triEntry = TRI_TABLE[cubeIndex];
        for (let i = 0; triEntry[i] !== -1; i += 3) {
          const v0 = edgeVertices[triEntry[i]];
          const v1 = edgeVertices[triEntry[i + 1]];
          const v2 = edgeVertices[triEntry[i + 2]];

          if (!v0 || !v1 || !v2) continue;

          // Calculate face normal
          const normal = calculateNormal(v0, v1, v2);

          // Add vertices, normals, and colors for this triangle
          const triVerts = [v0, v1, v2];
          for (const v of triVerts) {
            positions.push(v[0], v[1], v[2]);
            normals.push(normal[0], normal[1], normal[2]);

            if (colorFn) {
              const c = colorFn(v[0], v[1], v[2]);
              colors.push(c.r, c.g, c.b);
            } else {
              // Default gray color
              colors.push(0.5, 0.5, 0.5);
            }

            indices.push(vertexIndex++);
          }
        }
      }
    }
  }

  // Return null if no triangles were generated
  if (positions.length === 0) {
    return null;
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    colors: new Float32Array(colors),
    indices: new Uint32Array(indices),
    vertexCount: positions.length / 3,
    triangleCount: indices.length / 3,
  };
}

/**
 * Check if a density field chunk has any surface (not all solid or all empty)
 */
export function chunkHasSurface(
  densityField: Float32Array,
  isoLevel: number,
): { hasSurface: boolean; isEmpty: boolean; isSolid: boolean } {
  let hasPositive = false;
  let hasNegative = false;

  for (let i = 0; i < densityField.length; i++) {
    if (densityField[i] >= isoLevel) {
      hasPositive = true;
    } else {
      hasNegative = true;
    }

    // Early exit if we found both
    if (hasPositive && hasNegative) {
      return { hasSurface: true, isEmpty: false, isSolid: false };
    }
  }

  return {
    hasSurface: false,
    isEmpty: hasPositive && !hasNegative,
    isSolid: hasNegative && !hasPositive,
  };
}
