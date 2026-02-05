import { ISector } from "../../types/sector";
import { IVolumetricChunk } from "../../types/volumetric";

const DB_NAME = "terrain-db";
const DB_VERSION = 7; // Horizontal through-tunnels
const SECTOR_STORE_NAME = "sectors";
const VOLUMETRIC_STORE_NAME = "volumetric-chunks";

let dbInstance: IDBDatabase | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open terrain database"));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create or update sector store
      if (!db.objectStoreNames.contains(SECTOR_STORE_NAME)) {
        const store = db.createObjectStore(SECTOR_STORE_NAME, {
          keyPath: "key",
        });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }

      // Create volumetric chunks store
      if (!db.objectStoreNames.contains(VOLUMETRIC_STORE_NAME)) {
        const volumetricStore = db.createObjectStore(VOLUMETRIC_STORE_NAME, {
          keyPath: "key",
        });
        volumetricStore.createIndex("createdAt", "createdAt", {
          unique: false,
        });
      }
    };
  });
}

// ============================================
// SECTOR FUNCTIONS (Legacy 2D heightmap)
// ============================================

export async function getSector(key: string): Promise<ISector | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SECTOR_STORE_NAME, "readonly");
    const store = transaction.objectStore(SECTOR_STORE_NAME);
    const request = store.get(key);

    request.onerror = () => {
      reject(new Error(`Failed to get sector: ${key}`));
    };

    request.onsuccess = () => {
      resolve(request.result || null);
    };
  });
}

export async function saveSector(sector: ISector): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SECTOR_STORE_NAME, "readwrite");
    const store = transaction.objectStore(SECTOR_STORE_NAME);
    const request = store.put(sector);

    request.onerror = () => {
      reject(new Error(`Failed to save sector: ${sector.key}`));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

export async function hasSector(key: string): Promise<boolean> {
  const sector = await getSector(key);
  return sector !== null;
}

export async function deleteSector(key: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SECTOR_STORE_NAME, "readwrite");
    const store = transaction.objectStore(SECTOR_STORE_NAME);
    const request = store.delete(key);

    request.onerror = () => {
      reject(new Error(`Failed to delete sector: ${key}`));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

export async function getAllSectorKeys(): Promise<string[]> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SECTOR_STORE_NAME, "readonly");
    const store = transaction.objectStore(SECTOR_STORE_NAME);
    const request = store.getAllKeys();

    request.onerror = () => {
      reject(new Error("Failed to get sector keys"));
    };

    request.onsuccess = () => {
      resolve(request.result as string[]);
    };
  });
}

export async function clearAllSectors(): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SECTOR_STORE_NAME, "readwrite");
    const store = transaction.objectStore(SECTOR_STORE_NAME);
    const request = store.clear();

    request.onerror = () => {
      reject(new Error("Failed to clear sectors"));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

// ============================================
// VOLUMETRIC CHUNK FUNCTIONS
// ============================================

/**
 * Serializable version of volumetric chunk for storage
 * Converts TypedArrays to regular arrays for IndexedDB
 */
interface ISerializedVolumetricChunk {
  key: string;
  worldX: number;
  worldY: number;
  worldZ: number;
  densityField: number[];
  meshData: {
    positions: number[];
    normals: number[];
    colors: number[];
    indices: number[];
    vertexCount: number;
    triangleCount: number;
  } | null;
  isEmpty: boolean;
  isSolid: boolean;
  createdAt: number;
}

function serializeChunk(chunk: IVolumetricChunk): ISerializedVolumetricChunk {
  return {
    key: chunk.key,
    worldX: chunk.worldX,
    worldY: chunk.worldY,
    worldZ: chunk.worldZ,
    densityField: Array.from(chunk.densityField),
    meshData: chunk.meshData
      ? {
          positions: Array.from(chunk.meshData.positions),
          normals: Array.from(chunk.meshData.normals),
          colors: Array.from(chunk.meshData.colors),
          indices: Array.from(chunk.meshData.indices),
          vertexCount: chunk.meshData.vertexCount,
          triangleCount: chunk.meshData.triangleCount,
        }
      : null,
    isEmpty: chunk.isEmpty,
    isSolid: chunk.isSolid,
    createdAt: chunk.createdAt,
  };
}

function deserializeChunk(data: ISerializedVolumetricChunk): IVolumetricChunk {
  return {
    key: data.key,
    worldX: data.worldX,
    worldY: data.worldY,
    worldZ: data.worldZ,
    densityField: new Float32Array(data.densityField),
    meshData: data.meshData
      ? {
          positions: new Float32Array(data.meshData.positions),
          normals: new Float32Array(data.meshData.normals),
          colors: new Float32Array(data.meshData.colors),
          indices: new Uint32Array(data.meshData.indices),
          vertexCount: data.meshData.vertexCount,
          triangleCount: data.meshData.triangleCount,
        }
      : null,
    isEmpty: data.isEmpty,
    isSolid: data.isSolid,
    createdAt: data.createdAt,
  };
}

export async function getVolumetricChunk(
  key: string,
): Promise<IVolumetricChunk | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(VOLUMETRIC_STORE_NAME, "readonly");
    const store = transaction.objectStore(VOLUMETRIC_STORE_NAME);
    const request = store.get(key);

    request.onerror = () => {
      reject(new Error(`Failed to get volumetric chunk: ${key}`));
    };

    request.onsuccess = () => {
      if (request.result) {
        resolve(deserializeChunk(request.result as ISerializedVolumetricChunk));
      } else {
        resolve(null);
      }
    };
  });
}

export async function saveVolumetricChunk(
  chunk: IVolumetricChunk,
): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(VOLUMETRIC_STORE_NAME, "readwrite");
    const store = transaction.objectStore(VOLUMETRIC_STORE_NAME);
    const request = store.put(serializeChunk(chunk));

    request.onerror = () => {
      reject(new Error(`Failed to save volumetric chunk: ${chunk.key}`));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

export async function hasVolumetricChunk(key: string): Promise<boolean> {
  const chunk = await getVolumetricChunk(key);
  return chunk !== null;
}

export async function deleteVolumetricChunk(key: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(VOLUMETRIC_STORE_NAME, "readwrite");
    const store = transaction.objectStore(VOLUMETRIC_STORE_NAME);
    const request = store.delete(key);

    request.onerror = () => {
      reject(new Error(`Failed to delete volumetric chunk: ${key}`));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

export async function getAllVolumetricChunkKeys(): Promise<string[]> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(VOLUMETRIC_STORE_NAME, "readonly");
    const store = transaction.objectStore(VOLUMETRIC_STORE_NAME);
    const request = store.getAllKeys();

    request.onerror = () => {
      reject(new Error("Failed to get volumetric chunk keys"));
    };

    request.onsuccess = () => {
      resolve(request.result as string[]);
    };
  });
}

export async function clearAllVolumetricChunks(): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(VOLUMETRIC_STORE_NAME, "readwrite");
    const store = transaction.objectStore(VOLUMETRIC_STORE_NAME);
    const request = store.clear();

    request.onerror = () => {
      reject(new Error("Failed to clear volumetric chunks"));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Clear all terrain data (both sectors and volumetric chunks)
 * Useful for regenerating terrain with new settings
 */
export async function clearAllTerrainData(): Promise<void> {
  await clearAllSectors();
  await clearAllVolumetricChunks();
}
