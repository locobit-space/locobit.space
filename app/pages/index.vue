<template>
  <main class="">
    <nav
      class="sticky top-0 dark:border-gray-800 dark:bg-transparent dark:backdrop-blur bg-white/30 border-b border-white/20 z-50"
    >
      <AppHeader class="" @filter="handleFilter" />
    </nav>
    <CommonContainer class="py-8">
      <!-- Floating Check New Notes button that appears when scrolling down -->
      <div
        v-if="showScrollButton"
        class="fixed top-16 left-1/2 transform -translate-x-1/2 transition-opacity duration-300"
        :class="showScrollButton ? 'opacity-100' : 'opacity-0'"
        style="z-index: 99"
      >
        <UButton
          color="neutral"
          class="shadow-md z-50 rounded-2xl"
          variant="soft"
          :icon="
            isLoading
              ? 'svg-spinners:180-ring-with-bg'
              : 'system-uicons:refresh'
          "
          @click="
            () => {
              refreshNotes();
              scrollToTop();
            }
          "
        >
          Check New Notes
        </UButton>
      </div>

      <UButton
        color="neutral"
        variant="ghost"
        icon="i-heroicons-arrow-up"
        class="shadow-md fixed right-4 h-10 w-10 bottom-28 flex items-center justify-center rounded-full z-50"
        size="xl"
        @click="scrollToTop"
      >
      </UButton>

      <!-- Feed -->
      <div>
        <div v-if="isLoading" class="px-4">
          <article class="flex flex-col gap-4">
            <NoteSkeleton v-for="i in 3" :key="i" />
          </article>
        </div>

        <div v-if="notes.length === 0 && !isLoading" class="text-center py-8">
          <p class="text-gray-500">No notes found. Be the first to post!</p>
        </div>
        <!-- {{ notes }} -->
        <div class="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
          <NoteCard
            v-for="note in notes"
            :key="note.id"
            :note="note"
            @content-clicked="viewEvent(note.id)"
          />
        </div>

        <div v-if="isLoading" class="px-4">
          <article class="flex flex-col gap-4">
            <NoteSkeleton v-for="i in 3" :key="i" />
          </article>
        </div>
      </div>
    </CommonContainer>
  </main>
</template>

<script setup lang="ts">
import type { Event } from "nostr-tools";
import { ref, onMounted } from "vue";

const {
  checkNewNotes,
  loadNotesOnce,
  loadOlderNotes,
  isLoading,
  notes,
  filterTab,
} = useNostrFeed();

const { viewEvent, loadAlgorithmicFeed } = useNostrFeedAlgorithm();

// States
const hasNewContent = ref(false);
const isLoadingMore = ref(false);
const currentPage = ref(1);
const itemsPerPage = ref(10);

const showScrollButton = ref(false); // New ref to control button visibility

async function handleFilter(filter: any) {
  currentPage.value = 1;

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

const refreshFeed = async () => {
  currentPage.value = 1;

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

const loadMore = async () => {
  currentPage.value++;
  try {
    if (filterTab.value.key === "for-you") {
      await loadAlgorithmicFeed({
        limit: itemsPerPage.value,
        offset: (currentPage.value - 1) * itemsPerPage.value,
      });
    } else {
      await loadOlderNotes({
        filter: filterTab.value.key,
        limit: itemsPerPage.value,
        hashtag:
          filterTab.value.key === "hashtag" ? filterTab.value.value : null,
      });
    }
  } catch (e) {
    console.error(`Error loading more notes: ${e}`);
  }
};

const refreshNotes = () => {
  loadNotesOnce();
};

// New function to scroll to top
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

const setupInfiniteScroll = () => {
  window.addEventListener("scroll", handleScroll);

  onUnmounted(() => {
    window.removeEventListener("scroll", handleScroll);
  });
};

const handleScroll = async () => {
  // Show button after scrolling down 200px
  if (window.scrollY > 200) {
    showScrollButton.value = true;
  } else {
    showScrollButton.value = false;
  }

  // Load more notes when near bottom
  const bottomOfWindow =
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 300; // 300px before bottom
  if (bottomOfWindow && !isLoading.value) {
    const { key, value } = filterTab.value;
    loadMore();
  }
};

onMounted(() => {
  refreshFeed();
  setupInfiniteScroll();
});
</script>
