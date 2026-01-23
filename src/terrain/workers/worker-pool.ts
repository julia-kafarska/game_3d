/**
 * Worker pool for parallel volumetric terrain generation
 */

import VolumetricWorker from "./volumetric.worker?worker";
import {
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
  volumetricSettings,
} from "../../constants/settings";

interface PendingRequest {
  resolve: (result: ChunkResult) => void;
  reject: (error: Error) => void;
}

export interface ChunkResult {
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
}

interface WorkerState {
  worker: Worker;
  busy: boolean;
  ready: boolean;
}

class VolumetricWorkerPool {
  private workers: WorkerState[] = [];
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private requestQueue: Array<{
    chunkX: number;
    chunkY: number;
    chunkZ: number;
    requestId: string;
  }> = [];
  private requestIdCounter = 0;
  private initialized = false;

  constructor(private poolSize: number = navigator.hardwareConcurrency || 4) {
    // Limit to reasonable number
    this.poolSize = Math.min(Math.max(this.poolSize, 2), 8);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const config = {
      terrainSeed,
      chunkSize: volumetricSettings.chunkSize,
      chunkHeight: volumetricSettings.chunkHeight,
      resolution: volumetricSettings.resolution,
      isoLevel: volumetricSettings.isoLevel,
      caveEnabled: volumetricSettings.caveEnabled,
      caveThreshold: volumetricSettings.caveThreshold,
      caveFrequency: volumetricSettings.caveFrequency,
      minCaveHeight: volumetricSettings.minCaveHeight,
      maxCaveHeight: volumetricSettings.maxCaveHeight,
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
    };

    const initPromises: Promise<void>[] = [];

    for (let i = 0; i < this.poolSize; i++) {
      const worker = new VolumetricWorker();
      const state: WorkerState = { worker, busy: false, ready: false };
      this.workers.push(state);

      const initPromise = new Promise<void>((resolve) => {
        const onMessage = (e: MessageEvent) => {
          const { type, requestId, result, error } = e.data;

          switch (type) {
            case "ready":
              state.ready = true;
              resolve();
              break;

            case "chunkGenerated":
              state.busy = false;
              const pending = this.pendingRequests.get(requestId);
              if (pending) {
                this.pendingRequests.delete(requestId);
                pending.resolve(result);
              }
              this.processQueue();
              break;

            case "error":
              state.busy = false;
              const errorPending = this.pendingRequests.get(requestId);
              if (errorPending) {
                this.pendingRequests.delete(requestId);
                errorPending.reject(new Error(error));
              }
              this.processQueue();
              break;
          }
        };

        worker.onmessage = onMessage;
        worker.postMessage({ type: "init", data: { config } });
      });

      initPromises.push(initPromise);
    }

    await Promise.all(initPromises);
    this.initialized = true;
    console.log(
      `Volumetric worker pool initialized with ${this.poolSize} workers`,
    );
  }

  private getAvailableWorker(): WorkerState | null {
    return this.workers.find((w) => w.ready && !w.busy) || null;
  }

  private processQueue(): void {
    while (this.requestQueue.length > 0) {
      const worker = this.getAvailableWorker();
      if (!worker) break;

      const request = this.requestQueue.shift()!;
      worker.busy = true;
      worker.worker.postMessage({
        type: "generateChunk",
        data: {
          chunkX: request.chunkX,
          chunkY: request.chunkY,
          chunkZ: request.chunkZ,
          requestId: request.requestId,
        },
      });
    }
  }

  async generateChunk(
    chunkX: number,
    chunkY: number,
    chunkZ: number,
  ): Promise<ChunkResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const requestId = `req_${this.requestIdCounter++}`;

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      this.requestQueue.push({ chunkX, chunkY, chunkZ, requestId });
      this.processQueue();
    });
  }

  /**
   * Generate multiple chunks in parallel
   */
  async generateChunks(
    chunks: Array<{ chunkX: number; chunkY: number; chunkZ: number }>,
  ): Promise<ChunkResult[]> {
    return Promise.all(
      chunks.map((c) => this.generateChunk(c.chunkX, c.chunkY, c.chunkZ)),
    );
  }

  /**
   * Get number of pending requests
   */
  getPendingCount(): number {
    return this.pendingRequests.size + this.requestQueue.length;
  }

  /**
   * Terminate all workers
   */
  terminate(): void {
    for (const state of this.workers) {
      state.worker.terminate();
    }
    this.workers = [];
    this.pendingRequests.clear();
    this.requestQueue = [];
    this.initialized = false;
  }
}

// Singleton instance
let workerPool: VolumetricWorkerPool | null = null;

export function getWorkerPool(): VolumetricWorkerPool {
  if (!workerPool) {
    workerPool = new VolumetricWorkerPool();
  }
  return workerPool;
}

export function terminateWorkerPool(): void {
  if (workerPool) {
    workerPool.terminate();
    workerPool = null;
  }
}
