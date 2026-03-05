/**
 * useDb — Generic IndexedDB composable for Nostr event persistence.
 *
 * Single responsibility: CRUD + sync-status management for ONE IDB database
 * whose records all extend `NostrEventRecord`.
 *
 * Any feature can instantiate its own database:
 *
 *   const journal = useDb({ name: "laostr_journal", version: 1, store: "journal_events" })
 *   const gms     = useDb({ name: "laostr_gms",     version: 1, store: "gms_events" })
 *
 * Every database gets the same standard indexes automatically (pubkey, kind,
 * nostrId, dTag, created_at, syncStatus, pubkey+kind compound, pubkey+created_at
 * compound) so consumers can call `getByKind`, `getByStatus`, etc. without
 * any extra configuration.
 */

import {
  openDatabase,
  idbPut,
  idbPutMany,
  idbGet,
  idbDelete,
  idbGetAllByIndex,
  idbCursor,
  type StoreSchema,
} from "~/lib/idb";
import type {
  NostrEventRecord,
  SyncStatus,
  DbQueryOptions,
} from "~/types/nostr-idb";

// ── Config ─────────────────────────────────────────────────────────────────────

export interface UseDbConfig {
  /** IndexedDB database name — one per feature is recommended. */
  name: string;
  /** Schema version — increment when adding new indexes or stores. */
  version: number;
  /** Object store name inside the database. */
  store: string;
  /**
   * Extra feature-specific indexes beyond the built-in set.
   * Built-in indexes: nostrId, pubkey, kind, dTag, created_at, syncStatus,
   * pubkey_kind (compound), pubkey_createdAt (compound).
   */
  extraIndexes?: StoreSchema["indexes"];
}

// ── Standard schema builder ────────────────────────────────────────────────────

function buildSchema(config: UseDbConfig): StoreSchema {
  const builtIn: StoreSchema["indexes"] = [
    { name: "nostrId",         keyPath: "nostrId" },
    { name: "pubkey",          keyPath: "pubkey" },
    { name: "kind",            keyPath: "kind" },
    { name: "dTag",            keyPath: "dTag" },
    { name: "created_at",      keyPath: "created_at" },
    { name: "syncStatus",      keyPath: "syncStatus" },
    { name: "pubkey_kind",     keyPath: ["pubkey", "kind"] },
    { name: "pubkey_createdAt",keyPath: ["pubkey", "created_at"] },
  ];

  return {
    name:     config.store,
    keyPath:  "localId",
    indexes:  [...builtIn, ...(config.extraIndexes ?? [])],
  };
}

// ── Composable ─────────────────────────────────────────────────────────────────

export const useDb = <T extends NostrEventRecord>(config: UseDbConfig) => {
  // Lazy singleton — one IDBDatabase instance per composable call
  let _db: IDBDatabase | null = null;

  const getDB = async (): Promise<IDBDatabase> => {
    if (_db) return _db;
    _db = await openDatabase(config.name, config.version, [buildSchema(config)]);
    return _db;
  };

  // ── Write ──────────────────────────────────────────────────────────────────

  /** Insert or fully replace a record. */
  const upsert = async (record: T): Promise<void> => {
    const db = await getDB();
    await idbPut(db, config.store, record);
  };

  /** Bulk upsert — uses a single transaction for efficiency. */
  const upsertMany = async (records: T[]): Promise<void> => {
    if (!records.length) return;
    const db = await getDB();
    await idbPutMany(db, config.store, records);
  };

  // ── Read ───────────────────────────────────────────────────────────────────

  /** Fetch a record by its client UUID. Returns `null` if not found. */
  const getByLocalId = async (localId: string): Promise<T | null> => {
    const db = await getDB();
    return idbGet<T>(db, config.store, localId);
  };

  /** Fetch a record by its Nostr event id. Returns `null` if not found. */
  const getByNostrId = async (nostrId: string): Promise<T | null> => {
    const db   = await getDB();
    const rows = await idbGetAllByIndex<T>(
      db, config.store, "nostrId", IDBKeyRange.only(nostrId)
    );
    return rows[0] ?? null;
  };

  /**
   * Paginated newest-first load scoped to a pubkey.
   * Excludes soft-deleted records.
   */
  const getByPubkey = async (
    pubkey: string,
    opts: DbQueryOptions = {}
  ): Promise<T[]> => {
    const { limit = 20, before } = opts;
    const db = await getDB();

    const upper = before ?? Number.MAX_SAFE_INTEGER;
    const range = IDBKeyRange.bound([pubkey, 0], [pubkey, upper]);

    const rows = await idbCursor<T>(
      db, config.store, "pubkey_createdAt", range, "prev", limit + 50
    );

    return rows
      .filter((r) => r.syncStatus !== "deleted")
      .slice(0, limit);
  };

  /**
   * Paginated newest-first load scoped to a pubkey **and** a Nostr kind.
   * Useful when one database stores multiple event kinds (e.g. GMS).
   * Excludes soft-deleted records.
   */
  const getByKind = async (
    pubkey: string,
    kind: number,
    opts: DbQueryOptions = {}
  ): Promise<T[]> => {
    const { limit = 20, before } = opts;
    const db = await getDB();

    // Use pubkey_kind compound index to narrow to this kind,
    // then filter by created_at in JS (IDB compound ranges don't allow inequality on second key easily).
    const rows = await idbGetAllByIndex<T>(
      db, config.store, "pubkey_kind", IDBKeyRange.only([pubkey, kind])
    );

    return rows
      .filter((r) => r.syncStatus !== "deleted")
      .filter((r) => before === undefined || r.created_at < before)
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, limit);
  };

  /**
   * Return all records with a specific `syncStatus` for a pubkey.
   * Used to find `pending` / `failed` entries for retry.
   */
  const getByStatus = async (
    pubkey: string,
    status: SyncStatus
  ): Promise<T[]> => {
    const db   = await getDB();
    const rows = await idbGetAllByIndex<T>(
      db, config.store, "syncStatus", IDBKeyRange.only(status)
    );
    return rows.filter((r) => r.pubkey === pubkey);
  };

  /**
   * Return all records with a specific `syncStatus` for a pubkey **and** kind.
   */
  const getByStatusAndKind = async (
    pubkey: string,
    kind: number,
    status: SyncStatus
  ): Promise<T[]> => {
    const rows = await getByStatus(pubkey, status);
    return rows.filter((r) => r.kind === kind);
  };

  // ── Sync management ────────────────────────────────────────────────────────

  /**
   * Update only `syncStatus` (and optionally `nostrId`) of a record.
   * Avoids rewriting the entire record for relay acknowledgements.
   */
  const updateSyncStatus = async (
    localId: string,
    status: SyncStatus,
    nostrId?: string
  ): Promise<void> => {
    const db     = await getDB();
    const record = await idbGet<T>(db, config.store, localId);
    if (!record) return;

    record.syncStatus = status;
    record.updatedAt  = new Date().toISOString();
    if (nostrId !== undefined) record.nostrId = nostrId;

    await idbPut(db, config.store, record);
  };

  /**
   * Soft-delete: sets `syncStatus = "deleted"` so the tombstone event can be
   * published when online.  Call `hardDelete` after the tombstone is confirmed.
   */
  const markDeleted = async (localId: string): Promise<void> => {
    await updateSyncStatus(localId, "deleted");
  };

  /**
   * Permanently remove a record from IndexedDB.
   * Should only be called after the relay tombstone is confirmed.
   */
  const hardDelete = async (localId: string): Promise<void> => {
    const db = await getDB();
    await idbDelete(db, config.store, localId);
  };

  // ── Count ──────────────────────────────────────────────────────────────────

  /**
   * Count active (non-deleted) records for a pubkey.
   * Pass `kind` to count only a specific event kind.
   */
  const count = async (pubkey: string, kind?: number): Promise<number> => {
    const rows = kind !== undefined
      ? await getByKind(pubkey, kind, { limit: 99999 })
      : await getByPubkey(pubkey,    { limit: 99999 });
    return rows.length;
  };

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    // Write
    upsert,
    upsertMany,
    // Read
    getByLocalId,
    getByNostrId,
    getByPubkey,
    getByKind,
    getByStatus,
    getByStatusAndKind,
    // Sync lifecycle
    updateSyncStatus,
    markDeleted,
    hardDelete,
    // Aggregate
    count,
  };
};

/** Infer the return type of `useDb` for use in feature composables. */
export type DbInstance<T extends NostrEventRecord> = ReturnType<typeof useDb<T>>;
