<template>
  <main class="">
    <nav
      class="sticky top-0 backdrop-blur bg-white/30 border-b border-white/20 z-50"
    >
      <AppHeader class="" />
    </nav>
    <div class="py-8 max-w-3xl mx-auto">
      <!-- User Authentication Section -->
      <section class="hidden">
        <UButton @click="checkNewNotes" color="gray">Check New Notes</UButton>

        <div v-if="!user" class="mb-6">
          <UAlert title="Not Connected" color="yellow" class="mb-4">
            You need to create or login with your Nostr keys to interact
          </UAlert>
          <UButton @click="createNewUser" color="blue" class="mr-2"
            >Create New User</UButton
          >
          <UButton @click="importKeyModal = true" color="gray">
            Import Private Key
          </UButton>
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

        <UButton @click="refreshNotes" color="gray" class="mb-4">
          Refresh Notes
        </UButton>
      </section>

      <!-- Feed -->
      <div>
        <div v-if="isLoading" class="px-4">
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

        <div v-if="isLoading" class="px-4">
          <article class="flex flex-col gap-4">
            <NoteSkeleton v-for="i in 3" :key="i" />
          </article>
        </div>
      </div>
    </div>

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
  getUserInfo,
  loadOlderNotes,
} = useNostr();
const toast = useToast();

const importKeyModal = ref(false);
const importKey = ref("");
const keyInput = ref(null);

const displayUser = computed(() =>
  user.value ? shortenKey(user.value.publicKey) : ""
);

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

const refreshNotes = () => {
  loadNotesOnce();
};

const setupInfiniteScroll = () => {
  window.addEventListener("scroll", handleScroll);

  onUnmounted(() => {
    window.removeEventListener("scroll", handleScroll);
  });
};

const handleScroll = async () => {
  const bottomOfWindow =
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 300; // 300px before bottom
  if (bottomOfWindow && !isLoading.value) {
    await loadOlderNotes();
  }
};

watch(importKeyModal, (open) => {
  if (open) {
    nextTick(() => keyInput.value?.focus());
  }
});

onMounted(async () => {
  refreshNotes();
  setupInfiniteScroll();
});
</script>
