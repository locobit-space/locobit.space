<template>
  <div class="min-h-screen pb-24">
    <!-- Header -->
    <div
      class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10"
    >
      <div class="max-w-4xl mx-auto px-4 py-3">
        <div class="flex items-center gap-3">
          <NuxtLink
            to="/locosats"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <Icon name="heroicons:arrow-left" class="w-5 h-5" />
          </NuxtLink>
          <h1 class="text-lg font-semibold text-gray-900 dark:text-white flex-1">
            All Transactions
          </h1>
          <span class="text-xs text-gray-400">
            {{ filteredTransactions.length }} of {{ finance.entries.value.length }}
          </span>
        </div>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-4 py-4 space-y-4">

      <!-- Search + Filter Bar -->
      <div class="space-y-3">
        <UInput
          v-model="searchQuery"
          type="text"
          :placeholder="$t('common.search') + ' transactions...'"
          icon="heroicons:magnifying-glass"
          class="w-full"
        />

        <!-- Type tabs -->
        <div class="flex gap-2">
          <button
            v-for="tab in typeTabs"
            :key="tab.value"
            @click="typeFilter = tab.value"
            class="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
            :class="
              typeFilter === tab.value
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            "
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Category chips -->
        <div class="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <button
            @click="categoryFilter = ''"
            class="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
            :class="
              !categoryFilter
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
            "
          >
            All
          </button>
          <button
            v-for="cat in availableCategories"
            :key="cat"
            @click="categoryFilter = categoryFilter === cat ? '' : cat"
            class="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
            :class="
              categoryFilter === cat
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
            "
          >
            {{ cat }}
          </button>
        </div>

        <!-- Sort + date range row -->
        <div class="flex items-center gap-2">
          <div class="flex-1 flex items-center gap-2">
            <Icon name="heroicons:calendar-days" class="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <UInput v-model="dateFrom" type="date" size="xs" class="w-full" placeholder="From" />
            <span class="text-gray-400 text-xs">–</span>
            <UInput v-model="dateTo" type="date" size="xs" class="w-full" placeholder="To" />
          </div>
          <select
            v-model="sortBy"
            class="text-xs bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-gray-600 dark:text-gray-300 focus:outline-none"
          >
            <option value="date_desc">Newest</option>
            <option value="date_asc">Oldest</option>
            <option value="amount_desc">Amount ↓</option>
            <option value="amount_asc">Amount ↑</option>
          </select>
          <button
            v-if="hasFilters"
            @click="clearFilters"
            class="text-xs text-red-500 hover:text-red-600 whitespace-nowrap"
          >
            Clear
          </button>
        </div>
      </div>

      <!-- Summary strip -->
      <div
        v-if="filteredTransactions.length"
        class="grid grid-cols-3 gap-2 text-center"
      >
        <div class="bg-white dark:bg-gray-900 rounded-xl p-2.5 border border-gray-100 dark:border-gray-800">
          <p class="text-xs text-gray-400 mb-0.5">Income</p>
          <p class="text-sm font-semibold text-green-500">
            +{{ $n(summaryIncome) }}
          </p>
        </div>
        <div class="bg-white dark:bg-gray-900 rounded-xl p-2.5 border border-gray-100 dark:border-gray-800">
          <p class="text-xs text-gray-400 mb-0.5">Expenses</p>
          <p class="text-sm font-semibold text-red-500">
            -{{ $n(summaryExpenses) }}
          </p>
        </div>
        <div class="bg-white dark:bg-gray-900 rounded-xl p-2.5 border border-gray-100 dark:border-gray-800">
          <p class="text-xs text-gray-400 mb-0.5">Net</p>
          <p
            class="text-sm font-semibold"
            :class="(summaryIncome - summaryExpenses) >= 0 ? 'text-green-500' : 'text-red-500'"
          >
            {{ summaryIncome - summaryExpenses >= 0 ? '+' : '' }}{{ $n(summaryIncome - summaryExpenses) }}
          </p>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div v-if="finance.isLoading.value" class="space-y-3">
        <div
          v-for="i in 5"
          :key="i"
          class="animate-pulse flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl p-3.5 border border-gray-100 dark:border-gray-800"
        >
          <div class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0"></div>
          <div class="flex-1 space-y-2">
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            <div class="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-1/3"></div>
          </div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>
      </div>

      <!-- Transaction list -->
      <div
        v-else-if="paginatedTransactions.length"
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
      >
        <!-- Group by date -->
        <template v-for="group in groupedTransactions" :key="group.date">
          <!-- Date header -->
          <div
            class="px-4 py-2 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800"
          >
            <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {{ group.label }}
            </span>
            <span class="text-xs text-gray-400 ml-2">
              {{ group.entries.length }} transaction{{ group.entries.length !== 1 ? 's' : '' }}
            </span>
          </div>

          <!-- Entries -->
          <div
            v-for="entry in group.entries"
            :key="entry.id"
            class="flex items-center gap-3 p-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all cursor-pointer active:scale-[0.99] border-b border-gray-50 dark:border-gray-800 last:border-0"
            @click="openDetail(entry)"
          >
            <!-- Category icon -->
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              :class="getCategoryBg(entry.category)"
            >
              <Icon
                :name="getCategoryIcon(entry.category)"
                class="w-5 h-5"
                :class="getCategoryIconColor(entry.category)"
              />
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ entry.note || entry.category }}
                </p>
                <span
                  v-if="!entry.synced"
                  class="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400"
                  title="Not synced to Nostr"
                ></span>
              </div>
              <div class="flex items-center gap-2 mt-0.5">
                <span
                  class="text-xs px-1.5 py-0.5 rounded-md"
                  :class="getCategoryBg(entry.category)"
                >
                  <span :class="getCategoryIconColor(entry.category)">{{ entry.category }}</span>
                </span>
                <span v-if="entry.tags?.length" class="text-xs text-gray-400 truncate">
                  {{ entry.tags.slice(0, 2).map(t => '#' + t).join(' ') }}
                </span>
              </div>
            </div>

            <!-- Amount -->
            <div class="text-right shrink-0">
              <p
                class="text-sm font-semibold"
                :class="entry.type === 'income' ? 'text-green-500' : 'text-red-500'"
              >
                {{ entry.type === 'income' ? '+' : '-' }}{{ $n(entry.amount_fiat) }}
                <span class="text-xs font-normal">{{ entry.fiat_currency }}</span>
              </p>
              <p class="text-xs text-gray-400">
                {{ $n(Math.round(entry.amount_sats)) }} sats
              </p>
            </div>
          </div>
        </template>
      </div>

      <!-- Empty state -->
      <div v-else class="py-16 text-center">
        <div
          class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
        >
          <Icon name="heroicons:banknotes" class="w-8 h-8 text-gray-400" />
        </div>
        <h3 class="text-base font-medium text-gray-900 dark:text-white mb-2">
          {{ hasFilters ? "No matching transactions" : $t("finance.no_transactions") }}
        </h3>
        <p class="text-sm text-gray-500 mb-4">
          {{ hasFilters ? "Try adjusting your filters." : $t("finance.no_transactions_desc") }}
        </p>
        <UButton v-if="hasFilters" variant="outline" size="sm" @click="clearFilters">
          Clear filters
        </UButton>
        <NuxtLink v-else to="/locosats/create">
          <UButton color="primary" size="md">
            <Icon name="heroicons:plus" class="w-4 h-4 mr-2" />
            {{ $t("finance.add_first") }}
          </UButton>
        </NuxtLink>
      </div>

      <!-- Pagination -->
      <div
        v-if="filteredTransactions.length > pageSize"
        class="flex items-center justify-between pt-2"
      >
        <button
          @click="page--"
          :disabled="page === 1"
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
        >
          <Icon name="heroicons:chevron-left" class="w-3.5 h-3.5" />
          Previous
        </button>
        <span class="text-xs text-gray-400">
          Page {{ page }} of {{ totalPages }}
        </span>
        <button
          @click="page++"
          :disabled="page >= totalPages"
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
        >
          Next
          <Icon name="heroicons:chevron-right" class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Transaction Detail Modal -->
    <UModal
      v-model:open="showDetailModal"
      title="Transaction Detail"
      description="View transaction details"
    >
      <template #content>
        <div v-if="selectedEntry" class="p-6">
          <!-- Header -->
          <div class="flex items-start justify-between mb-5">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-xl flex items-center justify-center"
                :class="getCategoryBg(selectedEntry.category)"
              >
                <Icon
                  :name="getCategoryIcon(selectedEntry.category)"
                  class="w-6 h-6"
                  :class="getCategoryIconColor(selectedEntry.category)"
                />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ selectedEntry.note || selectedEntry.category }}
                </h3>
                <p class="text-xs text-gray-500">
                  {{ new Date(selectedEntry.created_at).toLocaleString() }}
                </p>
              </div>
            </div>
            <button
              @click="showDetailModal = false"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <Icon name="heroicons:x-mark" class="w-5 h-5" />
            </button>
          </div>

          <div class="space-y-4 mb-6">
            <!-- Amount -->
            <div>
              <label class="text-xs text-gray-500 dark:text-gray-400 block mb-1">Amount</label>
              <div
                class="text-3xl font-bold"
                :class="selectedEntry.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
              >
                {{ selectedEntry.type === 'income' ? '+' : '-' }}
                {{ $n(selectedEntry.amount_fiat) }} {{ selectedEntry.fiat_currency }}
              </div>
              <p class="text-sm text-gray-500 mt-1">
                ≈ {{ $n(Math.round(selectedEntry.amount_sats)) }} sats
              </p>
            </div>

            <!-- Category & Type -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-gray-500 dark:text-gray-400 block mb-1">Category</label>
                <p class="text-sm text-gray-700 dark:text-gray-300">{{ selectedEntry.category }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500 dark:text-gray-400 block mb-1">Type</label>
                <span
                  class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                  :class="selectedEntry.type === 'income' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'"
                >
                  <Icon :name="selectedEntry.type === 'income' ? 'heroicons:arrow-down-left' : 'heroicons:arrow-up-right'" class="w-3 h-3" />
                  {{ selectedEntry.type === 'income' ? $t('finance.income') : $t('finance.expense') }}
                </span>
              </div>
            </div>

            <!-- Note -->
            <div v-if="selectedEntry.note">
              <label class="text-xs text-gray-500 dark:text-gray-400 block mb-1">Note</label>
              <p class="text-sm text-gray-700 dark:text-gray-300">{{ selectedEntry.note }}</p>
            </div>

            <!-- Tags -->
            <div v-if="selectedEntry.tags?.length">
              <label class="text-xs text-gray-500 dark:text-gray-400 block mb-1.5">Tags</label>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="tag in selectedEntry.tags"
                  :key="tag"
                  class="text-xs px-2 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg"
                >
                  #{{ tag }}
                </span>
              </div>
            </div>

            <!-- Rate -->
            <div>
              <label class="text-xs text-gray-500 dark:text-gray-400 block mb-1">Exchange Rate</label>
              <p class="text-sm text-gray-700 dark:text-gray-300">
                {{ selectedEntry.sats_per_fiat }} sats / {{ selectedEntry.fiat_currency }}
              </p>
            </div>

            <!-- Sync status -->
            <div>
              <label class="text-xs text-gray-500 dark:text-gray-400 block mb-1">Sync Status</label>
              <span
                class="inline-flex items-center gap-1 text-xs"
                :class="selectedEntry.synced ? 'text-green-500' : 'text-amber-500'"
              >
                <Icon :name="selectedEntry.synced ? 'heroicons:check-circle' : 'heroicons:clock'" class="w-3.5 h-3.5" />
                {{ selectedEntry.synced ? 'Synced to Nostr' : 'Pending sync' }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex w-full gap-2">
            <UButton
              color="gray"
              variant="soft"
              block
              @click="editHandler(selectedEntry.id)"
            >
              <Icon name="heroicons:pencil" class="w-4 h-4 mr-2" />
              Edit
            </UButton>
            <UButton
              color="red"
              variant="soft"
              block
              @click="deleteHandler(selectedEntry.id)"
            >
              <Icon name="heroicons:trash" class="w-4 h-4 mr-2" />
              Delete
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- FAB -->
    <NuxtLink
      to="/locosats/create"
      class="fixed bottom-16 right-6 w-14 h-14 rounded-full bg-linear-to-br from-primary-500 to-primary-600 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center z-50 active:scale-95"
    >
      <Icon name="heroicons:plus" class="w-7 h-7" />
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import type { FinanceEntry } from "~/types";

const finance = useFinance();
const router = useRouter();
const toast = useToast();

// Filters
const searchQuery = ref("");
const typeFilter = ref<"all" | "income" | "expense">("all");
const categoryFilter = ref("");
const dateFrom = ref("");
const dateTo = ref("");
const sortBy = ref<"date_desc" | "date_asc" | "amount_desc" | "amount_asc">("date_desc");

// Pagination
const page = ref(1);
const pageSize = 25;

// Detail modal
const showDetailModal = ref(false);
const selectedEntry = ref<FinanceEntry | null>(null);

const typeTabs = [
  { label: "All", value: "all" as const },
  { label: "Income", value: "income" as const },
  { label: "Expense", value: "expense" as const },
];

const availableCategories = computed(() => {
  const cats = new Set(finance.entries.value.map((e) => e.category));
  return [...cats].sort();
});

const hasFilters = computed(
  () => !!(searchQuery.value || typeFilter.value !== "all" || categoryFilter.value || dateFrom.value || dateTo.value),
);

const clearFilters = () => {
  searchQuery.value = "";
  typeFilter.value = "all";
  categoryFilter.value = "";
  dateFrom.value = "";
  dateTo.value = "";
  page.value = 1;
};

// Reset page when filters change
watch([searchQuery, typeFilter, categoryFilter, dateFrom, dateTo, sortBy], () => {
  page.value = 1;
});

const filteredTransactions = computed(() => {
  let list = [...finance.entries.value];

  if (typeFilter.value !== "all") {
    list = list.filter((e) => e.type === typeFilter.value);
  }

  if (categoryFilter.value) {
    list = list.filter((e) => e.category === categoryFilter.value);
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(
      (e) =>
        e.note.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.tags?.some((t) => t.toLowerCase().includes(q)),
    );
  }

  if (dateFrom.value) {
    const from = new Date(dateFrom.value);
    list = list.filter((e) => new Date(e.created_at) >= from);
  }

  if (dateTo.value) {
    const to = new Date(dateTo.value);
    to.setHours(23, 59, 59, 999);
    list = list.filter((e) => new Date(e.created_at) <= to);
  }

  // Sort
  list.sort((a, b) => {
    if (sortBy.value === "date_desc") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy.value === "date_asc") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy.value === "amount_desc") return b.amount_fiat - a.amount_fiat;
    if (sortBy.value === "amount_asc") return a.amount_fiat - b.amount_fiat;
    return 0;
  });

  return list;
});

const totalPages = computed(() => Math.ceil(filteredTransactions.value.length / pageSize));

const paginatedTransactions = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filteredTransactions.value.slice(start, start + pageSize);
});

// Group by date label
const groupedTransactions = computed(() => {
  const groups: Map<string, { date: string; label: string; entries: FinanceEntry[] }> = new Map();
  const now = new Date();

  for (const entry of paginatedTransactions.value) {
    const d = new Date(entry.created_at);
    const dateKey = d.toISOString().split("T")[0] as string;

    if (!groups.has(dateKey)) {
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      let label: string;
      if (diffDays === 0) label = "Today";
      else if (diffDays === 1) label = "Yesterday";
      else if (diffDays < 7) label = d.toLocaleDateString(undefined, { weekday: "long" });
      else label = d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: diffDays > 365 ? "numeric" : undefined });

      groups.set(dateKey, { date: dateKey, label, entries: [] });
    }
    groups.get(dateKey)!.entries.push(entry);
  }

  return [...groups.values()];
});

// Summary for filtered results
const summaryIncome = computed(() =>
  filteredTransactions.value.filter((e) => e.type === "income").reduce((s, e) => s + e.amount_fiat, 0),
);
const summaryExpenses = computed(() =>
  filteredTransactions.value.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount_fiat, 0),
);

// Detail modal
const openDetail = (entry: FinanceEntry) => {
  selectedEntry.value = entry;
  showDetailModal.value = true;
};

const editHandler = (id: string) => {
  router.push(`/locosats/${id}/edit`);
  showDetailModal.value = false;
};

const deleteHandler = async (id: string) => {
  if (!confirm("Delete this transaction?")) return;
  try {
    finance.deleteEntry(id);
    showDetailModal.value = false;
    toast.add({ title: "Deleted", description: "Transaction removed successfully" });
  } catch {
    toast.add({ title: "Error", description: "Failed to delete transaction", color: "red" });
  }
};

// Category styling helpers
const getCategoryIcon = (category: string) => {
  const m: Record<string, string> = {
    Food: "heroicons:cake", Groceries: "heroicons:shopping-cart",
    Transport: "heroicons:truck", Entertainment: "heroicons:tv",
    Shopping: "heroicons:shopping-bag", Bills: "heroicons:document-text",
    Health: "heroicons:heart", Salary: "heroicons:banknotes",
    Freelance: "heroicons:computer-desktop", Investments: "heroicons:arrow-trending-up",
    Education: "heroicons:academic-cap", Travel: "heroicons:globe-alt",
    Family: "heroicons:users", Other: "heroicons:ellipsis-horizontal-circle",
  };
  return m[category] ?? m.Other;
};

const getCategoryBg = (category: string) => {
  const m: Record<string, string> = {
    Food: "bg-orange-50 dark:bg-orange-900/20", Groceries: "bg-green-50 dark:bg-green-900/20",
    Transport: "bg-blue-50 dark:bg-blue-900/20", Entertainment: "bg-purple-50 dark:bg-purple-900/20",
    Shopping: "bg-pink-50 dark:bg-pink-900/20", Bills: "bg-gray-100 dark:bg-gray-800",
    Health: "bg-red-50 dark:bg-red-900/20", Salary: "bg-emerald-50 dark:bg-emerald-900/20",
    Freelance: "bg-cyan-50 dark:bg-cyan-900/20", Investments: "bg-teal-50 dark:bg-teal-900/20",
    Education: "bg-indigo-50 dark:bg-indigo-900/20", Travel: "bg-sky-50 dark:bg-sky-900/20",
    Family: "bg-rose-50 dark:bg-rose-900/20", Other: "bg-gray-100 dark:bg-gray-800",
  };
  return m[category] ?? m.Other;
};

const getCategoryIconColor = (category: string) => {
  const m: Record<string, string> = {
    Food: "text-orange-600 dark:text-orange-400", Groceries: "text-green-600 dark:text-green-400",
    Transport: "text-blue-600 dark:text-blue-400", Entertainment: "text-purple-600 dark:text-purple-400",
    Shopping: "text-pink-600 dark:text-pink-400", Bills: "text-gray-600 dark:text-gray-400",
    Health: "text-red-600 dark:text-red-400", Salary: "text-emerald-600 dark:text-emerald-400",
    Freelance: "text-cyan-600 dark:text-cyan-400", Investments: "text-teal-600 dark:text-teal-400",
    Education: "text-indigo-600 dark:text-indigo-400", Travel: "text-sky-600 dark:text-sky-400",
    Family: "text-rose-600 dark:text-rose-400", Other: "text-gray-600 dark:text-gray-400",
  };
  return m[category] ?? m.Other;
};

onMounted(() => {
  finance.loadEntries();
});

useHead({ title: "All Transactions - Sats Wallet" });
</script>
