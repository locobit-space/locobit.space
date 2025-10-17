<template>
  <div>
    <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Expense by Category -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Expenses by Category</h2>
        <div v-if="expensesData.length > 0" class="h-64">
          <CommonPieChart :data="expensesData" />
        </div>
        <div v-else class="h-64 flex items-center justify-center">
          <p class="text-gray-500 dark:text-gray-400">
            No expense data available
          </p>
        </div>
      </div>

      <!-- Income vs Expenses -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Income vs Expenses</h2>
        <div v-if="monthlyDataChart.length > 0" class="h-64">
          <CommonLineChart :series="monthlyDataChart" class="h-full" />
        </div>
        <div v-else class="h-64 flex items-center justify-center">
          <p class="text-gray-500 dark:text-gray-400">
            No monthly data available
          </p>
        </div>
      </div>
    </section>
    <section>
      <!-- Balance Trend -->
      <div
        class="bg-white mt-4 dark:bg-gray-800 rounded-lg shadow p-6 md:col-span-2"
      >
        <h2 class="text-xl font-semibold mb-4">Balance Trend</h2>
        <div v-if="balanceData.length > 0" class="h-64">
          <!-- <LineChart :data="balanceData" /> -->
        </div>
        <div v-else class="h-64 flex items-center justify-center">
          <p class="text-gray-500 dark:text-gray-400">
            No balance data available
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { FinanceEntry } from "~/types";

const finance = useFinance();

const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Prepare data for expense categories pie chart
const expensesData = computed(() => {
  // Filter only expense entries
  const expenses = finance.entries.value.filter(
    (entry: FinanceEntry) => entry.type === "expense"
  );

  // Group by category using satoshis
  const categoryTotals: Record<string, number> = expenses.reduce(
    (acc, expense) => {
      const category = expense.category || "Un categorized";
      const satsAmount = expense.amount_sats || 0;

      acc[category] = (acc[category] || 0) + satsAmount;
      return acc;
    },
    {} as Record<string, number>
  );

  // Convert to pie chart format
  return Object.entries(categoryTotals).map(([category, totalSats]) => ({
    name: category,
    value: Math.round(totalSats), // Round to whole satoshis
    currency: "SATS",
  }));
});

// Current year (based on today's date: Oct 17, 2025)
const currentYear = new Date().getFullYear();
const displayUnit = ref<"fiat" | "sats">("fiat");

const monthlyData = computed(() => {
  const months: Record<
    string,
    { income: number; expense: number; month: string }
  > = {};

  finance.entries.value.forEach((entry) => {
    const date = new Date(entry.created_at);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const monthName = date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });

    if (!months[monthKey]) {
      months[monthKey] = {
        income: 0,
        expense: 0,
        month: monthName,
      };
    }

    if (entry.type === "income") {
      months[monthKey].income += entry.amount_fiat;
    } else {
      months[monthKey].expense += entry.amount_fiat;
    }
  });

  // Convert to array and sort by date
  return Object.entries(months)
    .map(([key, data]) => ({
      month: data.month,
      income: data.income,
      expense: data.expense,
      key,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
});

// Prepare monthly income vs expense data
const monthlyDataChart = computed(() => {
  // Initialize data for all 12 months
  const months: Record<string, { income: number; expense: number }> = {};
  monthLabels.forEach((_, index) => {
    const monthKey = `${currentYear}-${index + 1}`;
    months[monthKey] = { income: 0, expense: 0 };
  });

  // Aggregate entries by month
  finance.entries.value.forEach((entry: FinanceEntry) => {
    try {
      const date = new Date(entry.created_at);
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date in entry: ${entry.created_at}`);
        return;
      }

      // Only process entries for the current year
      if (date.getFullYear() !== currentYear) return;

      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (!months[monthKey]) return; // Skip if monthKey is not in current year

      const amount =
        displayUnit.value === "fiat"
          ? entry.amount_fiat || 0
          : Math.round(entry.amount_sats || 0);

      if (entry.type === "income") {
        months[monthKey].income += amount;
      } else if (entry.type === "expense") {
        months[monthKey].expense += amount;
      }
    } catch (err) {
      console.error(`Error processing entry: ${err}`);
    }
  });

  // Prepare chart data
  return [
    {
      name: "Income",
      type: "bar",
      data: monthLabels.map((_, index) => {
        const monthKey = `${currentYear}-${index + 1}`;
        return months[monthKey]?.income || 0;
      }),
      backgroundColor: "#36A2EB",
    },
    {
      name: "Expense",
      type: "bar",
      data: monthLabels.map((_, index) => {
        const monthKey = `${currentYear}-${index + 1}`;
        return months[monthKey]?.expense || 0;
      }),
      backgroundColor: "#FF6384",
    },
  ];
});

// Calculate balance trend data
const balanceData = computed(() => {
  const months = monthlyData.value;
  let runningBalance = 0;

  return months.map((month) => {
    runningBalance += month.income - month.expense;
    return {
      month: month.month,
      balance: runningBalance,
    };
  });
});
</script>
