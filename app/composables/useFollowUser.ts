import { ref, onMounted } from "vue";
import { hexToBytes } from "@noble/hashes/utils";

export function useFollowUser(targetUserPubkey: string) {
  const isFollowing = ref(false);
  const toast = useToast();
  const { $nostr } = useNuxtApp();
  const { finalizeEvent, pool } = $nostr;
  const { normalizeKey } = useNostrKeys();
  const { DEFAULT_RELAYS: RELAYS } = useNostrRelay();
  const { user: currentUser } = useNostrUser();

  const checkFollowStatus = async () => {
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

          isFollowing.value = followedPubkeys.includes(targetUserPubkey);
        }
      }
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const toggleFollow = async () => {
    try {
      if (!currentUser.value) {
        alert("Please login to follow users");
        return;
      }

      const contactList = await $nostr.pool.querySync(RELAYS, {
        kinds: [3],
        authors: [normalizeKey(currentUser.value.publicKey)],
        limit: 1,
      });

      let tags: string[][] = [];
      if (contactList.length > 0) {
        tags = contactList[0].tags.filter((tag) => tag[0] === "p");
      }

      if (isFollowing.value) {
        tags = tags.filter((tag) => tag[1] !== targetUserPubkey); // unfollow
      } else {
        if (!tags.some((tag) => tag[1] === targetUserPubkey)) {
          tags.push(["p", targetUserPubkey]); // follow
        }
      }

      const eventTemplate = {
        kind: 3,
        created_at: Math.floor(Date.now() / 1000),
        content: "",
        tags,
      };

      const signedEvent = finalizeEvent(
        eventTemplate,
        hexToBytes(currentUser.value.privateKey)
      );

      await Promise.any(pool.publish(RELAYS, signedEvent));
      isFollowing.value = !isFollowing.value;
    } catch (error) {
      console.error("Error updating follow status:", error);
      toast.add({
        title: "Failed to update follow status. Please try again.",
        color: "error",
      });
    }
  };

  onMounted(checkFollowStatus);

  return {
    isFollowing,
    toggleFollow,
  };
}
