import type { QueuedVisit, RejectedQueuedVisit, VisitQueueStore } from "@features/stands/lib/visit-queue";

const DATABASE_VERSION = 1;

const PENDING = "pending";

const REJECTED = "rejected";

type StoreName = typeof PENDING | typeof REJECTED;

/**
 * The offline queue of a kiosk in IndexedDB (RF-35), one database per stand: a visit taken at a stand is only sent by a
 * session of that same stand. Nothing opens until the first read, so creating the store during a render is safe.
 */
export function createIndexedDbVisitQueueStore(standCode: string): VisitQueueStore {
  let opening: Promise<IDBDatabase> | null = null;
  const open = () => (opening ??= openDatabase(`ute3-kiosk-queue-${standCode}`));

  return {
    listPending: async () => readAll<QueuedVisit>(await open(), PENDING),
    addPending: async (visit) => write(await open(), PENDING, (store) => store.put(visit)),
    removePending: async (ids) => write(await open(), PENDING, (store) => ids.forEach((id) => store.delete(id))),
    listRejected: async () => readAll<RejectedQueuedVisit>(await open(), REJECTED),
    addRejected: async (visits) =>
      write(await open(), REJECTED, (store) => visits.forEach((visit) => store.put(visit))),
  };
}

function openDatabase(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(PENDING, { keyPath: "id" });
      request.result.createObjectStore(REJECTED, { keyPath: "id" });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("No se pudo abrir la cola del kiosko."));
  });
}

function readAll<Row>(database: IDBDatabase, name: StoreName): Promise<Row[]> {
  return new Promise((resolve, reject) => {
    const request = database.transaction(name, "readonly").objectStore(name).getAll();

    // SAFETY: each store only receives the rows its own functions write, so the rows have that shape.
    request.onsuccess = () => resolve(request.result as Row[]);
    request.onerror = () => reject(request.error ?? new Error("No se pudo leer la cola del kiosko."));
  });
}

// Resolves once the transaction commits, so a visit is on disk before the kiosk says "gracias".
function write(database: IDBDatabase, name: StoreName, change: (store: IDBObjectStore) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(name, "readwrite");

    change(transaction.objectStore(name));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("No se pudo guardar en la cola del kiosko."));
  });
}
