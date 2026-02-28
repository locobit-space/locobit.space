<template>
  <div class="h-full bg-gray-50 flex flex-col dark:bg-gray-950">
    <!-- Header -->
    <div
      class="border-b border-gray-200 dark:border-gray-800 shrink-0 bg-gray-50 dark:bg-gray-950"
    >
      <div class="max-w-2xl mx-auto px-4 py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button
              @click="$router.back()"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <Icon name="heroicons:arrow-left" class="w-5 h-5" />
            </button>
            <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
              Edit Transaction
            </h1>
          </div>
          <button
            @click="confirmDelete"
            class="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Icon name="heroicons:trash" class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Not Found -->
    <div v-if="!entry" class="flex-1 flex items-center justify-center p-8">
      <div class="text-center">
        <Icon name="heroicons:exclamation-circle" class="w-12 h-12 text-gray-300 mb-3 mx-auto" />
        <p class="text-gray-500">Transaction not found.</p>
        <NuxtLink to="/locosats" class="text-primary-500 text-sm mt-2 inline-block">← Back to Wallet</NuxtLink>
      </div>
    </div>

    <!-- Scrollable Content -->
    <div v-else class="flex-1 overflow-y-auto">
      <div class="max-w-2xl mx-auto px-4 py-5">
        <!-- Type Toggle -->
        <div
          class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-1.5 mb-5"
        >
          <div class="grid grid-cols-2 gap-1.5">
            <button
              @click="form.type = 'expense'"
              class="py-2.5 px-4 rounded-lg text-sm font-medium transition-all"
              :class="
                form.type === 'expense'
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
              "
            >
              <Icon
                name="heroicons:arrow-up-right"
                class="w-4 h-4 inline mr-1.5"
              />
              {{ $t("finance.expense") }}
            </button>
            <button
              @click="form.type = 'income'"
              class="py-2.5 px-4 rounded-lg text-sm font-medium transition-all"
              :class="
                form.type === 'income'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
              "
            >
              <Icon
                name="heroicons:arrow-down-left"
                class="w-4 h-4 inline mr-1.5"
              />
              {{ $t("finance.income") }}
            </button>
          </div>
        </div>

        <!-- Amount Section -->
        <div
          class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 mb-5"
        >
          <label class="text-xs text-gray-500 dark:text-gray-400 mb-2 block">
            {{ $t("finance.amount") }}
          </label>
          <div class="flex items-center gap-3">
            <div class="flex-1 relative">
              <input
                v-model="amount"
                type="number"
                inputmode="decimal"
                class="w-full text-3xl sm:text-4xl font-bold p-0 border-0 bg-transparent focus:ring-0 outline-none"
                :class="
                  form.type === 'income'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                "
                placeholder="0"
              />
            </div>
            <button
              @click="toggleUnit"
              class="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
            >
              {{
                form.unit_input === "fiat"
                  ? finance.settings.value.default_currency
                  : "sats"
              }}
            </button>
          </div>

          <!-- Conversion -->
          <div
            v-if="amount && Number(amount) > 0"
            class="mt-1.5 text-xs text-gray-400"
          >
            ≈ {{ conversionDisplay }}
          </div>
        </div>

        <!-- Category Section -->
        <div
          class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 mb-5"
        >
          <label
            class="text-xs text-gray-500 dark:text-gray-400 mb-2.5 block"
            >{{ $t("finance.category") }}</label
          >
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="cat in categories"
              :key="cat.name"
              @click="form.category = cat.name"
              class="flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all relative overflow-hidden group"
              :class="[
                form.category === cat.name
                  ? 'bg-primary-50 dark:bg-primary-900/30 ring-2 ring-primary-500 dark:ring-primary-400'
                  : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700',
              ]"
            >
              <div
                v-if="form.category === cat.name"
                class="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary-500"
              ></div>
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center transition-transform"
                :class="[
                  cat.bg,
                  form.category === cat.name
                    ? 'scale-110'
                    : 'group-hover:scale-105',
                ]"
              >
                <Icon :name="cat.icon" class="w-5 h-5" :class="cat.color" />
              </div>
              <span
                class="text-xs font-medium truncate w-full text-center"
                :class="
                  form.category === cat.name
                    ? 'text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300'
                "
                >{{ cat.name }}</span
              >
            </button>
          </div>

          <!-- Quick-add custom category -->
          <div class="mt-3 flex gap-2">
            <UInput
              v-model="customCategory"
              placeholder="Add new category to settings…"
              size="sm"
              class="flex-1"
              @keyup.enter="addCustomCategory"
            />
            <UButton size="sm" color="primary" variant="soft" :disabled="!customCategory.trim()" @click="addCustomCategory">
              <Icon name="heroicons:plus" class="w-4 h-4" />
            </UButton>
          </div>
        </div>

        <!-- Details Section -->
        <div
          class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 mb-5 space-y-3.5"
        >
          <!-- Note -->
          <div>
            <label
              class="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block"
              >{{ $t("finance.note") }}</label
            >
            <UInput
              v-model="form.note"
              :placeholder="$t('finance.note_placeholder')"
              size="md"
              class="w-full"
            />
          </div>

          <!-- Tags -->
          <div>
            <label
              class="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block"
            >
              Tags
            </label>
            <UInputTags
              v-model="form.tags"
              placeholder="Add tags..."
              class="w-full"
            />
          </div>

          <!-- Date -->
          <div>
            <label
              class="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block"
            >
              {{ $t("common.date") }}
            </label>
            <UInput v-model="form.date" type="date" :max="today" size="md" />
          </div>

          <!-- Original entry info -->
          <div class="pt-2 border-t border-gray-100 dark:border-gray-800">
            <p class="text-xs text-gray-400">
              ID: {{ entry.id }} ·
              Created: {{ new Date(entry.created_at).toLocaleString() }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Action Bar -->
    <div v-if="entry" class="md:mb-0 mb-2">
      <div class="max-w-2xl px-4 py-2 mx-auto">
        <UButton
          color="primary"
          size="xl"
          block
          :loading="isSubmitting"
          :disabled="!amount || Number(amount) <= 0"
          @click="handleSubmit"
        >
          <Icon name="heroicons:check" class="w-5 h-5 mr-2" />
          Save Changes
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FinanceEntry } from "~/types";

const router = useRouter();
const route = useRoute();
const finance = useFinance();
const toast = useToast();

const today = new Date().toISOString().split("T")[0];
const id = route.params.id as string;

// Find the entry
const entry = computed(() =>
  finance.entries.value.find((e) => e.id === id) ?? null,
);

// Form state – seeded from the existing entry
const form = ref({
  type: "expense" as "income" | "expense",
  category: "Other",
  note: "",
  tags: [] as string[],
  unit_input: "fiat" as "fiat" | "sats",
  date: today,
});

const amount = ref<number | string>("");
const isSubmitting = ref(false);

// Populate form when entry is available (handles async loading)
watch(
  entry,
  (e) => {
    if (!e) return;
    form.value = {
      type: e.type,
      category: e.category,
      note: e.note || "",
      tags: [...(e.tags || [])],
      unit_input: e.unit_input || "fiat",
      date: e.created_at.split("T")[0],
    };
    amount.value =
      e.unit_input === "sats" ? e.amount_sats : e.amount_fiat;
  },
  { immediate: true },
);

// Categories — built from settings (includes user-added custom ones) + metadata fallback
const categories = computed(() =>
  (finance.settings.value.categories ?? []).map((name) => ({
    name,
    ...getCategoryMeta(name),
  }))
);

const customCategory = ref("");

// Quick-add a custom category to settings and select it
const addCustomCategory = () => {
  const name = customCategory.value.trim();
  if (!name) return;
  if (!finance.settings.value.categories) finance.settings.value.categories = [];
  if (!finance.settings.value.categories.includes(name)) {
    finance.settings.value.categories.push(name);
    finance.saveSettings();
  }
  form.value.category = name;
  customCategory.value = "";
};

const toggleUnit = () => {
  form.value.unit_input = form.value.unit_input === "fiat" ? "sats" : "fiat";
};

const conversionDisplay = computed(() => {
  if (!amount.value || Number(amount.value) <= 0) return "";
  const val = Number(amount.value);
  if (form.value.unit_input === "fiat") {
    const sats = Math.round(val * finance.currentExchangeRate.value);
    return `${sats.toLocaleString()} sats`;
  } else {
    const fiat = (val / finance.currentExchangeRate.value).toFixed(2);
    return `${fiat} ${finance.settings.value.default_currency}`;
  }
});

const handleSubmit = async () => {
  if (!amount.value || Number(amount.value) <= 0 || !entry.value) return;

  isSubmitting.value = true;
  try {
    const updated: FinanceEntry = {
      ...entry.value,
      type: form.value.type,
      category: form.value.category,
      note: form.value.note || form.value.category,
      tags: form.value.tags.length ? form.value.tags : [form.value.category.toLowerCase()],
      unit_input: form.value.unit_input,
      amount_fiat: form.value.unit_input === "fiat" ? Number(amount.value) : entry.value.amount_fiat,
      amount_sats: form.value.unit_input === "sats" ? Number(amount.value) : entry.value.amount_sats,
    };

    await finance.editEntry(id, updated);

    toast.add({
      title: "Saved",
      description: "Transaction updated successfully",
      color: "green",
    });

    router.push("/locosats");
  } catch (error) {
    console.error(error);
    toast.add({ title: "Error", description: "Failed to save changes", color: "red" });
  } finally {
    isSubmitting.value = false;
  }
};

const confirmDelete = async () => {
  if (!confirm("Delete this transaction? This cannot be undone.")) return;
  try {
    finance.deleteEntry(id);
    toast.add({ title: "Deleted", description: "Transaction removed", color: "green" });
    router.push("/locosats");
  } catch {
    toast.add({ title: "Error", description: "Failed to delete transaction", color: "red" });
  }
};

onMounted(() => {
  finance.fetchExchangeRate();
});

useHead({ title: "Edit Transaction - Sats Wallet" });
</script>
