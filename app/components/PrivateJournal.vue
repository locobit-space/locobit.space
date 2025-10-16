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

        <figure v-if="isLoading">
          <USkeleton class="h-6 mb-4 w-48" />
          <ul class="space-y-3">
            <li v-for="item in 3" :key="item" class="flex flex-col space-y-5">
              <div class="flex space-x-2">
                <span>
                  <USkeleton class="h-10 w-10 rounded-xl" />
                </span>
                <article class="flex-grow space-y-1">
                  <USkeleton
                    class="h-4"
                    :style="{ width: `${randomWidth(30, 40)}%` }"
                  />
                  <USkeleton
                    class="h-4"
                    :style="{ width: `${randomWidth()}%` }"
                  />
                </article>
              </div>
            </li>
          </ul>
        </figure>

        <figure
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

          <section class="divide-y divide-gray-100 dark:divide-slate-700">
            <div class="py-3">
              <h2 class="text-lg font-semibold text-gray-700">
                {{ formatGroupDate(dateGroup.date) }}
              </h2>
            </div>

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
                <div class="flex py-2">
                  <p class="text-sm text-gray-500 line-clamp-2 flex-grow">
                    {{ getExcerpt(entry.decryptedContent) }}
                  </p>

                  <small class="text-xs text-gray-500">
                    {{ formatTime(entry.created_at) }}
                  </small>
                </div>

                <!-- {{ entry.tags }} -->

                <EncryptedAttachmentList :event="entry" />

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
          </section>
        </figure>
        <div class="mt-4">
          <UButton color="primary" @click="onLoadMore">Load More</UButton>
        </div>
      </div>
    </section>

    <!-- New Entry Form -->
    <UModal v-model:open="isEditing" class="my-4">
      <template #content>
        <UCard>
          <nav class="flex gap-2">
            <UFormField label="Date" class="flex-grow">
              <UInput v-model="formState.date" type="date" :max="today" />
            </UFormField>
            <div class="flex justify-end mt-4 space-x-2">
              <UButton
                v-if="isEditing"
                @click="toggleNewEntry"
                color="neutral"
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
          </nav>

          <UFormField label="Your Thoughts" class="mt-4">
            <UTextarea
              v-model="formState.content"
              :rows="6"
              placeholder="Write your private journal entry here..."
              class="w-full"
            />
          </UFormField>

          <JournalFileUploader ref="fileUploaderRef" />
        </UCard>
      </template>
    </UModal>

    <!-- Modal for viewing full entry -->
    <UModal v-model:open="showModal">
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
const { user } = useNostrUser();
const { isLoading } = useNostrFeed();
const { formatTime } = useHelpers();

const {
  journalNotes,
  createJournalEntry,
  updateJournalEntry,
  loadJournalEntries,
  removeJournalEntry,
  loadMoreJournalEntries,
  hasMore,
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

const fileUploaderRef = ref();

const randomWidth = (min = 20, max = 100) => {
  // Random width between min and 100
  return Math.floor(Math.random() * (100 - min + 1) + min);
};

// Methods
const toggleNewEntry = () => {
  if (isEditing.value) {
    // Reset form when cancelling
    formState.value = { date: today, content: "" };
    currentEntry.value = null;
  }
  isEditing.value = !isEditing.value;
};


const generateSafeFilename = (originalName: string) => {
  const ext = originalName.split(".").pop() || "bin";
  const hash = crypto.randomUUID().replace(/-/g, "");
  return `${hash}.${ext}`;
};

const saveEntry = async () => {
  if (!formState.value.content.trim()) {
    return;
  }

  // 🧠 Get uploaded encrypted files
  const files = fileUploaderRef.value?.uploadedFiles || [];
  const attachmentTags: string[][] = [];

  for (const file of files) {
    // Convert the encrypted data back to a Uint8Array
    const keyBytes = Uint8Array.from(atob(file.key), (c) => c.charCodeAt(0));
    const nonceBytes = Uint8Array.from(atob(file.nonce), (c) =>
      c.charCodeAt(0)
    );
    const encrypted = file.encrypted; // this should already be Uint8Array

    // If encrypted content not stored in `file`, you'd need to persist it or re-encrypt here

    const encryptedBlob = new Blob([encrypted], { type: file.type });
    console.log("Encrypted blob size:", encryptedBlob.size);

    const newFilename = generateSafeFilename(file.name);
    const fileUrl = await uploadEncryptedFile(encryptedBlob, newFilename);

    attachmentTags.push(
      ["url", fileUrl],
      ["m", file.type],
      ["size", file.size.toString()],
      ["file-name", file.name],
      ["xkey", file.key],
      ["xnonce", file.nonce]
    );
  }

  console.log(attachmentTags);

  // return;

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
      formState.value.date,
      attachmentTags
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

const formatTimestamp = (timestamp: number) => {
  if (!timestamp) return "";
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
};

const getExcerpt = (text: string) => {
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

const onLoadMore = () => {
  hasMore.value = true;
  loadMoreJournalEntries();
};

// Load journal entries on mount
onMounted(() => {
  loadJournalEntries();
});
</script>
