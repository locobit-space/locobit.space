<template>
  <div class="shorts-container" ref="containerRef">
    <!-- Full Screen Shorts Feed (TikTok Style) -->
    <div
      class="shorts-wrapper"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <TransitionGroup name="slide">
        <div
          v-for="(short, index) in visibleShorts"
          :key="short.id"
          class="short-item"
          :class="{ active: index === currentIndex }"
          @dblclick="handleDoubleTap(short)"
        >
          <!-- Media Content -->
          <div class="short-media">
            <!-- Video -->
            <video
              v-if="isVideo(short.url)"
              ref="videoRefs"
              :src="short.url"
              class="w-full h-full object-cover"
              loop
              playsinline
              :muted="isMuted"
              @click="togglePlay(index)"
              @loadeddata="onVideoLoaded(index)"
            />

            <!-- Image with Ken Burns effect -->
            <div v-else class="image-container">
              <NuxtImg
                :src="short.url"
                class="w-full h-full object-cover animate-ken-burns"
                :alt="short.title"
              />
            </div>

            <!-- Gradient Overlay -->
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none"
            />
          </div>

          <!-- Double Tap Heart Animation -->
          <Transition name="heart">
            <div v-if="showHeartAnimation === short.id" class="heart-animation">
              <Icon
                name="heroicons:heart-solid"
                class="w-24 h-24 text-red-500"
              />
            </div>
          </Transition>

          <!-- Content Overlay -->
          <div class="short-content">
            <!-- Creator Info -->
            <div class="creator-section">
              <NuxtLink
                :to="`/profile/${short.pubkey}`"
                class="flex items-center gap-3"
              >
                <div class="relative">
                  <UAvatar
                    :src="short.userInfo?.picture"
                    size="md"
                    class="ring-2 ring-white/50"
                  />
                  <div
                    class="absolute -bottom-1 -right-1 bg-primary-500 rounded-full p-0.5"
                  >
                    <Icon name="heroicons:plus" class="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <p class="font-bold text-white text-shadow">
                    {{ short.userInfo?.display_name || short.creator }}
                  </p>
                  <p class="text-xs text-white/70">
                    @{{ short.userInfo?.name || "unknown" }}
                  </p>
                </div>
              </NuxtLink>

              <UButton
                v-if="!isFollowing(short.pubkey)"
                size="sm"
                color="white"
                variant="solid"
                class="ml-3"
                @click="follow(short.pubkey)"
              >
                {{ $t("social.follow") }}
              </UButton>
            </div>

            <!-- Caption & Hashtags -->
            <div class="caption-section">
              <p class="text-white text-shadow text-sm mb-2 line-clamp-2">
                {{ short.title }}
              </p>
              <div class="flex flex-wrap gap-1">
                <NuxtLink
                  v-for="tag in short.hashtags.slice(0, 3)"
                  :key="tag"
                  :to="`/hashtag/${tag}`"
                  class="text-xs text-white/90 bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm"
                >
                  #{{ tag }}
                </NuxtLink>
              </div>
            </div>

            <!-- Sound/Music Info -->
            <div class="sound-section" v-if="short.music">
              <div
                class="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5"
              >
                <Icon
                  name="heroicons:musical-note"
                  class="w-4 h-4 text-white animate-spin-slow"
                />
                <p class="text-xs text-white truncate max-w-[150px]">
                  {{ short.music || "Original Sound" }}
                </p>
              </div>
            </div>
          </div>

          <!-- Right Side Actions -->
          <div class="action-buttons">
            <!-- Like -->
            <button class="action-btn" @click="handleLike(short)">
              <Icon
                :name="
                  isLiked(short.id)
                    ? 'heroicons:heart-solid'
                    : 'heroicons:heart'
                "
                :class="isLiked(short.id) ? 'text-red-500' : 'text-white'"
                class="w-8 h-8"
              />
              <span class="action-count">{{
                formatCount(short.likeCount || 0)
              }}</span>
            </button>

            <!-- Comment -->
            <button class="action-btn" @click="openComments(short)">
              <Icon
                name="heroicons:chat-bubble-oval-left"
                class="w-8 h-8 text-white"
              />
              <span class="action-count">{{
                formatCount(short.commentCount || 0)
              }}</span>
            </button>

            <!-- Share -->
            <button class="action-btn" @click="openShareSheet(short)">
              <Icon
                name="heroicons:arrow-path-rounded-square"
                class="w-8 h-8 text-white"
              />
              <span class="action-count">{{
                formatCount(short.repostCount || 0)
              }}</span>
            </button>

            <!-- Zap (Bitcoin Lightning) -->
            <button class="action-btn" @click="openZapModal(short)">
              <Icon
                name="lets-icons:lightning-light"
                class="w-8 h-8 text-yellow-400"
              />
              <span class="action-count">{{
                formatCount(short.zapCount || 0)
              }}</span>
            </button>

            <!-- Bookmark -->
            <button class="action-btn" @click="toggleBookmark(short)">
              <Icon
                :name="
                  isBookmarked(short.id)
                    ? 'heroicons:bookmark-solid'
                    : 'heroicons:bookmark'
                "
                :class="
                  isBookmarked(short.id) ? 'text-yellow-400' : 'text-white'
                "
                class="w-7 h-7"
              />
            </button>

            <!-- More Options -->
            <button class="action-btn" @click="openOptions(short)">
              <Icon
                name="heroicons:ellipsis-horizontal"
                class="w-7 h-7 text-white"
              />
            </button>

            <!-- Creator Avatar (Animated Disc) -->
            <NuxtLink :to="`/profile/${short.pubkey}`" class="mt-4">
              <div class="relative">
                <div
                  class="w-12 h-12 rounded-full border-2 border-white overflow-hidden animate-spin-slow"
                >
                  <UAvatar
                    :src="short.userInfo?.picture"
                    size="lg"
                    class="w-full h-full"
                  />
                </div>
                <div
                  class="absolute inset-0 rounded-full border-4 border-gray-900/50"
                ></div>
              </div>
            </NuxtLink>
          </div>

          <!-- Progress Bar -->
          <div class="progress-bar" v-if="isVideo(short.url)">
            <div
              class="progress-fill"
              :style="{ width: `${videoProgress[index] || 0}%` }"
            />
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- Top Navigation -->
    <div class="top-nav">
      <NuxtLink to="/feed" class="nav-btn">
        <Icon name="heroicons:arrow-left" class="w-6 h-6" />
      </NuxtLink>

      <div class="flex gap-4">
        <button
          :class="{
            'font-bold border-b-2 border-white': feedType === 'following',
          }"
          class="text-white px-2 py-1"
          @click="feedType = 'following'"
        >
          {{ $t("social.following") }}
        </button>
        <button
          :class="{
            'font-bold border-b-2 border-white': feedType === 'for-you',
          }"
          class="text-white px-2 py-1"
          @click="feedType = 'for-you'"
        >
          {{ $t("social.for_you") }}
        </button>
      </div>

      <button class="nav-btn" @click="openSearch">
        <Icon name="heroicons:magnifying-glass" class="w-6 h-6" />
      </button>
    </div>

    <!-- Bottom Controls -->
    <div class="bottom-controls">
      <button @click="isMuted = !isMuted" class="control-btn">
        <Icon
          :name="
            isMuted ? 'heroicons:speaker-x-mark' : 'heroicons:speaker-wave'
          "
          class="w-5 h-5"
        />
      </button>
    </div>

    <!-- Comments Sheet -->
    <USlideover v-model="showComments" side="bottom" class="h-[70vh]">
      <div class="p-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold">
            {{ commentCount }} {{ $t("social.comments") }}
          </h3>
          <UButton
            icon="i-heroicons-x-mark"
            color="gray"
            variant="ghost"
            @click="showComments = false"
          />
        </div>

        <div class="space-y-4 max-h-[50vh] overflow-y-auto">
          <NoteCommentList
            v-if="activeShort"
            :note-id="activeShort.id"
            :pubkey="activeShort.pubkey"
          />
        </div>

        <div class="mt-4 border-t pt-4">
          <NoteCommentInput
            v-if="activeShort"
            :note-id="activeShort.id"
            :pubkey="activeShort.pubkey"
          />
        </div>
      </div>
    </USlideover>

    <!-- Share Sheet -->
    <USlideover v-model="showShareSheet" side="bottom">
      <div class="p-6">
        <h3 class="text-lg font-bold mb-4">{{ $t("social.share_to") }}</h3>

        <div class="grid grid-cols-4 gap-4 mb-6">
          <button class="share-option" @click="shareAction('repost')">
            <div class="share-icon bg-green-500">
              <Icon name="system-uicons:retweet" class="w-6 h-6 text-white" />
            </div>
            <span class="text-xs mt-1">{{ $t("social.repost") }}</span>
          </button>

          <button class="share-option" @click="shareAction('quote')">
            <div class="share-icon bg-blue-500">
              <Icon
                name="heroicons:chat-bubble-bottom-center-text"
                class="w-6 h-6 text-white"
              />
            </div>
            <span class="text-xs mt-1">{{ $t("social.quote") }}</span>
          </button>

          <button class="share-option" @click="shareAction('copy')">
            <div class="share-icon bg-gray-500">
              <Icon name="heroicons:link" class="w-6 h-6 text-white" />
            </div>
            <span class="text-xs mt-1">{{ $t("social.copy_link") }}</span>
          </button>

          <button class="share-option" @click="shareAction('message')">
            <div class="share-icon bg-purple-500">
              <Icon
                name="heroicons:paper-airplane"
                class="w-6 h-6 text-white"
              />
            </div>
            <span class="text-xs mt-1">{{ $t("social.message") }}</span>
          </button>
        </div>

        <!-- Share to External -->
        <div class="border-t pt-4">
          <p class="text-sm text-gray-500 mb-3">
            {{ $t("social.share_external") }}
          </p>
          <div class="flex gap-3">
            <button
              class="flex-1 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm"
              @click="shareNative"
            >
              {{ $t("social.more_options") }}
            </button>
          </div>
        </div>
      </div>
    </USlideover>

    <!-- Loading Indicator -->
    <div v-if="isLoading" class="loading-overlay">
      <Icon name="svg-spinners:180-ring-with-bg" class="w-10 h-10 text-white" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UserInfo } from "~~/types";

// Composables
const { shorts, isLoading, loadFirstShort, loadOldShort } = useNoteShort();
const { getUserInfo } = useNostrUser();
const { bookmarkNote, items: bookmarks } = useBookmark();
const { trackInteraction } = useNostrFeedAlgorithm();
const toast = useToast();

// State
const containerRef = ref<HTMLElement | null>(null);
const currentIndex = ref(0);
const feedType = ref<"following" | "for-you">("for-you");
const isMuted = ref(true);
const showComments = ref(false);
const showShareSheet = ref(false);
const activeShort = ref<any>(null);
const showHeartAnimation = ref<string | null>(null);
const videoProgress = ref<Record<number, number>>({});
const likedNotes = ref<Set<string>>(new Set());
const videoRefs = ref<HTMLVideoElement[]>([]);

// Touch handling
const touchStartY = ref(0);
const touchEndY = ref(0);
const isSwiping = ref(false);

// Computed
const visibleShorts = computed(() => {
  return shorts.value.map((short: any) => ({
    ...short,
    userInfo: userInfoCache.value[short.pubkey] || null,
  }));
});

const commentCount = computed(() => activeShort.value?.commentCount || 0);

// User info cache
const userInfoCache = ref<Record<string, UserInfo>>({});

// Methods
const handleTouchStart = (e: TouchEvent) => {
  touchStartY.value = e.touches[0].clientY;
  isSwiping.value = true;
};

const handleTouchMove = (e: TouchEvent) => {
  if (!isSwiping.value) return;
  touchEndY.value = e.touches[0].clientY;
};

const handleTouchEnd = () => {
  if (!isSwiping.value) return;

  const diff = touchStartY.value - touchEndY.value;
  const threshold = 50;

  if (diff > threshold) {
    // Swipe up - next short
    goToNext();
  } else if (diff < -threshold) {
    // Swipe down - previous short
    goToPrevious();
  }

  isSwiping.value = false;
};

const goToNext = () => {
  if (currentIndex.value < visibleShorts.value.length - 1) {
    currentIndex.value++;
    playCurrentVideo();
  } else {
    // Load more shorts
    loadOldShort();
  }
};

const goToPrevious = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    playCurrentVideo();
  }
};

const playCurrentVideo = () => {
  videoRefs.value.forEach((video, index) => {
    if (video) {
      if (index === currentIndex.value) {
        video.play();
      } else {
        video.pause();
        video.currentTime = 0;
      }
    }
  });
};

const togglePlay = (index: number) => {
  const video = videoRefs.value[index];
  if (video) {
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }
};

const onVideoLoaded = (index: number) => {
  if (index === currentIndex.value) {
    const video = videoRefs.value[index];
    if (video) {
      video.play();

      // Track progress
      video.addEventListener("timeupdate", () => {
        videoProgress.value[index] = (video.currentTime / video.duration) * 100;
      });
    }
  }
};

const handleDoubleTap = (short: any) => {
  if (!likedNotes.value.has(short.id)) {
    handleLike(short);
  }

  // Show heart animation
  showHeartAnimation.value = short.id;
  setTimeout(() => {
    showHeartAnimation.value = null;
  }, 1000);
};

const handleLike = async (short: any) => {
  if (likedNotes.value.has(short.id)) {
    likedNotes.value.delete(short.id);
  } else {
    likedNotes.value.add(short.id);
    trackInteraction(short.originalEvent, "like");
  }
};

const isLiked = (id: string) => likedNotes.value.has(id);
const isBookmarked = (id: string) => bookmarks.value.includes(id);
const isFollowing = (pubkey: string) => false; // TODO: implement

const toggleBookmark = (short: any) => {
  bookmarkNote(short.id);
};

const openComments = (short: any) => {
  activeShort.value = short;
  showComments.value = true;
};

const openShareSheet = (short: any) => {
  activeShort.value = short;
  showShareSheet.value = true;
};

const openZapModal = (short: any) => {
  // TODO: Open zap modal
  toast.add({ title: "Zap feature coming soon!" });
};

const openOptions = (short: any) => {
  // TODO: More options menu
};

const openSearch = () => {
  navigateTo("/search");
};

const follow = async (pubkey: string) => {
  // TODO: Implement follow
  toast.add({ title: "Follow feature coming soon!" });
};

const shareAction = async (type: string) => {
  if (!activeShort.value) return;

  switch (type) {
    case "repost":
      // Repost logic
      break;
    case "quote":
      navigateTo(`/create-note?quote=${activeShort.value.id}`);
      break;
    case "copy":
      await navigator.clipboard.writeText(
        `https://nostr.guru/e/${activeShort.value.id}`,
      );
      toast.add({ title: "Link copied!" });
      break;
    case "message":
      // DM logic
      break;
  }

  showShareSheet.value = false;
};

const shareNative = async () => {
  if (!activeShort.value || !navigator.share) return;

  try {
    await navigator.share({
      title: activeShort.value.title,
      url: `https://nostr.guru/e/${activeShort.value.id}`,
    });
  } catch (e) {
    console.error("Share failed", e);
  }
};

const isVideo = (url: string) => {
  return /\.(mp4|webm|ogg|mov)$/i.test(url);
};

const formatCount = (count: number) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

// Fetch user info for all shorts
const fetchUserInfo = async () => {
  const pubkeys = [...new Set(shorts.value.map((s: any) => s.pubkey))];

  for (const pubkey of pubkeys) {
    if (!userInfoCache.value[pubkey]) {
      const info = await getUserInfo(pubkey);
      if (info) {
        userInfoCache.value[pubkey] = info;
      }
    }
  }
};

// Keyboard navigation
const handleKeyboard = (e: KeyboardEvent) => {
  if (e.key === "ArrowUp" || e.key === "k") {
    goToPrevious();
  } else if (e.key === "ArrowDown" || e.key === "j") {
    goToNext();
  } else if (e.key === " ") {
    togglePlay(currentIndex.value);
  } else if (e.key === "m") {
    isMuted.value = !isMuted.value;
  }
};

// Lifecycle
onMounted(async () => {
  await loadFirstShort();
  await fetchUserInfo();

  window.addEventListener("keydown", handleKeyboard);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyboard);
});

watch(shorts, fetchUserInfo, { deep: true });

// SEO
useHead({
  title: "Shorts | BitOS",
});
</script>

<style scoped>
@reference "~/assets/css/main.css";

.shorts-container {
  position: fixed;
  inset: 0;
  background-color: black;
  overflow: hidden;
}

.shorts-wrapper {
  height: 100%;
  width: 100%;
  scroll-snap-type: y mandatory;
  overflow-y: scroll;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.short-item {
  height: 100vh;
  width: 100%;
  scroll-snap-align: start;
  position: relative;
  display: flex;
  align-items: flex-end;
}

.short-media {
  position: absolute;
  inset: 0;
}

.short-content {
  position: relative;
  z-index: 10;
  padding: 1rem;
  padding-bottom: 5rem;
  width: calc(100% - 80px);
}

.creator-section {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
}

.caption-section {
  margin-bottom: 0.5rem;
}

.sound-section {
  margin-top: 0.5rem;
}

.action-buttons {
  position: absolute;
  right: 0.5rem;
  bottom: 6rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  z-index: 20;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.action-count {
  font-size: 0.75rem;
  color: white;
  margin-top: 0.25rem;
  font-weight: 600;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.5), transparent);
}

.nav-btn {
  padding: 0.5rem;
  color: white;
}

.bottom-controls {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 50;
}

.control-btn {
  padding: 0.5rem;
  background-color: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  border-radius: 9999px;
  color: white;
}

.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 0.25rem;
  background-color: rgba(255, 255, 255, 0.3);
}

.progress-fill {
  height: 100%;
  background-color: white;
  transition: all 100ms;
}

.loading-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 50;
}

.text-shadow {
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.share-option {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.share-icon {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

/* Animations */
.animate-ken-burns {
  animation: kenBurns 20s ease-in-out infinite alternate;
}

@keyframes kenBurns {
  0% {
    transform: scale(1) translate(0, 0);
  }
  100% {
    transform: scale(1.2) translate(-5%, -5%);
  }
}

.animate-spin-slow {
  animation: spin 8s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Heart Animation */
.heart-animation {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
  pointer-events: none;
}

.heart-enter-active {
  animation: heartPop 0.8s ease-out;
}

.heart-leave-active {
  animation: heartFade 0.3s ease-out;
}

@keyframes heartPop {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

@keyframes heartFade {
  to {
    opacity: 0;
  }
}

/* Slide transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
