<template>
  <section>
    <article>
        <button @click="loadOldShort">xxx</button>
    </article>
    <article class="grid grid-cols-2 md:grid-cols-3 gap-2 p-2">
      <div
        v-for="(post, index) in shorts"
        :key="index"
        class="relative aspect-[3/4] rounded-md overflow-hidden group cursor-pointer"
      >
        <!-- Video Thumbnail -->
        <img
          :src="post.url"
          alt="Video thumbnail"
          class="w-full h-full object-cover"
        />

        <!-- Video Information Overlay -->
        <div
          class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2"
        >
          <div class="flex items-center text-white mb-1">
            <UIcon name="i-heroicons-play" class="mr-1 h-4 w-4" />
            <span class="text-xs font-medium">{{
              formatCount(post.likes)
            }}</span>
          </div>

          <p class="text-white text-xs line-clamp-2">{{ post.title }}</p>
        </div>

        <!-- Play Button Overlay (appears on hover) -->
        <div
          class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <UButton
            variant="ghost"
            icon="i-heroicons-play"
            class="h-12 w-12 bg-black/40 flex items-center justify-center rounded-full"
          />
        </div>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
const { loadFirstShort, loadOldShort, shorts } = useNoteShort();

onMounted(() => {
  loadFirstShort();
});

// Format view counts with K, M, etc.
const formatCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};
</script>
