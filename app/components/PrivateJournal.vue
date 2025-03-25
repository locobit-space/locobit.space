<!-- components/PrivateJournal.vue -->
<template>
  <div class="w-full max-w-3xl mx-auto p-4">
    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-bold">Private Journal</h2>
          <UButton
            v-if="isEditing"
            @click="toggleNewEntry"
            color="gray"
            icon="i-heroicons-x-mark"
            variant="ghost"
          >
            Cancel
          </UButton>
        </div>
      </template>

      <!-- New Entry Form -->
      <div v-if="isEditing" class="my-4">
        <UFormGroup label="Date">
          <UInput v-model="formState.date" type="date" :max="today" />
        </UFormGroup>

        <UFormGroup label="Your Thoughts" class="mt-4">
          <UTextarea
            v-model="formState.content"
            :rows="6"
            placeholder="Write your private journal entry here..."
            class="w-full"
          />
        </UFormGroup>

        <div class="flex justify-end mt-4 space-x-2">
          <UButton
            type="submit"
            color="primary"
            :loading="isLoading"
            @click="saveEntry"
          >
            {{ currentEntry ? "Update Entry" : "Save Entry" }}
          </UButton>
        </div>
      </div>

      <!-- Journal List -->
      <div v-else>
        <div class="flex justify-between items-center mb-4">
          <div>
            <span class="text-gray-500 dark:text-gray-400">
              {{ journalNotes?.length }} entries
            </span>
          </div>
          <UButton
            @click="toggleNewEntry"
            color="primary"
            icon="i-heroicons-plus"
          >
            New Entry
          </UButton>
        </div>

        <div v-if="isLoading" class="flex justify-center py-8">
          <ULoader />
        </div>

        <template v-else-if="journalNotes?.length === 0">
          <div class="text-center py-10 text-gray-500">
            <div class="text-4xl mb-2">
              <UIcon name="i-heroicons-book-open" />
            </div>
            <p>No journal entries yet. Start writing your private thoughts!</p>
          </div>
        </template>

        <div v-else class="space-y-4">
          <UCard
            v-for="note in journalNotes"
            :key="note.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-medium">{{ note.date }}</h3>
                <p class="text-sm text-gray-500">
                  {{ getExcerpt(note.decryptedContent) }}
                </p>
              </div>
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-pencil-square"
                @click="editEntry(note)"
              />
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-trash"
                @click="removeJournalEntry(note.id)"
              />
            </div>

            <template #footer>
              <div
                class="flex justify-between items-center text-xs text-gray-500"
              >
                <span>Last edited: {{ formatTimestamp(note.created_at) }}</span>
                <UButton
                  color="gray"
                  variant="ghost"
                  size="xs"
                  @click="viewFullEntry(note)"
                >
                  Read more
                </UButton>
              </div>
            </template>
          </UCard>
        </div>
      </div>
    </UCard>

    <!-- Modal for viewing full entry -->
    <UModal v-model:open="showModal" :ui="{ width: 'md:max-w-2xl' }">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-bold">{{ selectedEntry?.date }}</h3>
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-pencil-square"
                @click="editFromModal"
              />
            </div>
          </template>

          <div class="prose dark:prose-invert max-w-none">
            <p style="white-space: pre-wrap">
              {{ selectedEntry?.decryptedContent }}
            </p>
          </div>

          <template #footer>
            <div class="flex justify-between">
              <span class="text-sm text-gray-500">
                Last edited: {{ selectedEntry?.created_at }}
              </span>
              <UButton @click="showModal = false">Close</UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";

const { user } = useNostr();
const {
  journalNotes,
  createJournalEntry,
  updateJournalEntry,
  loadJournalEntries,
  isLoading,
  removeJournalEntry,
} = useNostrPrivateJournal();

// State management
const isEditing = ref(false);
const currentEntry = ref(null);
const showModal = ref(false);
const selectedEntry = ref(null);
const today = new Date().toISOString().split("T")[0];

// Form state
const formState = ref({
  date: today,
  content: "",
});

// Load journal entries on mount
onMounted(async () => {
  if (user.value) {
    await loadJournalEntries();
  }
});

// Methods
const toggleNewEntry = () => {
  if (isEditing.value) {
    // Reset form when cancelling
    formState.value = { date: today, content: "" };
    currentEntry.value = null;
  }
  isEditing.value = !isEditing.value;
};

const saveEntry = async () => {
  if (!formState.value.content.trim()) {
    return;
  }

  console.log(formState.value);

  let success;
  if (currentEntry.value) {
    // Update existing entry
    success = await updateJournalEntry(
      formState.value.date,
      formState.value.content
    );
  } else {
    // Create new entry
    success = await createJournalEntry(
      formState.value.content,
      formState.value.date
    );
  }

  if (success) {
    await loadJournalEntries();
    formState.value = { date: today, content: "" };
    currentEntry.value = null;
    isEditing.value = false;
  }
};

const editEntry = (note) => {
  currentEntry.value = note;
  formState.value = {
    date: note.date,
    content: note.decryptedContent,
  };
  isEditing.value = true;

  // Close modal if it's open
  if (showModal.value) {
    showModal.value = false;
  }
};

const viewFullEntry = (note) => {
  selectedEntry.value = note;
  showModal.value = true;
};

const editFromModal = () => {
  editEntry(selectedEntry.value);
  showModal.value = false;
};

// Utility functions
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
};

const getExcerpt = (text) => {
  if (!text) return "";
  return text.length > 100 ? text.substring(0, 100) + "..." : text;
};
</script>
