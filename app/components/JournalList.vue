<!-- components/JournalList.vue -->
<template>
  <div class="container mx-auto px-4 py-6">
    <h1 class="text-2xl font-bold mb-6 text-gray-800">My Journal</h1>

    <div v-if="groupedEntries.length === 0" class="text-center text-gray-500">
      No journal entries found
    </div>

    <div v-else class="space-y-8">
      <div v-for="(dateGroup, index) in groupedEntries" :key="index" class="">
        <div class="px-4 py-3">
          <h2 class="text-lg font-semibold text-gray-700">
            {{ formatGroupDate(dateGroup.date) }}
          </h2>
        </div>

        <div class="divide-y divide-gray-100 dark:divide-slate-700">
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
              <h3 class="text-md font-medium text-gray-800 line-clamp-2">
                {{ entry.title }}
              </h3>
              <p class="text-sm text-gray-500 line-clamp-2 mt-1">
                {{ entry.content }}
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
                      color="gray"
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
                  color="gray"
                  variant="ghost"
                  @click="viewEntry(entry)"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

// Simulated journal entries with images and attachments
const entries = ref([
  {
    id: 1,
    title: "First Day of Spring",
    content:
      "Enjoyed a beautiful walk in the park today. The cherry blossoms are in full bloom.",
    date: new Date("2024-03-20"),
    image: "/api/placeholder/300/200", // Placeholder image
    attachments: [
      {
        id: "att1",
        name: "park-notes.txt",
        type: "text/plain",
        url: "/path/to/attachment1",
      },
    ],
  },
  {
    id: 2,
    title: "Weekend Reflection",
    content:
      "Spent time with family and realized how important these moments are.",
    date: new Date("2024-03-20"),
    image: "/api/placeholder/300/200", // Placeholder image
    attachments: [
      {
        id: "att2",
        name: "family-memories.pdf",
        type: "application/pdf",
        url: "/path/to/attachment2",
      },
    ],
  },
  {
    id: 3,
    title: "New Project Started",
    content:
      "Began working on an exciting new project at work. Feeling motivated and inspired.",
    date: new Date("2024-03-21"),
    // No image or attachments for this entry
  },
]);

// Group entries by date
const groupedEntries = computed(() => {
  // Sort entries by date (most recent first)
  const sortedEntries = [...entries.value].sort((a, b) => b.date - a.date);

  // Group by date
  const grouped = sortedEntries.reduce((acc, entry) => {
    const dateKey = entry.date.toISOString().split("T")[0];
    const existingGroup = acc.find(
      (group) => group.date.toISOString().split("T")[0] === dateKey
    );

    if (existingGroup) {
      existingGroup.entries.push(entry);
    } else {
      acc.push({
        date: entry.date,
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

// Get file icon based on file type
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

// Methods for entry interactions
const viewEntry = (entry) => {
  // Implement view logic
  console.log("View entry:", entry);
};

const editEntry = (entry) => {
  // Implement edit logic
  console.log("Edit entry:", entry);
};

// Download attachment method
const downloadAttachment = (attachment) => {
  // Implement download logic
  console.log("Download attachment:", attachment);
  // In a real app, you'd use fetch or axios to download the file
};
</script>
