<template>
  <div class="bg-white dark:bg-transparent rounded-lg">
    <div
      class="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700"
    >
      <h2 class="text-xl font-semibold">Transactions</h2>

      <div class="flex items-center gap-2">
        <!-- Search -->
        <UInput
          v-model="search"
          placeholder="Search transactions"
          icon="i-heroicons-magnifying-glass"
          size="sm"
          class="w-40 md:w-64"
        />

        <!-- Unit Toggle -->
        <UTooltip text="Toggle display unit">
          <UButton
            icon="i-heroicons-arrows-right-left"
            color="gray"
            variant="ghost"
            @click="finance.toggleDisplayUnit"
          />
        </UTooltip>

        <!-- Filters -->
        <UDropdownMenu :items="filterDropdownItems">
          <UButton icon="i-heroicons-funnel" color="gray" variant="ghost" />
        </UDropdownMenu>
      </div>
    </div>

    <!-- Summary Stats -->
    <div
      class="grid grid-cols-3 gap-4 p-4 border-b border-gray-200 dark:border-gray-700"
    >
      <div>
        <div class="text-sm text-gray-500 dark:text-gray-400">Income</div>
        <div class="text-lg font-semibold text-green-600 dark:text-green-400">
          <span v-if="finance.settings.value.display_unit === 'fiat'">
            {{ $n(finance.totals.value.income) }}
            {{ finance.settings.value.default_currency }}
          </span>
          <span v-else>
            {{ $n(Math.round(finance.totals.value.incomeSats)) }}
            sats
          </span>
        </div>
      </div>

      <div>
        <div class="text-sm text-gray-500 dark:text-gray-400">Expenses</div>
        <div class="text-lg font-semibold text-red-600 dark:text-red-400">
          <span v-if="finance.settings.value.display_unit === 'fiat'">
            {{ $n(finance.totals.value.expenses) }}
            {{ finance.settings.value.default_currency }}
          </span>
          <span v-else>
            {{ $n(Math.round(finance.totals.value.expensesSats)) }}
            sats
          </span>
        </div>
      </div>

      <div>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Balance
          <UButton
            icon="mynaui:chevron-down"
            size="sm"
            variant="ghost"
            @click="showChart = !showChart"
          />
        </div>
        <div
          class="text-lg font-semibold"
          :class="
            finance.totals.value.balance >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          "
        >
          <span v-if="finance.settings.value.display_unit === 'fiat'">
            {{ $n(finance.totals.value.balance) }}
            {{ finance.settings.value.default_currency }}
          </span>
          <span v-else>
            {{ $n(Math.round(finance.totals.value.balanceSats)) }}
            sats
          </span>
        </div>
      </div>
    </div>
    <!-- Transactions List -->
    <div class="overflow-x-auto">
      <table class="w-full border-collapse table-auto">
        <thead>
          <tr>
            <!-- <th class="p-3 border-b border-gray-200 text-left font-semibold">
              Type
            </th> -->
            <th
              class="p-3 border-b border-gray-200 dark:border-slate-700 text-left font-semibold"
            >
              Amount
            </th>
            <th
              class="p-3 border-b border-gray-200 dark:border-slate-700 text-left font-semibold"
            >
              Description
            </th>
            <th
              class="p-3 border-b border-gray-200 dark:border-slate-700 text-left font-semibold"
            >
              Tags
            </th>
            <th
              class="p-3 border-b border-gray-200 dark:border-slate-700 text-left font-semibold"
            >
              Date
            </th>
            <th
              class="p-3 border-b border-gray-200 dark:border-slate-700 text-left font-semibold"
            ></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="entry in filteredEntries"
            :key="entry.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <!-- <td class="p-3 border-b border-gray-200">
              {{ entry.type === "income" ? "Income" : "Expense" }}
            </td> -->
            <td
              class="p-3 border-b border-gray-200 dark:border-slate-700 whitespace-nowrap"
            >
              <div
                class="font-medium"
                :class="
                  entry.type === 'income'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                "
              >
                <span v-if="finance.settings.value.display_unit === 'fiat'">
                  {{ entry.type === "income" ? "+" : "-"
                  }}{{ $n(entry.amount_fiat) }} {{ entry.fiat_currency }}
                </span>
                <span v-else>
                  {{ entry.type === "income" ? "+" : "-"
                  }}{{ $n(Math.round(entry.amount_sats)) }} sats
                </span>
              </div>
              <div
                class="text-xs text-gray-500 dark:text-gray-400 dark:border-slate-700"
              >
                <span v-if="finance.settings.value.display_unit === 'fiat'">
                  ≈ {{ $n(Math.round(entry.amount_sats)) }} sats
                </span>
                <span v-else>
                  ≈ {{ $n(entry.amount_fiat) }} {{ entry.fiat_currency }}
                </span>
              </div>
            </td>
            <td class="p-3 border-b border-gray-200 dark:border-slate-700">
              <b>{{ entry.category }}</b>
              <p class="text-sm text-slate-500 dark:text-300">
                <small>{{ entry.note }}</small>
              </p>
            </td>
            <td class="p-3 border-b border-gray-200 dark:border-slate-700">
              <div class="flex flex-wrap gap-1">
                <UBadge
                  v-for="tag in entry.tags"
                  :key="tag"
                  variant="subtle"
                  size="xs"
                >
                  {{ tag }}
                </UBadge>
              </div>
            </td>
            <td
              class="p-3 border-b border-gray-200 whitespace-nowrap dark:border-slate-700"
            >
              <div>{{ formatDate(entry.created_at) }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatTime(entry.created_at) }}
              </div>
            </td>
            <td class="p-3 border-b border-gray-200 dark:border-slate-700">
              <div class="flex items-center gap-2">
                <UTooltip text="Edit">
                  <UButton
                    variant="ghost"
                    icon="i-heroicons-pencil-square"
                    size="sm"
                    @click="editEntry(entry)"
                  />
                </UTooltip>
                <UTooltip text="Delete">
                  <UButton
                    variant="ghost"
                    icon="i-heroicons-trash"
                    size="sm"
                    @click="deleteEntry(entry)"
                  />
                </UTooltip>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div
      v-if="filteredEntries.length === 0"
      class="py-12 flex flex-col items-center justify-center"
    >
      <UIcon
        name="i-heroicons-currency-dollar"
        class="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4"
      />
      <h3 class="text-lg font-medium text-gray-600 dark:text-gray-400">
        No transactions yet
      </h3>
      <p class="text-gray-500 dark:text-gray-500 mt-1">
        Start by adding your first transaction
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UButton } from "#components";
import { ref, computed } from "vue";
import type { FinanceEntry } from "~/types";

const finance = useFinance();

// Filter and search
const search = ref("");
const typeFilter = ref<"all" | "income" | "expense">("all");
const dateFilter = ref<"all" | "today" | "week" | "month">("all");
const showChart = ref(false);
// Filter dropdown items
const filterDropdownItems = computed(() => [
  [
    {
      label: "Type",
      slot: "header",
    },
    {
      label: "All",
      icon: "i-heroicons-check",
      type: "checkbox" as const,
      checked: typeFilter.value === "all",
      onUpdateChecked: () => (typeFilter.value = "all"),
    },
    {
      label: "Income",
      icon:
        typeFilter.value === "income"
          ? "i-heroicons-check"
          : "i-heroicons-arrow-trending-up",
      type: "checkbox" as const,
      checked: typeFilter.value === "income",
      onUpdateChecked: () => (typeFilter.value = "income"),
    },
    {
      label: "Expense",
      icon:
        typeFilter.value === "expense"
          ? "i-heroicons-check"
          : "i-heroicons-arrow-trending-down",
      type: "checkbox" as const,
      checked: typeFilter.value === "expense",
      onUpdateChecked: () => (typeFilter.value = "expense"),
    },
  ],
  [
    {
      label: "Date",
      slot: "header",
    },
    {
      label: "All time",
      icon: dateFilter.value === "all" ? "i-heroicons-check" : null,
      type: "checkbox" as const,
      checked: dateFilter.value === "all",
      onUpdateChecked: () => (dateFilter.value = "all"),
    },
    {
      label: "Today",
      icon: dateFilter.value === "today" ? "i-heroicons-check" : null,
      type: "checkbox" as const,
      checked: dateFilter.value === "today",
      onUpdateChecked: () => (dateFilter.value = "today"),
    },
    {
      label: "This week",
      icon: dateFilter.value === "week" ? "i-heroicons-check" : null,
      type: "checkbox" as const,
      checked: dateFilter.value === "week",
      onUpdateChecked: () => (dateFilter.value = "week"),
    },
    {
      label: "This month",
      icon: dateFilter.value === "month" ? "i-heroicons-check" : null,
      type: "checkbox" as const,
      checked: dateFilter.value === "month",
      onUpdateChecked: () => (dateFilter.value = "month"),
    },
  ],
]);

// Filter entries based on search and filters
const filteredEntries = computed(() => {
  let result = finance.entries.value;

  // Type filter
  if (typeFilter.value !== "all") {
    result = result.filter((entry) => entry.type === typeFilter.value);
  }

  // Date filter
  if (dateFilter.value !== "all") {
    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();
    const weekStart = today - 6 * 24 * 60 * 60 * 1000; // 7 days ago
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    result = result.filter((entry) => {
      const entryDate = new Date(entry.created_at).getTime();
      if (dateFilter.value === "today") {
        return entryDate >= today;
      } else if (dateFilter.value === "week") {
        return entryDate >= weekStart;
      } else if (dateFilter.value === "month") {
        return entryDate >= monthStart;
      }
      return true;
    });
  }

  // Search
  if (search.value) {
    const searchLower = search.value.toLowerCase();
    result = result.filter(
      (entry) =>
        entry.category.toLowerCase().includes(searchLower) ||
        entry.note.toLowerCase().includes(searchLower) ||
        entry.tags.some((tag) => tag.toLowerCase().includes(searchLower))
    );
  }

  return result;
});

// Edit/Delete functions (would be implemented in a real app)
const editEntry = (entry: FinanceEntry) => {
  // Would open a modal or navigate to edit page
  console.log("Edit entry", entry);
};

const deleteEntry = (entry: FinanceEntry) => {
  // Would show confirmation dialog
  if (confirm("Are you sure you want to delete this transaction?")) {
    finance.entries.value = finance.entries.value.filter(
      (e) => e.id !== entry.id
    );
    finance.saveEntries();
  }
};

// Load entries when component mounts
onMounted(() => {
  finance.loadEntries();
});
</script>
