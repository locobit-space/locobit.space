<template>
  <div>
    <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Expense by Category -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Expenses by Category</h2>
        <div v-if="expensesData.length > 0" class="h-64">
          <PieChart :data="expensesData" />
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
        <div v-if="monthlyData.length > 0" class="h-64">
          <BarChart :data="monthlyData" />
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
          <LineChart :data="balanceData" />
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

const finance = useFinance();

// Prepare data for expense categories pie chart
const expensesData = computed(() => {
  const expenses = finance.entries.value.filter(
    (entry) => entry.type === "expense"
  );

  // Group by tags
  const tagGroups: Record<string, number> = {};

  expenses.forEach((expense) => {
    if (expense.tags.length === 0) {
      // Handle entries with no tags
      tagGroups["Uncategorized"] =
        (tagGroups["Uncategorized"] || 0) + expense.amount_fiat;
    } else {
      // Use the first tag as the category
      const category = expense.tags[0];
      tagGroups[category] = (tagGroups[category] || 0) + expense.amount_fiat;
    }
  });

  // Convert to chart format
  return Object.entries(tagGroups).map(([label, value]) => ({
    label,
    value,
  }));
});

// Prepare monthly income vs expense data
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
