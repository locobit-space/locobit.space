<template>
  <div
    class="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
  >
    <div class="flex items-start space-x-3">
      <div class="flex-shrink-0">
        <NuxtLink :to="`/profile/${user.pubkey}`">
          <UAvatar
            :src="user.picture"
            alt="Profile Picture"
            icon="i-heroicons-user-circle"
          />
        </NuxtLink>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center space-x-2">
          <NuxtLink :to="`/profile/${user.pubkey}`" class="hover:underline">
            <h3 class="text-sm font-bold truncate">
              {{ user.display_name || user.name || "Unknown User" }}
            </h3>
          </NuxtLink>
          <span v-if="user.verified" class="text-primary-500" title="Verified">
            <Icon name="bitcoin-icons:verify-outline" size="20" />
          </span>
        </div>

        <p v-if="user.nip05" class="text-xs text-gray-500 truncate">
          {{ user.nip05 }}
        </p>

        <p v-if="user.about" class="text-sm text-gray-600 mt-1 line-clamp-2">
          {{ user.about }}
        </p>

        <div class="mt-2">
          <button
            class="text-xs px-3 py-1 rounded-full bg-primary-100 text-primary-700 hover:bg-primary-200 transition-colors"
            @click="followUser"
          >
            {{ isFollowing ? "Following" : "Follow" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { hexToBytes } from "@noble/hashes/utils";

const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
});

const toast = useToast();
const { $nostr } = useNuxtApp();
const { finalizeEvent, pool } = $nostr;
const { normalizeKey } = useNostrKeys();
const { DEFAULT_RELAYS: RELAYS } = useNostrRelay();
const { user: currentUser } = useNostrUser();
const isFollowing = ref(false);

onMounted(async () => {
  // Check if the current user is following this user
  try {
    if (currentUser.value) {
      const contactList = await $nostr.pool.querySync(RELAYS, {
        kinds: [3],
        authors: [normalizeKey(currentUser.value.publicKey)],
        limit: 1,
      });

      if (contactList.length > 0) {
        const followedPubkeys = contactList[0].tags
          .filter((tag) => tag[0] === "p")
          .map((tag) => tag[1]);

        isFollowing.value = followedPubkeys.includes(props.user.pubkey);
      }
    }
  } catch (error) {
    console.error("Error checking follow status:", error);
  }
});

const followUser = async () => {
  try {
    if (!currentUser.value) {
      alert("Please login to follow users");
      return;
    }

    // Step 1: Get current contact list (kind 3)
    const contactList = await $nostr.pool.querySync(RELAYS, {
      kinds: [3],
      authors: [normalizeKey(currentUser.value.publicKey)],
      limit: 1,
    });

    // Step 2: Prepare existing "p" tags (pubkeys of followed users)
    let tags: string[][] = [];

    if (contactList.length > 0) {
      tags = contactList[0].tags.filter((tag) => tag[0] === "p");
    }

    // Step 3: Update tags based on follow/unfollow action
    const targetPubkey = props.user.pubkey;

    if (isFollowing.value) {
      // Unfollow: Remove the pubkey
      tags = tags.filter((tag) => tag[1] !== targetPubkey);
    } else {
      // Follow: Add if not already followed
      if (!tags.some((tag) => tag[1] === targetPubkey)) {
        tags.push(["p", targetPubkey]);
      }
    }

    // Step 4: Create event template (kind 3 is contact list)
    const eventTemplate = {
      kind: 3,
      created_at: Math.floor(Date.now() / 1000),
      content: "", // optional content for contact list
      tags,
    };

    // Step 5: Sign the event
    const signedEvent = finalizeEvent(
      eventTemplate,
      hexToBytes(currentUser.value.privateKey)
    );

    // Step 6: Publish to relays
    await Promise.any(pool.publish(RELAYS, signedEvent));

    // Step 7: Update local UI state
    isFollowing.value = !isFollowing.value;
  } catch (error) {
    console.error("Error updating follow status:", error);
    toast.add({
      title: "Failed to update follow status. Please try again.",
      color: "error",
    });
  }
};
</script>
