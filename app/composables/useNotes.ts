import type { Event } from "nostr-tools";

export const useNotes = () => {
  const { $nostr } = useNuxtApp();
  const { pool } = $nostr;
  const { RELAYS } = useNostr();

  // Add this function to the useNostr composable

  const getNoteDetail = async (
    noteId: string,
    timeout: number = 10000,
    maxRelays: number = 10,
    debug: boolean = false
  ): Promise<Event | null> => {
    // Normalize and validate note ID (assuming it's the event ID)
    if (!/^[0-9a-f]{64}$/.test(noteId)) {
      throw new Error(
        "Invalid note ID format. Must be a 64-character hex string."
      );
    }

    // Shuffle relays to distribute load
    const shuffledRelays = RELAYS.sort(() => 0.5 - Math.random()).slice(
      0,
      maxRelays
    );

    if (debug)
      console.log(`🔍 Querying relays for note detail:`, shuffledRelays);

    // Fetch note from relays
    const fetchFromRelays = async (): Promise<Event | null> => {
      const fetchPromises = shuffledRelays.map(async (relay) => {
        try {
          const event = await pool.get([relay], {
            ids: [noteId],
            kinds: [1], // Kind 1 is for text notes
          });
          return event || null;
        } catch (error) {
          if (debug) console.warn(`⚠️ Relay failed (${relay}):`, error);
          return null;
        }
      });

      const results = await Promise.allSettled(fetchPromises);
      const successful = results
        .filter((r) => r.status === "fulfilled" && r.value)
        .map((r) => (r as PromiseFulfilledResult<Event>).value);

      return successful[0] || null;
    };

    // Timeout mechanism
    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error("⏳ Fetch timeout")), timeout)
    );

    let noteDetail: Event | null = null;

    try {
      noteDetail = await Promise.race([fetchFromRelays(), timeoutPromise]);
    } catch (err) {
      if (debug) console.error("🚨 Note detail fetch error:", err);
    }

    // No data found
    if (!noteDetail) {
      if (debug) console.log(`❌ No note found with ID: ${noteId}`);
      return null;
    }

    if (debug) console.log("✅ Loaded note detail:", noteDetail);

    return noteDetail;
  };

  // Update the return object to include the new method
  return {
    // ... existing methods
    getNoteDetail,
  };
};
