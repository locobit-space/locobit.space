export const useUser = () => {
  const { $nostr } = useNuxtApp();
  const { RELAYS, user } = useNostr();

  const nostrBookmarks = ref<string[]>([]);
  // Add this function to the useNostr composable

  const getBookmarksFromNostr = async (): Promise<string[]> => {
    try {
      if (!user.value) return [];

      const pubkey = user.value.publicKey;
      if (!pubkey) return [];

      const events = await $nostr.pool.querySync(RELAYS, {
        kinds: [30001],
        authors: [pubkey],
        "#d": ["bookmarks"], // only your bookmark list
        limit: 1, // usually just one latest
      });

      if (!events.length) return [];

      const latest = events.sort((a, b) => b.created_at - a.created_at)[0];

      // Extract all note IDs from `e` tags
      const noteIds = latest?.tags
        .filter((tag) => tag[0] === "e")
        .map((tag) => tag[1]);

      // Optional: update local state

      localStorage.setItem("nostrBookmarks", JSON.stringify(noteIds));

      nostrBookmarks.value = noteIds as string[];
      return noteIds as string[];
    } catch (error) {
      console.error("Error loading bookmarks from Nostr:", error);
      return [];
    }
  };

  // Update the return object to include the new method
  return {
    getBookmarksFromNostr,
  };
};
