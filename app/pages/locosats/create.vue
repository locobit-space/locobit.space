<template>
  <div class="h-full bg-gray-50 flex flex-col dark:bg-gray-950">
    <!-- Header -->
    <div
      class="border-b border-gray-200 dark:border-gray-800 shrink-0 bg-gray-50 dark:bg-gray-950"
    >
      <div class="max-w-2xl mx-auto px-4 py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <NuxtLink
              to="/locosats"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <Icon name="heroicons:arrow-left" class="w-5 h-5" />
            </NuxtLink>
            <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ $t("finance.add_expense") }}
            </h1>
          </div>
        </div>
      </div>
    </div>

    <!-- Scrollable Content -->
    <div class="flex-1 overflow-y-auto">
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
                autofocus
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

          <!-- Quick Amounts -->
          <div class="mt-3 flex flex-wrap gap-1.5">
            <button
              v-for="quickAmount in quickAmounts"
              :key="quickAmount"
              @click="amount = quickAmount"
              class="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
            >
              {{ $n(quickAmount) }}
            </button>
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
              <!-- Selected Indicator -->
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

          <!-- Custom Category Input for "Other" -->
          <div v-if="form.category === 'Other'" class="mt-3">
            <UInput
              v-model="customCategory"
              :placeholder="
                $t('finance.custom_category_placeholder') ||
                'Enter custom category...'
              "
              size="sm"
            />
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
        </div>
      </div>
    </div>

    <!-- Bottom Action Bar -->
    <div class="md:mb-0 mb-2">
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
          {{
            form.type === "income"
              ? $t("finance.add_income")
              : $t("finance.add_expense")
          }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();
const route = useRoute();
const finance = useFinance();
const toast = useToast();

const today = new Date().toISOString().split("T")[0];

// Get type from query parameter
const initialType = (route.query.type === "income" ? "income" : "expense") as
  | "income"
  | "expense";

const form = ref({
  type: initialType,
  category: initialType === "income" ? "Salary" : "Food",
  note: "",
  tags: [] as string[],
  unit_input: "fiat" as "fiat" | "sats",
  date: today,
});

const amount = ref<number | string>("");
const customCategory = ref("");
const isSubmitting = ref(false);

// Quick amounts based on currency
const quickAmounts = computed(() => {
  if (form.value.unit_input === "sats") {
    return [1000, 5000, 10000, 21000, 50000, 100000];
  }
  // For LAK
  if (finance.settings.value.default_currency === "LAK") {
    return [10000, 20000, 50000, 100000, 200000, 500000];
  }
  // For USD
  return [5, 10, 20, 50, 100, 200];
});

// Categories with icons
const categories = [
  {
    name: "Food",
    icon: "heroicons:cake",
    bg: "bg-orange-50 dark:bg-orange-900/30",
    color: "text-orange-600 dark:text-orange-400",
  },
  {
    name: "Groceries",
    icon: "heroicons:shopping-cart",
    bg: "bg-green-50 dark:bg-green-900/30",
    color: "text-green-600 dark:text-green-400",
  },
  {
    name: "Transport",
    icon: "heroicons:truck",
    bg: "bg-blue-50 dark:bg-blue-900/30",
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    name: "Shopping",
    icon: "heroicons:shopping-bag",
    bg: "bg-pink-50 dark:bg-pink-900/30",
    color: "text-pink-600 dark:text-pink-400",
  },
  {
    name: "Entertainment",
    icon: "heroicons:tv",
    bg: "bg-purple-50 dark:bg-purple-900/30",
    color: "text-purple-600 dark:text-purple-400",
  },
  {
    name: "Bills",
    icon: "heroicons:document-text",
    bg: "bg-gray-50 dark:bg-gray-800",
    color: "text-gray-600 dark:text-gray-400",
  },
  {
    name: "Health",
    icon: "heroicons:heart",
    bg: "bg-red-50 dark:bg-red-900/30",
    color: "text-red-600 dark:text-red-400",
  },
  {
    name: "Investments",
    icon: "heroicons:arrow-trending-up",
    bg: "bg-teal-50 dark:bg-teal-900/30",
    color: "text-teal-600 dark:text-teal-400",
  },
  {
    name: "Education",
    icon: "heroicons:academic-cap",
    bg: "bg-indigo-50 dark:bg-indigo-900/30",
    color: "text-indigo-600 dark:text-indigo-400",
  },
  {
    name: "Travel",
    icon: "heroicons:globe-alt",
    bg: "bg-sky-50 dark:bg-sky-900/30",
    color: "text-sky-600 dark:text-sky-400",
  },
  {
    name: "Family",
    icon: "heroicons:users",
    bg: "bg-rose-50 dark:bg-rose-900/30",
    color: "text-rose-600 dark:text-rose-400",
  },
  {
    name: "Salary",
    icon: "heroicons:banknotes",
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    color: "text-emerald-600 dark:text-emerald-400",
  },
  {
    name: "Freelance",
    icon: "heroicons:computer-desktop",
    bg: "bg-cyan-50 dark:bg-cyan-900/30",
    color: "text-cyan-600 dark:text-cyan-400",
  },
  {
    name: "Other",
    icon: "heroicons:ellipsis-horizontal-circle",
    bg: "bg-gray-50 dark:bg-gray-800",
    color: "text-gray-600 dark:text-gray-400",
  },
];

// Toggle unit
const toggleUnit = () => {
  form.value.unit_input = form.value.unit_input === "fiat" ? "sats" : "fiat";
};

// Conversion display
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

// Submit handler
const handleSubmit = async () => {
  if (!amount.value || Number(amount.value) <= 0) return;

  isSubmitting.value = true;
  try {
    await finance.addEntry({
      type: form.value.type,
      category: form.value.category,
      amount_fiat: form.value.unit_input === "fiat" ? Number(amount.value) : 0,
      amount_sats: form.value.unit_input === "sats" ? Number(amount.value) : 0,
      unit_input: form.value.unit_input,
      fiat_currency: finance.settings.value.default_currency,
      sats_per_fiat: finance.currentExchangeRate.value,
      note: form.value.note || form.value.category,
      tags: form.value.tags.length
        ? form.value.tags
        : [form.value.category.toLowerCase()],
      visibility: "private",
      user_id: "",
    });

    toast.add({
      title: "Success",
      description: `${form.value.type === "income" ? "Income" : "Expense"} added successfully`,
      color: "green",
    });

    router.push("/locosats");
  } catch (error) {
    console.error(error);
  } finally {
    isSubmitting.value = false;
  }
};

// Load exchange rate on mount
onMounted(() => {
  finance.fetchExchangeRate();
});

useHead({
  title: "Add Transaction - Sats Wallet",
});
</script>
