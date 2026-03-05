# Private Journal — Offline-First Feature

> Agent handoff document — describes what was built, how it works, and where
> to extend it.

---

## Overview

The Private Journal was rebuilt as an **offline-first** feature. All journal
entries are stored in IndexedDB immediately on write; the Nostr relay is synced
in the background.  This means the journal works without an internet connection
and loads instantly from cache on every visit.

### Key behaviours

| Situation | Result |
|---|---|
| App opened online | Load from cache → relay sync in background |
| App opened offline | Load from cache, show "Offline" badge |
| Write entry offline | Save locally as `pending`, publish when reconnected |
| Relay publish fails | Status set to `failed`, auto-retried on next load |
| Delete entry offline | Soft-delete locally (status `deleted`), tombstone published when online |

---

## File structure

```
app/
├── composables/
│   ├── useJournalDB.ts              ← NEW: IndexedDB abstraction layer
│   └── useNostrPrivateJournal.ts    ← REWRITTEN: offline-first composable
└── pages/
    └── journals/
        └── index.vue                ← REWRITTEN: improved UI with scroll + sync badges
i18n/locales/
├── en-US.json                       ← Added 3 new journal keys
└── lo-LA.json                       ← Added 3 new journal keys (Lao translations)
```

---

## `useJournalDB.ts` — IndexedDB layer

### Database schema

| Property | Value |
|---|---|
| Database name | `laostr_journal` |
| Version | `1` |
| Object store | `journal_events` |
| Primary key | `localId` (client UUID — writable offline) |

**Indexes:**  
`nostrId`, `dTag`, `pubkey`, `date`, `created_at`, `syncStatus`,
`pubkey_createdAt` (compound)

### Core types

```typescript
type SyncStatus = "pending" | "synced" | "failed" | "deleted";

interface JournalEventRecord {
  localId: string;          // UUID, primary key
  nostrId: string | null;   // set once published to relay
  dTag: string;             // NIP-33 d-tag
  pubkey: string;
  kind: number;             // 30001
  created_at: number;       // Unix timestamp
  date: string;             // YYYY-MM-DD (from #date tag)
  content: string;          // raw NIP-04 encrypted text
  decryptedContent: string; // plaintext — stored for offline reads
  mood: string;
  tags: string[][];
  attachments: AttachmentMeta[];
  syncStatus: SyncStatus;
  updatedAt: string;        // ISO timestamp of last local change
}

interface AttachmentMeta {
  url: string;
  mimeType: string;
  size: number;
  fileName: string;
  encryptionKey: string;    // xchacha20poly1305 key (hex)
  encryptionNonce: string;  // xchacha20poly1305 nonce (hex)
}
```

### Public API

```typescript
const db = useJournalDB();

await db.upsert(record)                    // insert or update by localId
await db.upsertMany(records)               // bulk upsert
await db.getByPubkey(pubkey, limit, offset)
await db.getByLocalId(localId)
await db.getByNostrId(nostrId)
await db.getByStatus(pubkey, status)       // e.g. all "pending" entries
await db.updateSyncStatus(localId, status, nostrId?)
await db.markDeleted(localId)              // sets status = "deleted"
await db.hardDelete(localId)               // permanent removal from DB
await db.countByPubkey(pubkey)
db.buildRecord(event, decryptedContent)    // build a JournalEventRecord from a Nostr event
```

---

## `useNostrPrivateJournal.ts` — composable

### Strategy

1. **Read from local DB first** — instant load, no relay latency
2. **Relays sync in background** — upsert new events into DB, update UI
3. **Writes go to DB first** (status = `pending`) then relay-published  
4. **Online/offline event listeners** auto-trigger `syncPendingEntries()`

### Exported API

```typescript
const {
  // ── State ──────────────────────────────────────────────────────────────
  journalNotes,     // Ref<JournalEventRecord[]>   — working set, sorted newest-first
  hasMore,          // Ref<boolean>                 — more entries available for pagination
  isLoading,        // Ref<boolean>
  isSyncing,        // Ref<boolean>                 — background relay sync in progress
  isOffline,        // Ref<boolean>

  // ── Computed ───────────────────────────────────────────────────────────
  thisMonthCount,   // ComputedRef<number>
  streakCount,      // ComputedRef<number>          — consecutive days with an entry

  // ── Actions ────────────────────────────────────────────────────────────
  loadJournalEntries,       // (opts?: { limit, reset }) => Promise<void>
  loadMoreJournalEntries,   // () => Promise<void>
  createJournalEntry,       // (content, date, extraTags?) => Promise<JournalEventRecord | null>
  updateJournalEntry,       // (localId, content, date) => Promise<void>
  removeJournalEntry,       // (localId) => Promise<void>
  getJournalEntryByLocalId, // (localId) => JournalEventRecord | undefined
  syncPendingEntries,       // () => Promise<void>

  // ── Crypto helpers ─────────────────────────────────────────────────────
  encryptFile, // (file: File) => Promise<{ encryptedBuffer, key, nonce }>
  decryptFile, // (url, keyHex, nonceHex) => Promise<Blob>
} = useNostrPrivateJournal();
```

### Sync lifecycle state machine

```
[created offline]
      │
      ▼
   pending ──(relay publish OK)──► synced
      │
      └──(relay error / offline)──► failed ──(retry OK)──► synced
                                       │
                                  (retry fails forever, stays failed)

[user deletes entry]
   any state ──► deleted ──(tombstone published)──► hardDeleted (removed from DB)
```

---

## `pages/journals/index.vue` — UI

### Layout structure

```
<div class="h-full flex flex-col overflow-hidden">    ← full-height page
  <!-- Fixed header with title, status badges, stats -->
  <div class="shrink-0 border-b ...">
    Offline / Syncing / Synced badge
    New Entry button
    Stats: total entries, streak, this month
  </div>

  <!-- Scrollable body -->
  <div ref="scrollContainer" class="flex-1 overflow-y-auto">
    <div class="max-w-4xl mx-auto ...">
      <!-- Login gating -->
      <!-- Search + view toggle (list / calendar) -->
      <!-- Mood filter chips -->
      <!-- Writing prompt card (Transition animated) -->
      <!-- Calendar view (v-if="viewMode === 'calendar'") -->
      <!-- List view (v-if="viewMode === 'list'") -->
        Skeleton loaders
        Empty state
        Entry cards (grouped by date)
          Sync badge (pending = orange clock, failed = red !, synced = invisible)
          Mood chip
          Truncated content
          Edit / Delete buttons
      <!-- IntersectionObserver sentinel + manual Load More fallback -->
    </div>
  </div>

  <!-- Modals (outside scroll container, inside page div) -->
  UModal (New/Edit)
  UModal (View full entry)
  UModal (Delete confirm)
</div>
```

### Infinite scroll

`loadMoreSentinel` is a `div` at the bottom of the list, observed by an
`IntersectionObserver` mounted in `onMounted`.  When it becomes visible and
`hasMore` is true, `loadMoreJournalEntries()` is called automatically.  A
manual "Load More" button is also shown as a fallback.

### Sync status badges

Each entry card shows an inline badge when not synced:

| `syncStatus` | Icon | Colour |
|---|---|---|
| `pending` | `heroicons:clock` | amber |
| `failed` | `heroicons:exclamation-circle` | red |
| `synced` | *(hidden)* | — |

The global header badge shows the current connection state:

| State | Label | Colour |
|---|---|---|
| `isOffline` | "Offline" | red |
| `isSyncing` | "Syncing…" | amber |
| default | "Synced" | green |

---

## Nostr protocol details

| Property | Value |
|---|---|
| Event kind | `30001` (NIP-33 addressable replaceable) |
| d-tag | `journal:{YYYY-MM-DD}:{pubkey[0..7]}` |
| Content encryption | NIP-04 (`nip04.encrypt` / `nip04.decrypt`) |
| File encryption | `xchacha20poly1305` (from `@noble/ciphers/chacha`) |
| Relay filter | `#t: ["journal"]` |

### Tag structure

```json
[
  ["d", "journal:2025-01-15:a1b2c3d4"],
  ["t", "journal"],
  ["date", "2025-01-15"],
  ["mood", "happy"],
  ["url", "https://…/file.jpg", "image/jpeg", "12345", "photo.jpg", "xkey:...", "xnonce:..."]
]
```

---

## i18n keys added

Added to `i18n/locales/en-US.json` and `i18n/locales/lo-LA.json`:

| Key | English value |
|---|---|
| `journal.no_results` | "No Results Found" |
| `journal.try_different_filter` | "Try a different search term or filter" |
| `journal.all_loaded` | "All entries loaded" |

---

## Integration points for future features

### Search
The `filteredGroupedEntries` computed property already filters by
`searchQuery` (text) and `selectedMood`.  To add full-text search across the
local DB, extend `useJournalDB` with an `IDBIndex` on `decryptedContent` or
implement a simple in-memory search on `getByPubkey` results.

### Export / Backup
Call `db.getByPubkey(pubkey, Infinity, 0)` to fetch all entries, then
serialize to JSON or NDJSON.

### Tags / Categories
The `JournalEventRecord.tags` array stores the raw Nostr event tags.  To
support user-defined tags, add a `#tag` tag to events and a new `tags[]`
index in the DB schema (increment DB version to `2`).

### Attachments
`encryptFile` / `decryptFile` helpers are already in `useNostrPrivateJournal`.
The `JournalFileUploader.vue` component exists at
`app/components/JournalFileUploader.vue` and can be wired into the edit modal
`formState.attachments`.

### Notifications / Reminders
Subscribe to the `syncStatus` reactivity: watch for `isSyncing` → `false`
after a write and show a toast confirming the entry was published.

### Analytics / Charts
`thisMonthCount` and `streakCount` are already computed.  Connect them to
`CommonLineChart` or `CommonPieChart` to show writing history.

### Multi-device sync
`loadJournalEntries()` performs a relay query on every call.  Conflict
resolution uses the Nostr event's `created_at` — the newest event for a given
`dTag` wins (standard NIP-33 replaceable logic).

---

## Known limitations

- **DB version is hardcoded at `1`** — any schema change requires incrementing
  the version and writing a migration in the `onupgradeneeded` handler of
  `useJournalDB.ts`.
- **Failed entries are retried on load**, not on a timer — consider adding a
  retry interval for long offline sessions.
- **NIP-04 is deprecated** in favour of NIP-44 — plan migration before NIP-04
  relay support is dropped.
