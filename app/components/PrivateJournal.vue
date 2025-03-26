<!-- components/PrivateJournal.vue -->
<template>
  <div>
    <section>
      <h1 class="text-2xl font-bold mb-6 text-gray-800">My Journal</h1>

      <!-- Journal List -->
      <div>
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

        <div v-if="isLoading" class="flex justify-center py-8">Loading</div>

        <template v-if="journalNotes?.length === 0">
          <div class="text-center py-10 text-gray-500">
            <div class="text-4xl mb-2">
              <UIcon name="i-heroicons-book-open" />
            </div>
            <p>No journal entries yet. Start writing your private thoughts!</p>
          </div>
        </template>

        <article
          v-for="(dateGroup, index) in groupedEntries"
          :key="index"
          class="transition-colors"
        >
          <!-- <div class="flex justify-between items-start">
            <div>
              <h3 class="font-medium">
                {{ dateGroup.date }}
                {{ formatGroupDate(dateGroup.date) }}
              </h3>
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

          <div class="flex justify-between items-center text-xs text-gray-500">
            <span>Last edited: {{ formatTimestamp(note.created_at) }}</span>
            <UButton
              color="gray"
              variant="ghost"
              size="xs"
              @click="viewFullEntry(note)"
            >
              Read more
            </UButton>
          </div> -->

          <div class="py-3">
            <h2 class="text-lg font-semibold text-gray-700">
              {{ formatGroupDate(dateGroup.date) }}
            </h2>
          </div>

          <div class="divide-y divide-gray-100">
            <div
              v-for="entry in dateGroup.entries"
              :key="entry.id"
              class="flextransition-colors duration-200"
            >
              <!-- Image Thumbnail -->
              <div v-if="entry.image" class="flex-shrink-0">
                <img
                  :src="entry.image"
                  alt="Journal Entry Image"
                  class="w-24 h-24 object-cover rounded-md"
                />
              </div>

              <!-- Entry Content -->
              <div class="flex-grow">
                <p class="text-sm text-gray-500 line-clamp-2 mt-1">
                  {{ getExcerpt(entry.decryptedContent) }}
                </p>

                <!-- Attachments Section -->
                <div
                  v-if="entry.attachments && entry.attachments.length"
                  class="mt-2"
                >
                  <div class="text-xs text-gray-500 mb-1">Attachments:</div>
                  <div class="flex space-x-2">
                    <UTooltip
                      v-for="attachment in entry.attachments"
                      :key="attachment.id"
                      :text="attachment.name"
                    >
                      <UButton
                        :icon="getFileIcon(attachment.type)"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        @click="downloadAttachment(attachment)"
                      >
                        {{ attachment.name }}
                      </UButton>
                    </UTooltip>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center space-x-3">
                <UTooltip text="View Entry">
                  <UButton
                    icon="i-heroicons-eye"
                    color="neutral"
                    variant="ghost"
                    @click="viewFullEntry(entry)"
                  />
                </UTooltip>

                <UTooltip text="Edit Entry">
                  <UButton
                    icon="i-heroicons-pencil-square"
                    color="primary"
                    variant="ghost"
                    @click="editEntry(entry)"
                  />
                </UTooltip>

                <UButton
                  color="error"
                  variant="ghost"
                  icon="i-heroicons-trash"
                  @click="removeJournalEntry(entry.id)"
                />
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- New Entry Form -->
    <UModal v-model:open="isEditing" class="my-4">
      <template #content>
        <UCard>
          <UFormField label="Date">
            <UInput v-model="formState.date" type="date" :max="today" />
          </UFormField>

          <UFormField label="Your Thoughts" class="mt-4">
            <UTextarea
              v-model="formState.content"
              :rows="6"
              placeholder="Write your private journal entry here..."
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end mt-4 space-x-2">
            <UButton
              v-if="isEditing"
              @click="toggleNewEntry"
              color="gray"
              icon="i-heroicons-x-mark"
              variant="ghost"
            >
              Cancel
            </UButton>
            <UButton
              type="submit"
              color="primary"
              :loading="isLoading"
              @click="saveEntry"
            >
              {{ currentEntry ? "Update Entry" : "Save Entry" }}
            </UButton>
          </div>
        </UCard>
      </template>
    </UModal>

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

<script setup lang="ts">
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
    console.log(user.value);
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

  let success;
  if (currentEntry.value) {
    // Update existing entry
    success = await updateJournalEntry(
      currentEntry.value?.id,
      formState.value.content,
      formState.value.date
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
  console.log(note);
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

const groupedEntries = computed(() => {
  const sortedEntries = [...journalNotes.value].sort(
    (a, b) => b.created_at - a.created_at
  );

  const grouped = sortedEntries.reduce((acc, entry) => {
    const entryDate = new Date(entry.created_at * 1000);
    const dateKey = entryDate.toISOString().split("T")[0];

    const existingGroup = acc.find((group) => {
      const groupDateKey = new Date(group.created_at * 1000)
        .toISOString()
        .split("T")[0];
      return groupDateKey === dateKey;
    });

    if (existingGroup) {
      existingGroup.entries.push(entry);
    } else {
      acc.push({
        created_at: entry.created_at, // keep this as the timestamp for the group
        entries: [entry],
      });
    }

    return acc;
  }, []);

  return grouped;
});

// Date formatting method
const formatGroupDate = (date) => {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const getFileIcon = (fileType) => {
  const iconMap = {
    "text/plain": "i-heroicons-document-text",
    "application/pdf": "i-heroicons-document-pdf",
    "image/jpeg": "i-heroicons-photo",
    "image/png": "i-heroicons-photo",
    default: "i-heroicons-document",
  };
  return iconMap[fileType] || iconMap["default"];
};

// Download attachment method
const downloadAttachment = (attachment) => {
  // Implement download logic
  console.log("Download attachment:", attachment);
  // In a real app, you'd use fetch or axios to download the file
};
</script>
