<!-- CommentInput.vue -->
<template>
  <div class="mt-4">
    <div class="flex items-start gap-3">
      <UAvatar
        v-if="profile"
        :src="profile.picture"
        :alt="profile.displayName || profile.name"
        size="sm"
      />
      <UAvatar v-else icon="i-heroicons-user" size="sm" />

      <div class="flex-1">
        <UTextarea
          v-model="commentText"
          placeholder="Write your comment..."
          :rows="2"
          class="w-full"
          :disabled="isSubmitting"
          @keydown.ctrl.enter="submitComment"
        />

        <div class="flex justify-end mt-2">
          <UButton
            :loading="isSubmitting"
            :disabled="!commentText.trim() || isSubmitting"
            @click="submitComment"
            size="sm"
            color="primary"
          >
            Comment
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { hexToBytes } from "@noble/ciphers/utils";
import type { Event } from "nostr-tools";
import { ref } from "vue";

const props = defineProps({
  noteId: {
    type: String,
    required: true,
  },
  pubkey: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["comment-added"]);

const commentText = ref("");
const isSubmitting = ref(false);

const { $nostr } = useNuxtApp();
const { finalizeEvent } = $nostr;
const { publishEvent } = useNostrRelay();
const { user, currentUserInfo: profile } = useNostrUser();

const submitComment = async () => {
  if (!user.value) return;
  if (!commentText.value.trim() || isSubmitting.value) return;

  isSubmitting.value = true;

  try {
    // Create comment event (kind 1)
    const commentEvent: Event = {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ["e", props.noteId, "", "reply"],
        ["p", props.pubkey],
      ],
      content: commentText.value,
      pubkey: user.value.publicKey,
      id: "",
      sig: "",
    };

    // Sign event
    const signedEvent = finalizeEvent(
      commentEvent,
      hexToBytes(user.value.privateKey)
    );

    // Publish to relays
    const published = await publishEvent(signedEvent);

    if (published) {
      commentText.value = "";
      emit("comment-added", signedEvent);
    }
  } catch (error) {
    console.error("Failed to publish comment:", error);
  } finally {
    isSubmitting.value = false;
  }
};
</script>
