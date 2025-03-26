<template>
  <div class="max-w-3xl mx-auto p-4">
    <article v-if="!loading">
      <NoteCard v-if="noteDetail.id" :note="noteDetail" />
    </article>

    <div v-else class="text-center py-4">
      <div class="flex gap-4">
        <USkeleton class="h-12 w-12 rounded-full" />

        <div class="grid gap-2">
          <USkeleton class="h-4 w-[250px]" />
          <USkeleton class="h-4 w-[200px]" />

          <div class="flex gap-4 py-4">
            <USkeleton class="h-45 w-[150px]" />
            <USkeleton class="h-45 w-[150px]" />
          </div>

          <nav class="flex gap-2">
            <USkeleton class="h-6 w-14" />
            <USkeleton class="h-6 w-14" />
            <USkeleton class="h-6 w-14" />
            <USkeleton class="h-6 w-14" />
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Note } from "~~/types";

const toast = useToast();
const { id } = useRoute().params;
const { getNoteDetail } = useNotes();

const loading = ref(false);

const noteDetail = ref<Note>({
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
    const data = await getNoteDetail(id);
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
