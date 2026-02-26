<!-- pages/journals/index.vue -->
<template>
  <div class="h-full bg-gray-50 dark:bg-gray-950">
    <!-- Header Section -->
    <div class="border-b border-gray-200 dark:border-gray-800">
      <div class="max-w-4xl mx-auto px-4 py-5 sm:py-6">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h1
              class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white"
            >
              {{ $t("journal.title") }}
            </h1>
            <p class="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
              {{ $t("journal.subtitle") }}
            </p>
          </div>
          <UButton
            color="primary"
            variant="solid"
            icon="i-heroicons-plus"
            size="sm"
            @click="() => openNewEntry()"
          >
            <span class="hidden sm:inline">{{ $t("journal.new_entry") }}</span>
            <span class="sm:hidden">New</span>
          </UButton>
        </div>

        <!-- Stats Row -->
        <div class="grid grid-cols-3 gap-2 sm:gap-3">
          <div
            class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-center"
          >
            <div
              class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white"
            >
              {{ totalEntries }}
            </div>
            <div class="text-gray-500 dark:text-gray-400 text-xs">
              {{ $t("journal.total_entries") }}
            </div>
          </div>
          <div
            class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-center"
          >
            <div
              class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white"
            >
              {{ currentStreak }}
            </div>
            <div class="text-gray-500 dark:text-gray-400 text-xs">
              {{ $t("journal.day_streak") }}
            </div>
          </div>
          <div
            class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-center"
          >
            <div
              class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white"
            >
              {{ thisMonth }}
            </div>
            <div class="text-gray-500 dark:text-gray-400 text-xs">
              {{ $t("journal.this_month") }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto px-4 pt-4">
      <!-- Login Required -->
      <div
        v-if="!user"
        class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center"
      >
        <div
          class="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center"
        >
          <Icon
            name="heroicons:lock-closed"
            class="w-7 h-7 text-amber-600 dark:text-amber-400"
          />
        </div>
        <h3 class="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
          {{ $t("journal.login_required") }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400 text-sm mb-4">
          {{ $t("journal.login_description") }}
        </p>
        <UButton to="/settings" color="primary" size="sm">{{
          $t("common.login")
        }}</UButton>
      </div>

      <template v-else>
        <!-- View Toggle & Search -->
        <div class="flex items-center gap-4">
          <div class="flex-1">
            <UInput
              v-model="searchQuery"
              :placeholder="$t('journal.search_placeholder')"
              icon="i-heroicons-magnifying-glass"
              size="lg"
              class="w-full"
            />
          </div>
          <UFieldGroup>
            <UButton
              :color="viewMode === 'list' ? 'primary' : 'neutral'"
              :variant="viewMode === 'list' ? 'solid' : 'ghost'"
              icon="i-heroicons-list-bullet"
              @click="viewMode = 'list'"
            />
            <UButton
              :color="viewMode === 'calendar' ? 'primary' : 'neutral'"
              :variant="viewMode === 'calendar' ? 'solid' : 'ghost'"
              icon="i-heroicons-calendar-days"
              @click="viewMode = 'calendar'"
            />
          </UFieldGroup>
        </div>

        <!-- Mood Filter -->
        <div class="flex gap-2 mb-6 overflow-x-auto pb-2">
          <UButton
            v-for="mood in moods"
            :key="mood.value"
            :color="selectedMood === mood.value ? 'primary' : 'neutral'"
            :variant="selectedMood === mood.value ? 'soft' : 'ghost'"
            size="sm"
            @click="
              selectedMood = selectedMood === mood.value ? null : mood.value
            "
          >
            <span class="text-lg mr-1">{{ mood.emoji }}</span>
            {{ mood.label }}
          </UButton>
        </div>

        <!-- Writing Prompt Card -->
        <div
          v-if="showPrompt && !journalNotes.length"
          class="bg-amber-50/50 dark:bg-amber-900/10 rounded-xl p-4 sm:p-5 mb-6 border border-amber-200/50 dark:border-amber-800/30"
        >
          <div class="flex items-start gap-3">
            <div
              class="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0"
            >
              <Icon
                name="heroicons:light-bulb"
                class="w-5 h-5 text-amber-600 dark:text-amber-400"
              />
            </div>
            <div class="flex-1 min-w-0">
              <h3
                class="font-medium text-amber-900 dark:text-amber-100 text-sm"
              >
                {{ $t("journal.writing_prompt") }}
              </h3>
              <p
                class="text-amber-700 dark:text-amber-200/80 text-sm mt-1 italic"
              >
                "{{ currentPrompt }}"
              </p>
              <div class="flex flex-wrap gap-2 mt-3">
                <UButton
                  size="xs"
                  color="amber"
                  @click="openNewEntry(currentPrompt)"
                >
                  {{ $t("journal.start_writing") }}
                </UButton>
                <UButton
                  size="xs"
                  variant="ghost"
                  color="amber"
                  @click="refreshPrompt"
                >
                  <Icon name="heroicons:arrow-path" class="w-3.5 h-3.5 mr-1" />
                  {{ $t("journal.new_prompt") }}
                </UButton>
              </div>
            </div>
            <UButton
              variant="ghost"
              color="neutral"
              icon="i-heroicons-x-mark"
              size="xs"
              @click="showPrompt = false"
            />
          </div>
        </div>

        <!-- Calendar View -->
        <div
          v-if="viewMode === 'calendar'"
          class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6 mb-6"
        >
          <div class="flex items-center justify-between mb-4">
            <UButton
              variant="ghost"
              icon="i-heroicons-chevron-left"
              size="sm"
              @click="prevMonth"
            />
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
              {{ calendarTitle }}
            </h3>
            <UButton
              variant="ghost"
              icon="i-heroicons-chevron-right"
              size="sm"
              @click="nextMonth"
            />
          </div>
          <div class="grid grid-cols-7 gap-0.5 sm:gap-1">
            <div
              v-for="day in weekDays"
              :key="day"
              class="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-2"
            >
              {{ day }}
            </div>
            <button
              v-for="(date, i) in calendarDays"
              :key="i"
              class="aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors relative"
              :class="[
                date.isCurrentMonth
                  ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  : 'text-gray-300 dark:text-gray-700',
                date.isToday
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold'
                  : '',
                date.hasEntry ? 'font-medium' : '',
              ]"
              @click="date.isCurrentMonth && selectDate(date)"
            >
              {{ date.day }}
              <div
                v-if="date.hasEntry"
                class="w-1 h-1 rounded-full bg-primary-500 absolute bottom-1"
              />
            </button>
          </div>
        </div>

        <!-- List View -->
        <div v-if="viewMode === 'list'" class="space-y-4">
          <!-- Loading State -->
          <template v-if="isLoading && !journalNotes.length">
            <div
              v-for="i in 3"
              :key="i"
              class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5"
            >
              <div class="flex gap-3">
                <USkeleton class="w-10 h-10 rounded-full flex-shrink-0" />
                <div class="flex-1 space-y-2">
                  <USkeleton class="h-3 w-24" />
                  <USkeleton class="h-3 w-full" />
                  <USkeleton class="h-3 w-2/3" />
                </div>
              </div>
            </div>
          </template>

          <!-- Empty State -->
          <div
            v-else-if="!journalNotes.length"
            class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-10 text-center"
          >
            <div
              class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
            >
              <Icon name="heroicons:book-open" class="w-8 h-8 text-gray-400" />
            </div>
            <h3
              class="text-lg font-semibold mb-2 text-gray-900 dark:text-white"
            >
              {{ $t("journal.no_entries") }}
            </h3>
            <p class="text-gray-500 dark:text-gray-400 text-sm mb-5">
              {{ $t("journal.no_entries_description") }}
            </p>
            <UButton color="primary" size="sm" @click="() => openNewEntry()">
              <Icon name="heroicons:pencil" class="w-4 h-4 mr-1.5" />
              {{ $t("journal.write_first") }}
            </UButton>
          </div>

          <!-- Journal Entries -->
          <template v-else>
            <div
              v-for="(dateGroup, index) in filteredGroupedEntries"
              :key="index"
              class="space-y-3"
            >
              <!-- Date Header -->
              <div class="sticky top-0 z-10 bg-gray-50 dark:bg-gray-950 py-2">
                <div class="flex items-center gap-2">
                  <div class="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                  <span
                    class="text-xs font-medium text-gray-400 dark:text-gray-500 px-2"
                  >
                    {{ formatGroupDate(dateGroup.created_at) }}
                  </span>
                  <div class="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                </div>
              </div>

              <!-- Entry Cards -->
              <div
                v-for="entry in dateGroup.entries"
                :key="entry.id"
                class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-gray-300 dark:hover:border-gray-700 transition-colors cursor-pointer group"
                @click="viewFullEntry(entry)"
              >
                <div class="p-4 sm:p-5">
                  <div class="flex items-start gap-3">
                    <!-- Mood Indicator -->
                    <div
                      class="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                      :class="getMoodBgClass(entry.mood)"
                    >
                      {{ getMoodEmoji(entry.mood) }}
                    </div>

                    <!-- Content -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-xs text-gray-400 dark:text-gray-500">
                          {{ formatTime(entry.created_at) }}
                        </span>
                        <span
                          v-if="entry.attachments?.length"
                          class="text-gray-400"
                        >
                          <Icon
                            name="heroicons:paper-clip"
                            class="w-3.5 h-3.5"
                          />
                        </span>
                      </div>
                      <p
                        class="text-gray-700 dark:text-gray-300 text-sm leading-relaxed line-clamp-3 whitespace-pre-wrap"
                      >
                        {{ entry.decryptedContent }}
                      </p>
                    </div>

                    <!-- Actions -->
                    <div
                      class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <UButton
                        variant="ghost"
                        color="neutral"
                        icon="i-heroicons-pencil-square"
                        size="xs"
                        @click.stop="editEntry(entry)"
                      />
                      <UButton
                        variant="ghost"
                        color="error"
                        icon="i-heroicons-trash"
                        size="xs"
                        @click.stop="confirmDelete(entry)"
                      />
                    </div>
                  </div>

                  <!-- Attachments Preview -->
                  <EncryptedAttachmentList
                    v-if="entry.tags?.length"
                    :event="entry"
                    class="mt-3"
                  />
                </div>
              </div>
            </div>

            <!-- Load More -->
            <div v-if="hasMore" class="text-center py-4">
              <UButton variant="ghost" :loading="isLoading" @click="onLoadMore">
                {{ $t("common.load_more") }}
              </UButton>
            </div>
          </template>
        </div>
      </template>
    </div>

    <!-- New/Edit Entry Modal -->
    <UModal v-model:open="isEditing" fullscreen>
      <template #content>
        <div class="h-full flex flex-col bg-white dark:bg-gray-900">
          <!-- Modal Header -->
          <div
            class="flex items-center justify-between p-4 border-b dark:border-gray-700"
          >
            <div class="flex items-center gap-3">
              <UButton
                variant="ghost"
                icon="i-heroicons-x-mark"
                @click="closeEditor"
              />
              <span class="font-semibold">
                {{
                  currentEntry
                    ? $t("journal.edit_entry")
                    : $t("journal.new_entry")
                }}
              </span>
            </div>
            <UButton color="primary" :loading="isSaving" @click="saveEntry">
              {{ $t("common.save") }}
            </UButton>
          </div>

          <!-- Modal Content -->
          <div class="flex-1 overflow-y-auto p-4">
            <div class="max-w-2xl mx-auto space-y-6">
              <!-- Date & Mood -->
              <div class="flex flex-wrap gap-4">
                <UFormField :label="$t('journal.date')">
                  <UInput v-model="formState.date" type="date" :max="today" />
                </UFormField>

                <UFormField :label="$t('journal.mood')">
                  <div class="flex gap-1">
                    <button
                      v-for="mood in moods"
                      :key="mood.value"
                      class="w-10 h-10 rounded-full text-xl transition-all"
                      :class="
                        formState.mood === mood.value
                          ? 'bg-primary-100 dark:bg-primary-900 ring-2 ring-primary-500 scale-110'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      "
                      @click="formState.mood = mood.value"
                    >
                      {{ mood.emoji }}
                    </button>
                  </div>
                </UFormField>
              </div>

              <!-- Content -->
              <UFormField :label="$t('journal.your_thoughts')">
                <UTextarea
                  v-model="formState.content"
                  :rows="12"
                  :placeholder="
                    formState.prompt || $t('journal.write_placeholder')
                  "
                  class="w-full text-lg"
                  autofocus
                />
              </UFormField>

              <!-- Character Count -->
              <div class="text-right text-sm text-gray-500">
                {{ formState.content.length }} {{ $t("journal.characters") }}
              </div>

              <!-- Attachments -->
              <JournalFileUploader ref="fileUploaderRef" />
            </div>
          </div>
        </div>
      </template>
    </UModal>

    <!-- View Entry Modal -->
    <UModal v-model:open="showViewModal" :ui="{ content: 'max-w-2xl' }">
      <template #content>
        <div class="p-5 sm:p-6" v-if="selectedEntry">
          <div class="flex items-center gap-3 mb-5">
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center text-xl"
              :class="getMoodBgClass(selectedEntry.mood)"
            >
              {{ getMoodEmoji(selectedEntry.mood) }}
            </div>
            <div>
              <div
                class="text-base font-semibold text-gray-900 dark:text-white"
              >
                {{ formatGroupDate(selectedEntry.created_at) }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {{ formatTime(selectedEntry.created_at) }}
              </div>
            </div>
          </div>

          <div class="mb-5">
            <p
              class="whitespace-pre-wrap text-gray-700 dark:text-gray-300 text-sm leading-relaxed"
            >
              {{ selectedEntry.decryptedContent }}
            </p>
          </div>

          <EncryptedAttachmentList
            v-if="selectedEntry.tags?.length"
            :event="selectedEntry"
          />

          <div
            class="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-100 dark:border-gray-800"
          >
            <UButton variant="ghost" size="sm" @click="showViewModal = false">
              {{ $t("common.close") }}
            </UButton>
            <UButton color="primary" size="sm" @click="editFromView">
              <Icon name="heroicons:pencil" class="w-3.5 h-3.5 mr-1" />
              {{ $t("common.edit") }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Delete Confirmation -->
    <UModal v-model:open="showDeleteConfirm">
      <template #content>
        <div class="p-5 text-center">
          <div
            class="w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center"
          >
            <Icon
              name="heroicons:trash"
              class="w-6 h-6 text-red-600 dark:text-red-400"
            />
          </div>
          <h3
            class="text-base font-semibold mb-1.5 text-gray-900 dark:text-white"
          >
            {{ $t("journal.delete_confirm_title") }}
          </h3>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-5">
            {{ $t("journal.delete_confirm_message") }}
          </p>
          <div class="flex justify-center gap-2">
            <UButton
              variant="ghost"
              size="sm"
              @click="showDeleteConfirm = false"
            >
              {{ $t("common.cancel") }}
            </UButton>
            <UButton color="error" size="sm" @click="doDelete">
              {{ $t("common.delete") }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const { user } = useNostrUser();
const { isLoading } = useNostrFeed();
const { formatTime } = useHelpers();
const { t } = useI18n();

const {
  journalNotes,
  createJournalEntry,
  updateJournalEntry,
  loadJournalEntries,
  removeJournalEntry,
  loadMoreJournalEntries,
  hasMore,
} = useNostrPrivateJournal();

// View mode
const viewMode = ref<"list" | "calendar">("list");
const searchQuery = ref("");
const selectedMood = ref<string | null>(null);

// Moods
const moods = [
  { value: "great", emoji: "😊", label: "Great" },
  { value: "good", emoji: "🙂", label: "Good" },
  { value: "okay", emoji: "😐", label: "Okay" },
  { value: "bad", emoji: "😔", label: "Bad" },
  { value: "terrible", emoji: "😢", label: "Terrible" },
];

// Writing prompts
const prompts = [
  "What are you grateful for today?",
  "Describe a moment that made you smile recently.",
  "What's something you learned this week?",
  "Write about a goal you're working towards.",
  "What would you tell your past self?",
  "Describe your ideal day.",
  "What's been on your mind lately?",
  "Write about someone who inspires you.",
  "What small joy did you experience today?",
  "What are you looking forward to?",
];

const showPrompt = ref(true);
const currentPrompt = ref(prompts[Math.floor(Math.random() * prompts.length)]);

const refreshPrompt = () => {
  currentPrompt.value = prompts[Math.floor(Math.random() * prompts.length)];
};

// Calendar
const currentCalendarDate = ref(new Date());
const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const calendarTitle = computed(() => {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(currentCalendarDate.value);
});

const calendarDays = computed(() => {
  const year = currentCalendarDate.value.getFullYear();
  const month = currentCalendarDate.value.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const today = new Date();

  const days: any[] = [];

  // Previous month days
  for (let i = 0; i < firstDay.getDay(); i++) {
    const date = new Date(year, month, -firstDay.getDay() + i + 1);
    days.push({
      day: date.getDate(),
      isCurrentMonth: false,
      isToday: false,
      hasEntry: false,
      date,
    });
  }

  // Current month days
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i);
    const dateStr = date.toISOString().split("T")[0];
    days.push({
      day: i,
      isCurrentMonth: true,
      isToday: date.toDateString() === today.toDateString(),
      hasEntry: journalNotes.value.some((n: any) => {
        const entryDate = new Date(n.created_at * 1000)
          .toISOString()
          .split("T")[0];
        return entryDate === dateStr;
      }),
      date,
    });
  }

  // Next month days
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      day: i,
      isCurrentMonth: false,
      isToday: false,
      hasEntry: false,
      date,
    });
  }

  return days;
});

const prevMonth = () => {
  currentCalendarDate.value = new Date(
    currentCalendarDate.value.getFullYear(),
    currentCalendarDate.value.getMonth() - 1,
    1,
  );
};

const nextMonth = () => {
  currentCalendarDate.value = new Date(
    currentCalendarDate.value.getFullYear(),
    currentCalendarDate.value.getMonth() + 1,
    1,
  );
};

const selectDate = (date: any) => {
  formState.value.date = date.date.toISOString().split("T")[0];
  openNewEntry();
};

// Stats
const totalEntries = computed(() => journalNotes.value.length);
const currentStreak = computed(() => {
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sortedDates = [
    ...new Set(
      journalNotes.value.map((n: any) => {
        const d = new Date(n.created_at * 1000);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      }),
    ),
  ].sort((a, b) => b - a);

  for (let i = 0; i < sortedDates.length; i++) {
    const expectedDate = new Date(
      today.getTime() - i * 24 * 60 * 60 * 1000,
    ).getTime();
    if (sortedDates[i] === expectedDate) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
});

const thisMonth = computed(() => {
  const now = new Date();
  return journalNotes.value.filter((n: any) => {
    const date = new Date(n.created_at * 1000);
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }).length;
});

// Form state
const isEditing = ref(false);
const isSaving = ref(false);
const currentEntry = ref<any>(null);
const showViewModal = ref(false);
const selectedEntry = ref<any>(null);
const showDeleteConfirm = ref(false);
const entryToDelete = ref<any>(null);
const today = new Date().toISOString().split("T")[0];

const formState = ref({
  date: today as string,
  content: "",
  mood: "okay",
  prompt: "",
});

const fileUploaderRef = ref();

// Methods
const openNewEntry = (prompt?: string) => {
  currentEntry.value = null;
  formState.value = {
    date: today as string,
    content: "",
    mood: "okay",
    prompt: typeof prompt === "string" ? prompt : "",
  };
  isEditing.value = true;
};

const closeEditor = () => {
  isEditing.value = false;
  formState.value = {
    date: today as string,
    content: "",
    mood: "okay",
    prompt: "",
  };
  currentEntry.value = null;
};

const editEntry = (entry: any) => {
  currentEntry.value = entry;
  formState.value = {
    date: entry.date,
    content: entry.decryptedContent,
    mood: entry.mood || "okay",
    prompt: "",
  };
  isEditing.value = true;
};

const viewFullEntry = (entry: any) => {
  selectedEntry.value = entry;
  showViewModal.value = true;
};

const editFromView = () => {
  showViewModal.value = false;
  editEntry(selectedEntry.value);
};

const confirmDelete = (entry: any) => {
  entryToDelete.value = entry;
  showDeleteConfirm.value = true;
};

const doDelete = async () => {
  if (entryToDelete.value) {
    await removeJournalEntry(entryToDelete.value.id);
    showDeleteConfirm.value = false;
    entryToDelete.value = null;
  }
};

// Generate safe filename
const generateSafeFilename = (originalName: string) => {
  const ext = originalName.split(".").pop() || "bin";
  const hash = crypto.randomUUID().replace(/-/g, "");
  return `${hash}.${ext}`;
};

const saveEntry = async () => {
  if (!formState.value.content.trim()) return;

  isSaving.value = true;

  try {
    // Get uploaded files
    const files = fileUploaderRef.value?.uploadedFiles || [];
    const attachmentTags: string[][] = [];

    for (const file of files) {
      const encrypted = file.encrypted;

      const encryptedBlob = new Blob([encrypted], { type: file.type });
      const newFilename = generateSafeFilename(file.name);
      // Note: uploadEncryptedFile should be imported from use-upload composable
      const { uploadEncryptedFile } = useUpload();
      const fileUrl = await uploadEncryptedFile(encryptedBlob, newFilename);

      attachmentTags.push(
        ["url", fileUrl],
        ["m", file.type],
        ["size", file.size.toString()],
        ["file-name", file.name],
        ["xkey", file.key],
        ["xnonce", file.nonce],
      );
    }

    let success;
    if (currentEntry.value) {
      success = await updateJournalEntry(
        currentEntry.value.id,
        formState.value.content,
        formState.value.date,
      );
    } else {
      success = await createJournalEntry(
        formState.value.content,
        formState.value.date,
        [["mood", formState.value.mood], ...attachmentTags],
      );
    }

    if (success) {
      await loadJournalEntries();
      closeEditor();
    }
  } finally {
    isSaving.value = false;
  }
};

// Filtered entries
const filteredGroupedEntries = computed(() => {
  let entries = journalNotes.value;

  // Filter by search
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    entries = entries.filter((e: any) =>
      e.decryptedContent?.toLowerCase().includes(q),
    );
  }

  // Filter by mood
  if (selectedMood.value) {
    entries = entries.filter((e: any) => e.mood === selectedMood.value);
  }

  // Group by date
  const grouped = entries.reduce((acc: any[], entry: any) => {
    const entryDate = new Date(entry.created_at * 1000);
    const dateKey = entryDate.toISOString().split("T")[0];

    const existingGroup = acc.find((group: any) => {
      const groupDateKey = new Date(group.created_at * 1000)
        .toISOString()
        .split("T")[0];
      return groupDateKey === dateKey;
    });

    if (existingGroup) {
      existingGroup.entries.push(entry);
    } else {
      acc.push({
        created_at: entry.created_at,
        entries: [entry],
      });
    }

    return acc;
  }, []);

  return grouped.sort((a: any, b: any) => b.created_at - a.created_at);
});

// Helper functions
const formatGroupDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  const todayDate = new Date();
  const yesterday = new Date(todayDate);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === todayDate.toDateString()) {
    return t("common.today");
  } else if (date.toDateString() === yesterday.toDateString()) {
    return t("common.yesterday");
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const getMoodEmoji = (mood: string) => {
  const found = moods.find((m) => m.value === mood);
  return found?.emoji || "📝";
};

const getMoodBgClass = (mood: string) => {
  const classes: Record<string, string> = {
    great: "bg-green-50 dark:bg-green-900/20",
    good: "bg-blue-50 dark:bg-blue-900/20",
    okay: "bg-gray-100 dark:bg-gray-800",
    bad: "bg-orange-50 dark:bg-orange-900/20",
    terrible: "bg-red-50 dark:bg-red-900/20",
  };
  return classes[mood] || classes.okay;
};

const onLoadMore = () => {
  hasMore.value = true;
  loadMoreJournalEntries();
};

// Load on mount
onMounted(() => {
  if (user.value) {
    loadJournalEntries();
  }
});

useHead({
  title: "Journal - BitOS Space",
});
</script>
