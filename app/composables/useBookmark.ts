import { hexToBytes } from "@noble/ciphers/utils";

export const useBookmark = () => {
  const { queryEvents, publishEvent } = useNostrRelay();
  const { user } = useNostrUser();
  const items = useState<string[]>("itemsBookmark", () => {
    if (import.meta.client) {
      return JSON.parse(localStorage.getItem("itemsBookmark") || "[]");
    }

    return [];
  });

  const bookmarkNote = (noteId: string) => {
    const index = items.value.indexOf(noteId);

    if (index === -1) {
      items.value.push(noteId);
    } else {
      items.value.splice(index, 1);
    }

    // Save back to localStorage
    localStorage.setItem("nostrBookmarks", JSON.stringify(items.value));
    syncBookmarks();
  };

  // fetch bookmarks
  async function fetchBookmarks() {
    try {
      if (!user.value) return;
      const events = await queryEvents({
        kinds: [30001],
        limit: 1,
        "#d": ["bookmarks"],
        authors: [user.value?.publicKey],
      });

      const sortedEvents = events.sort((a, b) => {
        const aDate = new Date(a.created_at);
        const bDate = new Date(b.created_at);
        return bDate.getTime() - aDate.getTime();
      });

      if (!sortedEvents[0]) return;
      const _items = sortedEvents[0]?.tags
        .filter(
          (tag): tag is [string, string] =>
            tag[0] === "e" && typeof tag[1] === "string"
        )
        .map((tag) => tag[1]);

      items.value = _items;
    } catch (error) {
      throw new Error(`[useBookmark] Error fetching bookmarks: ${error}`);
    }
  }

  const syncBookmarks = async () => {
    if (!user.value) return;

    const { $nostr } = useNuxtApp();
    const pubkey = user.value?.publicKey;
    if (!pubkey) return;

    const event = {
      kind: 30001,
      created_at: Math.floor(Date.now() / 1000),
      content: "",
      tags: [
        ["d", "bookmarks"],
        ["title", "Bookmarks"],
        ["t", "bookmark"],
        ...items.value.map((id) => ["e", id]),
      ],
      pubkey,
    };

    const signed = $nostr.finalizeEvent(
      event,
      hexToBytes(user.value.privateKey)
    );

    try {
      await publishEvent(signed);
      // Optional success toast here if you want
    } catch (err) {
      console.error("Failed to sync bookmarks to Nostr", err);
    }
  };

  onMounted(() => {
    fetchBookmarks();
  });

  return {
    items,
    bookmarkNote,
    syncBookmarks,
    fetchBookmarks,
  };
};
