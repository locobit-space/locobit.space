<template>
  <div class="pt-4 pb-4">
    <!-- Stories Scroll Container -->
    <div class="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide" ref="scrollRef">
      <!-- Add Story Button -->
      <div class="flex flex-col items-center flex-shrink-0 cursor-pointer relative">
        <button class="relative w-16 h-16 rounded-full p-0.5 border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 overflow-hidden" @click="createStory">
          <div class="absolute bottom-0 right-0 w-6 h-6 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 z-10">
            <Icon name="heroicons:plus" class="w-4 h-4 text-primary-500" />
          </div>
          <UAvatar
            v-if="currentUserInfo?.picture"
            :src="currentUserInfo.picture"
            size="lg"
            class="w-full h-full"
          />
          <div
            v-else
            class="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-full"
          />
        </button>
        <span class="text-xs mt-1.5 text-gray-600 dark:text-gray-300 max-w-16 truncate">{{ t("social.your_story") }}</span>
      </div>

      <!-- Live Streams Button -->
      <div class="flex flex-col items-center flex-shrink-0 cursor-pointer relative" @click="openLiveStreams">
        <div class="w-16 h-16 rounded-full p-0.5 bg-linear-to-br from-pink-500 via-red-500 to-yellow-500">
          <div class="w-full h-full bg-linear-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center">
            <Icon name="heroicons:signal" class="w-8 h-8 text-white animate-pulse" />
          </div>
        </div>
        <span class="text-xs mt-1.5 text-gray-600 dark:text-gray-300 max-w-16 truncate">{{ t("social.live") }}</span>
        <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 text-[10px] font-bold text-white bg-red-500 rounded animate-pulse">LIVE</div>
      </div>

      <!-- Stories List -->
      <div
        v-for="story in groupedStories"
        :key="story.pubkey"
        class="flex flex-col items-center flex-shrink-0 cursor-pointer relative"
        @click="openStory(story)"
      >
        <div
          class="w-16 h-16 rounded-full p-0.5 bg-white dark:bg-gray-900 overflow-hidden"
          :class="{
            'bg-linear-to-br from-pink-500 via-red-500 to-yellow-500': !story.viewed,
            'ring-2 ring-gray-300 dark:ring-gray-600': story.viewed,
          }"
        >
          <UAvatar
            :src="story.userInfo?.picture"
            size="lg"
            class="w-full h-full rounded-full"
          />
        </div>
        <span class="text-xs mt-1.5 text-gray-600 dark:text-gray-300 max-w-16 truncate">{{
          story.userInfo?.display_name || "Anonymous"
        }}</span>
        <div v-if="story.isLive" class="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 text-[10px] font-bold text-white bg-red-500 rounded">LIVE</div>
      </div>

      <!-- Loading skeleton -->
      <div
        v-if="isLoadingStories"
        v-for="i in 5"
        :key="`skeleton-${i}`"
        class="flex flex-col items-center flex-shrink-0"
      >
        <div class="w-16 h-16 rounded-full animate-pulse bg-gray-200 dark:bg-gray-700" />
        <div class="w-12 h-2 mt-1 rounded animate-pulse bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>

    <!-- Story Viewer Modal -->
    <Teleport to="body">
      <Transition name="story-modal">
        <div v-if="showViewer" class="fixed inset-0 z-50 bg-black flex items-center justify-center" @click.self="closeViewer">
          <!-- Progress Bars -->
          <div class="absolute top-2 left-2 right-2 flex gap-1 z-20">
            <div
              v-for="(item, index) in activeStoryGroup?.items"
              :key="item.id"
              class="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                class="h-full bg-white transition-all"
                :class="{
                  'w-full': Number(index) < currentStoryIndex,
                  'transition-none': Number(index) === currentStoryIndex,
                }"
                :style="
                  Number(index) === currentStoryIndex
                    ? { width: `${storyProgress}%` }
                    : {}
                "
              />
            </div>
          </div>

          <!-- Story Header -->
          <div class="absolute top-6 left-0 right-0 px-4 flex items-center justify-between z-20">
            <NuxtLink
              :to="`/profile/${activeStoryGroup?.pubkey}`"
              class="flex items-center gap-3"
            >
              <UAvatar :src="activeStoryGroup?.userInfo?.picture" size="sm" />
              <div>
                <p class="font-semibold text-white text-sm">
                  {{ activeStoryGroup?.userInfo?.display_name }}
                </p>
                <p class="text-xs text-white/70">
                  {{ formatTimeAgo(currentStory?.createdAt) }}
                </p>
              </div>
            </NuxtLink>

            <div class="flex items-center gap-2">
              <button @click="toggleMute" class="p-2 relative">
                <Icon
                  :name="
                    isMuted
                      ? 'heroicons:speaker-x-mark'
                      : 'heroicons:speaker-wave'
                  "
                  class="w-5 h-5 text-white"
                />
              </button>
              <!-- Volume Slider -->
              <div v-if="currentStory?.type === 'video'" class="hidden md:flex items-center">
                <input
                  v-model.number="videoVolume"
                  type="range"
                  min="0"
                  max="100"
                  class="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                  style="accent-color: white;"
                  @input="updateVideoVolume"
                />
              </div>
              <button @click="togglePause" class="p-2">
                <Icon
                  :name="isPaused ? 'heroicons:play' : 'heroicons:pause'"
                  class="w-5 h-5 text-white"
                />
              </button>
              <button @click="closeViewer" class="p-2">
                <Icon name="heroicons:x-mark" class="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          <!-- Story Content -->
          <div class="relative w-full h-full max-w-2xl mx-auto flex items-center justify-center" @click="handleStoryTap">
            <!-- Left tap area (previous) -->
            <div class="absolute top-0 bottom-0 left-0 w-1/3 z-10" @click.stop="previousStory" />

            <!-- Story Media -->
            <div class="w-full h-full">
              <video
                v-if="currentStory?.type === 'video'"
                ref="videoRef"
                :src="currentStory.url"
                class="w-full h-full object-contain"
                :muted="isMuted"
                playsinline
                @timeupdate="updateProgress"
                @ended="nextStory"
              />
              <NuxtImg
                v-else
                :src="currentStory?.url"
                class="w-full h-full object-contain"
                :alt="currentStory?.caption"
              />
            </div>

            <!-- Right tap area (next) -->
            <div class="absolute top-0 bottom-0 right-0 w-1/3 z-10" @click.stop="nextStory" />
          </div>

          <!-- Story Caption -->
          <div v-if="currentStory?.caption" class="absolute bottom-24 left-0 right-0 px-4 z-20">
            <p class="text-white text-sm text-center">
              {{ currentStory.caption }}
            </p>
          </div>

          <!-- Story Actions -->
          <div class="absolute bottom-4 left-4 right-4 flex items-center gap-3 z-20">
            <div class="flex-1">
              <UInput
                v-model="replyText"
                :placeholder="t('social.reply_to_story')"
                variant="none"
                size="lg"
                input-class="text-white placeholder:text-white/50"
                class="bg-white/10 backdrop-blur-sm rounded-full"
                @keyup.enter="sendReply"
              />
            </div>

            <button @click="sendReaction('❤️')" class="p-2">
              <Icon name="heroicons:heart" class="w-7 h-7 text-white" />
            </button>

            <button @click="shareStory" class="p-2">
              <Icon
                name="heroicons:paper-airplane"
                class="w-7 h-7 text-white"
              />
            </button>
          </div>

          <!-- Navigation Arrows (Desktop) -->
          <button
            v-if="hasPreviousGroup"
            class="hidden md:flex absolute top-1/2 left-4 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur rounded-full items-center justify-center text-white transition-colors hover:bg-white/30"
            @click="previousGroup"
          >
            <Icon name="heroicons:chevron-left" class="w-8 h-8" />
          </button>

          <button
            v-if="hasNextGroup"
            class="hidden md:flex absolute top-1/2 right-4 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur rounded-full items-center justify-center text-white transition-colors hover:bg-white/30"
            @click="nextGroup"
          >
            <Icon name="heroicons:chevron-right" class="w-8 h-8" />
          </button>
        </div>
      </Transition>

      <!-- Live Streams Modal -->
      <Transition name="story-modal">
        <div v-if="showLiveModal" class="fixed inset-0 z-50 bg-black flex items-center justify-center" @click.self="closeLiveModal">
          <!-- Header -->
          <div class="absolute top-6 left-0 right-0 px-4 flex items-center justify-between z-20">
            <div class="flex items-center gap-3">
              <Icon name="heroicons:signal" class="w-6 h-6 text-red-500 animate-pulse" />
              <div>
                <p class="font-semibold text-white text-sm">
                  {{ t("social.live_streams") }}
                </p>
                <p class="text-xs text-white/70">
                  {{ nostrLiveStreams.length }} {{ t("social.active_streams") }}
                </p>
              </div>
            </div>
            
            <button @click="closeLiveModal" class="p-2">
              <Icon name="heroicons:x-mark" class="w-6 h-6 text-white" />
            </button>
          </div>

          <!-- Live Streams Content -->
          <div class="relative w-full h-full pt-20 px-4 pb-4 overflow-y-auto">
            <!-- Loading State -->
            <div v-if="isLoadingLiveStreams" class="flex items-center justify-center h-full">
              <Icon name="svg-spinners:180-ring-with-bg" class="w-12 h-12 text-white" />
            </div>

            <!-- Live Streams List -->
            <div v-else-if="nostrLiveStreams.length > 0" class="max-w-7xl mx-auto">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                  v-for="stream in nostrLiveStreams"
                  :key="stream.id"
                  class="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 hover:shadow-2xl"
                  @click="openLiveStream(stream)"
                >
                <div class="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
                  <NuxtImg
                    v-if="stream.image"
                    :src="stream.image"
                    class="w-full h-full object-cover"
                    :alt="stream.title"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <Icon name="heroicons:signal" class="w-12 h-12 text-white/50" />
                  </div>
                  <div class="absolute top-2 left-2 bg-red-500 px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1">
                    <span class="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    LIVE
                  </div>
                  <div v-if="stream.viewers" class="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                    <Icon name="heroicons:eye" class="w-3 h-3" />
                    {{ stream.viewers }}
                  </div>
                </div>
                <div class="p-3">
                  <h3 class="text-white font-semibold text-sm line-clamp-2 mb-1">
                    {{ stream.title }}
                  </h3>
                  <div class="flex items-center gap-2">
                    <UAvatar :src="stream.host?.picture" size="xs" />
                    <p class="text-white/70 text-xs">{{ stream.host?.name || 'Anonymous' }}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Load More Button -->
            <div v-if="nostrLiveStreams.length > 0 && hasMoreLiveStreams" class="flex justify-center mt-6">
              <UButton 
                @click="loadMoreLiveStreams" 
                :loading="isLoadingLiveStreams"
                color="white"
                variant="outline"
                size="lg"
              >
                <Icon name="heroicons:arrow-down-circle" class="w-5 h-5 mr-2" />
                {{ t("common.load_more") }}
              </UButton>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else-if="!isLoadingLiveStreams && nostrLiveStreams.length === 0" class="flex flex-col items-center justify-center h-full text-center px-6">
              <Icon name="heroicons:signal-slash" class="w-16 h-16 text-white/30 mb-4" />
              <p class="text-white text-lg font-semibold mb-2">{{ t("social.no_live_streams") }}</p>
              <p class="text-white/70 text-sm mb-6">{{ t("social.no_live_streams_description") }}</p>
              <UButton color="primary" @click="openZapStream">
                {{ t("social.visit_zap_stream") }}
              </UButton>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Individual Live Stream Viewer -->
      <Transition name="story-modal">
        <div v-if="showLiveViewer && activeLiveStream" class="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <!-- Header -->
          <div class="absolute top-6 left-0 right-0 px-4 flex items-center justify-between z-20">
            <div class="flex items-center gap-3">
              <button @click="closeLiveViewer" class="p-2">
                <Icon name="heroicons:arrow-left" class="w-5 h-5 text-white" />
              </button>
              <UAvatar :src="activeLiveStream.host?.picture" size="sm" />
              <div>
                <p class="font-semibold text-white text-sm">
                  {{ activeLiveStream.host?.name || 'Anonymous' }}
                </p>
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  <span class="text-xs text-white/70">LIVE</span>
                </div>
              </div>
            </div>
            
            <button @click="closeLiveViewer" class="p-2">
              <Icon name="heroicons:x-mark" class="w-6 h-6 text-white" />
            </button>
          </div>

          <!-- Stream Content -->
          <div class="relative w-full h-full max-w-4xl mx-auto flex items-center justify-center">
            <div class="w-full h-full max-w-3xl mx-auto bg-black rounded-lg overflow-hidden">
              <!-- Try to play HLS/video stream directly -->
              <video
                v-if="activeLiveStream.streamUrl && isVideoUrl(activeLiveStream.streamUrl)"
                ref="liveVideoRef"
                :src="activeLiveStream.streamUrl"
                class="w-full h-full"
                controls
                autoplay
                playsinline
                @error="handleStreamError"
              />
              <!-- Fallback to zap.stream -->
              <div v-else class="w-full h-full flex flex-col items-center justify-center bg-gray-900 p-6 text-center">
                <Icon name="heroicons:signal" class="w-16 h-16 text-white/50 mb-4" />
                <p class="text-white text-lg mb-4">{{ activeLiveStream.title }}</p>
                <p v-if="streamError" class="text-red-400 text-sm mb-4">{{ streamError }}</p>
                <p class="text-white/70 text-sm mb-6">{{ t("social.stream_on_zap_stream") }}</p>
                <UButton color="primary" @click="openInZapStream(activeLiveStream)">
                  {{ t("social.watch_on_zap_stream") }}
                </UButton>
              </div>
            </div>
          </div>

          <!-- Stream Info -->
          <div class="absolute bottom-24 left-0 right-0 px-4 z-20">
            <p class="text-white text-sm">{{ activeLiveStream.title }}</p>
            <p class="text-white/70 text-xs mt-1">{{ activeLiveStream.summary }}</p>
          </div>

          <!-- Stream Actions -->
          <div class="absolute bottom-4 left-4 right-4 flex items-center gap-3 z-20">
            <div class="flex-1">
              <UInput
                v-model="liveComment"
                :placeholder="t('social.send_message')"
                variant="none"
                size="lg"
                input-class="text-white placeholder:text-white/50"
                class="bg-white/10 backdrop-blur-sm rounded-full"
                @keyup.enter="sendLiveComment"
              />
            </div>
            
            <!-- Volume Control for Live Stream -->
            <div v-if="activeLiveStream.streamUrl && isVideoUrl(activeLiveStream.streamUrl)" class="flex items-center gap-2">
              <button @click="toggleLiveStreamMute" class="p-2">
                <Icon
                  :name="isLiveStreamMuted ? 'heroicons:speaker-x-mark' : 'heroicons:speaker-wave'"
                  class="w-6 h-6 text-white"
                />
              </button>
              <input
                v-model.number="liveStreamVolume"
                type="range"
                min="0"
                max="100"
                class="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                style="accent-color: white;"
                @input="updateLiveStreamVolume"
              />
            </div>
            
            <button @click="zapLiveStream" class="p-2">
              <Icon name="lets-icons:lightning-light" class="w-7 h-7 text-yellow-400" />
            </button>
            
            <button @click="shareLiveStream" class="p-2">
              <Icon name="heroicons:share" class="w-7 h-7 text-white" />
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { UserInfo } from "~/types";

// Props
const props = defineProps<{
  stories?: any[];
}>();

// Composables
const { currentUserInfo, getUserInfo } = useNostrUser();
const { timeAgo } = useHelpers();
const { t } = useI18n();
const toast = useToast();
const { 
  stories: nostrStories, 
  liveStreams: nostrLiveStreams, 
  isLoadingStories,
  isLoadingLiveStreams,
  hasMoreLiveStreams,
  fetchStories, 
  fetchLiveStreams,
  loadMoreLiveStreams,
  subscribeToLiveStreams 
} = useNostrStories();

// State
const scrollRef = ref<HTMLElement | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);
const showViewer = ref(false);
const activeStoryGroup = ref<any>(null);
const currentStoryIndex = ref(0);
const storyProgress = ref(0);
const isPaused = ref(false);
const isMuted = ref(true);
const videoVolume = ref(50); // Volume 0-100
const replyText = ref("");
const isLoading = ref(false);
const viewedStories = ref<Set<string>>(new Set());

// Live streams state
const showLiveModal = ref(false);
const showLiveViewer = ref(false);
const activeLiveStream = ref<any>(null);
const liveComment = ref("");
const isLiveStreamMuted = ref(false);
const liveStreamVolume = ref(50); // Volume 0-100

// Subscribe to live stream updates
let liveStreamSub: any = null;

// Timer for auto-advance
let progressTimer: ReturnType<typeof setInterval> | null = null;
const STORY_DURATION = 5000; // 5 seconds for images

// Computed
const groupedStories = computed(() => {
  return nostrStories.value.map((group) => ({
    ...group,
    viewed: viewedStories.value.has(group.pubkey),
  }));
});

const currentStory = computed(() => {
  return activeStoryGroup.value?.items?.[currentStoryIndex.value];
});

const hasPreviousGroup = computed(() => {
  const currentGroupIndex = groupedStories.value.findIndex(
    (g) => g.pubkey === activeStoryGroup.value?.pubkey,
  );
  return currentGroupIndex > 0;
});

const hasNextGroup = computed(() => {
  const currentGroupIndex = groupedStories.value.findIndex(
    (g) => g.pubkey === activeStoryGroup.value?.pubkey,
  );
  return currentGroupIndex < groupedStories.value.length - 1;
});

// Methods
const openStory = (storyGroup: any) => {
  activeStoryGroup.value = storyGroup;
  currentStoryIndex.value = 0;
  storyProgress.value = 0;
  showViewer.value = true;

  nextTick(() => {
    startProgress();
    viewedStories.value.add(storyGroup.pubkey);
  });
};

const closeViewer = () => {
  showViewer.value = false;
  stopProgress();
  activeStoryGroup.value = null;
};

const startProgress = () => {
  stopProgress();

  if (currentStory.value?.type === "video" && videoRef.value) {
    videoRef.value.volume = videoVolume.value / 100;
    videoRef.value.muted = isMuted.value;
    videoRef.value.play();
    return; // Video handles its own progress
  }

  // For images, use timer
  const startTime = Date.now();
  progressTimer = setInterval(() => {
    if (isPaused.value) return;

    const elapsed = Date.now() - startTime;
    storyProgress.value = Math.min((elapsed / STORY_DURATION) * 100, 100);

    if (storyProgress.value >= 100) {
      nextStory();
    }
  }, 50);
};

const stopProgress = () => {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
  if (videoRef.value) {
    videoRef.value.pause();
  }
};

const updateProgress = () => {
  if (videoRef.value) {
    storyProgress.value =
      (videoRef.value.currentTime / videoRef.value.duration) * 100;
  }
};

const nextStory = () => {
  if (
    currentStoryIndex.value <
    (activeStoryGroup.value?.items?.length || 0) - 1
  ) {
    currentStoryIndex.value++;
    storyProgress.value = 0;
    nextTick(() => startProgress());
  } else {
    nextGroup();
  }
};

const previousStory = () => {
  if (storyProgress.value > 20 || currentStoryIndex.value === 0) {
    // Restart current story
    storyProgress.value = 0;
    nextTick(() => startProgress());
  } else if (currentStoryIndex.value > 0) {
    currentStoryIndex.value--;
    storyProgress.value = 0;
    nextTick(() => startProgress());
  } else {
    previousGroup();
  }
};

const nextGroup = () => {
  const currentGroupIndex = groupedStories.value.findIndex(
    (g) => g.pubkey === activeStoryGroup.value?.pubkey,
  );
  if (currentGroupIndex < groupedStories.value.length - 1) {
    openStory(groupedStories.value[currentGroupIndex + 1]);
  } else {
    closeViewer();
  }
};

const previousGroup = () => {
  const currentGroupIndex = groupedStories.value.findIndex(
    (g) => g.pubkey === activeStoryGroup.value?.pubkey,
  );
  if (currentGroupIndex > 0) {
    openStory(groupedStories.value[currentGroupIndex - 1]);
  }
};

const handleStoryTap = (e: MouseEvent) => {
  const rect = (e.target as HTMLElement).getBoundingClientRect();
  const x = e.clientX - rect.left;

  if (x < rect.width / 3) {
    previousStory();
  } else if (x > (rect.width * 2) / 3) {
    nextStory();
  } else {
    togglePause();
  }
};

const togglePause = () => {
  isPaused.value = !isPaused.value;

  if (currentStory.value?.type === "video" && videoRef.value) {
    if (isPaused.value) {
      videoRef.value.pause();
    } else {
      videoRef.value.play();
    }
  }
};

const toggleMute = () => {
  isMuted.value = !isMuted.value;
  if (videoRef.value) {
    videoRef.value.muted = isMuted.value;
    if (!isMuted.value && videoVolume.value === 0) {
      videoVolume.value = 50;
      videoRef.value.volume = 0.5;
    }
  }
};

const updateVideoVolume = () => {
  if (videoRef.value) {
    videoRef.value.volume = videoVolume.value / 100;
    if (videoVolume.value === 0) {
      isMuted.value = true;
      videoRef.value.muted = true;
    } else {
      isMuted.value = false;
      videoRef.value.muted = false;
    }
  }
};

const createStory = () => {
  navigateTo("/create-story");
};

const sendReply = () => {
  if (!replyText.value.trim()) return;

  toast.add({ title: "Reply sent!" });
  replyText.value = "";
};

const sendReaction = (emoji: string) => {
  toast.add({ title: `Reacted with ${emoji}` });
};

const shareStory = () => {
  toast.add({ title: "Share feature coming soon!" });
};

const formatTimeAgo = (timestamp: number) => {
  if (!timestamp) return "";
  return timeAgo(Math.floor(timestamp / 1000));
};

// Live streams methods
const openLiveStreams = async () => {
  showLiveModal.value = true;
  if (nostrLiveStreams.value.length === 0) {
    await fetchLiveStreams();
  }
};

const closeLiveModal = () => {
  showLiveModal.value = false;
};

const openLiveStream = (stream: any) => {
  activeLiveStream.value = stream;
  showLiveModal.value = false;
  showLiveViewer.value = true;
};

const closeLiveViewer = () => {
  showLiveViewer.value = false;
  activeLiveStream.value = null;
  showLiveModal.value = true;
};

const openZapStream = () => {
  window.open('https://zap.stream/', '_blank');
};

// Check if URL is a video stream (HLS, MP4, etc.)
const isVideoUrl = (url: string) => {
  if (!url) return false;
  const videoExtensions = ['.m3u8', '.mp4', '.webm', '.flv'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
};

// Handle stream playback errors
const liveVideoRef = ref<HTMLVideoElement | null>(null);
const streamError = ref('');

const handleStreamError = (event: Event) => {
  console.error('Stream playback error:', event);
  streamError.value = 'Unable to play stream. Opening in zap.stream...';
  
  // Auto-open in zap.stream after 2 seconds
  setTimeout(() => {
    if (activeLiveStream.value) {
      openInZapStream(activeLiveStream.value);
    }
  }, 2000);
};

const openInZapStream = (stream: any) => {
  // Generate zap.stream URL
  if (stream?.host?.pubkey && stream?.identifier) {
    // Use npub and identifier for specific stream
    const zapStreamUrl = `https://zap.stream/${stream.host.pubkey}/${stream.identifier}`;
    window.open(zapStreamUrl, '_blank');
  } else if (stream?.host?.pubkey) {
    // Use just pubkey
    const zapStreamUrl = `https://zap.stream/${stream.host.pubkey}`;
    window.open(zapStreamUrl, '_blank');
  } else {
    // Fallback to main page
    window.open('https://zap.stream/', '_blank');
  }
  toast.add({ title: 'Opening in zap.stream...' });
};

const toggleLiveStreamMute = () => {
  isLiveStreamMuted.value = !isLiveStreamMuted.value;
  if (liveVideoRef.value) {
    liveVideoRef.value.muted = isLiveStreamMuted.value;
    if (!isLiveStreamMuted.value && liveStreamVolume.value === 0) {
      liveStreamVolume.value = 50;
      liveVideoRef.value.volume = 0.5;
    }
  }
};

const updateLiveStreamVolume = () => {
  if (liveVideoRef.value) {
    liveVideoRef.value.volume = liveStreamVolume.value / 100;
    if (liveStreamVolume.value === 0) {
      isLiveStreamMuted.value = true;
      liveVideoRef.value.muted = true;
    } else {
      isLiveStreamMuted.value = false;
      liveVideoRef.value.muted = false;
    }
  }
};

const sendLiveComment = () => {
  if (!liveComment.value.trim()) return;
  
  toast.add({ title: 'Comment sent!' });
  liveComment.value = '';
};

const zapLiveStream = () => {
  toast.add({ 
    title: '⚡ Zap sent to streamer!',
    color: 'yellow'
  });
};

const shareLiveStream = () => {
  if (activeLiveStream.value) {
    // Copy stream link to clipboard
    navigator.clipboard.writeText(`https://zap.stream/`);
    toast.add({ title: 'Stream link copied!' });
  }
};

// Lifecycle hooks
onMounted(async () => {
  // Fetch stories on mount
  await fetchStories();
  
  // Subscribe to live stream updates
  liveStreamSub = subscribeToLiveStreams();
});

// Cleanup
onUnmounted(() => {
  stopProgress();
  
  // Unsubscribe from live streams
  if (liveStreamSub) {
    liveStreamSub.close();
  }
});
</script>

<style scoped>
/* Hide scrollbar */
.scrollbar-hide {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Transitions */
.story-modal-enter-active,
.story-modal-leave-active {
  transition: all 0.3s ease;
}

.story-modal-enter-from,
.story-modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
