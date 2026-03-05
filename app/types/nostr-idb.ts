/**
 * nostr-idb.ts — Shared types for Nostr event records stored in IndexedDB.
 *
 * Every feature that persists Nostr events locally (journal, GMS, finance,
 * social feed…) builds on these base types so the generic `useDb()` composable
 * can apply common operations (sync status, kind filtering, pubkey scoping)
 * without knowing feature-specific fields.
 */

// ── Sync lifecycle ─────────────────────────────────────────────────────────────

/**
 * Tracks whether a locally-stored event has been published to a relay.
 *
 * State machine:
 *
 *   pending ──(relay OK)──► synced
 *     │
 *     └──(relay error)──► failed ──(retry OK)──► synced
 *
 *   any ──(user deletes)──► deleted ──(tombstone published)──► [hard removed]
 */
export type SyncStatus = "pending" | "synced" | "failed" | "deleted";

// ── Base record ────────────────────────────────────────────────────────────────

/**
 * Minimum fields every Nostr-backed IDB record must carry.
 *
 * Features extend this with their own domain fields.  The generic `useDb()`
 * composable only needs these fields to implement pubkey scoping, kind
 * filtering, and sync management.
 */
export interface NostrEventRecord {
  /** Client-generated UUID — primary key, writable immediately while offline. */
  localId: string;

  /** Nostr event id (`event.id`).  `null` until published to a relay. */
  nostrId: string | null;

  /** Author pubkey (hex). */
  pubkey: string;

  /**
   * Nostr event kind number.
   * Stored so every query can filter by kind without parsing content.
   *
   * Common project kinds:
   *   30001  → private journal entry  (NIP-33 replaceable)
   *   31000  → GMS plant record
   *   31001  → GMS irrigation log
   *   31100+ → other GardenOS / BitOS kinds
   */
  kind: number;

  /** NIP-33 `d` tag value — identifies a replaceable event within its kind. */
  dTag: string;

  /** Unix timestamp (seconds) — mirrors `event.created_at`. */
  created_at: number;

  /** Raw event content (may be NIP-04 encrypted). */
  content: string;

  /** Full tag array (`event.tags`). */
  tags: string[][];

  /** Current sync state against the relay. */
  syncStatus: SyncStatus;

  /** ISO-8601 string — when this local record was last written. */
  updatedAt: string;
}

// ── Attachment helper ──────────────────────────────────────────────────────────

/**
 * Metadata parsed from `url` / `m` / `size` / `file-name` / `xkey` / `xnonce`
 * tag groups on journal entries.
 */
export interface AttachmentMeta {
  url: string;
  mimeType: string;
  size: number;
  fileName: string;
  /** xchacha20poly1305 key (hex) */
  encryptionKey: string;
  /** xchacha20poly1305 nonce (hex) */
  encryptionNonce: string;
}

// ── Query helpers ──────────────────────────────────────────────────────────────

/** Options accepted by the paginated `getByPubkey` / `getByKind` queries. */
export interface DbQueryOptions {
  /** Maximum records to return (default: 20). */
  limit?: number;
  /**
   * Cursor — only return events with `created_at` strictly less than this
   * value.  Pass the smallest `created_at` from the last page to paginate.
   */
  before?: number;
}
