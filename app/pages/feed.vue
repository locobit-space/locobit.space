<template>
    <main>
      <UContainer>
        <!-- Top Navigation and User Section -->
        <div class="flex justify-between items-center py-4 border-b mb-6">
          <h1 class="text-3xl font-bold flex items-center">
            <UIcon name="solar:chat-round-line-outline" class="mr-3" />
            Nostr Social
          </h1>
  
          <!-- User Authentication/Profile Section -->
          <div class="flex items-center space-x-4">
            <template v-if="!user">
              <UButton @click="createNewUser" color="blue" class="mr-2">
                Create Account
              </UButton>
              <UButton @click="importKeyModal = true" color="gray">
                Import Key
              </UButton>
            </template>
            <template v-else>
              <UDropdown :items="userDropdownItems">
                <UAvatar 
                  :alt="displayUser" 
                  :ui="{ background: 'bg-primary-500' }"
                  class="cursor-pointer"
                >
                  {{ displayUser.charAt(0).toUpperCase() }}
                </UAvatar>
              </UDropdown>
            </template>
          </div>
        </div>
  
        <!-- Main Content Area -->
        <div class="grid grid-cols-12 gap-6">
          <!-- Sidebar Navigation -->
          <div class="col-span-3 bg-gray-50 rounded-xl p-4">
            
          </div>
  
          <!-- Main Feed Area -->
          <div class="col-span-9">
            <!-- Post Creation Section (when logged in) -->
            <div v-if="user" class="mb-6">
              <UCard>
                <UTextarea
                  v-model="newPost"
                  placeholder="What's on your mind?"
                  :rows="3"
                />
                <div class="flex justify-end mt-4">
                  <UButton
                    @click="submitPost"
                    :loading="isPosting"
                    :disabled="!newPost.trim() || isPosting"
                    color="primary"
                  >
                    Post
                  </UButton>
                </div>
              </UCard>
            </div>
  
            <!-- Notes Feed -->
            <div>
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-semibold">Recent Notes</h2>
                <UButton 
                  @click="refreshNotes" 
                  color="gray" 
                  variant="ghost" 
                  icon="i-heroicons-arrow-path"
                >
                  Refresh
                </UButton>
              </div>
  
              <div v-if="isLoading" class="flex justify-center my-8">
                <UIcon name="svg-spinners:3-dots-bounce" class="text-4xl" />
              </div>
  
              <div v-if="notes.length === 0 && !isLoading" class="text-center py-8">
                <p class="text-gray-500">No notes found. Be the first to post!</p>
              </div>
  
              <div class="space-y-4">
                <UCard 
                  v-for="note in notes" 
                  :key="note.id" 
                  class="hover:bg-gray-50 transition-colors"
                >
                  <div class="flex items-start space-x-3">
                    <UAvatar 
                      :alt="note.pubkey" 
                      :ui="{ background: 'bg-primary-500' }"
                    >
                      {{ note.pubkey.charAt(0).toUpperCase() }}
                    </UAvatar>
                    <div>
                      <p class="font-semibold">
                        {{ shortenKey(note.pubkey) }}
                      </p>
                      <p class="mt-2">{{ note.content }}</p>
                      <div class="text-xs text-gray-500 mt-2">
                        {{ formatTimestamp(note.created_at) }}
                      </div>
                    </div>
                  </div>
                </UCard>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Import Key Modal -->
        <UModal v-model:open="importKeyModal">
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
        </UModal>
      </UContainer>
    </main>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted, watch, nextTick } from "vue";
  import { useToast } from "#imports";
  
  
  // User Dropdown Items
  const userDropdownItems = [
    [
      {
        label: 'Profile',
        icon: 'i-heroicons-user-circle',
        click: () => {}
      },
      {
        label: 'Settings',
        icon: 'i-heroicons-cog-6-tooth',
        click: () => {}
      }
    ],
    [
      {
        label: 'Logout',
        icon: 'i-heroicons-arrow-right-on-rectangle',
        click: () => logout()
      }
    ]
  ]
  
  // Composables and Refs from Original Code
  const { 
    shortenKey 
  } = useHelpers();
  
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
  } = useNostr();
  const toast = useToast();
  
  const newPost = ref("");
  const isPosting = ref(false);
  
  const importKeyModal = ref(false);
  const importKey = ref("");
  const keyInput = ref(null);
  
  // Computed Properties
  const displayUser = computed(() =>
    user.value ? shortenKey(user.value.publicKey) : ""
  );
  
  // Lifecycle and Watchers
  onMounted(async () => {
    await connect();
    refreshNotes();
  });
  
  watch(importKeyModal, (open) => {
    if (open) {
      nextTick(() => keyInput.value?.focus());
    }
  });
  
  // Methods
  const createNewUser = () => {
    createUser();
    toast.add({ 
      title: "New Nostr user created!", 
      color: "green",
      icon: 'i-heroicons-check-circle'
    });
    refreshNotes();
  };
  
  const importUserKey = () => {
    if (importKey.value) {
      setupUser(importKey.value);
      localStorage.setItem("nostrUser", importKey.value);
      toast.add({ 
        title: "Private key imported!", 
        color: "green",
        icon: 'i-heroicons-key'
      });
      importKeyModal.value = false;
      importKey.value = "";
      refreshNotes();
    }
  };
  
  const logout = () => {
    localStorage.removeItem("nostrUser");
    user.value = null;
    toast.add({ 
      title: "Logged out", 
      color: "red",
      icon: 'i-heroicons-arrow-right-on-rectangle'
    });
  };
  
  const submitPost = async () => {
    if (!newPost.value.trim()) return;
    isPosting.value = true;
    const success = await postNote(newPost.value);
    isPosting.value = false;
    if (success) {
      newPost.value = "";
      toast.add({ 
        title: "Note posted!", 
        color: "green",
        icon: 'i-heroicons-paper-airplane'
      });
      loadNotesOnce();
    }
  };
  
  const refreshNotes = () => {
    loadNotesOnce();
  };
  
  // Helper method to format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };
  </script>