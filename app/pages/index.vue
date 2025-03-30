<template>
  <main class="">
    <nav
      class="sticky top-0 backdrop-blur bg-white/30 border-b border-white/20 z-50"
    >
      <AppHeader class="" />
    </nav>
    <CommonContainer class="py-8">
      <!-- Floating Check New Notes button that appears when scrolling down -->
      <div
        v-if="showScrollButton"
        class="fixed top-16 left-1/2 transform -translate-x-1/2 transition-opacity duration-300"
        :class="showScrollButton ? 'opacity-100' : 'opacity-0'"
      >
        <UButton
          color="neutral"
          class="shadow-md z-50 rounded-2xl"
          :icon="
            isLoading
              ? 'svg-spinners:180-ring-with-bg'
              : 'system-uicons:refresh'
          "
          @click="
            () => {
              checkNewNotes();
              scrollToTop();
            }
          "
        >
          Check New Notes
        </UButton>
      </div>

      <UButton
        color="gray"
        icon="i-heroicons-arrow-up"
        class="shadow-md fixed right-4 h-10 w-10 bottom-28 flex items-center justify-center rounded-full z-50"
        size="xl"
        @click="scrollToTop"
      >
      </UButton>

      <!-- User Authentication Section -->
      <section class="hidden">
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
    </CommonContainer>

   
  </main>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useToast } from "#imports";

const importKeyModal = ref(false);
const { shortenKey } = useHelpers();

const {
  notes,
  createUser,
  loadNotes,
  user,
  setupUser,
  postNote,
  isLoading,
  checkNewNotes,
  loadNotesOnce,
  loadOlderNotes,
} = useNostr();
const toast = useToast();


const keyInput = ref(null);
const showScrollButton = ref(false); // New ref to control button visibility

const displayUser = computed(() =>
  user.value ? shortenKey(user.value.publicKey) : ""
);

const createNewUser = () => {
  createUser();
  toast.add({ title: "New Nostr user created!", color: "green" });
  refreshNotes();
};



const logout = () => {
  localStorage.removeItem("nostrUser");
  user.value = null;
  toast.add({ title: "Logged out", color: "red" });
};

const refreshNotes = () => {
  loadNotesOnce();
};

// New function to scroll to top
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

const setupInfiniteScroll = () => {
  window.addEventListener("scroll", handleScroll);

  onUnmounted(() => {
    window.removeEventListener("scroll", handleScroll);
  });
};

const handleScroll = async () => {
  // Show button after scrolling down 200px
  if (window.scrollY > 200) {
    showScrollButton.value = true;
  } else {
    showScrollButton.value = false;
  }

  // Load more notes when near bottom
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

onMounted(() => {
  refreshNotes();
  setupInfiniteScroll();
});
</script>
