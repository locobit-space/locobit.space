import { finalizeEvent } from "nostr-tools/pure";
import { hexToBytes } from "@noble/hashes/utils";
// Add these imports to your existing useNostr.ts
import { nip04 } from "nostr-tools";
import { xchacha20poly1305 } from "@noble/ciphers/chacha";
import { randomBytes } from "@noble/hashes/utils";

// Extend your existing useNostr.ts with these new functions
export const useNostrPrivateJournal = () => {
  const { $nostr } = useNuxtApp();
  const { pool } = $nostr;

  const { user } = useNostrUser();
  const { error, isLoading } = useNostrFeed();
  const { DEFAULT_RELAYS: RELAYS, queryEvents } = useNostrRelay();
  const journalNotes = ref<any[]>([]);

  const oldItems = useState<any[]>("oldItems", () => []);

  // Kind 30001 is a standard for private notes/bookmarks
  const PRIVATE_NOTE_KIND = 30001;
  const hasMore = useState<boolean>("hasMore", () => false);
  const DEFAULT_LIMIT = 10;

  /**
   * Create a new private journal entry
   * @param content The journal entry content
   * @param date ISO date string for organizing entries
   * @returns boolean success status
   */
  const createJournalEntry = async (
    content: string,
    date: string,
    extraTags: string[][] = [] // Optional tags like file attachments
  ) => {
    if (!user.value) return false;
    isLoading.value = true;

    try {
      // Encrypt the content using the user's own public key
      // This way only they can decrypt it
      const encryptedContent = await nip04.encrypt(
        user.value.privateKey,
        user.value.publicKey,
        content
      );

      // get the current date timestamp
      const id = Math.floor(Date.now() / 1000);

      const eventTemplate = {
        kind: PRIVATE_NOTE_KIND,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ["d", `${id}`], // Use 'd' tag for dates to allow for replacement/editing
          // ["title", "Journal Entry"],
          ["date", date],
          ["t", "journal"], // add a tag for filtering
          ...extraTags,
        ],
        content: encryptedContent,
      };

      const signedEvent = finalizeEvent(
        eventTemplate,
        hexToBytes(user.value.privateKey)
      );

      await Promise.any(pool.publish(RELAYS, signedEvent));
      isLoading.value = false;
      return true;
    } catch (e) {
      error.value = e;
      isLoading.value = false;
      return false;
    }
  };

  /**
   * Update an existing journal entry
   * @param id The d-tag identifier (date)
   * @param content New content for the entry
   * @returns boolean success status
   */
  const updateJournalEntry = async (
    id: string,
    content: string,
    date: string
  ) => {
    if (!user.value) return false;
    isLoading.value = true;

    try {
      // Encrypt the updated content
      const encryptedContent = await nip04.encrypt(
        user.value.privateKey,
        user.value.publicKey,
        content
      );

      const eventTemplate = {
        kind: PRIVATE_NOTE_KIND,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ["d", id], // Same 'd' tag value for replacement
          // ["title", "Journal Entry"],
          ["date", date],
          ["t", "journal"],
        ],
        content: encryptedContent,
      };

      const signedEvent = finalizeEvent(
        eventTemplate,
        hexToBytes(user.value.privateKey)
      );

      await Promise.any(pool.publish(RELAYS, signedEvent));
      isLoading.value = false;
      return true;
    } catch (e) {
      error.value = e;
      isLoading.value = false;
      return false;
    }
  };

  /**
   * Load journal entries with pagination
   * @param option limit, since (UNIX timestamp), until (optional)
   */
  const loadJournalEntries = async (
    option: {
      limit?: number;
      since?: number;
      until?: number;
    } = {}
  ) => {
    if (!user.value) return;

    isLoading.value = true;

    const limit = option.limit ?? DEFAULT_LIMIT;
    const since = option.since ?? 0;
    const until = option.until;

    try {
      const filter: any = {
        kinds: [PRIVATE_NOTE_KIND],
        authors: [user.value.publicKey],
        "#t": ["journal"],
        since,
        limit,
      };

      if (until) filter.until = until;

      const events = await pool.querySync(RELAYS, filter);

      console.log(events);

      oldItems.value = [...oldItems.value, ...events].sort(
        (a, b) => b.created_at - a.created_at
      );

      const newEntries = [];

      for (const event of events) {
        if (!event.content) continue;

        try {
          const content = await nip04.decrypt(
            user.value.privateKey,
            user.value.publicKey,
            event.content
          );

          const dateTag = event.tags.find((tag) => tag[0] === "d");
          const date = dateTag ? dateTag[1] : "unknown";

          // Avoid duplicates (use 'id' or date as unique key)
          if (!journalNotes.value.find((e) => e.id === date)) {
            newEntries.push({
              ...event,
              id: date,
              decryptedContent: content,
              date,
            });
          }
        } catch (decryptError) {
          console.error("Failed to decrypt entry:", decryptError);
        }
      }

      journalNotes.value.push(...newEntries);

      // Sort descending by date
      journalNotes.value.sort((a, b) => b.date.localeCompare(a.date));

      // Set hasMore flag
      if (newEntries.length < limit) {
        hasMore.value = false;
      }
    } catch (e) {
      error.value = e;
    } finally {
      isLoading.value = false;
    }

    return journalNotes.value;
  };

  /**
   * Load more journal entries based on oldest known entry
   */
  const loadMoreJournalEntries = async () => {
    console.log(journalNotes.value.length, hasMore.value, isLoading.value);

    if (!hasMore.value || isLoading.value) return;

    console.log("Loading more journal entries...");
    const oldest = oldItems.value[oldItems.value.length - 1];
    const untilTimestamp = oldest ? oldest.created_at - 1 : 0;

    console.log(untilTimestamp);

    await loadJournalEntries({
      limit: DEFAULT_LIMIT,
      until: untilTimestamp,
    });
  };

  /**
   * Get a specific journal entry by date
   * @param date The date of the entry
   * @returns Journal entry or null if not found
   */
  const getJournalEntryByDate = async (date: string) => {
    if (!user.value) return null;

    // If we haven't loaded entries yet, do it now
    if (!journalNotes.value.length) {
      await loadJournalEntries();
    }

    // Find the entry for the specified date
    const entry = journalNotes.value.find((note) => note.date === date);
    return entry || null;
  };

  /**
   * Remove (replace with empty) a journal entry by ID
   * @param id The 'd' tag value (unique identifier of the entry)
   * @returns boolean success status
   */
  const removeJournalEntry = async (id: string) => {
    if (!user.value) return false;
    isLoading.value = true;

    console.log("Removing entry:", id);

    try {
      const eventTemplate = {
        kind: PRIVATE_NOTE_KIND,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ["d", id],
          ["title", "Journal Entry"],
          ["t", "journal"],
        ],
        content: "", // empty to signal deletion
      };

      const signedEvent = finalizeEvent(
        eventTemplate,
        hexToBytes(user.value.privateKey)
      );

      await Promise.any(pool.publish(RELAYS, signedEvent));

      // Optionally remove from local list
      journalNotes.value = journalNotes.value.filter((note) => note.id !== id);

      isLoading.value = false;
      return true;
    } catch (e) {
      console.error("Failed to remove entry:", e);
      error.value = e;
      isLoading.value = false;
      return false;
    }
  };

  // Encrypt file buffer
  async function encryptFile(file: File) {
    const key = randomBytes(32); // 256-bit key
    const nonce = randomBytes(24); // 192-bit nonce

    const buffer = await file.arrayBuffer();
    const cipher = xchacha20poly1305(key, nonce);
    const encrypted = cipher.encrypt(new Uint8Array(buffer));

    return {
      encrypted,
      key: Buffer.from(key).toString("base64"),
      nonce: Buffer.from(nonce).toString("base64"),
      mime: file.type,
      size: file.size,
      name: file.name,
    };
  }

  async function decryptFile(
    url: string,
    base64Key: string,
    base64Nonce: string
  ) {
    const key = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));
    const nonce = Uint8Array.from(atob(base64Nonce), (c) => c.charCodeAt(0));

    const response = await fetch(url);
    const buffer = await response.arrayBuffer();

    if (buffer.byteLength < 16) {
      throw new Error("Encrypted file is too small to contain a valid tag.");
    }

    const encrypted = new Uint8Array(buffer);
    const cipher = xchacha20poly1305(key, nonce);
    const decrypted = cipher.decrypt(encrypted);

    return new Blob([decrypted]);
  }

  return {
    journalNotes,
    hasMore,
    createJournalEntry,
    updateJournalEntry,
    removeJournalEntry,
    loadJournalEntries,
    getJournalEntryByDate,
    encryptFile,
    decryptFile,
    loadMoreJournalEntries,
  };
};
