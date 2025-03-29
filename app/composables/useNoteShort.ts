import { ref } from "vue";
import type { Event } from "nostr-tools";
import { mediaExtensions } from "~/lib";

interface VideoShort {
  id: string;
  url: string;
  title: string;
  creator: string;
  likes: number;
  comments: number;
  created_at: number;
}

export const useNoteShort = () => {
  const { $nostr } = useNuxtApp();
  const { pool } = $nostr;
  const { RELAYS } = useNostr();

  const shorts = ref<VideoShort[]>([]);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  const latestTimestamp = ref<number | null>(null);
  const oldestTimestamp = ref<number | null>(null);

  const isMediaUrl = (url: string): boolean => {
    return mediaExtensions.some((ext) => url.toLowerCase().endsWith(ext));
  };

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

  const mapNotesToMediaList = (events: Event[]): VideoShort[] => {
    const mediaNotes = filterMediaNotes(events);

    return mediaNotes.flatMap((event) => {
      const mediaUrls = [
        ...extractMediaUrlsFromContent(event.content),
        ...extractMediaUrlsFromTags(event.tags),
      ];

      const creator = `@${event.pubkey.slice(0, 8)}`;
      const title = event.content?.split("\n")[0].slice(0, 100);

      const uniqueMediaUrls = [...new Set(mediaUrls)];

      if (uniqueMediaUrls.length === 0) {
        return [];
      }

      return uniqueMediaUrls.map((url) => ({
        id: event.id,
        url,
        title,
        creator,
        likes: Math.floor(Math.random() * 500),
        comments: Math.floor(Math.random() * 100),
        created_at: event.created_at,
      }));
    });
  };

  // const loadFirstShort = async () => {
  //   isLoading.value = true;
  //   let newShortsAdded = false;
  //   try {
  //     const sub = pool.subscribeMany(
  //       RELAYS,
  //       [
  //         {
  //           kinds: [1],
  //           limit: 10,
  //         },
  //       ],
  //       {
  //         onevent(event: Event) {
  //           if (!shorts.value.some((v) => v.id === event.id)) {
  //             const result = [event];
  //             const newShorts = mapNotesToMediaList(result);
  //             shorts.value.push(...newShorts);
  //           }
  //         },
  //         oneose() {
  //           if (shorts.value.length > 0) {
  //             latestTimestamp.value = Math.max(
  //               ...shorts.value.map((v) => v.created_at)
  //             );
  //             oldestTimestamp.value = Math.min(
  //               ...shorts.value.map((v) => v.created_at)
  //             );
  //           }
  //           isLoading.value = false;
  //           sub.close();
  //         },
  //       }
  //     );
  //   } catch (err) {
  //     error.value = err as Error;
  //     isLoading.value = false;
  //   }
  // };

  const loadFirstShort = async () => {
    isLoading.value = true;
    let newShortsAdded = false;

    try {
      const sub = pool.subscribeMany(
        RELAYS,
        [
          {
            kinds: [1],
            limit: 10,
          },
        ],
        {
          onevent(event: Event) {
            if (!shorts.value.some((v) => v.id === event.id)) {
              const result = [event];
              const newShorts = mapNotesToMediaList(result);
              if (newShorts.length > 0) {
                shorts.value.push(...newShorts);
                newShortsAdded = true;
              }
            }
          },
          oneose() {
            if (shorts.value.length > 0) {
              latestTimestamp.value = Math.max(
                ...shorts.value.map((v) => v.created_at)
              );
              oldestTimestamp.value = Math.min(
                ...shorts.value.map((v) => v.created_at)
              );
            }
            isLoading.value = false;
            sub.close();

            // If no new shorts were added, attempt to load older shorts
            if (!newShortsAdded) {
              loadOldShort();
            }
          },
        }
      );
    } catch (err) {
      error.value = err as Error;
      isLoading.value = false;
    }
  };

  const loadOldShort = async () => {
    if (isLoading.value || !oldestTimestamp.value) return;
    isLoading.value = true;

    try {
      let oldestSeen = oldestTimestamp.value;

      const sub = pool.subscribeMany(
        RELAYS,
        [
          {
            kinds: [1],
            limit: 10,
            until: oldestTimestamp.value - 1,
          },
        ],
        {
          onevent(event: Event) {
            if (event.created_at < oldestSeen) {
              oldestSeen = event.created_at;
            }

            if (!shorts.value.some((v) => v.id === event.id)) {
              const result = [event];
              const newShorts = mapNotesToMediaList(result);
              shorts.value.push(...newShorts);

              if (newShorts.length > 0) {
                const newMin = Math.min(...newShorts.map((v) => v.created_at));
                oldestSeen = Math.min(oldestSeen, newMin);
              }
            }
          },
          oneose() {
            oldestTimestamp.value = oldestSeen;
            isLoading.value = false;
            sub.close();
          },
        }
      );
    } catch (err) {
      error.value = err as Error;
      isLoading.value = false;
    }
  };

  const checkNewShort = async () => {
    if (!latestTimestamp.value) return;

    const sub = pool.subscribeMany(
      RELAYS,
      [
        {
          kinds: [1],
          since: latestTimestamp.value + 1,
        },
      ],
      {
        onevent(event: Event) {
          if (!shorts.value.some((v) => v.id === event.id)) {
            const result = [event];
            const newShorts = mapNotesToMediaList(result);
            shorts.value.unshift(...newShorts);

            if (newShorts.length > 0) {
              const newMax = Math.max(...newShorts.map((v) => v.created_at));
              latestTimestamp.value = Math.max(latestTimestamp.value!, newMax);
            }
          }
        },
        oneose() {
          sub.close();
        },
      }
    );
  };

  return {
    shorts,
    isLoading,
    error,
    loadFirstShort,
    loadOldShort,
    checkNewShort,
    isMediaUrl,
    mapNotesToMediaList,
    filterMediaNotes,
    latestTimestamp,
    oldestTimestamp,
  };
};
