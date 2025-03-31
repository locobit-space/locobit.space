<template>
  <div class="mb-4 z-0">
    <div class="flex items-start gap-4">
      <NuxtLink :to="`/profile/${note.pubkey}`">
        <UAvatar :src="userInfo?.picture" />
      </NuxtLink>
      <div class="flex-1">
        <div
          class="flex justify-between md:items-center flex-col md:flex-row mb-2"
        >
          <NuxtLink :to="`/profile/${note.pubkey}`" class="flex flex-col">
            <span class="font-bold z-0">
              {{ userInfo?.display_name || "N/A" }}
              <Icon
                v-if="userInfo?.verified"
                name="ic:round-verified"
                class="text-primary-500 w-4 h-4"
              />
            </span>
            <small class="text-xs text-gray-500">
              @{{ userInfo?.name || "N/A" }}
            </small>
          </NuxtLink>
          <span class="text-sm text-gray-500" :title="formattedDate">
            {{ timeAgo(note.created_at) }}
          </span>
        </div>

        <!-- Media Display -->
        <section class="mb-3 grid grid-cols-2 gap-2">
          <div v-for="(media, index) in mediaUrls" :key="index">
            <!-- Image Display -->
            <NuxtImg
              v-if="media.type === 'image'"
              :src="media.url"
              :alt="`Note image ${index + 1}`"
              class="w-full rounded-lg object-cover max-h-64"
            />

            <!-- Video Display -->
            <video
              v-else-if="media.type === 'video'"
              controls
              class="w-full rounded-lg max-h-64 z-0"
            >
              <source :src="media.url" :type="media.videoType" />
              Your browser does not support the video tag.
            </video>

            <!-- Generic embed handling -->
            <iframe
              v-else-if="media.type === 'embed'"
              :src="media.embedUrl"
              :title="`${media.embedType} video`"
              frameborder="0"
              allowfullscreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              class="media-embed"
            >
            </iframe>

            <div v-if="media.type === 'embed'" class="media-caption">
              {{
                media.embedType.charAt(0).toUpperCase() +
                media.embedType.slice(1)
              }}
            </div>
          </div>
        </section>

        <!-- Note Content with Hashtag Parsing -->
        <div class="text-wrap break-all" @click="emit('contentClicked', note)">
          <template v-for="(part, index) in parsedContent" :key="index">
            <NuxtLink
              :to="`/notes/${note.id}`"
              v-if="part.type === 'text'"
              class="break-words break-all"
            >
              {{ part.value }}
            </NuxtLink>
            <NuxtLink
              v-else-if="part.type === 'hashtag'"
              :to="`/hashtag/${part.value.slice(1)}`"
              class="text-primary-600 hover:underline"
            >
              {{ part.value }}
            </NuxtLink>
          </template>
        </div>

        <!-- URL Preview -->
        <div v-if="linkPreviews.length" class="mt-2 space-y-2">
          <div
            v-for="(preview, index) in linkPreviews"
            :key="index"
            class="border rounded-lg border-slate-100 overflow-hidden flex"
          >
            <div v-if="preview.image" class="w-1/3">
              <img
                :src="preview.image"
                :alt="preview.title"
                class="w-full h-32 object-cover"
              />
            </div>
            <div class="p-3 flex-1">
              <a
                :href="preview.url"
                target="_blank"
                rel="noopener noreferrer"
                class="font-bold text-lg hover:underline"
              >
                {{ preview.title }}
              </a>
              <p class="text-sm text-gray-600 mt-1 line-clamp-2">
                {{ preview.description }}
              </p>
              <div class="text-xs text-gray-500 mt-1">
                {{ preview.domain }}
              </div>
            </div>
          </div>
        </div>

        <!-- action buttons repost like etc -->
        <div class="flex gap-4 mt-4 border-y border-slate-100 py-1">
          <UButton
            color="neutral"
            icon="system-uicons:retweet"
            class="mr-2"
            variant="ghost"
            :label="rePostCount > 0 ? `${rePostCount}` : ''"
            @click="repost"
          />
          <UButton
            :color="isLiked ? 'primary' : 'neutral'"
            :icon="isLiked ? 'heroicons:heart-20-solid' : 'heroicons:heart'"
            class="mr-2"
            variant="ghost"
            :label="likeCount > 0 ? `${likeCount}` : ''"
            @click="likeNote"
          />
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-chat-bubble-left-right"
            :label="commentCount > 0 ? `${commentCount}` : ''"
          />
          <UButton
            color="neutral"
            variant="ghost"
            :icon="
              isBookmarked ? 'heroicons:bookmark-solid' : 'heroicons:bookmark'
            "
            @click="bookmarkNote"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Event } from "nostr-tools";
import { hexToBytes } from "@noble/hashes/utils";
import { computed } from "vue";
import type { UserInfo } from "~~/types";

const props = defineProps<{
  note: Event;
}>();

const emit = defineEmits(["contentClicked"]);

const toast = useToast();
const { $nostr } = useNuxtApp();

const { formatDateTime, timeAgo } = useHelpers();
const { getUserInfo, user } = useNostrUser();
const { DEFAULT_RELAYS: RELAYS } = useNostrRelay();
const { trackInteraction } = useNostrFeedAlgorithm();

const userInfo = ref<UserInfo>({
  pubkey: "",
  display_name: "",
  picture: "",
  name: "",
});

const formattedDate = computed(() => formatDateTime(props.note.created_at));

function loadUserInfo() {
  getUserInfo(props.note.pubkey).then((user) => {
    userInfo.value = {
      ...userInfo.value,
      ...user,
    };
  });
}

loadUserInfo();

const shareNote = async () => {
  const url = `https://nostr.guru/e/${props.note.id}`;
  await navigator.clipboard.writeText(url);
  toast.add({ title: "Note URL copied!" });
};

const likeNote = async () => {
  if (!user.value) return;

  const pubkey = user.value.publicKey;
  const noteId = props.note.id;

  trackInteraction(props.note, "like");

  // Find user's latest reaction for this note
  const existing = noteItems.value.find(
    (item) =>
      item.kind === 7 &&
      item.pubkey === pubkey &&
      item.tags.some((tag) => tag[0] === "e" && tag[1] === noteId)
  );

  // Determine new reaction based on current one
  const newContent = existing?.content === "👍" ? "" : "👍";

  // Optional: toggle off if clicked twice on the same reaction
  const isUnliking = existing && existing.content === newContent;

  if (isUnliking) {
    // Remove the existing like
    noteItems.value = noteItems.value.filter((item) => item.id !== existing.id);
    return;
  }

  // Build new reaction event
  const event = {
    kind: 7,
    content: newContent,
    tags: [
      ["e", noteId],
      ["p", pubkey],
    ],
    created_at: Math.floor(Date.now() / 1000),
  };

  const { $nostr } = useNuxtApp();
  const signed = $nostr.finalizeEvent(event, hexToBytes(user.value.privateKey));

  // Remove old one if exists (e.g. switching from + to -)
  if (existing) {
    noteItems.value = noteItems.value.filter((item) => item.id !== existing.id);
  }

  noteItems.value.push(signed); // Add the new one

  try {
    await Promise.any($nostr.pool.publish(RELAYS, signed));
  } catch (err) {
    console.error("Like failed", err);
  }
};

const repost = () => {
  trackInteraction(props.note, "repost");
  toast.add({
    title: "Repost feature not implemented yet.",
  });
};

const replyToNote = () => {
  trackInteraction(props.note, "reply");
  toast.add({
    title: "Reply feature not implemented yet.",
  });
};

const nostrBookmarks = ref<string[]>([]);

const loadBookmarks = () => {
  const stored = localStorage.getItem("nostr-bookmarks");
  nostrBookmarks.value = stored ? JSON.parse(stored) : [];
};

// Load on init
loadBookmarks();

const bookmarkNote = () => {
  const id = props.note.id;
  const index = nostrBookmarks.value.indexOf(id);

  if (index === -1) {
    nostrBookmarks.value.push(id);
    toast.add({ title: "Note bookmarked" });
  } else {
    nostrBookmarks.value.splice(index, 1);
    toast.add({ title: "Note unbookmarked", color: "neutral" });
  }

  // Save back to localStorage
  localStorage.setItem("nostrBookmarks", JSON.stringify(nostrBookmarks.value));

  syncBookmarksToNostr();
};

const isBookmarked = computed(() => {
  return nostrBookmarks.value.includes(props.note.id);
});

const syncBookmarksToNostr = async () => {
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
      ...nostrBookmarks.value.map((id) => ["e", id]),
    ],
    pubkey,
  };

  const signed = $nostr.finalizeEvent(event, hexToBytes(user.value.privateKey));

  try {
    await Promise.any($nostr.pool.publish(RELAYS, signed));
    // Optional success toast here if you want
  } catch (err) {
    console.error("Failed to sync bookmarks to Nostr", err);
  }
};

const noteItems = ref<Event[]>([]);

const isLiked = computed(() => {
  if (noteItems.value.length) {
    return ["+", "❤️", "👍", "🙏🏿", "💜"].includes(
      noteItems.value[0]?.content || ""
    );
  }
  return false;
});

const getNoteLikes = async (noteId: string): Promise<number> => {
  try {
    const events = await $nostr.pool.querySync(RELAYS, {
      kinds: [7, 1, 6],
      "#e": [noteId], // reactions linked to this note
      limit: 100, // adjust based on how many likes you expect
    });

    noteItems.value = events;

    // Filter only like-type reactions
    const likeReactions = events.filter((event) =>
      ["+", "❤️", "👍", "🙏🏿", "💜", "like"].includes(event.content)
    );

    return likeReactions.length;
  } catch (error) {
    console.error("Error fetching likes:", error);
    return 0;
  }
};

const likeCount = computed(() => {
  const reactions = noteItems.value.filter(
    (item) =>
      item.kind === 7 &&
      item.tags.some((tag) => tag[0] === "e" && tag[1] === props.note.id)
  );

  // Map to store the latest reaction per pubkey
  const latestByUser = new Map();

  for (const item of reactions) {
    const existing = latestByUser.get(item.pubkey);
    if (!existing || item.created_at > existing.created_at) {
      latestByUser.set(item.pubkey, item);
    }
  }

  // Only count those where the latest reaction is "+"
  const count = Array.from(latestByUser.values()).filter((item) =>
    ["+", "❤️", "👍", "🙏🏿", "💜"].includes(item.content)
  ).length;

  return count;
});

const commentCount = computed(() => {
  return noteItems.value.filter((item) => item.kind === 1).length;
});

const rePostCount = computed(() => {
  return noteItems.value.filter((item) => item.kind === 6).length;
});

// Media URL extraction with support for multiple platforms
const mediaUrls = computed(() => {
  // Collection of platform patterns
  const platforms = [
    {
      name: "youtube",
      regex:
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)(?:\S*)/gi,
      embedUrl: (id: string) => `https://www.youtube.com/embed/${id}`,
      thumbnailUrl: (id: string) =>
        `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    },
    {
      name: "vimeo",
      regex:
        /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?)/gi,
      embedUrl: (id: string) => `https://player.vimeo.com/video/${id}`,
    },
    {
      name: "rumble",
      regex:
        /(?:https?:\/\/)?(?:www\.)?rumble\.com\/([a-zA-Z0-9_-]+)(?:\.html)?(?:\S*)/gi,
      embedUrl: (id: string) => `https://rumble.com/embed/${id}/`,
    },
    {
      name: "dailymotion",
      regex:
        /(?:https?:\/\/)?(?:www\.)?dailymotion\.com\/video\/([a-zA-Z0-9_-]+)(?:\S*)/gi,
      embedUrl: (id: string) => `https://www.dailymotion.com/embed/video/${id}`,
    },
    {
      name: "twitch",
      regex:
        /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/(?:videos\/)?([a-zA-Z0-9_-]+)(?:\S*)/gi,
      embedUrl: (id: string) => {
        // Check if it's a video or channel
        if (/^\d+$/.test(id)) {
          return `https://player.twitch.tv/?video=${id}&parent=${window.location.hostname}`;
        } else {
          return `https://player.twitch.tv/?channel=${id}&parent=${window.location.hostname}`;
        }
      },
    },
    {
      name: "tiktok",
      regex:
        /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[^\/]+\/video\/(\d+)(?:\S*)/gi,
      embedUrl: (id: string) => `https://www.tiktok.com/embed/v2/${id}`,
    },
    {
      name: "facebook",
      regex:
        /(?:https?:\/\/)?(?:www\.|web\.|m\.)?facebook\.com\/(?:watch\/?\?v=|video\.php\?v=|video\.php\?id=|.*?\/videos\/(?:[^\/]+\/)?)(\d+)(?:\S*)/gi,
      embedUrl: (id: string) =>
        `https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/watch/?v=${id}&show_text=0`,
    },
    {
      name: "instagram",
      regex:
        /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)(?:\S*)/gi,
      embedUrl: (id: string) => `https://www.instagram.com/p/${id}/embed/`,
    },
    {
      name: "bitchute",
      regex:
        /(?:https?:\/\/)?(?:www\.)?bitchute\.com\/video\/([a-zA-Z0-9_-]+)(?:\S*)/gi,
      embedUrl: (id: string) => `https://www.bitchute.com/embed/${id}/`,
    },
    {
      name: "odysee",
      regex:
        /(?:https?:\/\/)?(?:www\.)?odysee\.com\/(?:\$\/)?([a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+)(?:\S*)/gi,
      embedUrl: (id: string) => `https://odysee.com/$/embed/${id}`,
    },
    {
      name: "peertube",
      regex:
        /(?:https?:\/\/)?([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)\/(?:videos\/)?watch\/([a-zA-Z0-9_-]+)(?:\S*)/gi,
      // Special handler for PeerTube as it needs both domain and ID
      customHandler: (match: any) => {
        const domain = match[1];
        const videoId = match[2];
        return {
          type: "embed",
          embedType: "peertube",
          videoId: videoId,
          domain: domain,
          embedUrl: `https://${domain}/videos/embed/${videoId}`,
        };
      },
    },
  ];

  // Direct media file URLs
  const imageUrlRegex = /(https?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp))/gi;
  const videoUrlRegex = /(https?:\/\/\S+\.(?:mp4|mov|avi|webm))/gi;

  // Process regular media files
  const mediaList: Array<any> = [];

  // Add direct image files
  const imageMatches = props.note.content.match(imageUrlRegex) || [];
  imageMatches.forEach((url: string) => {
    mediaList.push({
      type: "image",
      url: url,
    });
  });

  // Add direct video files
  const videoMatches = props.note.content.match(videoUrlRegex) || [];
  videoMatches.forEach((url: string) => {
    mediaList.push({
      type: "video",
      url: url,
      videoType: `video/${url.split(".").pop()}`,
    });
  });

  // Process each platform
  platforms.forEach((platform) => {
    if (platform.customHandler) {
      // For platforms that need special handling (like PeerTube)
      let match;
      platform.regex.lastIndex = 0; // Reset regex state
      while ((match = platform.regex.exec(props.note.content)) !== null) {
        const mediaItem = platform.customHandler(match);
        mediaList.push(mediaItem);
      }
    } else {
      // Standard platform processing
      let match;
      platform.regex.lastIndex = 0; // Reset regex state
      while ((match = platform.regex.exec(props.note.content)) !== null) {
        const videoId = match[1];
        let mediaItem = {
          type: "embed",
          embedType: platform.name,
          videoId: videoId,
          embedUrl: platform.embedUrl(videoId || ""),
        };

        // Add thumbnail URL if available
        if (platform.thumbnailUrl) {
          mediaItem.thumbnailUrl = platform.thumbnailUrl(videoId || "");
        }

        mediaList.push(mediaItem);
      }
    }
  });

  return mediaList;
});

// Content parsing for hashtags and media removal
const parsedContent = computed(() => {
  let content = props.note.content;

  // check if is Repost
  if (props.note.kind === 6) {
    if (props.note.content) {
      content = JSON.parse(content as string).content || "";
    }
  }

  // Remove all media URLs from content
  mediaUrls.value.forEach((media) => {
    content = content.replace(media.url, "");
  });

  content = content.trim();
  const parts: Array<{ type: "text" | "hashtag"; value: string }> = [];
  const hashtagRegex = /#\w+/g;

  let lastIndex = 0;
  let match;

  while ((match = hashtagRegex.exec(content)) !== null) {
    // Add text before hashtag
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        value: content.slice(lastIndex, match.index),
      });
    }

    // Add hashtag
    parts.push({
      type: "hashtag",
      value: match[0],
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({
      type: "text",
      value: content.slice(lastIndex),
    });
  }

  return parts.length ? parts : [{ type: "text", value: content }];
});

const fetchUrlPreview = async (url: string) => {
  try {
    // In a real implementation, this would be an API call
    const response = await fetch(`/api/preview?url=${encodeURIComponent(url)}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("URL preview fetch failed", error);
    return null;
  }
};

// Link detection
const linkUrls = computed(() => {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const allUrls = props.note.content.match(urlRegex) || [];

  // Filter out media URLs
  return allUrls.filter(
    (url: string) => !mediaUrls.value.some((media) => media.url === url)
  );
});

// Link previews
const linkPreviews = ref<
  Array<{
    url: string;
    title: string;
    description: string;
    image?: string;
    domain: string;
  }>
>([]);

onMounted(async () => {
  const noteId = props.note.id;
  getNoteLikes(noteId);

  const previews = await Promise.all(
    linkUrls.value.map(async (url: string) => {
      const preview = await fetchUrlPreview(url);
      return preview;
    })
  );

  linkPreviews.value = previews.filter((preview) => preview !== null);
});
</script>
