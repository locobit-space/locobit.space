<template>
  <div class="max-w-3xl mx-auto p-4">
    <div v-if="isLoading" class="">
      <article class="flex flex-col gap-4">
        <NoteSkeleton v-for="i in 3" :key="i" />
      </article>
    </div>

    <div v-if="notes.length === 0 && !isLoading" class="text-center py-8">
      <p class="text-gray-500">No notes found. Be the first to post!</p>
    </div>
    <!-- {{ notes }} -->
    <div class="space-y-4 divide-y divide-slate-100">
      <NoteCard v-for="note in notes" :key="note.id" :note="note" />
    </div>
  </div>
</template>

<script setup lang="ts">
const { id } = useRoute().params;

const { isLoading, notes, loadNotesOnce } = useNostrFeed();
onMounted(() => {
  if (id) {
    loadNotesOnce({ hashtag: id as string, filter: "hashtag" });
  }
});
</script>

<style scoped></style>
