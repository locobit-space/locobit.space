<template>
  <main class="">
    <nav
      class="sticky top-0 dark:border-gray-800 dark:bg-transparent backdrop-blur bg-white/30 border-b border-gray-100 z-50"
    >
      <AppHeader class="" @filter="handleFilter" />
    </nav>

    <!-- Stories Bar -->
    <SocialStoriesBar class="bg-white dark:bg-gray-900" />

    <CommonContainer class="py-4">
      <!-- Floating Check New Notes button that appears when scrolling down -->
      <Transition name="slide-down">
        <div
          v-if="showScrollButton && hasNewNotes"
          class="fixed top-20 left-1/2 transform -translate-x-1/2 transition-all duration-300 z-[99]"
        >
          <UButton
            color="primary"
            class="shadow-lg rounded-full px-6"
            :icon="
              isLoading ? 'svg-spinners:180-ring-with-bg' : 'heroicons:arrow-up'
            "
            @click="
              () => {
                refreshNotes();
                scrollToTop();
                hasNewNotes = false;
              }
            "
          >
            {{ $t("social.new_posts") }}
          </UButton>
        </div>
      </Transition>

      <!-- Scroll to top button -->
      <Transition name="fade">
        <div v-if="showScrollButton" class="fixed right-4 bottom-28 z-50">
          <UButton
            color="neutral"
            variant="soft"
            icon="i-heroicons-arrow-up"
            class="shadow-lg h-12 w-12 flex items-center justify-center rounded-full"
            size="xl"
            @click="scrollToTop"
          />
        </div>
      </Transition>

      <!-- Shorts Quick Access -->
      <div class="mb-4">
        <NuxtLink
          to="/shorts"
          class="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 rounded-xl text-white"
        >
          <div class="p-2 bg-white/20 rounded-lg">
            <Icon name="heroicons:play-circle" class="w-6 h-6" />
          </div>
          <div class="flex-1">
            <p class="font-bold">{{ $t("social.shorts") }}</p>
            <p class="text-xs opacity-80">
              {{ $t("social.watch_short_videos") }}
            </p>
          </div>
          <Icon name="heroicons:chevron-right" class="w-5 h-5" />
        </NuxtLink>
      </div>

      <!-- Pull to Refresh Indicator -->
      <div v-if="isPulling" class="flex justify-center py-4">
        <Icon
          name="svg-spinners:180-ring-with-bg"
          class="w-6 h-6 text-primary-500"
          :class="{ 'animate-spin': isRefreshing }"
        />
      </div>

      <!-- Feed -->
      <div
        ref="feedContainer"
        @touchstart="handlePullStart"
        @touchmove="handlePullMove"
        @touchend="handlePullEnd"
      >
        <!-- Loading skeleton -->
        <div v-if="isLoading && notes.length === 0" class="px-4">
          <article class="flex flex-col gap-4">
            <NoteSkeleton v-for="i in 3" :key="i" />
          </article>
        </div>

        <!-- Empty state -->
        <CommonEmptyState
          v-else-if="notes.length === 0 && !isLoading"
          :title="$t('social.no_posts_yet')"
          :description="$t('social.no_posts_description')"
          icon="heroicons:document-text"
          :action-text="$t('social.create_first_post')"
          action-to="/create-note"
          action-icon="heroicons:plus"
        />

        <!-- Notes feed with enhanced interactions -->
        <div class="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
          <div
            v-for="note in notes"
            :key="note.id"
            class="note-item"
            @dblclick="handleDoubleTap(note)"
          >
            <!-- Double tap heart animation -->
            <Transition name="heart-pop">
              <div
                v-if="doubleTapNoteId === note.id"
                class="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
              >
                <Icon
                  name="heroicons:heart-solid"
                  class="w-20 h-20 text-red-500 drop-shadow-lg"
                />
              </div>
            </Transition>

            <NoteCard :note="note" @content-clicked="viewEvent(note.id)" />
          </div>
        </div>

        <!-- Load more indicator (Sentinel) -->
        <div
          ref="loadMoreSentinel"
          class="py-8 flex flex-col items-center justify-center w-full"
        >
          <div v-if="isLoadingMore || isLoading" class="flex justify-center">
            <Icon
              name="svg-spinners:180-ring-with-bg"
              class="w-8 h-8 text-primary-500"
            />
          </div>

          <!-- Manual Load More UI -->
          <UButton
            v-if="
              !settings.easyScroll && hasMore && !isLoading && !isLoadingMore
            "
            label="Load More"
            variant="soft"
            @click="loadMore"
          />
        </div>

        <!-- End of feed -->
        <div v-if="!hasMore && notes.length > 0" class="text-center py-8">
          <Icon
            name="heroicons:check-circle"
            class="w-8 h-8 text-green-500 mx-auto mb-2"
          />
          <p class="text-gray-500 text-sm">
            {{ $t("social.youre_all_caught_up") }}
          </p>
        </div>
      </div>
    </CommonContainer>
  </main>
</template>

<script setup lang="ts">
import type { Event } from "nostr-tools";
import { ref, onMounted, onUnmounted, watch } from "vue";

useHead({
  title: "BitOS Space",
});

const {
  checkNewNotes,
  loadNotesOnce,
  loadOlderNotes,
  isLoading,
  notes,
  filterTab,
} = useNostrFeed();

const { viewEvent, loadAlgorithmicFeed } = useNostrFeedAlgorithm();
const { trackInteraction } = useNostrFeedAlgorithm();

// States
const { settings } = useAppSettings();
const hasNewContent = ref(false);
const isLoadingMore = ref(false);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const showScrollButton = ref(false);
const hasNewNotes = ref(false);
const hasMore = ref(true);
const feedContainer = ref<HTMLElement | null>(null);
const loadMoreSentinel = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

// Pull to refresh
const isPulling = ref(false);
const isRefreshing = ref(false);
const pullStartY = ref(0);

// Double tap like
const doubleTapNoteId = ref<string | null>(null);
const lastTapTime = ref(0);

async function handleFilter(filter: any) {
  currentPage.value = 1;
  hasMore.value = true; // Reset hasMore when filter changes

  scrollToTop();
  notes.value = [];

  if (filter.key === "for-you") {
    await loadAlgorithmicFeed({ limit: itemsPerPage.value });
  } else if (filter.key === "following") {
    await loadNotesOnce({ filter: "following", limit: itemsPerPage.value });
  } else if (filter.key === "trending") {
    // Load trending posts (most engagement in last 24h)
    const events = await loadNotesOnce({
      since: Math.floor(Date.now() / 1000) - 86400,
      limit: itemsPerPage.value * 3,
    });

    // Sort by engagement and update notes
    notes.value = [...events]
      .sort((a, b) => {
        const aEngagement =
          getLikeCount(a) + getRepostCount(a) * 2 + getReplyCount(a) * 3;
        const bEngagement =
          getLikeCount(b) + getRepostCount(b) * 2 + getReplyCount(b) * 3;
        return bEngagement - aEngagement;
      })
      .slice(0, itemsPerPage.value);
  } else if (filter.key === "hashtag") {
    await loadNotesOnce({
      filter: "hashtag",
      hashtag: filter.value,
      limit: itemsPerPage.value,
    });
  } else {
    await loadNotesOnce({
      filter: filter.value.key,
      limit: itemsPerPage.value,
    });
  }
}

const getLikeCount = (note: Event): number => {
  return (note.tags || []).filter((t) => t[0] === "like").length;
};

const getRepostCount = (note: Event): number => {
  return (note.tags || []).filter((t) => t[0] === "repost").length;
};

const getReplyCount = (note: Event): number => {
  return (note.tags || []).filter((t) => t[0] === "reply").length;
};

const refreshFeed = async (force = false) => {
  currentPage.value = 1;
  hasMore.value = true;

  // If we already have notes and it's not a forced refresh, just return
  // This preserves state when navigating back
  if (!force && notes.value.length > 0) {
    return;
  }

  notes.value = [];

  if (filterTab.value.key === "for-you") {
    await loadAlgorithmicFeed({ limit: itemsPerPage.value });
  } else {
    await loadNotesOnce({
      filter: filterTab.value.value,
      limit: itemsPerPage.value,
    });
  }
};

const refreshNotes = () => {
  // Force a refresh when explicitly requested (e.g. pull to refresh or new posts button)
  refreshFeed(true);
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const handleScroll = () => {
  showScrollButton.value = window.scrollY > 300;
};

const loadMore = async () => {
  if (isLoading.value || isLoadingMore.value || !hasMore.value) return;
  isLoadingMore.value = true;
  await loadOlderNotes({ limit: itemsPerPage.value });
  isLoadingMore.value = false;
};

const setupIntersectionObserver = () => {
  if (observer) observer.disconnect();
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !isLoading.value) {
          loadMore();
        }
      });
    },
    { rootMargin: "300px" },
  );

  if (loadMoreSentinel.value) observer.observe(loadMoreSentinel.value);
};

const checkForNewNotes = async () => {
  const result = await checkNewNotes();
  hasNewNotes.value = result;
};

const handlePullStart = (e: TouchEvent) => {
  if (window.scrollY === 0) {
    pullStartY.value = e.touches[0].clientY;
    isPulling.value = true;
  }
};

const handlePullMove = (e: TouchEvent) => {
  if (isPulling.value) {
    const y = e.touches[0].clientY;
    const diff = y - pullStartY.value;
    if (diff > 0) {
      // Visual feedback could be added here
    }
    if (diff > 100) isRefreshing.value = true;
  }
};

const handlePullEnd = async () => {
  if (isRefreshing.value) {
    await refreshNotes();
  }
  isPulling.value = false;
  isRefreshing.value = false;
};

const handleDoubleTap = (note: any) => {
  const now = Date.now();
  if (now - lastTapTime.value < 300) {
    doubleTapNoteId.value = note.id;
    // Assuming we have a like function or trackInteraction handles it
    // For now just show animation
    setTimeout(() => {
      doubleTapNoteId.value = null;
    }, 800);
  }
  lastTapTime.value = now;
};

onMounted(() => {
  // Only load if empty, otherwise we keep existing state
  if (notes.value.length === 0) {
    refreshFeed();
  } else {
    // If we have content, we might want to check for *newer* stuff in background
    checkForNewNotes();
  }

  // Setup intersection observer for infinite scroll
  setupIntersectionObserver();

  // ... existing code ...

  // Keep scroll listener only for "scroll to top" button visibility
  window.addEventListener("scroll", handleScroll);

  // Check for new notes every 30 seconds
  setInterval(checkForNewNotes, 30000);
});

// Watch for loading state changes to retry loading more if we're at the bottom
// This handles cases where infinite scroll was blocked by a background update
watch(isLoading, (newIsLoading) => {
  if (
    settings.value.easyScroll &&
    !newIsLoading &&
    observer &&
    loadMoreSentinel.value
  ) {
    // Re-observing forces a new entry check immediately
    observer.unobserve(loadMoreSentinel.value);
    observer.observe(loadMoreSentinel.value);
  }
});

// Watch setting change to enable/disable observer dynamically
watch(
  () => settings.value.easyScroll,
  (enabled) => {
    if (enabled) {
      setupIntersectionObserver();
    } else {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    }
  },
);

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
  if (observer) {
    observer.disconnect();
  }
});
</script>

<style scoped>
.note-item {
  position: relative;
}

/* Transitions */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.heart-pop-enter-active {
  animation: heartPop 0.8s ease-out;
}

.heart-pop-leave-active {
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
</style>
