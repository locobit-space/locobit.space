// composables/nostr/useNostrStories.ts

import { ref } from "vue";
import type { Event } from "nostr-tools";
import { useNostrRelay } from "./useNostrRelay";
import { useNostrUser } from "./useNostrUser";

export const useNostrStories = () => {
  const { queryEvents, subscribeToEvents, LIVE_STREAM_RELAYS } = useNostrRelay();
  const { getUserInfo, fetchFollowList, user } = useNostrUser();

  const stories = ref<any[]>([]);
  const liveStreams = ref<any[]>([]);
  const isLoadingStories = ref(false);
  const isLoadingLiveStreams = ref(false);
  const storiesLimit = ref(100); // Increased from 50
  const liveStreamsLimit = ref(30);
  const hasMoreLiveStreams = ref(true);

  /**
   * Fetch stories from followed users
   * Using kind 1 events with #story tag or recent posts from last 24h
   */
  const fetchStories = async () => {
    isLoadingStories.value = true;
    try {
      const twentyFourHoursAgo = Math.floor(Date.now() / 1000) - 86400;

      // Get followed users list
      const currentPubkey = user.value?.pubkey;
      if (!currentPubkey) {
        stories.value = [];
        return;
      }

      const followedPubkeys = await fetchFollowList(currentPubkey);
      
      if (followedPubkeys.length === 0) {
        stories.value = [];
        return;
      }

      // Query for recent image/video posts from followed users
      const storyEvents = await queryEvents({
        kinds: [1], // Text notes
        authors: followedPubkeys,
        since: twentyFourHoursAgo,
        limit: storiesLimit.value,
      });

      // Filter events that have images or videos
      const storyEventsWithMedia = storyEvents.filter((event) => {
        const content = event.content.toLowerCase();
        return (
          content.includes("http") &&
          (content.includes(".jpg") ||
            content.includes(".jpeg") ||
            content.includes(".png") ||
            content.includes(".gif") ||
            content.includes(".webp") ||
            content.includes(".mp4") ||
            content.includes(".webm"))
        );
      });

      // Group by author
      const groupedByAuthor = new Map<string, Event[]>();
      for (const event of storyEventsWithMedia) {
        const pubkey = event.pubkey;
        if (!groupedByAuthor.has(pubkey)) {
          groupedByAuthor.set(pubkey, []);
        }
        groupedByAuthor.get(pubkey)!.push(event);
      }

      // Convert to stories format
      const storiesData = await Promise.all(
        Array.from(groupedByAuthor.entries()).map(async ([pubkey, events]) => {
          const userInfo = await getUserInfo(pubkey);
          
          const items = events.map((event) => {
            // Extract media URL from content
            const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|mp4|webm))/gi;
            const matches = event.content.match(urlRegex);
            const mediaUrl = matches ? matches[0] : "";
            
            // Determine if video or image
            const isVideo = mediaUrl.match(/\.(mp4|webm)$/i);
            
            return {
              id: event.id,
              type: isVideo ? "video" : "image",
              url: mediaUrl,
              caption: event.content.replace(urlRegex, "").trim(),
              createdAt: event.created_at * 1000,
            };
          });

          return {
            pubkey,
            userInfo,
            viewed: false,
            isLive: false,
            items: items.sort((a, b) => b.createdAt - a.createdAt),
          };
        }),
      );

      stories.value = storiesData.filter(story => story.items.length > 0);
    } catch (error) {
      console.error("Failed to fetch stories:", error);
      stories.value = [];
    } finally {
      isLoadingStories.value = false;
    }
  };

  /**
   * Fetch live streams
   * Using NIP-53: Live Activities (kind 30311)
   */
  const fetchLiveStreams = async () => {
    isLoadingLiveStreams.value = true;
    try {
      // Query for live streaming events (kind 30311) from specialized relays
      const liveEvents = await queryEvents(
        {
          kinds: [30311], // Live streaming events
          limit: liveStreamsLimit.value,
        },
        LIVE_STREAM_RELAYS, // Use specialized relays for better discovery
      );
      
      // Check if there might be more streams
      hasMoreLiveStreams.value = liveEvents.length >= liveStreamsLimit.value;

      // Filter for active streams (check status tag)
      const activeLiveEvents = liveEvents.filter((event) => {
        const statusTag = event.tags.find((tag) => tag[0] === "status");
        return statusTag && statusTag[1] === "live";
      });

      // Convert to live stream format
      const liveStreamsData = await Promise.all(
        activeLiveEvents.map(async (event) => {
          const userInfo = await getUserInfo(event.pubkey);
          
          // Extract metadata from tags
          const titleTag = event.tags.find((tag) => tag[0] === "title");
          const summaryTag = event.tags.find((tag) => tag[0] === "summary");
          const imageTag = event.tags.find((tag) => tag[0] === "image");
          const streamingTag = event.tags.find((tag) => tag[0] === "streaming");
          const recordingTag = event.tags.find((tag) => tag[0] === "recording");
          const currentParticipantsTag = event.tags.find((tag) => tag[0] === "current_participants");
          const dTag = event.tags.find((tag) => tag[0] === "d");
          
          // Get stream URL - prefer streaming tag, fallback to recording
          let streamUrl = streamingTag ? streamingTag[1] : "";
          if (!streamUrl && recordingTag) {
            streamUrl = recordingTag[1];
          }
          
          // Create naddr for zap.stream link
          const identifier = dTag ? dTag[1] : "";
          
          return {
            id: event.id,
            title: titleTag ? titleTag[1] : "Live Stream",
            summary: summaryTag ? summaryTag[1] : event.content,
            image: imageTag ? imageTag[1] : "",
            host: {
              name: userInfo?.display_name || userInfo?.name || "Anonymous",
              picture: userInfo?.picture || "",
              pubkey: event.pubkey,
            },
            viewers: currentParticipantsTag ? parseInt(currentParticipantsTag[1] || "0") : 0,
            streamUrl: streamUrl,
            identifier: identifier,
            event: event,
          };
        }),
      );

      liveStreams.value = liveStreamsData;
    } catch (error) {
      console.error("Failed to fetch live streams:", error);
      liveStreams.value = [];
    } finally {
      isLoadingLiveStreams.value = false;
    }
  };

  /**
   * Load more live streams by increasing the limit
   */
  const loadMoreLiveStreams = async () => {
    liveStreamsLimit.value += 20; // Increase limit by 20
    await fetchLiveStreams();
  };

  /**
   * Subscribe to new live streams
   */
  const subscribeToLiveStreams = () => {
    return subscribeToEvents(
      {
        kinds: [30311],
        since: Math.floor(Date.now() / 1000),
      },
      {
        onevent: async (event: Event) => {
          const statusTag = event.tags.find((tag) => tag[0] === "status");
          
          if (statusTag && statusTag[1] === "live") {
            // Add new live stream
            const userInfo = await getUserInfo(event.pubkey);
            
            const titleTag = event.tags.find((tag) => tag[0] === "title");
            const summaryTag = event.tags.find((tag) => tag[0] === "summary");
            const imageTag = event.tags.find((tag) => tag[0] === "image");
            const streamingTag = event.tags.find((tag) => tag[0] === "streaming");
            const recordingTag = event.tags.find((tag) => tag[0] === "recording");
            const currentParticipantsTag = event.tags.find((tag) => tag[0] === "current_participants");
            const dTag = event.tags.find((tag) => tag[0] === "d");
            
            // Get stream URL - prefer streaming tag, fallback to recording
            let streamUrl = streamingTag ? streamingTag[1] : "";
            if (!streamUrl && recordingTag) {
              streamUrl = recordingTag[1];
            }
            
            const identifier = dTag ? dTag[1] : "";
            
            const newStream = {
              id: event.id,
              title: titleTag ? titleTag[1] : "Live Stream",
              summary: summaryTag ? summaryTag[1] : event.content,
              image: imageTag ? imageTag[1] : "",
              host: {
                name: userInfo?.display_name || userInfo?.name || "Anonymous",
                picture: userInfo?.picture || "",
                pubkey: event.pubkey,
              },
              viewers: currentParticipantsTag ? parseInt(currentParticipantsTag[1] || "0") : 0,
              streamUrl: streamUrl,
              identifier: identifier,
              event: event,
            };
            
            // Check if stream already exists
            const existingIndex = liveStreams.value.findIndex(s => s.id === event.id);
            if (existingIndex === -1) {
              liveStreams.value.unshift(newStream);
            }
          } else if (statusTag && statusTag[1] === "ended") {
            // Remove ended stream
            liveStreams.value = liveStreams.value.filter(s => s.id !== event.id);
          }
        },
      },
    );
  };

  return {
    stories,
    liveStreams,
    isLoadingStories,
    isLoadingLiveStreams,
    hasMoreLiveStreams,
    fetchStories,
    fetchLiveStreams,
    loadMoreLiveStreams,
    subscribeToLiveStreams,
  };
};
