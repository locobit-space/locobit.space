<template>
  <div>
    <CommonContainer class="shadow-xs rounded-lg overflow-hidden">
      <!-- Existing banner and profile section (unchanged) -->
      <div class="relative">
        <USkeleton v-if="loading" class="h-48 rounded-lg" />
        <img
          v-else
          :src="profile?.banner || '/default-banner.jpg'"
          alt="Profile Banner"
          class="w-full h-48 object-cover bg-primary-400"
        />

        <div
          class="absolute -bottom-12 left-4 border-4 border-white rounded-full"
        >
          <USkeleton v-if="loading" class="w-24 h-24 rounded-full" />
          <img
            v-else
            :src="profile?.picture || '/default-avatar.png'"
            alt="Profile Picture"
            class="w-24 backdrop-blur bg-white/50 h-24 rounded-full object-cover"
          />
        </div>
      </div>

      <div class="px-4 pt-16 pb-4">
        <nav class="flex justify-between">
          <div class="flex flex-col">
            <h2 class="text-xl font-bold">
              {{ profile?.display_name || profile?.name || "N/A" }}
              <span
                v-if="profile?.verified"
                class="text-primary-500"
                title="Verified"
              >
                <Icon name="bitcoin-icons:verify-outline" size="20" />
              </span>
            </h2>
            <div>
              <span class="text-sm text-gray-500">
                @{{ profile?.name || "N/A" }}
              </span>
            </div>
          </div>
          <div v-if="user" class="">
            <nav v-if="user?.publicKey !== profile?.pubkey">
              <UButton
                variant="ghost"
                :label="isFollowing ? 'Unfollow' : 'Follow'"
                :color="isFollowing ? 'primary' : 'neutral'"
                :icon="
                  isFollowing ? 'i-heroicons-check' : 'i-heroicons-plus-circle'
                "
                @click="toggleFollow"
              />
            </nav>
            <nav v-else>
              <UButton variant="ghost" label="Edit" :to="`/profile/${id}`" />
            </nav>
            <!-- <UButton variant="ghost" label="Message" @click="message" /> -->
            <!-- <UButton color="neutral" label="Share" @click="share" />
            <UButton color="neutral" label="Report" @click="report" />
            <UButton color="neutral" label="Block" @click="block" />
            <UButton color="neutral" label="Mute" @click="mute" /> -->
          </div>
        </nav>

        <p class="text-gray-600 mt-1">
          {{ profile?.about }}
        </p>

        <!-- Profile stats -->
        <div class="flex mt-3 space-x-4">
          <div class="text-sm">
            <span class="font-bold">{{ profileNotes.length }}</span> Notes
          </div>
          <div class="text-sm">
            <span class="font-bold">{{ profileReplies.length }}</span> Replies
          </div>
          <div class="text-sm">
            <span class="font-bold">{{ mediaItems.length }}</span> Media
          </div>
          <div class="text-sm">
            <span class="font-bold">{{ followers.length }}</span> Followers
          </div>
          <div class="text-sm">
            <span class="font-bold">{{ following.length }}</span> Following
          </div>
        </div>

        <!-- Profile links (unchanged) -->
        <div class="mt-4 space-y-2">
          <div v-if="profile?.nip05" class="flex items-center space-x-2">
            <span>
              <Icon name="mdi:at" class="w-4 h-4" />
            </span>
            <a
              :href="`https://${profile?.nip05}`"
              target="_blank"
              class="text-blue-600"
            >
              {{ profile?.nip05 }}
            </a>
          </div>

          <div v-if="profile?.website" class="flex items-center space-x-2">
            <span>
              <Icon name="mdi:web" class="w-4 h-4" />
            </span>
            <a
              :href="profile?.website"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600"
            >
              {{ profile?.website }}
            </a>
          </div>

          <div v-if="profile?.lud16" class="flex items-center space-x-2">
            <span>
              <Icon name="system-uicons:lightning" class="w-4 h-4" />
            </span>
            <span>{{ profile?.lud16 }}</span>
          </div>
        </div>
      </div>
    </CommonContainer>

    <CommonContainer
      class="sticky backdrop-blur dark:bg-transparent bg-white/30 top-0"
    >
      <CommonTab :tabs="tabs" v-model="tab" class="mt-8"> </CommonTab>
    </CommonContainer>

    <!-- Notes tab content (unchanged) -->
    <CommonContainer v-show="tab === 'notes'">
      <div v-if="loading" class="pt-4">
        <article class="flex flex-col gap-4">
          <NoteSkeleton v-for="i in 3" :key="i" />
        </article>
      </div>

      <div v-if="profileNotes.length" class="md:px-0 py-4">
        <div v-for="note in profileNotes" :key="note.id">
          <NoteCard :note="note" />
        </div>
      </div>

      <div v-else-if="!loading" class="py-8 text-center text-gray-500">
        No notes found
      </div>
    </CommonContainer>

    <!-- Replies tab content (NEW) -->
    <CommonContainer v-show="tab === 'replies'">
      <div v-if="loadingReplies" class="pt-4">
        <article class="flex flex-col gap-4">
          <NoteSkeleton v-for="i in 3" :key="i" />
        </article>
      </div>

      <div v-if="profileReplies.length" class="md:px-0 py-4">
        <div v-for="reply in profileReplies" :key="reply.id" class="mb-4">
          <ReplyCard :reply="reply" />
        </div>
      </div>

      <div v-else-if="!loadingReplies" class="py-8 text-center text-gray-500">
        No replies found
      </div>
    </CommonContainer>

    <!-- Media tab content (NEW) -->
    <CommonContainer v-show="tab === 'media'">
      <div v-if="loadingMedia" class="pt-4">
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div
            v-for="i in 6"
            :key="i"
            class="aspect-square bg-gray-200 rounded-lg animate-pulse"
          ></div>
        </div>
      </div>

      <div v-else-if="mediaItems.length" class="py-4">
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div
            v-for="media in mediaItems"
            :key="media.id"
            class="relative aspect-square rounded-lg overflow-hidden"
          >
            <!-- Image preview -->
            <img
              v-if="media?.imageUrl"
              :src="media?.imageUrl"
              :alt="media?.alt || 'Media'"
              class="w-full h-full object-cover"
              @click="openMediaModal(media)"
            />

            <!-- Video preview -->
            <div
              v-else-if="media?.videoUrl"
              class="w-full h-full flex bg-black items-center justify-center cursor-pointer"
              @click="openMediaModal(media)"
            >
              <Icon name="mdi:play-circle" size="32" class="text-white" />
            </div>

            <!-- Audio preview -->
            <div
              v-else-if="media.audioUrl"
              class="w-full h-full bg-gray-100 flex items-center justify-center cursor-pointer"
              @click="openMediaModal(media)"
            >
              <Icon name="mdi:volume-high" size="32" class="text-gray-700" />
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="!loadingMedia" class="py-8 text-center text-gray-500">
        No media found
      </div>
    </CommonContainer>

    <!-- Followers tab content (unchanged) -->
    <CommonContainer v-show="tab === 'followers'">
      <div v-if="loadingFollowers" class="pt-4">
        <article class="flex flex-col gap-4">
          <ProfileSkeleton v-for="i in 3" :key="i" />
        </article>
      </div>

      <div v-else-if="followers.length" class="md:px-0 py-4">
        <div v-for="follower in followers" :key="follower.pubkey" class="mb-4">
          <UserCard :user="follower" />
        </div>
      </div>

      <div v-else class="py-8 text-center text-gray-500">
        No followers found
      </div>
    </CommonContainer>

    <!-- Following tab content (unchanged) -->
    <CommonContainer v-show="tab === 'following'">
      <div v-if="loadingFollowing" class="pt-4">
        <article class="flex flex-col gap-4">
          <ProfileSkeleton v-for="i in 3" :key="i" />
        </article>
      </div>

      <div v-else-if="following.length" class="md:px-0 py-4">
        <div
          v-for="followedUser in following"
          :key="followedUser.pubkey"
          class="mb-4"
        >
          <UserCard :user="followedUser" />
        </div>
      </div>

      <div v-else class="py-8 text-center text-gray-500">
        No following found
      </div>
    </CommonContainer>

    <!-- Media modal -->
    <transition name="fade">
      <div
        v-if="selectedMedia"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
        @click="selectedMedia = null"
      >
        <div class="max-w-4xl max-h-full relative" @click.stop>
          <button
            class="absolute right-4 top-4 z-10 w-8 h-8 text-white bg-black/50 rounded-full p-1"
            @click="selectedMedia = null"
          >
            <Icon name="mdi:close" class="w-6 h-6" />
          </button>

          <!-- Image viewer -->
          <img
            v-if="selectedMedia?.imageUrl"
            :src="selectedMedia?.imageUrl"
            :alt="selectedMedia?.alt || 'Media'"
            class="max-w-full max-h-[80vh] object-contain rounded-lg"
          />

          <!-- Video player -->
          <video
            v-else-if="selectedMedia?.videoUrl"
            controls
            autoplay
            class="max-w-full max-h-[80vh] rounded-lg"
          >
            <source :src="selectedMedia?.videoUrl" :type="'video/mp4'" />
            Your browser does not support the video tag.
          </video>

          <!-- Audio player -->
          <audio
            v-else-if="selectedMedia.audioUrl"
            controls
            autoplay
            class="w-full"
          >
            <source :src="selectedMedia.audioUrl" :type="'audio/mpeg'" />
            Your browser does not support the audio tag.
          </audio>

          <div class="text-white mt-2">
            <p v-if="selectedMedia.caption" class="text-sm">
              {{ selectedMedia.caption }}
            </p>
            <p class="text-xs mt-1 opacity-70">
              Posted
              {{ new Date(selectedMedia.created_at * 1000).toLocaleString() }}
            </p>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import type { Event } from "nostr-tools";
import { ref, onMounted, watch } from "vue";
import type { UserInfo } from "~~/types";

// Extend Event to include extra fields
type ExtendedEvent = Event & {
  parentEvent?: Event;
  parentAuthor?: UserInfo;
};

const route = useRoute();

const { $nostr } = useNuxtApp();
const { pool } = $nostr;
const { normalizeKey } = useNostrKeys();
const { DEFAULT_RELAYS: RELAYS } = useNostrRelay();
const { getUserInfo } = useNostrUser();
const { isFollowing, toggleFollow } = useFollowUser(route.params.id as string);

interface MediaItem {
  id: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  alt?: string;
  created_at: number;
  caption?: string;
  type: "image" | "video" | "audio";
  event: Event;
}

const tab = ref("notes");
const tabs = ref([
  { label: "Notes", value: "notes" },
  { label: "Replies", value: "replies" },
  { label: "Media", value: "media" },
  { label: "Followers", value: "followers" },
  { label: "Following", value: "following" },
]);

const pubkey = ref("");
const profile = ref<UserInfo>({
  pubkey: "",
  display_name: "",
  picture: "",
  name: "",
});

const { user } = useNostrUser();
const loading = ref(true);
const profileNotes = ref<Event[]>([]);

// For replies tab
const profileReplies = ref<ExtendedEvent[]>([]);
const loadingReplies = ref(false);

// For media tab
const mediaItems = ref<MediaItem[]>([]);
const loadingMedia = ref(false);
const selectedMedia = ref<MediaItem | null>(null);

// For followers and following
const followers = ref<UserInfo[]>([]);
const following = ref<UserInfo[]>([]);
const loadingFollowers = ref(false);
const loadingFollowing = ref(false);

// Watch for tab changes to load data as needed
watch(tab, (newTab) => {
  if (newTab === "replies" && profileReplies.value.length === 0) {
    fetchReplies();
  }
  if (newTab === "media" && mediaItems.value.length === 0) {
    fetchMedia();
  }
  if (newTab === "followers" && followers.value.length === 0) {
    fetchFollowers();
  }
  if (newTab === "following" && following.value.length === 0) {
    fetchFollowing();
  }
});

const { id } = route.params;

onMounted(async () => {
  pubkey.value = id as string;

  try {
    const req = await getUserInfo(pubkey.value);
    if (req) {
      profile.value = req;
    }

    // Convert npub to hex
    const hexPubkey = normalizeKey(pubkey.value);

    // Fetch user's notes
    const notes = await pool.querySync(RELAYS, {
      kinds: [1, 6],
      authors: [hexPubkey],
      limit: 20,
    });

    // Remove duplication
    const uniqueNotes = Array.from(
      new Map(notes.map((note) => [note.id, note])).values()
    );

    profileNotes.value = uniqueNotes.sort(
      (a, b) => b.created_at - a.created_at
    );

    // Automatically fetch data for the current tab
    if (tab.value === "replies") {
      fetchReplies();
    } else if (tab.value === "media") {
      fetchMedia();
    } else if (tab.value === "followers") {
      fetchFollowers();
    } else if (tab.value === "following") {
      fetchFollowing();
    }
  } catch (error) {
    console.error("Profile fetch error:", error);
  } finally {
    loading.value = false;
  }
});

// Function to fetch replies (kind 1 notes with e tag)
const fetchReplies = async () => {
  if (loadingReplies.value) return;
  loadingReplies.value = true;

  try {
    const hexPubkey = normalizeKey(pubkey.value);

    // Query for replies - kind 1 events with e tags
    const replyEvents = await pool.querySync(RELAYS, {
      kinds: [1],
      authors: [hexPubkey],
      limit: 50,
    });

    // Filter replies that have at least one 'e' tag
    const replies = replyEvents.filter((event) =>
      event.tags.some((tag) => tag[0] === "e")
    );

    // Load referenced parent notes
    const extendedReplies: ExtendedEvent[] = replies.map((e) => ({ ...e }));

    for (const reply of extendedReplies) {
      const referencedEventIds: string[] = reply.tags
        .filter((tag) => tag[0] === "e" && typeof tag[1] === "string")
        .map((tag) => tag[1] as string);

      if (referencedEventIds.length > 0) {
        try {
          const parentEvents = await pool.querySync(RELAYS, {
            ids: [referencedEventIds[0] as string],
            limit: 1,
          });

          const parentEvent = parentEvents?.[0];
          if (parentEvent && parentEvent.pubkey) {
            reply.parentEvent = parentEvent;

            const parentAuthorInfo = await getUserInfo(parentEvent.pubkey);
            if (parentAuthorInfo) {
              reply.parentAuthor = parentAuthorInfo;
            }
          }
        } catch (error) {
          console.error("Error fetching parent event:", error);
        }
      }
    }

    profileReplies.value = extendedReplies.sort(
      (a, b) => b.created_at - a.created_at
    ) as ExtendedEvent[];
  } catch (error) {
    console.error("Error fetching replies:", error);
  } finally {
    loadingReplies.value = false;
  }
};

// Function to fetch media content
const fetchMedia = async () => {
  if (loadingMedia.value) return;
  loadingMedia.value = true;

  try {
    const hexPubkey = normalizeKey(pubkey.value);

    // Query for notes by the user
    const events = await pool.querySync(RELAYS, {
      kinds: [1], // Regular notes
      authors: [hexPubkey],
      limit: 100, // Fetch more to find media
    });

    // Process events to extract media
    const media: MediaItem[] = [];

    for (const event of events) {
      // Check for image URLs in content
      const imageUrls = extractMediaUrls(event.content, "image");
      const videoUrls = extractMediaUrls(event.content, "video");
      const audioUrls = extractMediaUrls(event.content, "audio");

      // Add image media items
      for (const url of imageUrls) {
        media.push({
          id: `${event.id}-${media.length}`,
          imageUrl: url,
          type: "image",
          created_at: event.created_at,
          event: event,
        });
      }

      // Add video media items
      for (const url of videoUrls) {
        media.push({
          id: `${event.id}-${media.length}`,
          videoUrl: url,
          type: "video",
          created_at: event.created_at,
          event: event,
        });
      }

      // Add audio media items
      for (const url of audioUrls) {
        media.push({
          id: `${event.id}-${media.length}`,
          audioUrl: url,
          type: "audio",
          created_at: event.created_at,
          event: event,
        });
      }
    }

    mediaItems.value = media.sort((a, b) => b.created_at - a.created_at);
  } catch (error) {
    console.error("Error fetching media:", error);
  } finally {
    loadingMedia.value = false;
  }
};

// Helper function to extract media URLs from content
const extractMediaUrls = (
  content: string,
  type: "image" | "video" | "audio"
) => {
  const urls = [];

  // Image URL patterns
  if (type === "image") {
    // Match common image URL patterns
    const imgRegex = /(https?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp)(\?\S*)?)/gi;
    const matches = content.match(imgRegex);
    if (matches) urls.push(...matches);
  }

  // Video URL patterns
  else if (type === "video") {
    // Match common video URL patterns
    const videoRegex = /(https?:\/\/\S+\.(?:mp4|webm|mov|mkv)(\?\S*)?)/gi;
    const youtubeRegex =
      /(https?:\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?)/gi;

    const matches = content.match(videoRegex);
    const ytMatches = content.match(youtubeRegex);

    if (matches) urls.push(...matches);
    if (ytMatches) urls.push(...ytMatches);
  }

  // Audio URL patterns
  else if (type === "audio") {
    // Match common audio URL patterns
    const audioRegex = /(https?:\/\/\S+\.(?:mp3|wav|ogg|flac)(\?\S*)?)/gi;
    const matches = content.match(audioRegex);
    if (matches) urls.push(...matches);
  }

  return urls;
};

// Function to open media in modal
const openMediaModal = (media: MediaItem) => {
  selectedMedia.value = media;
};

// Function to fetch followers (users who follow the current profile)
const fetchFollowers = async () => {
  if (loadingFollowers.value) return;
  loadingFollowers.value = true;

  try {
    const hexPubkey = normalizeKey(pubkey.value);

    // Query for contacts that include our pubkey (users following the current profile)
    // NIP-02: kind 3 events are contact lists
    const followerEvents = await pool.querySync(RELAYS, {
      kinds: [3],
      "#p": [hexPubkey],
      limit: 50,
    });

    // Extract unique pubkeys of followers
    const followerPubkeys = [
      ...new Set(followerEvents.map((event) => event.pubkey)),
    ];

    // Fetch user info for each follower
    const followerProfiles = await Promise.all(
      followerPubkeys.map(async (pk) => {
        try {
          const userInfo = await getUserInfo(pk);
          return {
            ...userInfo,
            pubkey: pk,
          };
        } catch (error) {
          console.error(`Error fetching follower info for ${pk}:`, error);
          return {
            pubkey: pk,
            name: "Unknown User",
          };
        }
      })
    );

    followers.value = followerProfiles as UserInfo[];
  } catch (error) {
    console.error("Error fetching followers:", error);
  } finally {
    loadingFollowers.value = false;
  }
};

// Function to fetch following (users that the current profile follows)
const fetchFollowing = async () => {
  if (loadingFollowing.value) return;
  loadingFollowing.value = true;

  try {
    const hexPubkey = normalizeKey(pubkey.value);

    // Get the contact list of the current profile
    const contactListEvents = await pool.querySync(RELAYS, {
      kinds: [3],
      authors: [hexPubkey],
      limit: 1, // We only need the most recent contact list
    });

    // If no contact list found
    if (!contactListEvents.length) {
      loadingFollowing.value = false;
      return;
    }

    // Extract the pubkeys from the tags
    const contactList = contactListEvents[0];
    const followingPubkeys = contactList?.tags
      .filter((tag) => tag[0] === "p")
      .map((tag) => tag[1]);

    if (!Array.isArray(followingPubkeys) || followingPubkeys.length === 0) {
      following.value = [];
      return;
    }

    const followingProfiles = await Promise.all(
      followingPubkeys.map(async (pk) => {
        try {
          const userInfo = await getUserInfo(pk as string);
          return {
            ...userInfo,
            pubkey: pk,
          };
        } catch (error) {
          console.error(`Error fetching following info for ${pk}:`, error);
          return {
            pubkey: pk,
            name: "Unknown User",
          };
        }
      })
    );

    following.value = followingProfiles as UserInfo[];
  } catch (error) {
    console.error("Error fetching following:", error);
  } finally {
    loadingFollowing.value = false;
  }
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
