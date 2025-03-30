import type { Event } from "nostr-tools";
import { mediaExtensions } from "~/lib";

export const useNotes = () => {
  const { $nostr } = useNuxtApp();
  const { pool } = $nostr;
  const { DEFAULT_RELAYS: RELAYS } = useNostrRelay();

  const storedBookmarks = localStorage.getItem("nostr-bookmarks");
  const bookmarks = useState<string[]>("bookmarkedVideos", () => []);

  const toggleBookmark = (videoId: string) => {
    const index = bookmarks.value.indexOf(videoId);
    if (index > -1) {
      bookmarks.value.splice(index, 1);
    } else {
      bookmarks.value.push(videoId);
    }
  };

  const getNoteDetail = async (
    noteId: string,
    timeout: number = 10000,
    maxRelays: number = 10,
    debug: boolean = false
  ): Promise<Event | null> => {
    if (!/^[0-9a-f]{64}$/.test(noteId)) {
      throw new Error(
        "Invalid note ID format. Must be a 64-character hex string."
      );
    }

    const shuffledRelays = RELAYS.sort(() => 0.5 - Math.random()).slice(
      0,
      maxRelays
    );

    if (debug)
      console.log(`🔍 Querying relays for note detail:`, shuffledRelays);

    const fetchFromRelays = async (): Promise<Event | null> => {
      const fetchPromises = shuffledRelays.map(async (relay) => {
        try {
          const event = await pool.get([relay], {
            ids: [noteId],
            kinds: [1],
          });
          console.log(event);
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

    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error("⏳ Fetch timeout")), timeout)
    );

    let noteDetail: Event | null = null;

    try {
      noteDetail = await Promise.race([fetchFromRelays(), timeoutPromise]);
    } catch (err) {
      if (debug) console.error("🚨 Note detail fetch error:", err);
    }

    if (!noteDetail) {
      if (debug) console.log(`No note found with ID: ${noteId}`);
      return null;
    }

    if (debug) console.log("Loaded note detail:", noteDetail);

    return noteDetail;
  };

  const isMediaUrl = (url: string) =>
    mediaExtensions.some((ext) => url.toLowerCase().includes(ext));

  const extractMediaUrlsFromContent = (content: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return (content.match(urlRegex) || []).filter(isMediaUrl);
  };

  const extractMediaUrlsFromTags = (tags: string[][]): string[] => {
    return tags
      .filter((tag) => tag[0] === "imeta" && tag[1]?.includes("url"))
      .map((tag) => {
        const match = tag[1].match(/https?:\/\/[^ ]+/);
        return match?.[0] ?? "";
      })
      .filter(Boolean)
      .filter(isMediaUrl);
  };

  const filterMediaNotes = (events: Event[]): Event[] => {
    return events.filter((event) => {
      const contentHasMedia =
        extractMediaUrlsFromContent(event.content).length > 0;
      const tagsHaveMedia = extractMediaUrlsFromTags(event.tags).length > 0;
      return contentHasMedia || tagsHaveMedia;
    });
  };

  const mapNotesToMediaList = (events: Event[]) => {
    const mediaNotes = filterMediaNotes(events);

    console.log(mediaNotes)

    return mediaNotes.flatMap((event) => {
      const mediaUrls = [
        ...extractMediaUrlsFromContent(event.content),
        ...extractMediaUrlsFromTags(event.tags),
      ];

      const creator = `@${event?.pubkey?.slice(0, 8) || "unknown"}`;
      // first line as title
      const title = event?.content?.split("\n")[0]?.slice(0, 100) ?? "Untitled";

      return mediaUrls.map((url) => ({
        id: event.id,
        url,
        title,
        creator,
        likes: Math.floor(Math.random() * 500), // You can replace with real data
        comments: Math.floor(Math.random() * 100), // or pull from tag/meta if supported
        created_at: event.created_at,
      }));
    });
  };

  return {
    bookmarks,
    getNoteDetail,
    toggleBookmark,
    filterMediaNotes,
    mapNotesToMediaList,
  };
};
