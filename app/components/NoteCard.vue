<template>
  <div class="mb-4 p-4">
    <div class="flex items-start gap-4">
      <NuxtLink :to="`/profile/${note.pubkey}`">
        <UAvatar :src="userInfo?.picture" />
      </NuxtLink>
      <div class="flex-1">
        <div class="flex justify-between items-center mb-2">
          <NuxtLink :to="`/profile/${note.pubkey}`" class="font-bold">{{
            userInfo?.display_name
          }}</NuxtLink>
          <span class="text-sm text-gray-500">{{ formattedDate }}</span>
        </div>
        <div class="text-wrap break-all">
          {{ note.content }}
        </div>

        <!-- action buttons share like etc -->
        <div class="flex gap-4 mt-4 border-y border-slate-100 py-1">
          <UButton
            color="neutral"
            icon="system-uicons:retweet"
            class="mr-2"
            variant="ghost"
            :label="rePostCount > 0 ? `${rePostCount}` : ''"
            @click="shareNote"
          />
          <UButton
            color="neutral"
            icon="i-heroicons-heart"
            class="mr-2"
            variant="ghost"
            :label="likeCount > 0 ? `${likeCount}` : ''"
            @click="likeNote"
          />
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-chat-bubble-left-right"
            :label="commentCount > 0 ? `${commentCount}` : ''"
          />
          <UButton color="neutral" variant="ghost" icon="heroicons:bookmark" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { hexToBytes } from "@noble/hashes/utils";
import { computed } from "vue";
import type { Note, UserInfo } from "~~/types";
const { shortenKey, formatDate } = useHelpers();
const { getUserInfo } = useNostr();
const props = defineProps({
  note: { type: Object, required: true },
});

const userInfo = ref<UserInfo>({
  pubkey: "",
  display_name: "",
  picture: "",
  name: "",
});
const shortKey = computed(() => shortenKey(props.note.pubkey));
const formattedDate = computed(() => formatDate(props.note.created_at));

function loadUserInfo() {
  getUserInfo(props.note.pubkey).then((user) => {
    userInfo.value = {
      ...userInfo.value,
      ...user
    }
  });
}

loadUserInfo();

const toast = useToast();

const shareNote = async () => {
  const url = `https://nostr.guru/e/${props.note.id}`;
  await navigator.clipboard.writeText(url);
  toast.add({ title: "Note URL copied!" });
};

const { $nostr } = useNuxtApp();
const { user, postNote, RELAYS } = useNostr();

const likeNote = async () => {
  if (!user.value) return;

  // Check if the user has already liked the note
  const hasLiked = noteItems.value.some((item) => item.kind === 7);

  const event = {
    kind: 7, // kind 7 = "reaction"
    content: hasLiked ? "-" : "+", // standard for "like"
    tags: [
      ["e", props.note.id],
      ["p", props.note.pubkey],
    ],
    created_at: Math.floor(Date.now() / 1000),
  };

  const { $nostr } = useNuxtApp();
  const signed = $nostr.finalizeEvent(event, hexToBytes(user.value.privateKey));
  noteItems.value.push(signed);

  try {
    await Promise.any($nostr.pool.publish(RELAYS, signed));
    toast.add({ title: "You liked this note" });
  } catch (err) {
    console.error("Like failed", err);
  }
};

const replyToNote = () => {
  toast.add({
    title: "Reply feature not implemented yet.",
  });
};

const bookmarkNote = () => {
  const bookmarks = JSON.parse(localStorage.getItem("nostrBookmarks") || "[]");
  if (!bookmarks.includes(props.note.id)) {
    bookmarks.push(props.note.id);
    localStorage.setItem("nostrBookmarks", JSON.stringify(bookmarks));
    toast.add({ title: "Note bookmarked" });
  } else {
    toast.add({ title: "Already bookmarked", color: "neutral" });
  }
};

const noteItems = ref<Note[]>([]);

const getNoteLikes = async (noteId: string): Promise<number> => {
  try {
    const events = await $nostr.pool.querySync(RELAYS, {
      kinds: [7, 1, 6],
      "#e": [noteId], // reactions linked to this note
      limit: 100, // adjust based on how many likes you expect
    });

    console.log(events);
    noteItems.value = events;

    // Count "+" reactions (likes)
    const likes = events.filter((event) =>
      ["+", "❤️", "👍"].includes(event.content)
    );

    return likes.length;
  } catch (error) {
    console.error("Error fetching likes:", error);
    return 0;
  }
};

const likeCount = computed(() => {
  // filter without -
  return noteItems.value.filter(
    (item) => item.kind === 7 && item.content !== "-"
  ).length;
});

const commentCount = computed(() => {
  return noteItems.value.filter((item) => item.kind === 1).length;
});

const rePostCount = computed(() => {
  return noteItems.value.filter((item) => item.kind === 6).length;
});

onMounted(() => {
  const noteId = props.note.id;
  getNoteLikes(noteId);
});
</script>
