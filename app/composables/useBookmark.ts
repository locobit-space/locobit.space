export const useBookmark = () => {
  const { queryEvents } = useNostrRelay();
  const { user } = useNostrUser();
  const items = useState("itemsBookmark", () => {
    if (import.meta.client) {
      return JSON.parse(localStorage.getItem("itemsBookmark") || "[]");
    }

    return [];
  });

  // fetch bookmarks
  async function fetchBookmarks() {
    try {
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

      items.value = events;
    } catch (error) {
      throw new Error(`[useBookmark] Error fetching bookmarks: ${error}`);
    }
  }

  return {
    items,
    fetchBookmarks,
  };
};
