<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <h2 class="text-xl font-semibold mb-6">Settings</h2>

    <div class="space-y-6">
      <!-- Default Currency -->
      <UFormGroup label="Default Currency">
        <USelect
          v-model="settings.default_currency"
          :options="currencies"
          @update:model-value="saveSettings"
        />
      </UFormGroup>

      <!-- Default Display Unit -->
      <UFormGroup label="Default Display Unit">
        <URadio
          v-model="settings.display_unit"
          value="fiat"
          name="display_unit"
          :label="`Fiat (${settings.default_currency})`"
          @update:model-value="saveSettings"
        />
        <URadio
          v-model="settings.display_unit"
          value="sats"
          name="display_unit"
          label="Satoshis"
          @update:model-value="saveSettings"
        />
      </UFormGroup>

      <!-- Exchange Rate Provider -->
      <UFormGroup label="Exchange Rate Provider">
        <USelect
          v-model="selectedRateProvider"
          :options="rateProviders"
          @update:model-value="saveSettings"
        />
      </UFormGroup>

      <!-- Auto-fetch Exchange Rate -->
      <UFormGroup label="Exchange Rate Updates">
        <UToggle v-model="autoFetchRates" @update:model-value="saveSettings" />
        <span class="text-sm text-gray-500 dark:text-gray-400 ml-2">
          Automatically fetch exchange rates when adding transactions
        </span>
      </UFormGroup>

      <!-- Import/Export -->
      <div>
        <h3 class="text-lg font-semibold mb-2">Data Management</h3>
        <div class="flex flex-wrap gap-2">
          <UButton
            color="blue"
            variant="soft"
            icon="i-heroicons-arrow-down-tray"
            @click="exportData"
          >
            Export Data
          </UButton>

          <UButton
            color="blue"
            variant="soft"
            icon="i-heroicons-arrow-up-tray"
            @click="showImportModal = true"
          >
            Import Data
          </UButton>

          <UButton
            color="red"
            variant="soft"
            icon="i-heroicons-trash"
            @click="confirmClearData"
          >
            Clear All Data
          </UButton>
        </div>
      </div>
    </div>

    <!-- Import Data Modal -->
    <UModal v-model="showImportModal">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Import Data</h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              class="-my-1"
              @click="showImportModal = false"
            />
          </div>
        </template>

        <div class="space-y-4">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Upload a JSON file containing your financial data. This will replace
            your current data.
          </p>

          <UFormGroup label="Upload JSON File">
            <UInput type="file" accept=".json" @change="handleFileUpload" />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="gray"
              variant="soft"
              @click="showImportModal = false"
            >
              Cancel
            </UButton>
            <UButton
              color="primary"
              :disabled="!importFile"
              @click="importData"
            >
              Import
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal v-model="showDeleteModal">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Clear All Data</h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              class="-my-1"
              @click="showDeleteModal = false"
            />
          </div>
        </template>

        <div>
          <p class="text-red-500 font-medium">
            Warning: This action cannot be undone!
          </p>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            This will permanently delete all your financial data. Consider
            exporting your data before clearing.
          </p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="gray"
              variant="soft"
              @click="showDeleteModal = false"
            >
              Cancel
            </UButton>
            <UButton color="red" @click="clearAllData">
              Yes, Delete Everything
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { UserSettings } from "~~/types";

const finance = useFinance();
const settings = ref<UserSettings>({ ...finance.settings.value });

// Modal visibility states
const showImportModal = ref(false);
const showDeleteModal = ref(false);

// Available currencies
const currencies = ["USD", "EUR", "JPY", "GBP", "THB", "BTC"];

// Exchange rate providers (for demonstration)
const rateProviders = ["CoinGecko", "CoinMarketCap", "Binance", "Manual"];
const selectedRateProvider = ref("CoinGecko");

// Auto-fetch rate toggle
const autoFetchRates = ref(true);

// File upload reference
const importFile = ref<File | null>(null);

// Save settings
const saveSettings = () => {
  finance.settings.value = { ...settings.value };
  finance.saveEntries();

  // Show a success notification
  useToast().add({
    title: "Settings Saved",
    description: "Your preferences have been updated.",
    color: "green",
    timeout: 3000,
  });
};

// Export data as JSON file
const exportData = () => {
  const data = {
    entries: finance.entries.value,
    settings: finance.settings.value,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `finance-tracker-export-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  useToast().add({
    title: "Export Completed",
    description: "Your data has been exported successfully.",
    color: "green",
    timeout: 3000,
  });
};

// Handle file upload
const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    importFile.value = target.files[0];
  }
};

// Import data from JSON file (continued)
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

        useToast().add({
          title: "Import Completed",
          description: "Your data has been imported successfully.",
          color: "green",
          timeout: 3000,
        });
      } else {
        throw new Error("Invalid data format");
      }
    } catch (error) {
      useToast().add({
        title: "Import Failed",
        description: "The file format is invalid or corrupted.",
        color: "red",
        timeout: 5000,
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

  useToast().add({
    title: "Data Cleared",
    description: "All your data has been permanently deleted.",
  });
};
</script>
