/**
 * useJournalDB — Journal-specific IndexedDB composable.
 *
 * Single responsibility: define the journal schema (JournalEventRecord) and
 * provide the `buildRecord` factory that maps raw Nostr events to that schema.
 *
 * All CRUD, sync-lifecycle, and query operations are delegated to the generic
 * `useDb()` composable — this file adds only what is unique to journals.
 *
 * Usage:
 *   const db = useJournalDB()
 *   await db.upsert(record)
 *   await db.getByKind(pubkey, 30001)
 *   await db.getByStatus(pubkey, "pending")
 *
 * Database : "laostr_journal"
 * Store    : "journal_events"
 * Kind     : 30001 (NIP-33 addressable replaceable event)
 */

import { useDb } from "./useDb";
import type { NostrEventRecord, AttachmentMeta, SyncStatus } from "~/types/nostr-idb";

// ── Journal kind constant ──────────────────────────────────────────────────────

/** Nostr event kind for private journal entries (NIP-33 addressable replaceable). */
export const JOURNAL_KIND = 30001;

// ── Journal-specific record type ───────────────────────────────────────────────

/**
 * A journal entry as stored in IndexedDB.
 * Extends the base `NostrEventRecord` with journal-domain fields.
 */
export interface JournalEventRecord extends NostrEventRecord {
  /** UTC date string from the `#date` tag  (YYYY-MM-DD). */
  date: string;
  /** Decrypted plaintext — cached locally so reads never need the relay. */
  decryptedContent: string;
  /** Value of the `#mood` tag. */
  mood: string;
  /** Parsed attachment metadata. */
  attachments: AttachmentMeta[];
}

// Re-export shared types so callers only need one import.
export type { SyncStatus, AttachmentMeta };

// ── Database config ────────────────────────────────────────────────────────────

const DB_CONFIG = {
  name:    "laostr_journal",
  version: 1,
  store:   "journal_events",
  /** `date` index is journal-specific — not in the generic built-in set. */
  extraIndexes: [
    { name: "date", keyPath: "date" },
  ],
};

// ── Composable ─────────────────────────────────────────────────────────────────

export const useJournalDB = () => {
  // Generic database instance — all CRUD/sync ops live here
  const db = useDb<JournalEventRecord>(DB_CONFIG);

  // ── Journal-specific helpers ───────────────────────────────────────────────

  /**
   * Build a `JournalEventRecord` from a raw Nostr event + its decrypted content.
   *
   * Keeps all Nostr → domain mapping in one place so it can be reused by
   * `useNostrPrivateJournal` for both relay events and optimistic local writes.
   */
  const buildRecord = (
    event: {
      id?: string;
      pubkey: string;
      kind: number;
      created_at: number;
      content: string;
      tags: string[][];
    },
    decryptedContent: string,
    opts: { syncStatus?: SyncStatus; localId?: string } = {}
  ): JournalEventRecord => {
    const tag = (key: string) =>
      event.tags.find((t) => t[0] === key)?.[1];

    const dTag    = tag("d") ?? String(event.created_at);
    const date    = tag("date") ?? new Date(event.created_at * 1000).toISOString().slice(0, 10);
    const mood    = tag("mood") ?? "okay";

    // Parse attachment tag groups: [url, …] [m, …] [size, …] [file-name, …] [xkey, …] [xnonce, …]
    const attachments: AttachmentMeta[] = event.tags
      .filter((t) => t[0] === "url")
      .map((urlTag) => {
        const idx  = event.tags.indexOf(urlTag);
        const pick = (key: string): string =>
          event.tags.slice(idx, idx + 6).find((t) => t[0] === key)?.[1] ?? "";

        return {
          url:             urlTag[1] ?? "",
          mimeType:        pick("m"),
          size:            Number(pick("size")),
          fileName:        pick("file-name"),
          encryptionKey:   pick("xkey"),
          encryptionNonce: pick("xnonce"),
        };
      });

    return {
      // Base NostrEventRecord fields
      localId:    opts.localId ?? crypto.randomUUID(),
      nostrId:    event.id ?? null,
      pubkey:     event.pubkey,
      kind:       event.kind,
      dTag,
      created_at: event.created_at,
      content:    event.content,
      tags:       event.tags,
      syncStatus: opts.syncStatus ?? "synced",
      updatedAt:  new Date().toISOString(),
      // Journal-specific fields
      date,
      decryptedContent,
      mood,
      attachments,
    };
  };

  // Spread all generic DB methods + add the journal factory
  return {
    ...db,
    buildRecord,
  };
};
