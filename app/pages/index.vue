<template>
  <main>
    <UContainer>
      <div class="py-8">
        <h1 class="text-3xl font-bold mb-6">Nostr Social</h1>
        <UButton @click="checkNewNotes" color="gray">Check New Notes</UButton>

        <!-- User Authentication Section -->
        <div v-if="!user" class="mb-6">
          <UAlert title="Not Connected" color="yellow" class="mb-4">
            You need to create or login with your Nostr keys to interact
          </UAlert>
          <UButton @click="createNewUser" color="blue" class="mr-2"
            >Create New User</UButton
          >
          <UButton @click="importKeyModal = true" color="gray"
            >Import Private Key</UButton
          >
        </div>

        <div v-else class="mb-6">
          <UAlert
            :title="`Connected as ${displayUser}`"
            color="green"
            class="mb-4"
          >
            Your public key: {{ user.publicKey }}
          </UAlert>
          <UButton @click="logout" color="red">Logout</UButton>
        </div>

        <!-- Post Creation -->
        <div v-if="user" class="mb-8">
          <UCard class="mb-4">
            <UTextarea
              v-model="newPost"
              placeholder="What's on your mind?"
              class="mb-4"
              rows="3"
            />
            <div class="flex justify-end">
              <UButton
                @click="submitPost"
                :loading="isPosting"
                :disabled="!newPost.trim() || isPosting"
                color="blue"
              >
                Post
              </UButton>
            </div>
          </UCard>
        </div>

        <!-- Feed -->
        <div>
          <h2 class="text-xl font-semibold mb-4">Recent Notes</h2>

          <UButton @click="refreshNotes" color="gray" class="mb-4">
            Refresh Notes
          </UButton>

          <div v-if="isLoading" class="flex justify-center my-8">Loading</div>

          <div v-if="notes.length === 0 && !isLoading" class="text-center py-8">
            <p class="text-gray-500">No notes found. Be the first to post!</p>
          </div>
          <!-- {{ notes }} -->
          <div>
            <NoteCard v-for="note in notes" :key="note.id" :note="note" />
          </div>
        </div>
      </div>
    </UContainer>

    <!-- Import Key Modal -->
    <UModal v-model:open="importKeyModal">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-bold">Import Private Key</h3>
          </template>

          <div class="mb-4">
            <UInput
              ref="keyInput"
              v-model="importKey"
              placeholder="Enter your hex private key"
              type="password"
            />
          </div>

          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton color="gray" @click="importKeyModal = false">
                Cancel
              </UButton>
              <UButton
                color="primary"
                :disabled="!importKey"
                @click="importUserKey"
              >
                Import
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useToast } from "#imports";

const { shortenKey } = useHelpers();

const {
  notes,
  createUser,
  loadNotes,
  user,
  setupUser,
  postNote,
  connect,
  isLoading,
  checkNewNotes,
  loadNotesOnce,
  getUserInfo
} = useNostr();
const toast = useToast();



const newPost = ref("");
const isPosting = ref(false);

const importKeyModal = ref(false);
const importKey = ref("");
const keyInput = ref(null);

const displayUser = computed(() =>
  user.value ? shortenKey(user.value.publicKey) : ""
);

onMounted(async () => {
  await connect();
  refreshNotes();
});

watch(importKeyModal, (open) => {
  if (open) {
    nextTick(() => keyInput.value?.focus());
  }
});

const createNewUser = () => {
  createUser();
  toast.add({ title: "New Nostr user created!", color: "green" });
  refreshNotes();
};

const importUserKey = () => {
  if (importKey.value) {
    setupUser(importKey.value);
    localStorage.setItem("nostrUser", importKey.value);
    toast.add({ title: "Private key imported!", color: "green" });
    importKeyModal.value = false;
    importKey.value = "";
    refreshNotes();
  }
};

const logout = () => {
  localStorage.removeItem("nostrUser");
  user.value = null;
  toast.add({ title: "Logged out", color: "red" });
};

const submitPost = async () => {
  if (!newPost.value.trim()) return;
  isPosting.value = true;
  const success = await postNote(newPost.value);
  isPosting.value = false;
  if (success) {
    newPost.value = "";
    toast.add({ title: "Note posted!", color: "green" });
    loadNotesOnce();
  }
};

const refreshNotes = () => {
  loadNotesOnce();
};
</script>
