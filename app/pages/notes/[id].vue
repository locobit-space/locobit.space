<template>
  <CommonContainer class="py-4">
    <article v-if="!loading">
      <NoteCard v-if="noteDetail.id" :note="noteDetail" />
    </article>

    <div v-else class="py-4">
      <NoteSkeleton />
    </div>
  </CommonContainer>
</template>

<script setup lang="ts">
import type { Event } from "nostr-tools";

const toast = useToast();
const { id } = useRoute().params;
const { getNoteById } = useNostrFeed();

const loading = ref(false);

const noteDetail = ref<Event>({
  id: "",
  pubkey: "",
  created_at: 0,
  kind: 0,
  tags: [],
  content: "",
  sig: "",
});

async function loaDetail(id: string) {
  try {
    loading.value = true;
    const data = await getNoteById(id);
    if (data) noteDetail.value = data;
  } catch (error) {
    toast.add({ title: "Error loading note", color: "error" });
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loaDetail(id as string);
});
</script>

<style scoped></style>
