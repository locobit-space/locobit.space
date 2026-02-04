<template>
  <div class="stories-container">
    <!-- Stories Scroll Container -->
    <div class="stories-scroll" ref="scrollRef">
      <!-- Add Story Button -->
      <div class="story-item">
        <button class="story-avatar add-story" @click="createStory">
          <div class="add-icon">
            <Icon name="heroicons:plus" class="w-6 h-6 text-primary-500" />
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
        <span class="story-name">{{ $t("social.your_story") }}</span>
      </div>

      <!-- Stories List -->
      <div
        v-for="story in groupedStories"
        :key="story.pubkey"
        class="story-item"
        @click="openStory(story)"
      >
        <div
          class="story-avatar"
          :class="{
            'ring-gradient': !story.viewed,
            'ring-gray-300 dark:ring-gray-600': story.viewed,
          }"
        >
          <UAvatar
            :src="story.userInfo?.picture"
            size="lg"
            class="w-full h-full"
          />
        </div>
        <span class="story-name">{{
          story.userInfo?.display_name || "Anonymous"
        }}</span>
        <div v-if="story.isLive" class="live-badge">LIVE</div>
      </div>

      <!-- Loading skeleton -->
      <div
        v-if="isLoading"
        v-for="i in 5"
        :key="`skeleton-${i}`"
        class="story-item"
      >
        <div class="story-avatar animate-pulse bg-gray-200 dark:bg-gray-700" />
        <div
          class="w-12 h-2 mt-1 rounded animate-pulse bg-gray-200 dark:bg-gray-700"
        />
      </div>
    </div>

    <!-- Story Viewer Modal -->
    <Teleport to="body">
      <Transition name="story-modal">
        <div v-if="showViewer" class="story-viewer" @click.self="closeViewer">
          <!-- Progress Bars -->
          <div class="story-progress">
            <div
              v-for="(item, index) in activeStoryGroup?.items"
              :key="item.id"
              class="progress-segment"
            >
              <div
                class="progress-fill"
                :class="{
                  completed: index < currentStoryIndex,
                  active: index === currentStoryIndex,
                }"
                :style="
                  index === currentStoryIndex
                    ? { width: `${storyProgress}%` }
                    : {}
                "
              />
            </div>
          </div>

          <!-- Story Header -->
          <div class="story-header">
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
              <button @click="toggleMute" class="p-2">
                <Icon
                  :name="
                    isMuted
                      ? 'heroicons:speaker-x-mark'
                      : 'heroicons:speaker-wave'
                  "
                  class="w-5 h-5 text-white"
                />
              </button>
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
          <div class="story-content" @click="handleStoryTap">
            <!-- Left tap area (previous) -->
            <div class="tap-area left" @click.stop="previousStory" />

            <!-- Story Media -->
            <div class="story-media">
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
            <div class="tap-area right" @click.stop="nextStory" />
          </div>

          <!-- Story Caption -->
          <div v-if="currentStory?.caption" class="story-caption">
            <p class="text-white text-sm text-center">
              {{ currentStory.caption }}
            </p>
          </div>

          <!-- Story Actions -->
          <div class="story-actions">
            <div class="flex-1">
              <UInput
                v-model="replyText"
                :placeholder="$t('social.reply_to_story')"
                variant="none"
                class="bg-white/10 backdrop-blur-sm rounded-full text-white placeholder-white/50"
                @keyup.enter="sendReply"
              />
            </div>

            <button @click="sendReaction('❤️')" class="reaction-btn">
              <Icon name="heroicons:heart" class="w-7 h-7 text-white" />
            </button>

            <button @click="shareStory" class="reaction-btn">
              <Icon
                name="heroicons:paper-airplane"
                class="w-7 h-7 text-white"
              />
            </button>
          </div>

          <!-- Navigation Arrows (Desktop) -->
          <button
            v-if="hasPreviousGroup"
            class="nav-arrow left hidden md:flex"
            @click="previousGroup"
          >
            <Icon name="heroicons:chevron-left" class="w-8 h-8" />
          </button>

          <button
            v-if="hasNextGroup"
            class="nav-arrow right hidden md:flex"
            @click="nextGroup"
          >
            <Icon name="heroicons:chevron-right" class="w-8 h-8" />
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { UserInfo } from "~~/types";

// Props
const props = defineProps<{
  stories?: any[];
}>();

// Composables
const { currentUserInfo, getUserInfo } = useNostrUser();
const { timeAgo } = useHelpers();
const toast = useToast();

// State
const scrollRef = ref<HTMLElement | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);
const showViewer = ref(false);
const activeStoryGroup = ref<any>(null);
const currentStoryIndex = ref(0);
const storyProgress = ref(0);
const isPaused = ref(false);
const isMuted = ref(true);
const replyText = ref("");
const isLoading = ref(false);
const viewedStories = ref<Set<string>>(new Set());

// Timer for auto-advance
let progressTimer: ReturnType<typeof setInterval> | null = null;
const STORY_DURATION = 5000; // 5 seconds for images

// Demo stories data (replace with real Nostr data)
const demoStories = ref([
  {
    pubkey: "demo1",
    userInfo: {
      display_name: "Alice",
      picture: "https://i.pravatar.cc/150?u=alice",
    },
    viewed: false,
    isLive: false,
    items: [
      {
        id: "1",
        type: "image",
        url: "https://picsum.photos/400/700?random=1",
        caption: "Beautiful sunset 🌅",
        createdAt: Date.now() - 3600000,
      },
      {
        id: "2",
        type: "image",
        url: "https://picsum.photos/400/700?random=2",
        caption: "",
        createdAt: Date.now() - 3000000,
      },
    ],
  },
  {
    pubkey: "demo2",
    userInfo: {
      display_name: "Bob",
      picture: "https://i.pravatar.cc/150?u=bob",
    },
    viewed: false,
    isLive: true,
    items: [
      {
        id: "3",
        type: "image",
        url: "https://picsum.photos/400/700?random=3",
        caption: "Check this out!",
        createdAt: Date.now() - 1800000,
      },
    ],
  },
  {
    pubkey: "demo3",
    userInfo: {
      display_name: "Carol",
      picture: "https://i.pravatar.cc/150?u=carol",
    },
    viewed: true,
    isLive: false,
    items: [
      {
        id: "4",
        type: "image",
        url: "https://picsum.photos/400/700?random=4",
        caption: "",
        createdAt: Date.now() - 7200000,
      },
    ],
  },
]);

// Computed
const groupedStories = computed(() => {
  const stories = props.stories?.length ? props.stories : demoStories.value;
  return stories.map((group) => ({
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

// Cleanup
onUnmounted(() => {
  stopProgress();
});
</script>

<style scoped>
.stories-container {
  padding-top: 1rem;
  padding-bottom: 1rem;
  /* border-bottom: 1px solid rgb(243 244 246); */
}

:global(.dark) .stories-container {
  /* border-bottom-color: rgb(31 41 55); */
}

.stories-scroll {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-left: 1rem;
  padding-right: 1rem;
  padding-bottom: 0.5rem;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.stories-scroll::-webkit-scrollbar {
  display: none;
}

.story-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  cursor: pointer;
  position: relative;
}

.story-avatar {
  width: 4rem;
  height: 4rem;
  border-radius: 9999px;
  padding: 2px;
  background-color: white;
  overflow: hidden;
}

:global(.dark) .story-avatar {
  background-color: rgb(17 24 39);
}

.story-avatar.ring-gradient {
  background: linear-gradient(
    45deg,
    #f09433,
    #e6683c,
    #dc2743,
    #cc2366,
    #bc1888
  );
  padding: 2px;
}

.story-avatar.ring-gradient > * {
  border-radius: 9999px;
}

.add-story {
  position: relative;
  border: 2px dashed rgb(209 213 219);
}

:global(.dark) .add-story {
  border-color: rgb(75 85 99);
}

.add-icon {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 1.5rem;
  height: 1.5rem;
  background-color: white;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  z-index: 10;
}

:global(.dark) .add-icon {
  background-color: rgb(31 41 55);
  border-color: rgb(17 24 39);
}

.story-name {
  font-size: 0.75rem;
  margin-top: 0.375rem;
  color: rgb(55 65 81);
  max-width: 4rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:global(.dark) .story-name {
  color: rgb(209 213 219);
}

.live-badge {
  position: absolute;
  bottom: -0.25rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.125rem 0.375rem;
  font-size: 10px;
  font-weight: 700;
  color: white;
  background-color: rgb(239 68 68);
  border-radius: 0.25rem;
}

/* Story Viewer */
.story-viewer {
  position: fixed;
  inset: 0;
  z-index: 50;
  background-color: black;
  display: flex;
  align-items: center;
  justify-content: center;
}

.story-progress {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.25rem;
  z-index: 20;
}

.progress-segment {
  flex: 1;
  height: 2px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: white;
  transition: all 0.1s;
}

.progress-fill.completed {
  width: 100%;
}

.progress-fill.active {
  transition: none;
}

.story-header {
  position: absolute;
  top: 1.5rem;
  left: 0;
  right: 0;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 20;
}

.story-content {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 32rem;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.story-media {
  width: 100%;
  height: 100%;
}

.tap-area {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 33.333%;
  z-index: 10;
}

.tap-area.left {
  left: 0;
}

.tap-area.right {
  right: 0;
}

.story-caption {
  position: absolute;
  bottom: 6rem;
  left: 0;
  right: 0;
  padding: 0 1rem;
  z-index: 20;
}

.story-actions {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 20;
}

.reaction-btn {
  padding: 0.5rem;
}

.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 3rem;
  height: 3rem;
  background-color: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: background-color 0.15s;
}

.nav-arrow:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.nav-arrow.left {
  left: 1rem;
}

.nav-arrow.right {
  right: 1rem;
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
