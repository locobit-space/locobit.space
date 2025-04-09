<template>
  <div
    class="bg-white shadow-sm dark:bg-slate-800 rounded-lg p-4 hover:bg-gray-50 transition hover:dark:bg-slate-900"
  >
    <!-- Parent post reference section -->
    <div
      v-if="reply.parentEvent"
      class="mb-3 pb-3 border-b dark:border-slate-700 border-gray-200"
    >
      <div class="flex items-start space-x-3">
        <!-- Parent author avatar -->
        <div>
          <img
            :src="reply.parentAuthor?.picture || '/default-avatar.png'"
            alt="Profile Picture"
            class="w-8 h-8 rounded-full object-cover"
          />
        </div>

        <!-- Parent post content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center">
            <p class="font-semibold truncate">
              {{
                reply.parentAuthor?.display_name ||
                reply.parentAuthor?.name ||
                "Unknown User"
              }}
            </p>
            <span
              v-if="reply.parentAuthor?.verified"
              class="ml-1 text-primary-500"
              title="Verified"
            >
              <Icon name="bitcoin-icons:verify-outline" size="16" />
            </span>
            <span class="ml-2 text-xs text-gray-500">
              {{ formatDate(reply.parentEvent.created_at) }}
            </span>
          </div>

          <p
            class="text-gray-700 dark:text-slate-300 text-sm line-clamp-2 mt-1"
          >
            {{ reply.parentEvent.content }}
          </p>
        </div>
      </div>
    </div>

    <!-- Reply section -->
    <div class="flex items-start space-x-3">
      <!-- Current user avatar -->
      <div>
        <NuxtLink :to="`/profile/${reply.pubkey}`">
          <img
            :src="profile?.picture || '/default-avatar.png'"
            alt="Profile Picture"
            class="w-10 h-10 rounded-full object-cover"
          />
        </NuxtLink>
      </div>

      <!-- Reply content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center">
          <p class="font-semibold">
            {{ profile?.display_name || profile?.name || "Unknown User" }}
          </p>
          <span
            v-if="profile?.verified"
            class="ml-1 text-primary-500"
            title="Verified"
          >
            <Icon name="bitcoin-icons:verify-outline" size="16" />
          </span>
          <span class="ml-2 text-xs text-gray-500">
            {{ formatDate(reply.created_at) }}
          </span>
        </div>

        <p class="text-gray-800 mt-1 dark:text-slate-300 whitespace-pre-line">
          {{ reply.content }}
        </p>

        <!-- Media attachments -->
        <div v-if="hasMedia" class="mt-3">
          <div
            v-if="imageUrls.length > 0"
            class="mt-2 grid gap-2"
            :class="gridClass"
          >
            <img
              v-for="(url, index) in imageUrls"
              :key="index"
              :src="url"
              alt="Attached image"
              class="rounded-lg object-cover w-full h-full max-h-64"
              @click="openMedia(url, 'image')"
            />
          </div>

          <div v-if="videoUrls.length > 0" class="mt-2">
            <div v-for="(url, index) in videoUrls" :key="index" class="mt-2">
              <div
                class="relative aspect-video bg-black/10 rounded-lg cursor-pointer flex items-center justify-center"
                @click="openMedia(url, 'video')"
              >
                <Icon name="mdi:play-circle" class="w-12 h-12 text-white/80" />
              </div>
            </div>
          </div>
        </div>

        <!-- Reaction buttons -->
        <div class="flex items-center mt-3 text-gray-500">
          <button class="flex items-center mr-4 hover:text-primary-500">
            <Icon name="mdi:comment-outline" class="w-5 h-5 mr-1" />
            <span class="text-xs">{{ replyCount }}</span>
          </button>

          <button class="flex items-center mr-4 hover:text-teal-500">
            <Icon name="mdi:repeat" class="w-5 h-5 mr-1" />
            <span class="text-xs">{{ repostCount }}</span>
          </button>

          <button class="flex items-center mr-4 hover:text-red-500">
            <Icon name="mdi:heart-outline" class="w-5 h-5 mr-1" />
            <span class="text-xs">{{ likeCount }}</span>
          </button>

          <button class="flex items-center hover:text-orange-500">
            <Icon name="mdi:lightning-bolt" class="w-5 h-5 mr-1" />
            <span class="text-xs">{{ zapCount }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

const props = defineProps({
  reply: {
    type: Object,
    required: true,
  },
});

const { getUserInfo } = useNostrUser();
const profile = ref(null);

// Mock counts for demo - would be replaced with actual data
const replyCount = ref(Math.floor(Math.random() * 5));
const repostCount = ref(Math.floor(Math.random() * 10));
const likeCount = ref(Math.floor(Math.random() * 20));
const zapCount = ref(Math.floor(Math.random() * 15));

// Format timestamp to relative time
const formatDate = (timestamp) => {
  if (!timestamp) return "";

  const date = new Date(timestamp * 1000);
  const now = new Date();

  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s`;
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}m`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}h`;
  } else if (diffInSeconds < 604800) {
    return `${Math.floor(diffInSeconds / 86400)}d`;
  } else {
    return date.toLocaleDateString();
  }
};

// Extract media from content
const imageUrls = computed(() => {
  if (!props.reply.content) return [];
  const imgRegex = /(https?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp)(\?\S*)?)/gi;
  return props.reply.content.match(imgRegex) || [];
});

const videoUrls = computed(() => {
  if (!props.reply.content) return [];
  const videoRegex = /(https?:\/\/\S+\.(?:mp4|webm|mov|mkv)(\?\S*)?)/gi;
  return props.reply.content.match(videoRegex) || [];
});

const hasMedia = computed(() => {
  return imageUrls.value.length > 0 || videoUrls.value.length > 0;
});

// Determine grid layout based on number of images
const gridClass = computed(() => {
  const count = imageUrls.value.length;
  if (count === 1) return "";
  if (count === 2) return "grid-cols-2";
  if (count === 3) return "grid-cols-2";
  if (count >= 4) return "grid-cols-2";
  return "grid-cols-1";
});

// Method to open media in modal (this would be implemented in the parent component)
const openMedia = (url, type) => {
  // This would emit an event to the parent or use a global state
  // For now, we'll just log it
  console.log("Open media:", { url, type });
};

onMounted(async () => {
  // Fetch user profile if needed (assuming it's not already included in the reply data)
  try {
    profile.value = await getUserInfo(props.reply.pubkey);
  } catch (error) {
    console.error("Error fetching profile:", error);
  }
});
</script>
