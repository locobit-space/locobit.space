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

    <div v-else>
      <!-- <ul class="space-y-4">
        <li v-for="(comment, index) in rootComments" :key="index">
          <CommentItem
            :comment="comment.event"
            :profiles="profiles"
            :rootId="noteId"
          />
          <ol v-if="comment.replies.length" class="pl-8 space-y-2 my-2">
            <li
              v-for="(reply, replyIndex) in comment.replies"
              :key="replyIndex"
            >
              <CommentItem
                :comment="reply.event"
                :profiles="profiles"
                :rootId="noteId"
                :isReplyComment="true"
              />
            </li>
          </ol>
        </li>
      </ul> -->
      <ul class="space-y-4">
        <li
          v-for="(comment, index) in rootComments"
          :key="index"
          class="relative"
        >
          <CommentItem
            :comment="comment.event"
            :profiles="profiles"
            :rootId="noteId"
          />
          <ol v-if="comment.replies.length" class="pl-8 space-y-2 my-2">
            <!-- Vertical line with rounded edges -->
            <div
              class="absolute left-3 top-7 w-0.5 h-[65%]  bg-gray-200 rounded-full"
            ></div>

            <li
              v-for="(reply, replyIndex) in comment.replies"
              :key="replyIndex"
              class="relative"
            >
              <!-- Curved connector using border-radius -->
              <div
                class="absolute left-[-20px] -top-6 w-5 h-10 border-l-2 border-b-2 border-gray-200 rounded-bl-lg"
                style="border-right: none; border-top: none"
              ></div>

              <CommentItem
                :comment="reply.event"
                :profiles="profiles"
                :rootId="noteId"
                :isReplyComment="true"
              />
            </li>
          </ol>
        </li>
      </ul>
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

interface CommentNode {
  event: Event;
  replies: CommentNode[];
}
const commentMap = new Map<string, CommentNode>();
const rootComments = ref<CommentNode[]>([]);

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

    for (const event of fetchedComments) {
      if (event.kind !== 1) continue;
      commentMap.set(event.id, { event, replies: [] });
    }

    for (const { event } of commentMap.values()) {
      const replyTag = event.tags.find((t) => t[0] === "e" && t[3] === "reply");

      if (replyTag) {
        const parentId = replyTag[1];
        const parentNode = commentMap.get(`${parentId}`);

        if (parentNode) {
          parentNode.replies.push(commentMap.get(event.id)!);
        } else {
          // fallback: treat as root if parent not found
          rootComments.value.push(commentMap.get(event.id)!);
        }
      } else {
        // top-level comment
        rootComments.value.push(commentMap.get(event.id)!);
      }
    }

    console.log(rootComments.value);
    // console.log(commentMap);

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
    console.log(pubkeys);
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
