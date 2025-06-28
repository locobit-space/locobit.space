<template>
  <div class="h-screen flex flex-col">
    <section>
      <!-- <nav class="p-2">Nostr Shorts</nav> -->
    </section>
    <section
      class="w-full flex-1 overflow-y-scroll snap-y snap-mandatory scroll-smooth touch-none max-w-lg mx-auto"
      @scroll="handleScroll"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      ref="scrollContainer"
    >
      <div
        v-for="(video, index) in videos"
        :key="video.id"
        class="h-screen w-full snap-start relative flex-shrink-0"
      >
        <div
          class="h-full w-full bg-black flex items-center justify-center relative"
        >
          <template v-if="isVideoUrl(video.url)">
            <video
              :ref="(el) => (mediaRefs[index] = el)"
              :src="video.url"
              class="object-cover w-full h-full"
              :class="{ paused: !isPlaying(index) }"
              @click="togglePlay(index)"
              @ended="handleMediaEnd(index)"
              @error="handleMediaError(index)"
              preload="none"
              playsinline
            />
          </template>
          <template v-else>
            <img
              :src="video.url"
              class="object-cover w-full h-full"
              @click="handleImageClick(index)"
              alt="Media Content"
              loading="lazy"
            />
          </template>

          <!-- Play Button Overlay -->
          <div
            v-if="isVideoUrl(video.url) && !isPlaying(index)"
            class="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-0"
            @click="togglePlay(index)"
          >
            <Icon
              name="material-symbols:play-circle-outline"
              size="45"
              class="text-primary-500 hover:scale-110 transition-transform"
            />
          </div>

          <!-- Interaction Buttons -->
          <div class="absolute right-4 bottom-1/3 flex flex-col space-y-4 z-20">
            <button
              class="bg-white/30 p-2 rounded-full flex items-center justify-center"
              @click="toggleLike(video.id)"
            >
              <Icon
                name="mdi:heart"
                :class="[
                  'w-6 h-6',
                  likedVideos?.includes(video.id)
                    ? 'text-red-500'
                    : 'text-white',
                ]"
              />
              <span class="text-white ml-2 text-sm">{{ video.likes }}</span>
            </button>

            <button
              class="bg-white/30 p-2 rounded-full flex items-center justify-center"
              @click="openComments(video.id)"
            >
              <Icon name="mdi:comment" class="w-6 h-6 text-white" />
              <span class="text-white ml-2 text-sm">{{ video.comments }}</span>
            </button>

            <button
              class="bg-white/30 p-2 rounded-full flex items-center justify-center"
              @click="shareVideo(video.id)"
            >
              <Icon name="mdi:share" class="w-6 h-6 text-white" />
            </button>

            <button
              class="bg-white/30 p-2 rounded-full flex items-center justify-center"
              @click="toggleBookmark(video.id)"
            >
              <Icon
                name="mdi:bookmark"
                :class="[
                  'w-6 h-6',
                  bookmarks?.includes(video.id) ? 'text-red-500' : 'text-white',
                ]"
              />
            </button>
          </div>

          <!-- Video Info -->
          <div class="absolute bottom-10 left-4 text-white z-20 max-w-[70%]">
            <h3 class="text-lg font-bold break-words">
              {{ video.title }}
            </h3>
            <p class="text-sm">{{ video.creator }}</p>
            <div class="flex flex-wrap gap-1 mt-1">
              <span
                v-for="tag in (video.hashtags || []).slice(0, 3)"
                :key="tag"
                class="bg-white/20 px-2 py-0.5 rounded-full text-xs"
              >
                #{{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading Indicator -->
      <div v-if="isLoading" class="flex justify-center items-center h-32">
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"
        ></div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from "vue";
import { videoExtensions } from "~/lib";

const { toggleBookmark, bookmarks } = useNotes();

const {
  shorts: videos,
  loadFirstShort,
  loadOldShort,
  isLoading,
} = useNoteShort();

const mediaRefs = ref<(HTMLVideoElement | HTMLImageElement)[]>([]);
const currentVideoIndex = ref(0);
const playingVideos = ref<boolean[]>(Array(videos.value.length).fill(false));
const likedVideos = ref<string[]>([]);
const touchStartY = ref(0);
const touchEndY = ref(0);
const minSwipeDistance = 50;
const scrollContainer = ref<HTMLElement | null>(null);

const isVideoUrl = (url: string) => {
  return videoExtensions.some((ext) => url.toLowerCase().endsWith(ext));
};

const isPlaying = (index: number) => playingVideos.value[index];

const togglePlay = async (index: number) => {
  await nextTick();
  const media = mediaRefs.value[index];
  if (media instanceof HTMLVideoElement) {
    if (media.paused) {
      mediaRefs.value.forEach((m, i) => {
        if (m instanceof HTMLVideoElement) m.pause();
      });
      playingVideos.value = playingVideos.value.map((_, i) => i === index);
      media.play().catch(console.error);
    } else {
      media.pause();
      playingVideos.value[index] = false;
    }
  }
};

const handleImageClick = (index: number) => {
  if (index < videos.value.length - 1) currentVideoIndex.value++;
};

const handleMediaEnd = (index: number) => {
  playingVideos.value[index] = false;
  if (index < videos.value.length - 1) currentVideoIndex.value++;
};

const handleMediaError = (index: number) => {
  console.error(`Error loading media at index ${index}`);
  videos.value.splice(index, 1);
  if (currentVideoIndex.value >= videos.value.length) {
    currentVideoIndex.value = videos.value.length - 1;
  }
};

const handleTouchStart = (event: TouchEvent) => {
  touchStartY.value = event.touches[0].clientY;
};
const handleTouchMove = (event: TouchEvent) => {
  touchEndY.value = event.touches[0].clientY;
};
const handleTouchEnd = () => {
  const isAnyVideoPlaying = playingVideos.value.some((playing) => playing);
  if (isAnyVideoPlaying) return;
  const swipeDistance = touchStartY.value - touchEndY.value;
  if (Math.abs(swipeDistance) > minSwipeDistance) {
    if (
      swipeDistance > 0 &&
      currentVideoIndex.value < videos.value.length - 1
    ) {
      pauseCurrentMedia();
      currentVideoIndex.value++;
    } else if (swipeDistance < 0 && currentVideoIndex.value > 0) {
      pauseCurrentMedia();
      currentVideoIndex.value--;
    }
  }
};

const pauseCurrentMedia = () => {
  const currentMedia = mediaRefs.value[currentVideoIndex.value];
  if (currentMedia instanceof HTMLVideoElement) {
    currentMedia.pause();
    playingVideos.value[currentVideoIndex.value] = false;
  }
};

const toggleLike = (videoId: string) => {
  const index = likedVideos.value.indexOf(videoId);
  if (index > -1) likedVideos.value.splice(index, 1);
  else likedVideos.value.push(videoId);
};

const openComments = (videoId: string) => {
  // This would need to integrate with Nostr replies/thread view
  console.log(`Opening comments for video ${videoId}`);
};

const shareVideo = (videoId: string) => {
  // This could create a shareable Nostr link
  console.log(`Sharing video ${videoId}`);
};

const handleScroll = () => {
  const container = scrollContainer.value;
  if (!container) return;
  const scrollTop = container.scrollTop;
  const index = Math.round(scrollTop / window.innerHeight);
  if (index !== currentVideoIndex.value) {
    currentVideoIndex.value = index;
  }

  if (index >= videos.value.length - 1) {
    if (isLoading.value) return;
    loadMedia();
  }
};

watch(currentVideoIndex, async (newIndex) => {
  await nextTick();
  mediaRefs.value.forEach((media, i) => {
    if (media instanceof HTMLVideoElement) {
      media.pause();
      playingVideos.value[i] = false;
    }
  });
  const currentMedia = mediaRefs.value[newIndex];
  if (currentMedia instanceof HTMLVideoElement) {
    currentMedia
      .play()
      .then(() => {
        playingVideos.value[newIndex] = true;
      })
      .catch((err) => {
        console.warn("Autoplay failed:", err);
      });
  }
});

// Update playingVideos array when videos change
watch(
  () => videos.value.length,
  () => {
    playingVideos.value = Array(videos.value.length).fill(false);
  }
);

async function loadMedia() {
  loadOldShort();
}

onMounted(() => {
  loadFirstShort();
  nextTick(() => {
    const firstMedia = mediaRefs.value[0];
    if (firstMedia instanceof HTMLVideoElement) {
      firstMedia.play().catch(console.error);
      playingVideos.value[0] = true;
    }
  });
});
</script>

<style scoped>
* {
  user-select: none;
  -webkit-user-select: none;
}
.paused {
  opacity: 0.7;
}
</style>
