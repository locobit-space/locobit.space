<template>
  <div class="space-y-6">
    <!-- General Settings -->
    <div
      class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
    >
      <h3
        class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"
      >
        <Icon
          name="heroicons:adjustments-horizontal"
          class="w-5 h-5 text-primary-500"
        />
        General Settings
      </h3>

      <div class="space-y-5">
        <!-- Default Currency -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Default Currency
          </label>

          <!-- Searchable currency picker -->
          <div ref="currencyPickerRef">
            <!-- Trigger -->
            <button
              ref="currencyTriggerRef"
              type="button"
              @click="toggleCurrencyPicker"
              class="w-full flex items-center justify-between px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              :class="showCurrencyPicker ? 'border-primary-400 ring-2 ring-primary-500' : ''"
            >
              <span class="flex items-center gap-2">
                <span class="font-mono font-semibold text-primary-600 dark:text-primary-400 text-sm">
                  {{ settings.default_currency }}
                </span>
                <span class="text-gray-600 dark:text-gray-300">
                  {{ getCurrencyDisplayName(settings.default_currency) }}
                </span>
              </span>
              <Icon
                name="heroicons:chevron-up-down"
                class="w-4 h-4 text-gray-400 shrink-0"
                :class="showCurrencyPicker ? 'rotate-180' : ''"
              />
            </button>

            <!-- Dropdown rendered at body level to escape stacking contexts -->
            <Teleport to="body">
              <div
                v-if="showCurrencyPicker"
                ref="currencyDropdownRef"
                :style="dropdownStyle"
                class="fixed border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden"
              >
                <!-- Search -->
                <div class="p-2 border-b border-gray-100 dark:border-gray-700">
                  <UInput
                    v-model="currencySearch"
                    placeholder="Search currency or country…"
                    size="sm"
                    class="w-full"
                    autofocus
                  >
                    <template #leading>
                      <Icon name="heroicons:magnifying-glass" class="w-4 h-4 text-gray-400" />
                    </template>
                  </UInput>
                </div>
                <!-- List -->
                <ul class="max-h-60 overflow-y-auto py-1">
                  <li v-if="filteredCurrencies.length === 0" class="px-3 py-2 text-xs text-gray-400 text-center">
                    No currencies found
                  </li>
                  <li
                    v-for="c in filteredCurrencies"
                    :key="c.code"
                    @mousedown.prevent="selectCurrency(c.code)"
                    class="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    :class="settings.default_currency === c.code ? 'bg-primary-50 dark:bg-primary-900/30' : ''"
                  >
                    <span class="font-mono text-xs font-semibold w-10 shrink-0"
                      :class="settings.default_currency === c.code ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500'"
                    >{{ c.code }}</span>
                    <span class="text-sm text-gray-700 dark:text-gray-200">{{ c.name }}</span>
                    <span class="ml-auto text-xs text-gray-400">{{ c.symbol }}</span>
                    <Icon
                      v-if="settings.default_currency === c.code"
                      name="heroicons:check"
                      class="w-4 h-4 text-primary-500 shrink-0"
                    />
                  </li>
                </ul>
              </div>
            </Teleport>
          </div>

          <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            {{ filteredCurrencies.length || finance.currencies.length }} currencies supported · rate fetched live from blockchain.info
          </p>
        </div>

        <!-- Default Display Unit -->
        <div>
          <label
            class="block text-sm font-medium z-0 text-gray-700 dark:text-gray-300 mb-2"
          >
            Default Display Unit
          </label>
          <div class="grid grid-cols-2 z-0 gap-3">
            <button
              @click="
                settings.display_unit = 'fiat';
                saveSettings();
              "
              class="p-4 rounded-lg z-0 border-2 transition-all"
              :class="
                settings.display_unit === 'fiat'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              "
            >
              <Icon
                name="heroicons:currency-dollar"
                class="w-6 h-6 mx-auto mb-2"
                :class="
                  settings.display_unit === 'fiat'
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-400'
                "
              />
              <p
                class="text-sm font-medium"
                :class="
                  settings.display_unit === 'fiat'
                    ? 'text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-400'
                "
              >
                Fiat Currency
              </p>
            </button>
            <button
              @click="
                settings.display_unit = 'sats';
                saveSettings();
              "
              class="p-4 rounded-lg z-0 border-2 transition-all"
              :class="
                settings.display_unit === 'sats'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              "
            >
              <Icon
                name="lets-icons:lightning-light"
                class="w-6 h-6 mx-auto mb-2"
                :class="
                  settings.display_unit === 'sats'
                    ? 'text-amber-500'
                    : 'text-gray-400'
                "
              />
              <p
                class="text-sm font-medium"
                :class="
                  settings.display_unit === 'sats'
                    ? 'text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-400'
                "
              >
                Satoshis
              </p>
            </button>
          </div>
        </div>

        <!-- Auto-sync -->
        <div
          class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
        >
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <Icon name="heroicons:arrow-path" class="w-4 h-4 text-gray-500" />
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Auto-sync with Nostr
              </p>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Automatically sync transactions every 5 minutes
            </p>
          </div>
          <USwitch
            v-model="settings.auto_sync"
            @update:model-value="saveSettings"
          />
        </div>

        <!-- Show Balance on Tab -->
        <div
          class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
        >
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <Icon name="heroicons:eye" class="w-4 h-4 text-gray-500" />
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Show Balance on Tab
              </p>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Display balance in browser tab title
            </p>
          </div>
          <USwitch
            v-model="settings.show_balance_on_tab"
            @update:model-value="saveSettings"
          />
        </div>
      </div>
    </div>

    <!-- Categories Management -->
    <div
      class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
    >
      <div class="flex items-center justify-between mb-4">
        <h3
          class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"
        >
          <Icon name="heroicons:tag" class="w-5 h-5 text-primary-500" />
          Categories
        </h3>
        <div class="flex gap-2">
          <UButton size="sm" color="primary" variant="soft" @click="showInlineAdd = true">
            <Icon name="heroicons:plus" class="w-4 h-4 mr-1" />
            Add
          </UButton>
          <UButton size="sm" color="gray" variant="soft" @click="restoreDefaults">
            <Icon name="heroicons:arrow-path" class="w-4 h-4 mr-1" />
            Restore
          </UButton>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 mt-4">
        <div
          v-for="category in settings.categories"
          :key="category"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg group hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          :class="isDefaultCategory(category) ? 'bg-gray-100 dark:bg-gray-800' : 'bg-violet-50 dark:bg-violet-900/30'"
        >
          <div
            class="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
            :class="getCategoryMetaLocal(category).bg"
          >
            <Icon
              :name="getCategoryMetaLocal(category).icon"
              class="w-3 h-3"
              :class="getCategoryMetaLocal(category).color"
            />
          </div>
          <span class="text-sm text-gray-700 dark:text-gray-300">{{ category }}</span>
          <span
            v-if="!isDefaultCategory(category)"
            class="text-xs px-1 py-0.5 rounded bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 font-medium leading-none"
          >custom</span>
          <button
            @click="removeCategory(category)"
            class="text-gray-300 hover:text-red-500 transition-colors ml-0.5"
          >
            <Icon name="heroicons:x-mark" class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Quick-add inline -->
        <div v-if="showInlineAdd" class="flex items-center gap-1.5">
          <UInput
            v-model="newCategory"
            placeholder="Category name"
            size="xs"
            class="w-36"
            autofocus
            @keyup.enter="addCategory"
            @keyup.escape="showInlineAdd = false; newCategory = ''"
          />
          <UButton size="xs" color="primary" :disabled="!newCategory.trim()" @click="addCategory">Add</UButton>
          <button @click="showInlineAdd = false; newCategory = ''" class="text-gray-400 hover:text-gray-600">
            <Icon name="heroicons:x-mark" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Data Management -->
    <div
      class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
    >
      <h3
        class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"
      >
        <Icon
          name="heroicons:cloud-arrow-down"
          class="w-5 h-5 text-primary-500"
        />
        Data Management
      </h3>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          @click="exportData('csv')"
          class="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
        >
          <div
            class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors"
          >
            <Icon
              name="heroicons:document-arrow-down"
              class="w-5 h-5 text-blue-600 dark:text-blue-400"
            />
          </div>
          <div class="flex-1 text-left">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              Export CSV
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Download as spreadsheet
            </p>
          </div>
        </button>

        <button
          @click="exportData('json')"
          class="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
        >
          <div
            class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors"
          >
            <Icon
              name="heroicons:code-bracket"
              class="w-5 h-5 text-green-600 dark:text-green-400"
            />
          </div>
          <div class="flex-1 text-left">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              Export JSON
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Complete backup file
            </p>
          </div>
        </button>

        <button
          @click="showImportModal = true"
          class="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
        >
          <div
            class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors"
          >
            <Icon
              name="heroicons:arrow-up-tray"
              class="w-5 h-5 text-purple-600 dark:text-purple-400"
            />
          </div>
          <div class="flex-1 text-left">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              Import Data
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Restore from backup
            </p>
          </div>
        </button>

        <button
          @click="confirmClearData"
          class="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors group"
        >
          <div
            class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors"
          >
            <Icon
              name="heroicons:trash"
              class="w-5 h-5 text-red-600 dark:text-red-400"
            />
          </div>
          <div class="flex-1 text-left">
            <p class="text-sm font-medium text-red-700 dark:text-red-300">
              Clear All Data
            </p>
            <p class="text-xs text-red-500 dark:text-red-400">
              Permanent deletion
            </p>
          </div>
        </button>
      </div>

      <!-- Stats -->
      <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="text-center">
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ finance.entries.value.length }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Transactions
            </p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ settings.budgets?.length || 0 }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Budgets</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ settings.categories?.length || 0 }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Categories
            </p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ daysSinceFirstTransaction }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Days Active
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Import Data Modal -->
    <UModal
      v-model:open="showImportModal"
      title="Import Data"
      description="Import your financial data from a JSON file."
    >
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Import Data
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Upload a JSON file containing your financial data. This will merge
            with your current data.
          </p>

          <div
            class="border-2 flex items-center flex-col justify-center border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-primary-500 dark:hover:border-primary-400 transition-colors"
          >
            <Icon
              name="heroicons:cloud-arrow-up"
              class="w-12 h-12 mx-auto mb-3 text-gray-400"
            />
            <label class="cursor-pointer">
              <span
                class="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                Choose a file
              </span>
              <input
                type="file"
                accept=".json"
                class="hidden"
                @change="handleFileUpload"
              />
            </label>
            <p
              v-if="importFile"
              class="text-sm text-gray-600 dark:text-gray-400 mt-2"
            >
              Selected: {{ importFile.name }}
            </p>
          </div>

          <div class="flex gap-3 mt-5">
            <UButton
              color="gray"
              variant="soft"
              block
              @click="showImportModal = false"
            >
              Cancel
            </UButton>
            <UButton
              color="primary"
              block
              :disabled="!importFile"
              @click="importData"
            >
              Import
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal
      v-model:open="showDeleteModal"
      title="Clear All Data?"
      description="Warning: This action cannot be undone!"
    >
      <template #content>
        <div class="p-6">
          <div
            class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4"
          >
            <Icon
              name="heroicons:exclamation-triangle"
              class="w-6 h-6 text-red-600 dark:text-red-400"
            />
          </div>
          <h3
            class="text-lg font-semibold text-center text-gray-900 dark:text-white mb-2"
          >
            Clear All Data?
          </h3>
          <p
            class="text-center text-red-600 dark:text-red-400 text-sm font-medium mb-2"
          >
            Warning: This action cannot be undone!
          </p>
          <p class="text-center text-gray-600 dark:text-gray-400 text-sm mb-6">
            This will permanently delete all your financial data. Consider
            exporting your data before clearing.
          </p>

          <div class="flex gap-3">
            <UButton
              color="gray"
              variant="soft"
              block
              @click="showDeleteModal = false"
            >
              Cancel
            </UButton>
            <UButton color="red" block @click="clearAllData">
              Yes, Delete Everything
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import type { UserSettings } from "~/types";

const finance = useFinance();
const toast = useToast();

// Keep local ref in sync with finance.settings (e.g. after a Nostr sync merges new defaults)
const settings = ref<UserSettings>({ ...finance.settings.value });
watch(
  () => finance.settings.value,
  (v) => { settings.value = { ...v }; },
  { deep: true },
);

// Modal / inline-add visibility
const showImportModal = ref(false);
const showDeleteModal = ref(false);
const showAddCategoryModal = ref(false);
const showInlineAdd = ref(false);
const newCategory = ref("");

// Available currencies
const currencyOptions = finance.currencies.map((c) => ({ label: `${c.code} – ${c.name}`, value: c.code }));

// Searchable currency picker
const showCurrencyPicker = ref(false);
const currencySearch = ref("");
const currencyPickerRef = ref<HTMLElement | null>(null);
const currencyTriggerRef = ref<HTMLElement | null>(null);
const currencyDropdownRef = ref<HTMLElement | null>(null);
const dropdownStyle = ref<Record<string, string>>({});

const colorMode = useColorMode();

const updateDropdownPosition = () => {
  if (!currencyTriggerRef.value) return;
  const rect = currencyTriggerRef.value.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const dropdownHeight = 320; // approx max-h
  const openUpward = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
  const isDark = colorMode.value === "dark";
  dropdownStyle.value = {
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    zIndex: "9999",
    backgroundColor: isDark ? "#111827" : "#ffffff",
    ...(openUpward
      ? { bottom: `${window.innerHeight - rect.top + 4}px` }
      : { top: `${rect.bottom + 4}px` }),
  };
};

const toggleCurrencyPicker = () => {
  showCurrencyPicker.value = !showCurrencyPicker.value;
  if (showCurrencyPicker.value) {
    nextTick(updateDropdownPosition);
  }
};

const filteredCurrencies = computed(() => {
  const q = currencySearch.value.trim().toLowerCase();
  if (!q) return finance.currencies;
  return finance.currencies.filter(
    (c) =>
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q),
  );
});

const getCurrencyDisplayName = (code: string) =>
  finance.currencies.find((c) => c.code === code)?.name ?? code;

const selectCurrency = (code: string) => {
  settings.value.default_currency = code;
  showCurrencyPicker.value = false;
  currencySearch.value = "";
  saveSettings();
};

// Close picker when clicking outside (trigger or teleported dropdown)
const handleOutsideClick = (e: MouseEvent) => {
  const target = e.target as Node;
  const insideTrigger = currencyPickerRef.value?.contains(target);
  const insideDropdown = currencyDropdownRef.value?.contains(target);
  if (!insideTrigger && !insideDropdown) {
    showCurrencyPicker.value = false;
  }
};
onMounted(() => {
  document.addEventListener("mousedown", handleOutsideClick);
  window.addEventListener("scroll", updateDropdownPosition, true);
  window.addEventListener("resize", updateDropdownPosition);
});
onUnmounted(() => {
  document.removeEventListener("mousedown", handleOutsideClick);
  window.removeEventListener("scroll", updateDropdownPosition, true);
  window.removeEventListener("resize", updateDropdownPosition);
});

// File upload reference
const importFile = ref<File | null>(null);

// Category helpers
const getCategoryMetaLocal = (category: string) => getCategoryMeta(category);
const isDefaultCategory = (category: string) => DEFAULT_CATEGORIES.includes(category);

// Days since first transaction
const daysSinceFirstTransaction = computed(() => {
  const last = finance.entries.value.at(-1);
  if (!last) return 0;
  const firstDate = new Date(last.created_at);
  const now = new Date();
  return Math.floor(
    (now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24),
  );
});

// Category management
const addCategory = () => {
  if (!newCategory.value.trim()) return;
  if (!settings.value.categories) settings.value.categories = [];
  const name = newCategory.value.trim();
  if (!settings.value.categories.includes(name)) {
    settings.value.categories.push(name);
    saveSettings();
    toast.add({
      title: "Category Added",
      description: `${name} has been added to your categories.`,
      color: "green",
    });
  }
  newCategory.value = "";
  showAddCategoryModal.value = false;
  showInlineAdd.value = false;
};

const removeCategory = (category: string) => {
  if (!settings.value.categories) return;
  settings.value.categories = settings.value.categories.filter(
    (c) => c !== category,
  );
  saveSettings();
  toast.add({
    title: "Category Removed",
    description: `${category} has been removed.`,
  });
};

const restoreDefaults = () => {
  if (!settings.value.categories) settings.value.categories = [];
  const missing = DEFAULT_CATEGORIES.filter(
    (c) => !settings.value.categories!.includes(c),
  );
  if (missing.length === 0) {
    toast.add({ title: "Already complete", description: "All default categories are present." });
    return;
  }
  settings.value.categories.push(...missing);
  saveSettings();
  toast.add({
    title: "Defaults Restored",
    description: `Added ${missing.length} missing default categor${missing.length === 1 ? "y" : "ies"}.`,
    color: "green",
  });
};

// Save settings — syncs local ref back to composable state + localStorage
const saveSettings = () => {
  finance.settings.value = { ...settings.value };
  finance.saveSettings();

  toast.add({
    title: "Settings Saved",
    description: "Your preferences have been updated.",
    color: "green",
  });
};

// Export data as JSON or CSV file
const exportData = (type = "json" as "json" | "csv") => {
  const data = {
    entries: finance.entries.value,
    settings: finance.settings.value,
  };

  if (type === "csv") {
    const entriesArray = Array.isArray(data.entries) ? data.entries : [];
    let rows: string[] = [];

    if (entriesArray.length > 0) {
      rows = [
        Object.keys((entriesArray[0] ?? {}) as Record<string, any>).join(","),
        ...entriesArray.map((entry) =>
          Object.values(entry as Record<string, any>)
            .map((v) =>
              typeof v === "string" && (v.includes(",") || v.includes('"'))
                ? `"${v.replace(/"/g, '""')}"`
                : String(v),
            )
            .join(","),
        ),
      ];
    }

    const csv = `data:text/csv;charset=utf-8,${rows.join("\n")}`;
    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "locosats-export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.add({
      title: "Export Completed",
      description: "Your data has been exported successfully.",
      color: "green",
    });
    return;
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `locosats-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  toast.add({
    title: "Export Completed",
    description: "Your data has been exported successfully.",
    color: "green",
  });
};

// Handle file upload
const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    importFile.value = target.files[0] as File;
  }
};

// Import data from JSON file
const importData = () => {
  if (!importFile.value) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const data = JSON.parse(content);

      if (data.entries && Array.isArray(data.entries)) {
        finance.entries.value = data.entries;

        if (data.settings) {
          finance.settings.value = data.settings;
          settings.value = { ...data.settings };
        }

        finance.saveEntries();

        showImportModal.value = false;
        importFile.value = null;

        toast.add({
          title: "Import Completed",
          description: "Your data has been imported successfully.",
          color: "green",
        });
      } else {
        throw new Error("Invalid data format");
      }
    } catch (error) {
      toast.add({
        title: "Import Failed",
        description: "The file format is invalid or corrupted.",
        color: "red",
      });
    }
  };

  reader.readAsText(importFile.value);
};

// Show delete confirmation modal
const confirmClearData = () => {
  showDeleteModal.value = true;
};

// Clear all data
const clearAllData = () => {
  finance.entries.value = [];
  finance.saveEntries();
  showDeleteModal.value = false;

  toast.add({
    title: "Data Cleared",
    description: "All your data has been permanently deleted.",
  });
};
</script>
