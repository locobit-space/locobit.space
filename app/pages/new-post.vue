<template>
  <div>
    <!-- Post Creation -->
    <div v-if="currentUserInfo" class="mb-8 p-4">
      <article class="mb-4 flex gap-2">
        <span>
          <UAvatar :src="currentUserInfo?.picture" />
        </span>
        <div class="flex-1">
          <UTextarea
            v-model="newPost"
            placeholder="What's on your mind?"
            class="mb-4 w-full"
          />
          <div class="flex justify-end">
            <UButton
              @click="submitPost"
              :loading="isPosting"
              :disabled="!newPost.trim() || isPosting"
              color="primary"
            >
              Post
            </UButton>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
const toast = useToast();
const { currentUserInfo, loadNotesOnce, postNote } = useNostr();

const newPost = ref("");
const isPosting = ref(false);

const submitPost = async () => {
  if (!newPost.value.trim()) return;
  isPosting.value = true;
  const success = await postNote(newPost.value);
  isPosting.value = false;
  if (success) {
    newPost.value = "";
    toast.add({ title: "Note posted!" });
    loadNotesOnce();
  }
};
</script>

<style scoped></style>
