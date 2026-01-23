import { ISector } from "../../types/sector";

const DB_NAME = "terrain-db";
const DB_VERSION = 1;
const STORE_NAME = "sectors";

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

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
  });
}

export async function getSector(key: string): Promise<ISector | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
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
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
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
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
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
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
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
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onerror = () => {
      reject(new Error("Failed to clear sectors"));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}
