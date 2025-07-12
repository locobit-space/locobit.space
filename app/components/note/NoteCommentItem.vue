<!-- CommentItem.vue -->
<template>
  <div class="flex gap-3">
    <NuxtLink :to="`/profile/${comment.pubkey}`">
      <UAvatar
        :src="authorProfile?.picture"
        :alt="authorProfile?.displayName || authorProfile?.name || 'Unknown'"
        size="sm"
      />
    </NuxtLink>

    <div class="flex-1">
      <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
        <div class="flex items-center justify-between mb-2">
          <div class="font-medium">
            <NuxtLink :to="`/profile/${comment.pubkey}`">
              {{
                authorProfile?.display_name ||
                authorProfile?.name ||
                shortenPubkey(comment.pubkey)
              }}
            </NuxtLink>
          </div>
          <div class="text-xs text-gray-500">
            {{ timeAgo(comment.created_at) }}
          </div>
        </div>

        <div class="prose prose-sm dark:prose-invert max-w-none">
          <p class="whitespace-pre-wrap">{{ comment.content }}</p>
        </div>
      </div>

      <div class="flex gap-4 mt-1 ml-1 text-xs text-gray-500">
        <button
          class="hover:text-primary flex items-center gap-1"
          @click="toggleLike"
        >
          <UIcon
            :name="isLiked ? 'i-heroicons-heart-solid' : 'i-heroicons-heart'"
            class="w-4 h-4"
          />
          <span>{{ likeCount }}</span>
        </button>

        <button
          class="hover:text-primary flex items-center gap-1"
          @click="showReplyInput = !showReplyInput"
        >
          <UIcon name="i-heroicons-chat-bubble-left" class="w-4 h-4" />
          <span>Reply</span>
        </button>
      </div>

      <div v-if="showReplyInput" class="mt-2">
        <NoteCommentInput
          :noteId="comment.id"
          :pubkey="`${currentUserPubkey}`"
          :profile="currentUserProfile"
          :isReplyComment="true"
          @comment-added="handleReplyAdded"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { Event } from "nostr-tools";
import { hexToBytes } from "@noble/ciphers/utils";

const props = defineProps({
  comment: {
    type: Object,
    required: true,
  },
  profiles: {
    type: Object,
    default: () => ({}),
  },
  rootId: {
    type: String,
    required: true,
  },
});

const { $nostr } = useNuxtApp();
const { finalizeEvent } = $nostr;

const { timeAgo } = useHelpers();
const { publishEvent } = useNostrRelay();
const { user, currentUserInfo } = useNostrUser();
const showReplyInput = ref(false);
const isLiked = ref(false);
const likeCount = ref(0);
const currentUserPubkey = user.value?.publicKey; // You'll need to implement this composable
const currentUserProfile = computed(() => currentUserInfo.value);

const authorProfile = computed(() => {
  return props.profiles[props.comment.pubkey] || null;
});

const shortenPubkey = (pubkey: string) => {
  return pubkey ? `${pubkey.slice(0, 6)}...${pubkey.slice(-6)}` : "unknown";
};

const toggleLike = async () => {
  isLiked.value = !isLiked.value;
  likeCount.value += isLiked.value ? 1 : -1;
  // TODO: Implement reaction event (kind 7)
  // This will be added in a future iteration
};

const handleReplyAdded = async (data: any) => {
  if (!user.value) return;

  showReplyInput.value = false;

  const pubkey = user.value?.publicKey;
  const created_at = Math.floor(Date.now() / 1000);

  const { comment, noteId } = data;

  const event: Event = {
    kind: 1,
    pubkey: `${pubkey}`,
    created_at,
    content: comment,
    tags: [
      ["e", props.rootId, "", "root"], // root post
      ["e", noteId, "", "reply"], // the comment being replied to
      ["p", props.comment.pubkey], // the commenter you're replying to
    ],
    id: "",
    sig: "",
  };

  const signed = finalizeEvent(event, hexToBytes(`${user.value?.privateKey}`));
  await publishEvent(signed);
};
</script>
