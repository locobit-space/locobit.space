/**
 * useNostrPrivateJournal
 *
 * Offline-first private journal built on NIP-04 encryption + kind-30001
 * replaceable events.  IndexedDB is the source of truth for reads; relays
 * are synced in the background.
 *
 * Sync lifecycle
 * ──────────────
 *  pending  → written locally, awaiting relay publish
 *  synced   → confirmed on ≥ 1 relay
 *  failed   → relay rejected / offline (auto-retried on next load)
 *  deleted  → soft-delete locally, tombstone queued for relay
 */

import { finalizeEvent } from "nostr-tools/pure";
import { hexToBytes } from "@noble/hashes/utils";
import { nip04 } from "nostr-tools";
import { xchacha20poly1305 } from "@noble/ciphers/chacha";
import { randomBytes } from "@noble/hashes/utils";
import { useJournalDB, type JournalEventRecord } from "./useJournalDB";

// ── Constants ───────────────────────────────────────────────────────────────

const PRIVATE_NOTE_KIND = 30001;
const DEFAULT_LIMIT = 20;

// ── Composable ───────────────────────────────────────────────────────────────

export const useNostrPrivateJournal = () => {
  // ── Dependencies ──────────────────────────────────────────────────────────

  const { $nostr } = useNuxtApp();
  const { pool } = $nostr;
  const { user } = useNostrUser();
  const { error, isLoading } = useNostrFeed();
  const { DEFAULT_RELAYS: RELAYS } = useNostrRelay();
  const db = useJournalDB();

  // ── Reactive state ────────────────────────────────────────────────────────

  /** Working set shown in the UI (newest-first, excludes soft-deletes) */
  const journalNotes = ref<JournalEventRecord[]>([]);

  /** True when there may be older entries not yet loaded */
  const hasMore = useState<boolean>("journal_hasMore", () => true);

  /** Whether we are currently fetching from relays (not just reading cache) */
  const isSyncing = ref(false);

  /** True when the browser is offline */
  const isOffline = ref(!import.meta.client || !navigator.onLine);

  // ── Online/offline detection ──────────────────────────────────────────────

  if (import.meta.client) {
    window.addEventListener("online", () => {
      isOffline.value = false;
      syncPendingEntries();
    });
    window.addEventListener("offline", () => {
      isOffline.value = true;
    });
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  const encrypt = (plaintext: string) => {
    if (!user.value) throw new Error("No user");
    return nip04.encrypt(user.value.privateKey, user.value.publicKey, plaintext);
  };

  const decrypt = (ciphertext: string) => {
    if (!user.value) throw new Error("No user");
    return nip04.decrypt(user.value.privateKey, user.value.publicKey, ciphertext);
  };

  const publishEvent = async (template: any) => {
    if (!user.value) throw new Error("No user");
    const signed = finalizeEvent(template, hexToBytes(user.value.privateKey));
    await Promise.any(pool.publish(RELAYS, signed));
    return signed;
  };

  const mergeRelayEvents = async (events: any[]): Promise<JournalEventRecord[]> => {
    if (!user.value) return [];
    const records: JournalEventRecord[] = [];

    for (const event of events) {
      if (!event.content) continue;
      try {
        const decryptedContent = decrypt(event.content);
        const dTag = event.tags.find((t: string[]) => t[0] === "d")?.[1];
        if (!dTag) continue;

        const existing = await db.getByNostrId(event.id);
        if (existing) {
          if (event.created_at >= existing.created_at) {
            existing.decryptedContent = decryptedContent;
            existing.content = event.content;
            existing.created_at = event.created_at;
            existing.tags = event.tags;
            existing.mood = event.tags.find((t: string[]) => t[0] === "mood")?.[1] ?? existing.mood;
            existing.syncStatus = "synced";
            existing.nostrId = event.id;
            existing.updatedAt = new Date().toISOString();
            await db.upsert(existing);
            records.push(existing);
          }
        } else {
          const record = db.buildRecord(event, decryptedContent, { syncStatus: "synced" });
          await db.upsert(record);
          records.push(record);
        }
      } catch {
        // Skip events we can't decrypt
      }
    }
    return records;
  };

  // ── Load ──────────────────────────────────────────────────────────────────

  /**
   * Cache-first load: show IndexedDB data instantly, then sync relay in bg.
   */
  const loadJournalEntries = async (opts: { limit?: number; reset?: boolean } = {}) => {
    if (!user.value) return;
    const limit = opts.limit ?? DEFAULT_LIMIT;

    if (opts.reset) {
      journalNotes.value = [];
      hasMore.value = true;
    }

    isLoading.value = true;

    // Step 1 — instant cache read
    const cached = await db.getByPubkey(user.value.publicKey, { limit });
    if (cached.length) journalNotes.value = cached;

    // Step 2 — relay sync in background
    isSyncing.value = true;
    try {
      const filter: any = {
        kinds: [PRIVATE_NOTE_KIND],
        authors: [user.value.publicKey],
        "#t": ["journal"],
        limit,
      };
      const events = await pool.querySync(RELAYS, filter);
      await mergeRelayEvents(events);

      const fresh = await db.getByPubkey(user.value.publicKey, { limit });
      journalNotes.value = fresh;
      hasMore.value = events.length >= limit;
    } catch (e) {
      error.value = e;
    } finally {
      isSyncing.value = false;
      isLoading.value = false;
    }
  };

  /**
   * Load the next page (infinite scroll).
   */
  const loadMoreJournalEntries = async () => {
    if (!hasMore.value || isLoading.value || !user.value) return;
    isLoading.value = true;

    const oldest = journalNotes.value[journalNotes.value.length - 1];
    const before = oldest ? oldest.created_at - 1 : undefined;
    const cached = await db.getByPubkey(user.value.publicKey, { limit: DEFAULT_LIMIT, before });

    isSyncing.value = true;
    try {
      const filter: any = {
        kinds: [PRIVATE_NOTE_KIND],
        authors: [user.value.publicKey],
        "#t": ["journal"],
        limit: DEFAULT_LIMIT,
        until: before,
      };
      const events = await pool.querySync(RELAYS, filter);
      await mergeRelayEvents(events);

      const page = await db.getByPubkey(user.value.publicKey, { limit: DEFAULT_LIMIT, before });
      const existingIds = new Set(journalNotes.value.map((n) => n.localId));
      journalNotes.value.push(...page.filter((e) => !existingIds.has(e.localId)));
      hasMore.value = events.length >= DEFAULT_LIMIT;
    } catch {
      const existingIds = new Set(journalNotes.value.map((n) => n.localId));
      journalNotes.value.push(...cached.filter((e) => !existingIds.has(e.localId)));
      hasMore.value = cached.length >= DEFAULT_LIMIT;
    } finally {
      isSyncing.value = false;
      isLoading.value = false;
    }
  };

  // ── Create ────────────────────────────────────────────────────────────────

  const createJournalEntry = async (
    content: string,
    date: string,
    extraTags: string[][] = []
  ): Promise<JournalEventRecord | null> => {
    if (!user.value || !content.trim()) return null;

    const dTag = String(Math.floor(Date.now() / 1000));
    const created_at = Math.floor(Date.now() / 1000);
    const encryptedContent = await encrypt(content);
    const tags: string[][] = [["d", dTag], ["date", date], ["t", "journal"], ...extraTags];
    const localId = crypto.randomUUID();

    const record = db.buildRecord(
      { id: null, pubkey: user.value.publicKey, kind: PRIVATE_NOTE_KIND, created_at, tags, content: encryptedContent },
      content,
      { syncStatus: "pending", localId }
    );
    await db.upsert(record);
    journalNotes.value = [record, ...journalNotes.value];

    if (!isOffline.value) {
      try {
        const signed = await publishEvent({ kind: PRIVATE_NOTE_KIND, created_at, tags, content: encryptedContent });
        await db.updateSyncStatus(localId, "synced", signed.id);
        record.syncStatus = "synced";
        record.nostrId = signed.id;
        const idx = journalNotes.value.findIndex((n) => n.localId === localId);
        if (idx !== -1) Object.assign(journalNotes.value[idx], { syncStatus: "synced", nostrId: signed.id });
      } catch {
        await db.updateSyncStatus(localId, "failed");
        record.syncStatus = "failed";
      }
    }

    return record;
  };

  // ── Update ────────────────────────────────────────────────────────────────

  const updateJournalEntry = async (
    localId: string,
    newContent: string,
    newDate: string
  ): Promise<boolean> => {
    if (!user.value) return false;
    const record = await db.getByLocalId(localId);
    if (!record) return false;

    const encryptedContent = await encrypt(newContent);
    const created_at = Math.floor(Date.now() / 1000);
    const tags: string[][] = [
      ["d", record.dTag],
      ["date", newDate],
      ["t", "journal"],
      ["mood", record.mood],
    ];

    Object.assign(record, {
      decryptedContent: newContent,
      content: encryptedContent,
      date: newDate,
      created_at,
      tags,
      syncStatus: isOffline.value ? "pending" : record.syncStatus,
      updatedAt: new Date().toISOString(),
    });
    await db.upsert(record);

    const idx = journalNotes.value.findIndex((n) => n.localId === localId);
    if (idx !== -1) journalNotes.value[idx] = { ...record };

    if (!isOffline.value) {
      try {
        const signed = await publishEvent({ kind: PRIVATE_NOTE_KIND, created_at, tags, content: encryptedContent });
        await db.updateSyncStatus(localId, "synced", signed.id);
        if (idx !== -1) Object.assign(journalNotes.value[idx], { syncStatus: "synced", nostrId: signed.id });
      } catch {
        await db.updateSyncStatus(localId, "failed");
        if (idx !== -1) journalNotes.value[idx].syncStatus = "failed";
      }
    }

    return true;
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const removeJournalEntry = async (localId: string): Promise<boolean> => {
    if (!user.value) return false;
    const record = await db.getByLocalId(localId);
    if (!record) return false;

    journalNotes.value = journalNotes.value.filter((n) => n.localId !== localId);

    if (!isOffline.value && record.nostrId) {
      try {
        await publishEvent({
          kind: PRIVATE_NOTE_KIND,
          created_at: Math.floor(Date.now() / 1000),
          tags: [["d", record.dTag], ["t", "journal"]],
          content: "",
        });
        await db.hardDelete(localId);
      } catch {
        await db.markDeleted(localId);
      }
    } else if (record.syncStatus === "pending") {
      await db.hardDelete(localId);
    } else {
      await db.markDeleted(localId);
    }

    return true;
  };

  // ── Background sync ───────────────────────────────────────────────────────

  const syncPendingEntries = async () => {
    if (!user.value) return;
    const pubkey = user.value.publicKey;
    const queue = [
      ...(await db.getByStatus(pubkey, "pending")),
      ...(await db.getByStatus(pubkey, "failed")),
    ];

    for (const record of queue) {
      try {
        const signed = await publishEvent({
          kind: PRIVATE_NOTE_KIND,
          created_at: record.created_at,
          tags: record.tags,
          content: record.content,
        });
        await db.updateSyncStatus(record.localId, "synced", signed.id);
        const idx = journalNotes.value.findIndex((n) => n.localId === record.localId);
        if (idx !== -1) Object.assign(journalNotes.value[idx], { syncStatus: "synced", nostrId: signed.id });
      } catch {
        await db.updateSyncStatus(record.localId, "failed");
      }
    }

    for (const record of await db.getByStatus(user.value.publicKey, "deleted")) {
      if (!record.nostrId) { await db.hardDelete(record.localId); continue; }
      try {
        await publishEvent({
          kind: PRIVATE_NOTE_KIND,
          created_at: Math.floor(Date.now() / 1000),
          tags: [["d", record.dTag], ["t", "journal"]],
          content: "",
        });
        await db.hardDelete(record.localId);
      } catch { /* retry later */ }
    }
  };

  // ── Computed stats ────────────────────────────────────────────────────────

  const thisMonthCount = computed(() => {
    const now = new Date();
    return journalNotes.value.filter((n) => {
      const d = new Date(n.created_at * 1000);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  });

  const streakCount = computed(() => {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const uniqueDays = [
      ...new Set(
        journalNotes.value.map((n) => {
          const d = new Date(n.created_at * 1000);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        })
      ),
    ].sort((a, b) => b - a);
    for (let i = 0; i < uniqueDays.length; i++) {
      if (uniqueDays[i] === today.getTime() - i * 86_400_000) streak++;
      else break;
    }
    return streak;
  });

  // ── File encryption (for JournalFileUploader) ─────────────────────────────

  async function encryptFile(file: File) {
    const key = randomBytes(32);
    const nonce = randomBytes(24);
    const buffer = await file.arrayBuffer();
    const cipher = xchacha20poly1305(key, nonce);
    return {
      encrypted: cipher.encrypt(new Uint8Array(buffer)),
      key: Buffer.from(key).toString("base64"),
      nonce: Buffer.from(nonce).toString("base64"),
      mime: file.type,
      size: file.size,
      name: file.name,
    };
  }

  async function decryptFile(url: string, base64Key: string, base64Nonce: string) {
    const key = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));
    const nonce = Uint8Array.from(atob(base64Nonce), (c) => c.charCodeAt(0));
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength < 16) throw new Error("File too small");
    const cipher = xchacha20poly1305(key, nonce);
    return new Blob([cipher.decrypt(new Uint8Array(buffer))]);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  return {
    journalNotes,
    hasMore,
    isLoading,
    isSyncing,
    isOffline,
    thisMonthCount,
    streakCount,

    createJournalEntry,
    updateJournalEntry,
    removeJournalEntry,
    getJournalEntryByLocalId: db.getByLocalId,

    loadJournalEntries,
    loadMoreJournalEntries,
    syncPendingEntries,

    encryptFile,
    decryptFile,
  };
};
