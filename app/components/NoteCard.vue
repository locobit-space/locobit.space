<template>
  <UCard class="mb-4">
    <div class="flex items-start">
      <UAvatar :alt="shortKey" class="mr-3" />
      <div class="flex-1">
        <div class="flex justify-between items-center mb-2">
          <span class="font-bold">{{ shortKey }}</span>
          <span class="text-sm text-gray-500">{{ formattedDate }}</span>
        </div>
        <p class="whitespace-pre-wrap">{{ note.content }}</p>
      </div>
    </div>
  </UCard>
</template>

<script setup>
import { computed } from "vue";
const { shortenKey, formatDate } = useHelpers();

const props = defineProps({
  note: { type: Object, required: true },
});

const shortKey = computed(() => shortenKey(props.note.pubkey));
const formattedDate = computed(() => formatDate(props.note.created_at));

</script>
