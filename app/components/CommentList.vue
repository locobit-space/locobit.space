<!-- CommentList.vue -->
<template>
  <div class="space-y-4 mt-4">
    <div v-if="loading" class="flex gap-2">
      <span>
        <USkeleton class="w-7 h-7 rounded-full" />
      </span>
      <article class="flex-grow space-y-1">
        <USkeleton class="h-4" :style="{ width: '40%' }" />
        <USkeleton class="h-4" :style="{ width: '90%' }" />
      </article>
    </div>

    <div
      v-else-if="comments.length === 0"
      class="text-center text-gray-500 py-4"
    >
      No comments yet. Be the first to comment!
    </div>

    <div v-else class="space-y-4">
      <CommentItem
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        :profiles="profiles"
      />
    </div>

    <div v-if="hasMoreComments" class="flex justify-center pt-2">
      <UButton
        variant="ghost"
        size="sm"
        @click="loadMoreComments"
        :loading="loadingMore"
      >
        Load more comments
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Event } from "nostr-tools";
import { ref, onMounted, watch } from "vue";

const props = defineProps({
  noteId: {
    type: String,
    required: true,
  },
  limit: {
    type: Number,
    default: 10,
  },
});

const comments = ref<Event[]>([]);
const loading = ref(true);
const loadingMore = ref(false);
const hasMoreComments = ref(false);
const currentPage = ref(1);

const { queryEvents, subscribeToEvents: subscribe } = useNostrRelay();
const { fetchUserProfiles, profiles } = useProfile();

const loadComments = async (page = 1) => {
  if (page === 1) loading.value = true;
  else loadingMore.value = true;

  try {
    // Fetch comments that reference this note
    const filter = {
      kinds: [1],
      "#e": [props.noteId],
      limit: props.limit,
      until:
        page > 1
          ? comments.value[comments.value.length - 1]?.created_at
          : undefined,
    };

    const fetchedComments = await queryEvents(filter);

    // Sort comments by timestamp
    const sortedComments = fetchedComments.sort(
      (a, b) => b.created_at - a.created_at
    );

    // Update comments
    if (page === 1) {
      comments.value = sortedComments;
    } else {
      comments.value = [...comments.value, ...sortedComments];
    }

    // Check if we have more comments
    hasMoreComments.value = fetchedComments.length === props.limit;

    // Extract pubkeys to fetch profiles
    const pubkeys = [
      ...new Set(fetchedComments.map((comment) => comment.pubkey)),
    ];
    if (pubkeys.length > 0) {
      await fetchUserProfiles(pubkeys);
    }
  } catch (error) {
    console.error("Failed to load comments:", error);
  } finally {
    if (page === 1) loading.value = false;
    else loadingMore.value = false;
  }
};

const loadMoreComments = async () => {
  currentPage.value++;
  await loadComments(currentPage.value);
};

// Listen for new comment events
const handleNewComment = (event: Event) => {
  if (event.tags.some((tag) => tag[0] === "e" && tag[1] === props.noteId)) {
    // Add to comments if not already present
    if (!comments.value.some((comment) => comment.id === event.id)) {
      comments.value = [event, ...comments.value];
      // Fetch profile for this comment author
      fetchUserProfiles([event.pubkey]);
    }
  }
};

// Watch for noteId changes
watch(
  () => props.noteId,
  () => {
    currentPage.value = 1;
    loadComments();
  }
);

onMounted(() => {
  loadComments();
  // Subscribe to new comment events
  const subscription = subscribe(
    { kinds: [1], "#e": [props.noteId] },
    {
      onevent: handleNewComment,
    }
  );
});
</script>
