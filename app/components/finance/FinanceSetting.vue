<template>
  <div class="space-y-6">
    <!-- Header -->
    <div
      class="bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 rounded-xl p-6 text-white"
    >
      <div class="flex items-center gap-3 mb-2">
        <div
          class="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
        >
          <Icon name="heroicons:cog-6-tooth" class="w-6 h-6" />
        </div>
        <div>
          <h2 class="text-2xl font-bold">Finance Settings</h2>
          <p class="text-sm text-white/80">Manage your financial preferences</p>
        </div>
      </div>
    </div>

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
          <USelect
            v-model="settings.default_currency"
            :items="currencyOptions"
            size="lg"
            @update:model-value="saveSettings"
          />
          <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            This will be used for all transactions and reports
          </p>
        </div>

        <!-- Default Display Unit -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Default Display Unit
          </label>
          <div class="grid grid-cols-2 gap-3">
            <button
              @click="
                settings.display_unit = 'fiat';
                saveSettings();
              "
              class="p-4 rounded-lg border-2 transition-all"
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
              class="p-4 rounded-lg border-2 transition-all"
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
        <UButton color="primary" size="sm" @click="showAddCategoryModal = true">
          <Icon name="heroicons:plus" class="w-4 h-4 mr-1" />
          Add
        </UButton>
      </div>

      <div class="flex flex-wrap gap-2">
        <div
          v-for="category in settings.categories"
          :key="category"
          class="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg group hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <span class="text-sm text-gray-700 dark:text-gray-300">{{
            category
          }}</span>
          <button
            @click="removeCategory(category)"
            class="text-gray-400 hover:text-red-500 transition-colors"
          >
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

        <UButton
          @click="showImportModal = true"
          class="flex items-center flex-col gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
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
        </UButton>

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

    <!-- Add Category Modal -->
    <UModal
      v-model:open="showAddCategoryModal"
      title="Add Category"
      description="Category"
    >
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Add Category
          </h3>
          <UInput
            v-model="newCategory"
            placeholder="Enter category name"
            size="lg"
            class="w-full"
            @keyup.enter="addCategory"
          />
          <div class="flex gap-3 mt-5">
            <UButton
              color="gray"
              variant="soft"
              block
              @click="showAddCategoryModal = false"
            >
              Cancel
            </UButton>
            <UButton
              color="primary"
              block
              @click="addCategory"
              :disabled="!newCategory.trim()"
            >
              Add Category
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

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
import { ref } from "vue";
import type { UserSettings } from "~/types";

const finance = useFinance();
const toast = useToast();
const settings = ref<UserSettings>({ ...finance.settings.value });

// Modal visibility states
const showImportModal = ref(false);
const showDeleteModal = ref(false);
const showAddCategoryModal = ref(false);
const newCategory = ref("");

// Available currencies
const currencyOptions = finance.currencies.map((c) => ({ label: c, value: c }));

// File upload reference
const importFile = ref<File | null>(null);

// Days since first transaction
const daysSinceFirstTransaction = computed(() => {
  if (finance.entries.value.length === 0) return 0;
  const firstDate = new Date(
    finance.entries.value[finance.entries.value.length - 1].created_at,
  );
  const now = new Date();
  return Math.floor(
    (now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24),
  );
});

// Category management
const addCategory = () => {
  if (!newCategory.value.trim()) return;
  if (!settings.value.categories) settings.value.categories = [];
  if (!settings.value.categories.includes(newCategory.value.trim())) {
    settings.value.categories.push(newCategory.value.trim());
    saveSettings();
    toast.add({
      title: "Category Added",
      description: `${newCategory.value} has been added to your categories.`,
      color: "green",
    });
  }
  newCategory.value = "";
  showAddCategoryModal.value = false;
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

// Save settings
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
