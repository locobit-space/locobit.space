<template>
  <div>
    <CommonContainer>


    </CommonContainer>
  </div>
</template>

<script setup lang="ts">
const { fetchBookmarks, items } = useBookmark();

onMounted(() => {
  fetchBookmarks();
});
</script>

<style scoped></style>
