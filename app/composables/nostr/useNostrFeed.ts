// composables/nostr/useNostrFeed.ts

import { ref } from "vue";
import { hexToBytes } from "@noble/hashes/utils";
import type { Event } from "nostr-tools";
import { useNostrUser } from "./useNostrUser";
import { useNostrRelay } from "./useNostrRelay";

const DEFAULT_OPTIONS = {
  limit: 20,
  offset: 0,
};

export const useNostrFeed = () => {
  const notes = useState<Event[]>("notes", () => []);
  const isLoading = useState<boolean>("isLoading", () => false);
  const error = ref<any>(null);
  const latestTimestamp = useState<number>("latestTimestamp", () => 0);
  const filterTab = useState<any>("filterTab", () => {
    return {
      label: "For You",
      key: "for-you",
      value: "for-you",
    };
  });

  const { user, fetchFollowList } = useNostrUser();
  const { publishEvent, queryEvents, subscribeToEvents } = useNostrRelay();
  const { finalizeEvent } = useNuxtApp().$nostr;

  const extractHashtags = (content: string): string[] => {
    const hashtagRegex = /#(\w+)/g;
    return [
      ...new Set(
        Array.from(content.matchAll(hashtagRegex), (match) => match[1]!)
      ),
    ];
  };

  const postNote = async (content: string) => {
    if (!user.value) return false;
    isLoading.value = true;

    try {
      const contentHashtags = extractHashtags(content);
      const tagsArray = contentHashtags.map((hashtag) => ["t", hashtag]);

      const eventTemplate = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [...tagsArray],
        content,
      };

      const signedEvent = finalizeEvent(
        eventTemplate,
        hexToBytes(user.value.privateKey)
      );
      const result = await publishEvent(signedEvent);

      if (result) {
        notes.value.unshift(signedEvent);
        notes.value.sort((a, b) => b.created_at - a.created_at);
        latestTimestamp.value = Math.max(
          latestTimestamp.value,
          signedEvent.created_at
        );
      }

      return result;
    } catch (e) {
      error.value = e;
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const subscribeToNotes = (options = {}) => {
    isLoading.value = true;
    notes.value = [];

    const subscription = subscribeToEvents(
      {
        kinds: [1],
        limit: DEFAULT_OPTIONS.limit,
        ...options,
      },
      {
        onevent(event) {
          notes.value.push(event);
          notes.value.sort((a, b) => b.created_at - a.created_at);
          latestTimestamp.value = Math.max(
            latestTimestamp.value,
            event.created_at
          );
        },
        oneose() {
          isLoading.value = false;
        },
      }
    );

    return subscription;
  };

  const mergeUniqueEvents = (
    newEvents: Event[],
    existingEvents: Event[]
  ): Event[] => {
    return [
      ...newEvents,
      ...existingEvents.filter(
        (existingEvent) =>
          !newEvents.some((newEvent) => newEvent.id === existingEvent.id)
      ),
    ];
  };

  // remove duplicate events
  const getUniqueEvents = (newEvents: Event[], existingEvents: Event[]) => {
    return newEvents.filter(
      (newEvent) =>
        !existingEvents.some(
          (existingEvent) => existingEvent.id === newEvent.id
        )
    );
  };

  function getEngagementScore(event: Event): number {
    const tags = event.tags || [];

    const likeCount = tags.filter((t) => t[0] === "like").length;
    const repostCount = tags.filter((t) => t[0] === "repost").length;
    const commentCount = tags.filter((t) => t[0] === "reply").length;

    return likeCount + repostCount + commentCount * 2;
  }

  const loadNotesOnce = async (
    options: {
      filter?: "for-you" | "following" | "hashtag";
      hashtag?: string;
      limit?: number;
      offset?: number;
      since?: number;
      until?: number;
      authors?: string[];
    } = {}
  ) => {
    isLoading.value = true;
    const {
      filter = "for-you",
      hashtag,
      limit = DEFAULT_OPTIONS.limit,
      offset = DEFAULT_OPTIONS.offset,
      since,
      until,
      authors,
    } = options;

    try {
      const filterQuery: any = { kinds: [1], limit };
      if (since) filterQuery.since = since;
      if (until) filterQuery.until = until;
      if (authors) filterQuery.authors = authors;

      const userPubkey = user.value?.publicKey;

      if (filter === "following" && userPubkey) {
        const followList = await fetchFollowList(userPubkey);
        filterQuery.authors = followList;
      } else if (filter === "hashtag" && hashtag) {
        filterQuery["#t"] = [hashtag];
      }

      const events = await queryEvents(filterQuery);
      const uniqueEvents = mergeUniqueEvents(events, notes.value);
      const sortedEvents = uniqueEvents.sort(
        (a, b) => b.created_at - a.created_at
      );
      notes.value = sortedEvents;

      if (
        sortedEvents.length > 0 &&
        sortedEvents[0]?.created_at !== undefined
      ) {
        latestTimestamp.value = Math.max(
          latestTimestamp.value,
          sortedEvents[0].created_at
        );
      }

      return sortedEvents;
    } catch (e) {
      error.value = e;
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  const checkNewNotes = async () => {
    if (latestTimestamp.value === 0) return false;
    isLoading.value = true;

    try {
      const newNotes = await loadNotesOnce({
        since: latestTimestamp.value + 1,
      });
      return newNotes.length > 0;
    } catch (e) {
      error.value = e;
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const loadOlderNotes = async (
    options: {
      filter?: "for-you" | "following" | "hashtag";
      hashtag?: string;
      limit?: number;
    } = {}
  ) => {
    if (notes.value.length === 0) return false;

    const oldestNote = notes.value[notes.value.length - 1];
    const until = oldestNote?.created_at;
    if (!until || isNaN(until)) return false;

    try {
      isLoading.value = true;

      const olderNotes = await loadNotesOnce({
        ...options,
        until: until - 1,
      });

      if (olderNotes.length) {
        const merged = mergeUniqueEvents(olderNotes, notes.value);
        notes.value = merged.sort((a, b) => b.created_at - a.created_at);
      }

      return olderNotes.length > 0;
    } catch (e) {
      error.value = e;
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const searchNotes = async (
    query: string,
    options: {
      limit?: number;
      authors?: string[];
      since?: number;
      until?: number;
    } = {}
  ) => {
    if (!query.trim()) return [];

    try {
      isLoading.value = true;

      const searchResults = await loadNotesOnce({
        limit: options.limit,
        authors: options.authors,
        since: options.since,
        until: options.until,
      });

      const queryLower = query.toLowerCase();
      return searchResults.filter((note) =>
        note.content.toLowerCase().includes(queryLower)
      );
    } catch (e) {
      error.value = e;
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  const getNoteById = async (id: string): Promise<Event | null> => {
    try {
      isLoading.value = true;

      const existingNote = notes.value.find((note) => note.id === id);
      if (existingNote) return existingNote;

      const events = await queryEvents({ ids: [id] });
      return events[0] || null;
    } catch (e) {
      error.value = e;
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    notes,
    isLoading,
    error,
    latestTimestamp,
    filterTab,
    DEFAULT_OPTIONS,
    postNote,
    subscribeToNotes,
    loadNotesOnce,
    checkNewNotes,
    loadOlderNotes,
    searchNotes,
    getNoteById,
    extractHashtags,
    mergeUniqueEvents,
    getUniqueEvents,
  };
};
