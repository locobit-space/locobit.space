/**
 * idb.ts — Low-level IndexedDB primitives.
 *
 * Single responsibility: wraps the raw IDBDatabase API so callers never
 * touch `IDBRequest`, `IDBTransaction`, or callback patterns directly.
 *
 * Rules:
 *  - No Vue reactivity here (no ref / reactive / computed).
 *  - No Nostr / domain logic here.
 *  - All functions are pure async utilities that accept a live `IDBDatabase`.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export interface StoreSchema {
  /** Object store name */
  name: string;
  /** IDB keyPath — must be a top-level field on every record */
  keyPath: string;
  /** Indexes to create on first open / upgrade */
  indexes?: {
    name: string;
    keyPath: string | string[];
    unique?: boolean;
  }[];
}

// ── Database open ──────────────────────────────────────────────────────────────

/**
 * Open (or create) an IndexedDB database.
 *
 * @param name      - database name
 * @param version   - schema version (increment to trigger `onupgradeneeded`)
 * @param stores    - object store definitions used in the upgrade handler
 */
export function openDatabase(
  name: string,
  version: number,
  stores: StoreSchema[]
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;

      for (const schema of stores) {
        let store: IDBObjectStore;

        if (!db.objectStoreNames.contains(schema.name)) {
          store = db.createObjectStore(schema.name, { keyPath: schema.keyPath });
        } else {
          // Access the existing store via the in-progress transaction
          store = (e.target as IDBOpenDBRequest).transaction!.objectStore(schema.name);
        }

        for (const idx of schema.indexes ?? []) {
          if (!store.indexNames.contains(idx.name)) {
            store.createIndex(idx.name, idx.keyPath, { unique: idx.unique ?? false });
          }
        }
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror  = () => reject(req.error);
    req.onblocked = () => reject(new Error(`IDB blocked: ${name}`));
  });
}

// ── Single-record operations ───────────────────────────────────────────────────

/** Insert or replace a record by its keyPath. */
export function idbPut<T>(
  db: IDBDatabase,
  store: string,
  record: T
): Promise<IDBValidKey> {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(store, "readwrite");
    const req = tx.objectStore(store).put(record);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
    tx.onerror    = () => reject(tx.error);
  });
}

/** Get a record by its primary key. Returns `null` if not found. */
export function idbGet<T>(
  db: IDBDatabase,
  store: string,
  key: IDBValidKey
): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve((req.result as T | undefined) ?? null);
    req.onerror   = () => reject(req.error);
  });
}

/** Delete a record by its primary key. */
export function idbDelete(
  db: IDBDatabase,
  store: string,
  key: IDBValidKey
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(store, "readwrite");
    const req = tx.objectStore(store).delete(key);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
    tx.onerror    = () => reject(tx.error);
  });
}

// ── Batch operations ───────────────────────────────────────────────────────────

/** Insert or replace multiple records in a single transaction. */
export function idbPutMany<T>(
  db: IDBDatabase,
  store: string,
  records: T[]
): Promise<void> {
  if (!records.length) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const tx  = db.transaction(store, "readwrite");
    const obj = tx.objectStore(store);
    records.forEach((r) => obj.put(r));
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

// ── Index queries ───────────────────────────────────────────────────────────────

/** Return all records that match `query` on the given index. */
export function idbGetAllByIndex<T>(
  db: IDBDatabase,
  store: string,
  indexName: string,
  query: IDBValidKey | IDBKeyRange
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx   = db.transaction(store, "readonly");
    const req  = tx.objectStore(store).index(indexName).getAll(query);
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror   = () => reject(req.error);
  });
}

/**
 * Cursor-based range scan on a compound or single index.
 * Returns results in `direction` order up to `limit` records.
 */
export function idbCursor<T>(
  db: IDBDatabase,
  store: string,
  indexName: string,
  range: IDBKeyRange,
  direction: IDBCursorDirection,
  limit: number
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx     = db.transaction(store, "readonly");
    const req    = tx.objectStore(store).index(indexName).openCursor(range, direction);
    const results: T[] = [];

    req.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (!cursor || results.length >= limit) {
        resolve(results);
        return;
      }
      results.push(cursor.value as T);
      cursor.continue();
    };
    req.onerror = () => reject(req.error);
  });
}

/** Count records matching `query` on index, falling back to full store count. */
export function idbCount(
  db: IDBDatabase,
  store: string,
  indexName?: string,
  query?: IDBValidKey | IDBKeyRange
): Promise<number> {
  return new Promise((resolve, reject) => {
    const tx      = db.transaction(store, "readonly");
    const target  = indexName
      ? tx.objectStore(store).index(indexName)
      : tx.objectStore(store);
    const req     = query ? target.count(query) : (target as IDBObjectStore).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}
