<template>
  <div class="mb-4 p-4">
    <div class="flex items-start gap-4">
      <span>
          <UAvatar :src="userInfo?.picture" />
        </span>
      <div class="flex-1">
        <div class="flex justify-between items-center mb-2">
          <span class="font-bold">{{ userInfo?.display_name }}</span>
          <span class="text-sm text-gray-500">{{ formattedDate }}</span>
        </div>
        <div class="text-wrap break-all">
          {{ note.content }}
        </div>

        <!-- action buttons share like etc -->
        <div class="flex gap-4 mt-4 border-y border-slate-100 py-1">
          <UButton color="gray" icon="i-heroicons-share" class="mr-2" />
          <UButton color="gray" icon="i-heroicons-heart" class="mr-2" />
          <UButton color="gray" icon="i-heroicons-chat-bubble-left-right" />
          <UButton color="gray" icon="heroicons:bookmark" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
const { shortenKey, formatDate } = useHelpers();
const { getUserInfo } = useNostr();
const props = defineProps({
  note: { type: Object, required: true },
});

const userInfo = ref(null);
const shortKey = computed(() => shortenKey(props.note.pubkey));
const formattedDate = computed(() => formatDate(props.note.created_at));

function loadUserInfo() {
  getUserInfo(props.note.pubkey).then((user) => {
    userInfo.value = user;
  });
}

loadUserInfo();
</script>
