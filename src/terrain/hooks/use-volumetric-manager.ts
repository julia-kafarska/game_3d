/**
 * Hook for managing volumetric terrain chunks
 * Uses Web Workers for off-thread generation
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { ILoadedVolumetricChunk } from "../../types/volumetric";
import { volumetricSettings } from "../../constants/settings";
import { useTerrainStore } from "../../store/terrain-store";
import { getWorkerPool, ChunkResult } from "../workers/worker-pool";
import { getVolumetricChunk, saveVolumetricChunk } from "../db/terrain-db";

interface UseVolumetricManagerOptions {
  playerX: number;
  playerY: number;
  playerZ: number;
}

function getChunkKey(chunkX: number, chunkY: number, chunkZ: number): string {
  return `${chunkX}_${chunkY}_${chunkZ}`;
}

function parseChunkKey(key: string): { x: number; y: number; z: number } {
  const [x, y, z] = key.split("_").map(Number);
  return { x, y, z };
}

function worldToChunk(
  worldX: number,
  worldY: number,
  worldZ: number,
): { chunkX: number; chunkY: number; chunkZ: number } {
  return {
    chunkX: Math.floor(worldX / volumetricSettings.chunkSize),
    chunkY: Math.floor(worldY / volumetricSettings.chunkHeight),
    chunkZ: Math.floor(worldZ / volumetricSettings.chunkSize),
  };
}

function chunkDistance(
  chunkX: number,
  chunkY: number,
  chunkZ: number,
  playerChunkX: number,
  playerChunkY: number,
  playerChunkZ: number,
): { h: number; v: number } {
  return {
    h: Math.max(
      Math.abs(chunkX - playerChunkX),
      Math.abs(chunkZ - playerChunkZ),
    ),
    v: Math.abs(chunkY - playerChunkY),
  };
}

function chunkResultToLoaded(result: ChunkResult): ILoadedVolumetricChunk {
  return {
    key: result.key,
    worldX: result.worldX,
    worldY: result.worldY,
    worldZ: result.worldZ,
    densityField: new Float32Array(0), // We don't store density field in memory
    meshData: result.meshData,
    isEmpty: result.isEmpty,
    isSolid: result.isSolid,
    createdAt: Date.now(),
    lastAccessedAt: Date.now(),
  };
}

export function useVolumetricManager({
  playerX,
  playerY,
  playerZ,
}: UseVolumetricManagerOptions) {
  const [loadedChunks, setLoadedChunks] = useState<
    Map<string, ILoadedVolumetricChunk>
  >(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const loadingRef = useRef<Set<string>>(new Set());
  const workerPoolRef = useRef(getWorkerPool());

  const setVolumetricChunks = useTerrainStore(
    (state) => state.setVolumetricChunks,
  );

  /**
   * Load or generate a single chunk using worker
   */
  const loadOrGenerateChunk = useCallback(
    async (
      chunkX: number,
      chunkY: number,
      chunkZ: number,
    ): Promise<ILoadedVolumetricChunk | null> => {
      const key = getChunkKey(chunkX, chunkY, chunkZ);

      if (loadingRef.current.has(key)) {
        return null;
      }

      loadingRef.current.add(key);

      try {
        // Try to load from IndexedDB first
        const cached = await getVolumetricChunk(key);
        if (cached) {
          return {
            ...cached,
            lastAccessedAt: Date.now(),
          };
        }

        // Generate using worker pool
        const result = await workerPoolRef.current.generateChunk(
          chunkX,
          chunkY,
          chunkZ,
        );

        const loadedChunk = chunkResultToLoaded(result);

        // Save to IndexedDB in background (don't await)
        saveVolumetricChunk(loadedChunk).catch((err) =>
          console.warn("Failed to cache chunk:", err),
        );

        return loadedChunk;
      } catch (error) {
        console.error(`Failed to load/generate chunk ${key}:`, error);
        return null;
      } finally {
        loadingRef.current.delete(key);
      }
    },
    [],
  );

  /**
   * Get required chunk coordinates based on player position
   */
  const getRequiredChunkCoords = useCallback((): Array<{
    chunkX: number;
    chunkY: number;
    chunkZ: number;
    dist: number;
  }> => {
    const { chunkX, chunkY, chunkZ } = worldToChunk(playerX, playerY, playerZ);
    const { loadDistanceH, loadDistanceV } = volumetricSettings;

    const chunks: Array<{
      chunkX: number;
      chunkY: number;
      chunkZ: number;
      dist: number;
    }> = [];

    for (let dx = -loadDistanceH; dx <= loadDistanceH; dx++) {
      for (let dy = -loadDistanceV; dy <= loadDistanceV; dy++) {
        for (let dz = -loadDistanceH; dz <= loadDistanceH; dz++) {
          const cx = chunkX + dx;
          const cy = chunkY + dy;
          const cz = chunkZ + dz;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          chunks.push({ chunkX: cx, chunkY: cy, chunkZ: cz, dist });
        }
      }
    }

    // Sort by distance (closest first)
    chunks.sort((a, b) => a.dist - b.dist);

    return chunks;
  }, [playerX, playerY, playerZ]);

  // Load chunks based on player position
  useEffect(() => {
    const { chunkX, chunkY, chunkZ } = worldToChunk(playerX, playerY, playerZ);
    const requiredCoords = getRequiredChunkCoords();

    // Find chunks that need to be loaded
    const chunksToLoad = requiredCoords.filter(
      (c) =>
        !loadedChunks.has(getChunkKey(c.chunkX, c.chunkY, c.chunkZ)) &&
        !loadingRef.current.has(getChunkKey(c.chunkX, c.chunkY, c.chunkZ)),
    );

    // Find chunks that should be unloaded
    const { unloadDistanceH, unloadDistanceV } = volumetricSettings;
    const chunksToUnload = Array.from(loadedChunks.keys()).filter((key) => {
      const { x, y, z } = parseChunkKey(key);
      const { h, v } = chunkDistance(x, y, z, chunkX, chunkY, chunkZ);
      return h > unloadDistanceH || v > unloadDistanceV;
    });

    // Unload distant chunks
    if (chunksToUnload.length > 0) {
      setLoadedChunks((prev) => {
        const next = new Map(prev);
        chunksToUnload.forEach((key) => next.delete(key));
        return next;
      });
    }

    // Load new chunks (process in batches)
    if (chunksToLoad.length > 0) {
      setIsLoading(true);

      const loadBatch = async () => {
        // Load more chunks at once since workers handle them in parallel
        const batchSize = 8;
        const batch = chunksToLoad.slice(0, batchSize);

        const results = await Promise.all(
          batch.map((c) => loadOrGenerateChunk(c.chunkX, c.chunkY, c.chunkZ)),
        );

        setLoadedChunks((prev) => {
          const next = new Map(prev);
          results.forEach((chunk) => {
            if (chunk) {
              next.set(chunk.key, chunk);
            }
          });
          return next;
        });

        if (chunksToLoad.length <= batchSize) {
          setIsLoading(false);
        }
      };

      loadBatch();
    } else if (isLoading && loadingRef.current.size === 0) {
      setIsLoading(false);
    }
  }, [
    playerX,
    playerY,
    playerZ,
    loadedChunks,
    loadOrGenerateChunk,
    getRequiredChunkCoords,
    isLoading,
  ]);

  // Sync loaded chunks to terrain store
  useEffect(() => {
    setVolumetricChunks(Array.from(loadedChunks.values()));
  }, [loadedChunks, setVolumetricChunks]);

  // Return chunks that have mesh data
  const visibleChunks = Array.from(loadedChunks.values()).filter(
    (chunk) => chunk.meshData !== null,
  );

  return {
    chunks: visibleChunks,
    allChunks: Array.from(loadedChunks.values()),
    isLoading,
    loadedCount: loadedChunks.size,
    pendingCount: workerPoolRef.current.getPendingCount(),
  };
}
