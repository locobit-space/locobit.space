<template>
  <div>
    <CommonContainer class="py-4">
      <div v-for="bookmark in bookmarks" :key="bookmark.id">
        <NoteCard :note="bookmark" />
      </div>

      <div v-if="!bookmarks.length" class="py-8 text-center text-gray-500">
        No bookmarks found
      </div>
    </CommonContainer>
  </div>
</template>

<script setup lang="ts">
const { fetchBookmarks, bookmarks } = useBookmark();

onMounted(() => {
  fetchBookmarks(true);
});
</script>

<style scoped></style>
