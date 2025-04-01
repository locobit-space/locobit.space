// Enhanced Feed Algorithm for useNostrFeed.ts

// Add these imports at the top of your file
import type { Event as NostrEvent } from "nostr-tools";

export const useNostrFeedAlgorithm = () => {
  const { user } = useNostrUser();
  const { queryEvents } = useNostrRelay();
  const {
    loadNotesOnce,
    extractHashtags,
    DEFAULT_OPTIONS,
    isLoading,
    notes,
    error,
    mergeUniqueEvents,
  } = useNostrFeed();

  // Add these to your useNostrFeed composable
  const userInteractions = useState<Record<string, number>>(
    "userInteractions",
    () => ({
      // Initialize with empty objects localstorage
      ...JSON.parse(localStorage.getItem("userInteractions") || "{}"),
    })
  );
  const userInterests = useState<Record<string, number>>(
    "userInterests",
    () => ({
      // Initialize with empty objects localstorage
      ...JSON.parse(localStorage.getItem("userInterests") || "{}"),
    })
  );

  const oldTimestamp = useState<number>("oldTimestampAlgorithm", () => 0);

  // Enhanced event scoring function
  const calculateEventScore = (event: NostrEvent): number => {
    // Base engagement metrics
    const tags = event.tags || [];
    const likeCount = tags.filter((t) => t[0] === "like").length;
    const repostCount = tags.filter((t) => t[0] === "repost").length;
    const commentCount = tags.filter((t) => t[0] === "reply").length;

    // Basic engagement score
    let score = likeCount + repostCount * 2 + commentCount * 3;

    // Freshness factor (newer content gets boosted)
    const ageInHours = (Date.now() / 1000 - event.created_at) / 3600;
    const freshnessFactor = Math.max(0.5, 1 - ageInHours / 48); // Decay over 48 hours
    score *= freshnessFactor;

    // Author reputation boost
    if (user.value && userInteractions.value[event.pubkey]) {
      score *= 1 + Math.min(2, (userInteractions.value[event.pubkey] || 0) / 5);
    }

    // Content relevance based on hashtags
    const contentHashtags = extractHashtags(event.content);
    const interestBoost = contentHashtags.reduce((boost, tag) => {
      return boost + (userInterests.value[tag] || 0) * 0.2;
    }, 0);

    score *= 1 + interestBoost;

    // Content quality signal (longer doesn't always mean better, but extremely short content
    // might be less valuable)
    const contentLength = event.content.length;
    if (contentLength > 50 && contentLength < 1000) {
      score *= 1.1;
    }

    return score;
  };

  // Sort events by score
  const sortEventsByScore = (events: NostrEvent[]): NostrEvent[] => {
    return [...events].sort((a, b) => {
      return calculateEventScore(b) - calculateEventScore(a);
    });
  };

  // detect content type
  const detectContentType = (content: string): "text" | "image" | "video" => {
    if (content.match(/\.(jpeg|jpg|png|gif)/i)) return "image";
    if (content.match(/\.(mp4|webm|ogg)/i)) return "video";
    return "text";
  };

  // track user interactions
  const trackInteraction = (
    event: NostrEvent,
    interactionType: "view" | "like" | "reply" | "repost"
  ) => {
    // Ensure the event has a pubkey before proceeding
    if (!event.pubkey) {
      console.warn("Event has no pubkey:", event);
      return; // Exit function if pubkey is missing
    }

    // Initialize user interaction count if not present
    if (!userInteractions.value[event.pubkey]) {
      userInteractions.value[event.pubkey] = 0;
    }

    // Ensure event content is defined (default to an empty string)
    const content = event.content || "";

    // Detect content type (Text, Image, Video)
    const contentType = detectContentType(content);

    // Define base weight for different interaction types
    const baseWeight =
      {
        view: 0.1,
        like: 1,
        reply: 2,
        repost: 1.5,
      }[interactionType] || 0; // Default to 0 if interactionType is unknown

    // Define content type multipliers
    const contentMultiplier =
      {
        text: 1,
        image: 1.2,
        video: 1.5,
      }[contentType] || 1; // Default to 1 if contentType is unknown

    // Calculate the final interaction weight
    const interactionWeight = baseWeight * contentMultiplier;

    // Update the user's interaction score
    // userInteractions.value[event.pubkey] += interactionWeight;
    userInteractions.value[event.pubkey] =
      (userInteractions.value[event.pubkey] || 0) + interactionWeight;

    // Extract hashtags from content and track user interests
    const contentHashtags = extractHashtags(content);
    contentHashtags.forEach((tag) => {
      if (!userInterests.value[tag]) {
        userInterests.value[tag] = 0;
      }
      userInterests.value[tag] += interactionWeight;
    });

    // Save user interactions and interests to localStorage
    try {
      localStorage.setItem(
        "userInteractions",
        JSON.stringify(userInteractions.value)
      );
      localStorage.setItem(
        "userInterests",
        JSON.stringify(userInterests.value)
      );
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  };

  // Enhanced feed loading with algorithmic sorting
  const loadAlgorithmicFeed = async (
    options: {
      limit?: number;
      offset?: number;
      since?: number;
      until?: number;
    } = {}
  ) => {
    // Check loading state before changing any values
    if (isLoading.value) {
      console.warn("Feed is already loading.");
      return;
    }

    // Set loading state BEFORE try/catch so it's always set
    isLoading.value = true;

    try {
      const tags = Object.keys(userInterests.value).filter(
        (tag) => (userInterests.value[tag] || 0) > 0
      );

      const uniqueTags = [...new Set(tags)];

      const filterQuery = {
        kinds: [1],
        limit: 10,
        // add tags
        ...(tags.length && { "#t": uniqueTags }),
        ...(oldTimestamp.value && { until: oldTimestamp.value - 1 }),
      };

      const rawEvents = await queryEvents(filterQuery);

      if (!rawEvents.length) {
        isLoading.value = false;
        return;
      }

      if (notes.value.length) {
        oldTimestamp.value =
          notes.value[notes.value.length - 1]?.created_at || 0;
      }

      const uniqueEvents = mergeUniqueEvents(rawEvents, notes.value);

      // const scoredEvents = uniqueEvents.map((event) => {
      //   let score = 0;

      //   // Example scoring based on user interactions (e.g. likes, reposts)
      //   const interactionScore = userInteractions.value[event.id] || 0;

      //   // Score based on topics/keywords the user is interested in
      //   const tags = event.tags?.flat() || [];
      //   const interestScore = tags.reduce((acc, tag) => {
      //     return acc + (userInterests.value[tag] || 0);
      //   }, 0);

      //   score += interactionScore + interestScore;

      //   return { ...event, score };
      // });

      notes.value = uniqueEvents.sort((a, b) => b.created_at - a.created_at);

      return uniqueEvents;
    } catch (e) {
      error.value = e;
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  // Event view tracking
  const viewEvent = (eventId: string) => {
    const event = notes.value.find((note) => note.id === eventId);
    if (event) {
      trackInteraction(event, "view");
    }
  };

  // Add these to your return statement
  return {
    // ... existing return values
    calculateEventScore,
    sortEventsByScore,
    loadAlgorithmicFeed,
    trackInteraction,
    viewEvent,
    userInteractions,
    userInterests,
  };
};
