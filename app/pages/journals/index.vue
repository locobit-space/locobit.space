<!-- pages/journals/index.vue -->
<template>
  <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden">
    <!-- ── Top Bar ─────────────────────────────────────────────────────────── -->
    <div class="shrink-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div class="max-w-4xl mx-auto px-4 py-4 sm:py-5">

        <!-- Title + status badges -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2.5">
            <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {{ t("journal.title") }}
            </h1>
            <span
              v-if="isOffline"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
            >
              <Icon name="heroicons:wifi" class="w-3 h-3" />
              Offline
            </span>
            <span
              v-else-if="isSyncing"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            >
              <Icon name="heroicons:arrow-path" class="w-3 h-3 animate-spin" />
              Syncing
            </span>
            <span
              v-else
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
            >
              <Icon name="heroicons:check-circle" class="w-3 h-3" />
              Synced
            </span>
          </div>
          <UButton
            color="primary"
            variant="solid"
            icon="i-heroicons-plus"
            size="sm"
            @click="openNewEntry()"
          >
            <span class="hidden sm:inline">{{ t("journal.new_entry") }}</span>
            <span class="sm:hidden">New</span>
          </UButton>
        </div>

        <!-- Stats row -->
        <div class="grid grid-cols-3 gap-2 sm:gap-3">
          <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center">
            <div class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{{ journalNotes.length }}</div>
            <div class="text-gray-500 dark:text-gray-400 text-xs">{{ t("journal.total_entries") }}</div>
          </div>
          <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center">
            <div class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{{ streakCount }}</div>
            <div class="text-gray-500 dark:text-gray-400 text-xs">{{ t("journal.day_streak") }}</div>
          </div>
          <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center">
            <div class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{{ thisMonthCount }}</div>
            <div class="text-gray-500 dark:text-gray-400 text-xs">{{ t("journal.this_month") }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Scrollable body ─────────────────────────────────────────────────── -->
    <div ref="scrollContainer" class="flex-1 overflow-y-auto">
    <div class="max-w-4xl mx-auto px-4 pt-4 pb-20">
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
          {{ t("journal.login_required") }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400 text-sm mb-4">
          {{ t("journal.login_description") }}
        </p>
        <UButton to="/settings" color="primary" size="sm">{{
          t("common.login")
        }}</UButton>
      </div>

      <template v-else>
        <!-- Search + View toggle -->
        <div class="flex items-center gap-3 mb-3">
          <UInput
            v-model="searchQuery"
            :placeholder=" t('journal.search_placeholder')"
            icon="i-heroicons-magnifying-glass"
            class="flex-1"
          />
          <div class="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              class="px-3 py-2 text-sm transition-colors"
              :class="viewMode === 'list'
                ? 'bg-primary-500 text-white'
                : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'"
              @click="viewMode = 'list'"
            >
              <Icon name="i-heroicons-list-bullet" class="w-4 h-4" />
            </button>
            <button
              class="px-3 py-2 text-sm transition-colors"
              :class="viewMode === 'calendar'
                ? 'bg-primary-500 text-white'
                : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'"
              @click="viewMode = 'calendar'"
            >
              <Icon name="i-heroicons-calendar-days" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Mood filter chips -->
        <div class="flex gap-1.5 mb-5 overflow-x-auto pb-1">
          <button
            v-for="mood in MOODS"
            :key="mood.value"
            class="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all border"
            :class="selectedMood === mood.value
              ? 'bg-primary-500 text-white border-primary-500'
              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary-400'"
            @click="selectedMood = selectedMood === mood.value ? null : mood.value"
          >
            {{ mood.emoji }} {{ mood.label }}
          </button>
        </div>

        <!-- Writing Prompt Card -->
        <Transition name="fade">
          <div
            v-if="showPrompt && !journalNotes.length && !isLoading"
            class="bg-amber-50/60 dark:bg-amber-900/10 rounded-xl p-4 mb-5 border border-amber-200/60 dark:border-amber-800/30"
          >
            <div class="flex items-start gap-3">
              <div class="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                <Icon name="heroicons:light-bulb" class="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-amber-700 dark:text-amber-200/80 text-sm italic">"{{ currentPrompt }}"</p>
                <div class="flex gap-2 mt-2">
                  <UButton size="xs" color="amber" @click="openNewEntry(currentPrompt)">
                    {{ t("journal.start_writing") }}
                  </UButton>
                  <UButton size="xs" variant="ghost" color="amber" icon="i-heroicons-arrow-path" @click="refreshPrompt">
                    {{ t("journal.new_prompt") }}
                  </UButton>
                </div>
              </div>
              <button class="text-amber-400 hover:text-amber-500 mt-0.5" @click="showPrompt = false">
                <Icon name="heroicons:x-mark" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </Transition>

        <!-- Calendar View -->
        <div
          v-if="viewMode === 'calendar'"
          class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 mb-5"
        >
          <div class="flex items-center justify-between mb-4">
            <UButton variant="ghost" icon="i-heroicons-chevron-left" size="sm" @click="prevMonth" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">{{ calendarTitle }}</h3>
            <UButton variant="ghost" icon="i-heroicons-chevron-right" size="sm" @click="nextMonth" />
          </div>
          <div class="grid grid-cols-7 gap-0.5">
            <div
              v-for="day in WEEK_DAYS"
              :key="day"
              class="text-center text-[11px] font-medium text-gray-400 dark:text-gray-500 py-1"
            >
              {{ day }}
            </div>
            <button
              v-for="(date, i) in calendarDays"
              :key="i"
              class="aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-colors relative"
              :class="[
                date.isCurrentMonth
                  ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  : 'text-gray-300 dark:text-gray-700 pointer-events-none',
                date.isToday && 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold',
              ]"
              @click="date.isCurrentMonth && selectDate(date)"
            >
              {{ date.day }}
              <div v-if="date.hasEntry" class="w-1 h-1 rounded-full bg-primary-500 absolute bottom-1" />
            </button>
          </div>
        </div>

        <!-- List View -->
        <div v-if="viewMode === 'list'" class="space-y-4">
          <!-- Skeleton loader -->
          <template v-if="isLoading && !journalNotes.length">
            <div
              v-for="i in 3"
              :key="i"
              class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4"
            >
              <div class="flex gap-3">
                <USkeleton class="w-10 h-10 rounded-full shrink-0" />
                <div class="flex-1 space-y-2">
                  <USkeleton class="h-3 w-24" />
                  <USkeleton class="h-3 w-full" />
                  <USkeleton class="h-3 w-2/3" />
                </div>
              </div>
            </div>
          </template>

          <!-- Empty state -->
          <div
            v-else-if="!filteredGroupedEntries.length"
            class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-10 text-center"
          >
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Icon name="heroicons:book-open" class="w-8 h-8 text-gray-400" />
            </div>
            <h3 class="text-base font-semibold mb-1 text-gray-900 dark:text-white">
              {{ searchQuery || selectedMood ? t("journal.no_results") : t("journal.no_entries") }}
            </h3>
            <p class="text-gray-500 dark:text-gray-400 text-sm mb-4">
              {{ searchQuery || selectedMood ? t("journal.try_different_filter") : t("journal.no_entries_description") }}
            </p>
            <UButton v-if="!searchQuery && !selectedMood" color="primary" size="sm" @click="openNewEntry()">
              <Icon name="heroicons:pencil" class="w-4 h-4 mr-1.5" />
              {{ t("journal.write_first") }}
            </UButton>
          </div>

          <!-- Entry groups -->
          <template v-else>
            <div
              v-for="(group, gi) in filteredGroupedEntries"
              :key="gi"
              class="space-y-2"
            >
              <!-- Date divider -->
              <div class="flex items-center gap-2 py-1">
                <div class="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                <span class="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-2">
                  {{ formatGroupDate(group.date) }}
                </span>
                <div class="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
              </div>

              <!-- Entry cards -->
              <div
                v-for="entry in group.entries"
                :key="entry.localId"
                class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-gray-300 dark:hover:border-gray-700 transition-colors cursor-pointer group"
                @click="viewFullEntry(entry)"
              >
                <div class="p-4 sm:p-5">
                  <div class="flex items-start gap-3">
                    <!-- Mood -->
                    <div
                      class="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
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
                        <!-- Sync status badge -->
                        <span
                          v-if="entry.syncStatus === 'pending'"
                          class="inline-flex items-center gap-0.5 text-[10px] font-medium text-orange-500"
                        >
                          <Icon name="heroicons:clock" class="w-3 h-3" />
                          Pending
                        </span>
                        <span
                          v-else-if="entry.syncStatus === 'failed'"
                          class="inline-flex items-center gap-0.5 text-[10px] font-medium text-red-500"
                        >
                          <Icon name="heroicons:exclamation-circle" class="w-3 h-3" />
                          Failed
                        </span>
                        <Icon
                          v-if="entry.attachments?.length"
                          name="heroicons:paper-clip"
                          class="w-3.5 h-3.5 text-gray-400"
                        />
                      </div>
                      <p class="text-gray-700 dark:text-gray-300 text-sm leading-relaxed line-clamp-3 whitespace-pre-wrap">
                        {{ entry.decryptedContent }}
                      </p>
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
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

                  <!-- Attachments preview -->
                  <EncryptedAttachmentList
                    v-if="entry.tags?.length"
                    :event="entry"
                    class="mt-3"
                  />
                </div>
              </div>
            </div>

            <!-- Infinite scroll sentinel + load-more fallback -->
            <div ref="loadMoreSentinel" class="py-4 flex justify-center">
              <UButton
                v-if="hasMore"
                variant="ghost"
                :loading="isLoading"
                @click="loadMoreJournalEntries"
              >
                {{ t("common.load_more") }}
              </UButton>
              <span v-else class="text-xs text-gray-400 dark:text-gray-600">{{ t("journal.all_loaded") }}</span>
            </div>
          </template>
        </div>
      </template>
    </div><!-- /max-w-4xl -->
    </div><!-- /scrollContainer -->

    <!-- New/Edit Entry Modal -->
    <UModal v-model:open="isEditing" fullscreen>
      <template #content>
        <div class="h-full flex flex-col bg-white dark:bg-gray-900">
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <div class="flex items-center gap-2">
              <UButton variant="ghost" icon="i-heroicons-x-mark" size="sm" @click="closeEditor" />
              <span class="font-semibold text-sm">
                {{ currentEntry ? t("journal.edit_entry") : t("journal.new_entry") }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400">{{ formState.content.length }} chars</span>
              <UButton color="primary" size="sm" :loading="isSaving" @click="saveEntry">
                {{ t("common.save") }}
              </UButton>
            </div>
          </div>

          <!-- Modal Body -->
          <div class="flex-1 overflow-y-auto p-4">
            <div class="max-w-2xl mx-auto space-y-5">
              <!-- Date + Mood -->
              <div class="flex flex-wrap gap-4 items-end">
                <UFormField :label=" t('journal.date')">
                  <UInput v-model="formState.date" type="date" :max="today" />
                </UFormField>
                <UFormField :label=" t('journal.mood')">
                  <div class="flex gap-1">
                    <button
                      v-for="mood in MOODS"
                      :key="mood.value"
                      class="w-10 h-10 rounded-full text-xl transition-all flex items-center justify-center"
                      :class="formState.mood === mood.value
                        ? 'ring-2 ring-primary-500 scale-110 bg-primary-50 dark:bg-primary-900/30'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'"
                      @click="formState.mood = mood.value"
                    >
                      {{ mood.emoji }}
                    </button>
                  </div>
                </UFormField>
              </div>

              <!-- Prompt hint -->
              <div
                v-if="formState.prompt"
                class="rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-700/30 px-4 py-3"
              >
                <p class="text-amber-700 dark:text-amber-300/80 text-sm italic">"{{ formState.prompt }}"</p>
              </div>

              <!-- Content -->
              <UFormField :label=" t('journal.your_thoughts')">
                <UTextarea
                  v-model="formState.content"
                  :rows="14"
                  :placeholder="formState.prompt ||  t('journal.write_placeholder')"
                  class="w-full text-base leading-relaxed"
                  autofocus
                />
              </UFormField>

              <!-- File uploader -->
              <JournalFileUploader ref="fileUploaderRef" />
            </div>
          </div>
        </div>
      </template>
    </UModal>

    <!-- View Entry Modal -->
    <UModal v-model:open="showViewModal" :ui="{ content: 'max-w-2xl' }">
      <template #content>
        <div v-if="selectedEntry" class="p-5 sm:p-6">
          <!-- Header -->
          <div class="flex items-center gap-3 mb-5">
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0"
              :class="getMoodBgClass(selectedEntry.mood)"
            >
              {{ getMoodEmoji(selectedEntry.mood) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-base font-semibold text-gray-900 dark:text-white">
                {{ formatGroupDate(selectedEntry.date) }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">{{ formatTime(selectedEntry.created_at) }}</div>
            </div>
            <!-- Sync badge -->
            <span
              v-if="selectedEntry.syncStatus === 'pending'"
              class="text-[11px] font-medium text-orange-500 flex items-center gap-1"
            >
              <Icon name="heroicons:clock" class="w-3.5 h-3.5" />Pending
            </span>
            <span
              v-else-if="selectedEntry.syncStatus === 'failed'"
              class="text-[11px] font-medium text-red-500 flex items-center gap-1"
            >
              <Icon name="heroicons:exclamation-circle" class="w-3.5 h-3.5" />Failed
            </span>
            <span
              v-else
              class="text-[11px] font-medium text-green-500 flex items-center gap-1"
            >
              <Icon name="heroicons:check-circle" class="w-3.5 h-3.5" />Synced
            </span>
          </div>

          <p class="whitespace-pre-wrap text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-5">
            {{ selectedEntry.decryptedContent }}
          </p>

          <EncryptedAttachmentList
            v-if="selectedEntry.tags?.length"
            :event="selectedEntry"
            class="mb-5"
          />

          <div class="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
            <UButton variant="ghost" size="sm" @click="showViewModal = false">{{ t("common.close") }}</UButton>
            <UButton color="primary" size="sm" icon="i-heroicons-pencil" @click="editFromView">{{ t("common.edit") }}</UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Delete Confirmation -->
    <UModal v-model:open="showDeleteConfirm">
      <template #content>
        <div class="p-5 text-center">
          <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <Icon name="heroicons:trash" class="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 class="text-base font-semibold mb-1.5 text-gray-900 dark:text-white">
            {{ t("journal.delete_confirm_title") }}
          </h3>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-5">
            {{ t("journal.delete_confirm_message") }}
          </p>
          <div class="flex justify-center gap-2">
            <UButton variant="ghost" size="sm" @click="showDeleteConfirm = false">{{ t("common.cancel") }}</UButton>
            <UButton color="error" size="sm" :loading="isDeleting" @click="doDelete">{{ t("common.delete") }}</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { JournalEventRecord } from "~/composables/useJournalDB";

// ── Composables ────────────────────────────────────────────────────────────────

const { user } = useNostrUser();
const { formatTime } = useHelpers();
const { t } = useI18n();
const {
  journalNotes,
  hasMore,
  isLoading,
  isSyncing,
  isOffline,
  thisMonthCount,
  streakCount,
  createJournalEntry,
  updateJournalEntry,
  removeJournalEntry,
  loadJournalEntries,
  loadMoreJournalEntries,
} = useNostrPrivateJournal();

// ── Constants ──────────────────────────────────────────────────────────────────

const MOODS = [
  { value: "great",    emoji: "😊", label: "Great"    },
  { value: "good",     emoji: "🙂", label: "Good"     },
  { value: "okay",     emoji: "😐", label: "Okay"     },
  { value: "bad",      emoji: "😔", label: "Bad"      },
  { value: "terrible", emoji: "😢", label: "Terrible" },
] as const;

const MOOD_BG: Record<string, string> = {
  great:    "bg-green-50  dark:bg-green-900/20",
  good:     "bg-blue-50   dark:bg-blue-900/20",
  okay:     "bg-gray-100  dark:bg-gray-800",
  bad:      "bg-orange-50 dark:bg-orange-900/20",
  terrible: "bg-red-50    dark:bg-red-900/20",
};

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const PROMPTS = [
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

const today = new Date().toISOString().split("T")[0];

// ── UI State ───────────────────────────────────────────────────────────────────

const viewMode      = ref<"list" | "calendar">("list");
const searchQuery   = ref("");
const selectedMood  = ref<string | null>(null);
const showPrompt    = ref(true);
const currentPrompt = ref(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);

// ── Editor State ───────────────────────────────────────────────────────────────

const isEditing       = ref(false);
const isSaving        = ref(false);
const currentEntry    = ref<JournalEventRecord | null>(null);
const fileUploaderRef = ref();

const formState = ref({
  date:    today,
  content: "",
  mood:    "okay",
  prompt:  "",
});

// ── Modal State ────────────────────────────────────────────────────────────────

const showViewModal     = ref(false);
const selectedEntry     = ref<JournalEventRecord | null>(null);
const showDeleteConfirm = ref(false);
const entryToDelete     = ref<JournalEventRecord | null>(null);
const isDeleting        = ref(false);

// ── Infinite Scroll ────────────────────────────────────────────────────────────

const scrollContainer  = ref<HTMLElement | null>(null);
const loadMoreSentinel = ref<HTMLElement | null>(null);

onMounted(() => {
  if (!import.meta.client) return;
  if (user.value) loadJournalEntries();

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && hasMore.value && !isLoading.value) {
        loadMoreJournalEntries();
      }
    },
    { root: scrollContainer.value, threshold: 0.1 }
  );

  watchEffect(() => {
    if (loadMoreSentinel.value) observer.observe(loadMoreSentinel.value);
  });

  onUnmounted(() => observer.disconnect());
});

// ── Calendar ───────────────────────────────────────────────────────────────────

const currentCalendarDate = ref(new Date());

const calendarTitle = computed(() =>
  new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    currentCalendarDate.value
  )
);

const calendarDays = computed(() => {
  const year  = currentCalendarDate.value.getFullYear();
  const month = currentCalendarDate.value.getMonth();
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const now   = new Date();
  const days: any[] = [];

  for (let i = 0; i < first.getDay(); i++) {
    const d = new Date(year, month, -first.getDay() + i + 1);
    days.push({ day: d.getDate(), isCurrentMonth: false, isToday: false, hasEntry: false, date: d });
  }

  for (let i = 1; i <= last.getDate(); i++) {
    const d   = new Date(year, month, i);
    const iso = d.toISOString().split("T")[0];
    days.push({
      day: i,
      isCurrentMonth: true,
      isToday: d.toDateString() === now.toDateString(),
      hasEntry: journalNotes.value.some((n) => n.date === iso),
      date: d,
    });
  }

  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push({ day: i, isCurrentMonth: false, isToday: false, hasEntry: false, date: d });
  }

  return days;
});

const prevMonth = () => {
  const d = currentCalendarDate.value;
  currentCalendarDate.value = new Date(d.getFullYear(), d.getMonth() - 1, 1);
};

const nextMonth = () => {
  const d = currentCalendarDate.value;
  currentCalendarDate.value = new Date(d.getFullYear(), d.getMonth() + 1, 1);
};

const selectDate = (date: any) => {
  formState.value.date = date.date.toISOString().split("T")[0];
  openNewEntry();
};

// ── Filtered + grouped entries ─────────────────────────────────────────────────

const filteredGroupedEntries = computed(() => {
  let entries = journalNotes.value as JournalEventRecord[];

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    entries = entries.filter((e) => e.decryptedContent?.toLowerCase().includes(q));
  }

  if (selectedMood.value) {
    entries = entries.filter((e) => e.mood === selectedMood.value);
  }

  // Group by calendar date string
  const map = new Map<string, { date: string; entries: JournalEventRecord[] }>();
  for (const entry of entries) {
    const iso = new Date(entry.created_at * 1000).toISOString().split("T")[0] ?? "";
    if (!iso) continue;
    if (!map.has(iso)) map.set(iso, { date: iso, entries: [] });
    map.get(iso)!.entries.push(entry);
  }

  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
});

// ── Editor helpers ─────────────────────────────────────────────────────────────

const openNewEntry = (prompt?: string) => {
  currentEntry.value = null;
  formState.value    = { date: today, content: "", mood: "okay", prompt: typeof prompt === "string" ? prompt : "" };
  isEditing.value    = true;
};

const closeEditor = () => {
  isEditing.value    = false;
  currentEntry.value = null;
  formState.value    = { date: today, content: "", mood: "okay", prompt: "" };
};

const editEntry = (entry: JournalEventRecord) => {
  currentEntry.value = entry;
  formState.value    = { date: entry.date, content: entry.decryptedContent, mood: entry.mood ?? "okay", prompt: "" };
  isEditing.value    = true;
};

const viewFullEntry = (entry: JournalEventRecord) => {
  selectedEntry.value = entry;
  showViewModal.value  = true;
};

const editFromView = () => {
  showViewModal.value = false;
  if (selectedEntry.value) editEntry(selectedEntry.value);
};

const confirmDelete = (entry: JournalEventRecord) => {
  entryToDelete.value    = entry;
  showDeleteConfirm.value = true;
};

const doDelete = async () => {
  if (!entryToDelete.value) return;
  isDeleting.value = true;
  await removeJournalEntry(entryToDelete.value.localId);
  isDeleting.value       = false;
  showDeleteConfirm.value = false;
  entryToDelete.value    = null;
};

const saveEntry = async () => {
  if (!formState.value.content.trim()) return;
  isSaving.value = true;

  try {
    const files          = fileUploaderRef.value?.uploadedFiles ?? [];
    const attachmentTags: string[][] = [];

    for (const file of files) {
      const { uploadEncryptedFile } = useUpload();
      const blob     = new Blob([file.encrypted], { type: file.type });
      const filename = `${crypto.randomUUID().replace(/-/g, "")}.${file.name.split(".").pop() ?? "bin"}`;
      const url      = await uploadEncryptedFile(blob, filename);
      attachmentTags.push(
        ["url",       url],
        ["m",         file.type],
        ["size",      file.size.toString()],
        ["file-name", file.name],
        ["xkey",      file.key],
        ["xnonce",    file.nonce],
      );
    }

    if (currentEntry.value) {
      await updateJournalEntry(currentEntry.value.localId, formState.value.content, formState.value.date!);
    } else {
      await createJournalEntry(
        formState.value.content,
        formState.value.date!,
        [["mood", formState.value.mood], ...attachmentTags]
      );
    }

    closeEditor();
  } finally {
    isSaving.value = false;
  }
};

// ── Formatting helpers ─────────────────────────────────────────────────────────

const formatGroupDate = (dateStr: string) => {
  const date      = new Date(dateStr + "T00:00:00");
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const yesterday = new Date(todayDate);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === todayDate.toDateString()) return t("common.today");
  if (date.toDateString() === yesterday.toDateString())  return t("common.yesterday");

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  }).format(date);
};

const getMoodEmoji  = (mood: string) => MOODS.find((m) => m.value === mood)?.emoji ?? "📝";
const getMoodBgClass = (mood: string) => MOOD_BG[mood] ?? MOOD_BG.okay;
const refreshPrompt  = () => {
  currentPrompt.value = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
};

// ── Meta ───────────────────────────────────────────────────────────────────────

useHead({ title: "Journal — BitOS Space" });
</script>
