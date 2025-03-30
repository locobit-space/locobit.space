// composables/useNoteShort.ts

import { computed } from "vue";

export const useNoteShort = () => {
  const { notes, isLoading, loadNotesOnce, loadOlderNotes, getNoteById } =
    useNostrFeed();

  // Transform Nostr notes into shorts format
  const shorts = computed(() => {
    return notes.value
      .filter((note) => {
        // Filter notes that have media URLs in their content
        const urlRegex =
          /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|mp4|webm|ogg|mov))/gi;
        return urlRegex.test(note.content);
      })
      .map((note) => {
        // Extract the first media URL from the content
        const urlRegex =
          /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|mp4|webm|ogg|mov))/i;
        const match = note.content.match(urlRegex);
        const url = match ? match[0] : "";

        // Extract hashtags for potential use
        const hashtagRegex = /#(\w+)/g;
        const hashtags = Array.from(
          note.content.matchAll(hashtagRegex),
          (m) => m[1]
        );

        // Clean content by removing the URL
        let title = note.content.replace(urlRegex, "").trim();

        // If content is too long, truncate it
        if (title.length > 100) {
          title = title.substring(0, 97) + "...";
        }

        // Find author info from event tags if available
        let creator = "";
        const authorTag = note.tags.find((tag) => tag[0] === "p");
        if (authorTag && authorTag[1]) {
          creator = authorTag[3] || `nostr:${authorTag[1].substring(0, 8)}...`;
        } else {
          creator = `nostr:${note.pubkey.substring(0, 8)}...`;
        }

        return {
          id: note.id,
          url: url,
          title: title,
          creator: creator,
          createdAt: note.created_at,
          pubkey: note.pubkey,
          hashtags: hashtags,
          // Placeholder values for UI elements
          likes: Math.floor(Math.random() * 100),
          comments: Math.floor(Math.random() * 20),
          originalEvent: note,
        };
      });
  });

  // Load initial shorts
  const loadFirstShort = async () => {
    await loadNotesOnce({ limit: 10 });
  };

  // Load older shorts when scrolling
  const loadOldShort = async () => {
    await loadOlderNotes({ limit: 5 });
  };

  // Get a specific short by ID
  const getShortById = async (id: string) => {
    const note = await getNoteById(id);
    if (!note) return null;

    // Convert the note to short format
    const urlRegex =
      /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|mp4|webm|ogg|mov))/i;
    const match = note.content.match(urlRegex);
    if (!match) return null;

    const url = match[0];
    let title = note.content.replace(urlRegex, "").trim();

    if (title.length > 100) {
      title = title.substring(0, 97) + "...";
    }

    let creator = "";
    const authorTag = note.tags.find((tag) => tag[0] === "p");
    if (authorTag && authorTag[1]) {
      creator = authorTag[3] || `nostr:${authorTag[1].substring(0, 8)}...`;
    } else {
      creator = `nostr:${note.pubkey.substring(0, 8)}...`;
    }

    return {
      id: note.id,
      url: url,
      title: title,
      creator: creator,
      createdAt: note.created_at,
      pubkey: note.pubkey,
      hashtags: [],
      likes: Math.floor(Math.random() * 100),
      comments: Math.floor(Math.random() * 20),
      originalEvent: note,
    };
  };

  // Post a new short with media URL
  const postShort = async (content: string, mediaUrl: string) => {
    // This would need to be implemented using the postNote function
    // from useNostrFeed, combining the content and mediaUrl
  };

  return {
    shorts,
    isLoading,
    loadFirstShort,
    loadOldShort,
    getShortById,
    postShort,
  };
};
