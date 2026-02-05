<template>
  <div class="pb-20">
    <!-- Header -->
    <div
      class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10"
    >
      <div class="max-w-6xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <NuxtLink
              to="/locosats"
              class="p-2 -ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <Icon name="heroicons:arrow-left" class="w-5 h-5" />
            </NuxtLink>
            <h1
              class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400"
            >
              {{ $t("finance.reports") }}
            </h1>
          </div>
          <UButton variant="solid" @click="exportData">
            <Icon name="heroicons:arrow-down-tray" class="w-4 h-4 mr-2" />
            Export
          </UButton>
        </div>
      </div>
    </div>

    <!-- Time Period Selector -->
    <div class="max-w-6xl mx-auto px-4 py-6">
      <div
        class="bg-white dark:bg-gray-800 p-1.5 rounded-xl inline-flex gap-1 overflow-x-auto max-w-full"
      >
        <button
          v-for="period in periods"
          :key="period.value"
          class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
          :class="
            selectedPeriod === period.value
              ? 'bg-primary-500 text-white'
              : 'text-gray-500 dark:text-gray-400'
          "
          @click="selectedPeriod = period.value"
        >
          {{ period.label }}
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-5xl mx-auto px-4 pb-8 space-y-6">
      <!-- Top Row: Summary & Distribution -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Summary Section (Minimal List Style) -->
        <div
          class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800 h-fit"
        >
          <!-- Balance -->
          <div class="p-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
              >
                <Icon name="heroicons:banknotes" class="w-5 h-5" />
              </div>
              <div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  Net Balance
                </div>
                <div class="font-semibold text-gray-900 dark:text-gray-100">
                  {{ periodStats.balance >= 0 ? "+" : ""
                  }}{{ $n(periodStats.balance) }}
                  <span class="text-xs font-normal text-gray-400">{{
                    finance.settings.value.default_currency
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Income -->
          <div class="p-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
              >
                <Icon name="heroicons:arrow-trending-up" class="w-5 h-5" />
              </div>
              <div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  Income
                </div>
                <div class="font-semibold text-green-600 dark:text-green-400">
                  +{{ $n(periodStats.income) }}
                </div>
              </div>
            </div>
            <div
              class="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-gray-500"
            >
              {{ periodStats.incomeCount }} txns
            </div>
          </div>

          <!-- Expense -->
          <div class="p-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
              >
                <Icon name="heroicons:arrow-trending-down" class="w-5 h-5" />
              </div>
              <div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  Expenses
                </div>
                <div class="font-semibold text-red-600 dark:text-red-400">
                  -{{ $n(periodStats.expenses) }}
                </div>
              </div>
            </div>
            <div
              class="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-gray-500"
            >
              {{ periodStats.expenseCount }} txns
            </div>
          </div>

          <!-- Sats -->
          <div class="p-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
              >
                <Icon name="lets-icons:lightning-fill" class="w-5 h-5" />
              </div>
              <div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  In Satoshis
                </div>
                <div class="font-semibold text-amber-600 dark:text-amber-400">
                  {{ $n(Math.round(periodStats.balanceSats)) }} sats
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Distribution (Pie Chart) -->
        <div
          class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex flex-col h-full"
        >
          <h3
            class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wide"
          >
            Distribution
          </h3>
          <div
            v-if="categoryData.length > 0"
            class="flex-1 min-h-[250px] relative"
          >
            <CommonPieChart :data="categoryData" />
            <!-- Minimal Donut Center Text -->
            <div
              class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            >
              <span class="text-[10px] text-gray-400 uppercase tracking-wider"
                >Total</span
              >
              <span class="text-lg font-bold text-gray-900 dark:text-white">{{
                $n(periodStats.expenses)
              }}</span>
            </div>
          </div>
          <div
            v-else
            class="flex-1 flex items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg min-h-[250px]"
          >
            No data
          </div>
        </div>
      </div>

      <!-- Analysis (Line Chart) - Full Width -->
      <div
        class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
      >
        <div class="flex items-center justify-between mb-6">
          <h3
            class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide"
          >
            Analysis
          </h3>
          <div class="flex items-center gap-3 text-xs text-gray-500">
            <span class="flex items-center gap-1.5"
              ><span class="w-2 h-2 rounded-full bg-green-500"></span>
              Income</span
            >
            <span class="flex items-center gap-1.5"
              ><span class="w-2 h-2 rounded-full bg-red-500"></span>
              Expense</span
            >
          </div>
        </div>

        <div v-if="trendChart.length > 0" class="h-72 w-full">
          <CommonLineChart
            :series="trendChart"
            :option="chartOptions"
            class="h-full"
          />
        </div>
        <div
          v-else
          class="h-72 flex items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
        >
          No data available
        </div>
      </div>

      <!-- Categories List (Settings Style) -->
      <div>
        <h3
          class="px-1 text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide"
        >
          Breakdown
        </h3>
        <div
          class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800"
        >
          <div
            v-for="cat in categoryBreakdown"
            :key="cat.name"
            class="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div class="flex items-center gap-4">
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-700"
              >
                <Icon
                  :name="getCategoryIcon(cat.name)"
                  class="w-5 h-5 text-gray-600 dark:text-gray-300"
                />
              </div>
              <div>
                <div class="font-medium text-gray-900 dark:text-white">
                  {{ cat.name }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ cat.percentage.toFixed(0) }}%
                </div>
              </div>
            </div>
            <div class="text-right">
              <div class="font-medium text-gray-900 dark:text-white">
                {{ $n(cat.amount) }}
              </div>
              <span class="text-xs text-gray-400">{{
                finance.settings.value.default_currency
              }}</span>
            </div>
          </div>
          <div
            v-if="categoryBreakdown.length === 0"
            class="p-8 text-center text-gray-400"
          >
            No expense data for this period
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFinance } from "~/composables/useFinance"; // Ensure explicit import if needed
const finance = useFinance();

// Period selector
const selectedPeriod = ref("month");
const periods = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
  { value: "year", label: "Year" },
];

/**
 * CHART OPTIONS
 * Custom ECharts options for a cleaner look
 */
const chartOptions = {
  grid: {
    top: "15%",
    left: "2%",
    right: "2%",
    bottom: "5%",
    containLabel: true,
  },
  xAxis: [
    {
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { color: "#9CA3AF" }, // gray-400
    },
  ],
  yAxis: [
    {
      splitLine: {
        lineStyle: { type: "dashed", color: "#E5E7EB" }, // gray-200
      },
    },
  ],
  tooltip: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderColor: "#E5E7EB",
    textStyle: { color: "#1F2937" },
    padding: 12,
    borderRadius: 8,
  },
};

// Filter entries by period
const filteredEntries = computed(() => {
  const now = new Date();
  let startDate: Date;

  switch (selectedPeriod.value) {
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "quarter":
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      return finance.entries.value;
  }

  return finance.entries.value.filter(
    (e) => new Date(e.created_at) >= startDate,
  );
});

// Period statistics
const periodStats = computed(() => {
  const income = filteredEntries.value
    .filter((e) => e.type === "income")
    .reduce((sum, e) => sum + e.amount_fiat, 0);

  const expenses = filteredEntries.value
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + e.amount_fiat, 0);

  const incomeSats = filteredEntries.value
    .filter((e) => e.type === "income")
    .reduce((sum, e) => sum + e.amount_sats, 0);

  const expensesSats = filteredEntries.value
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + e.amount_sats, 0);

  return {
    income,
    expenses,
    balance: income - expenses,
    balanceSats: incomeSats - expensesSats,
    incomeCount: filteredEntries.value.filter((e) => e.type === "income")
      .length,
    expenseCount: filteredEntries.value.filter((e) => e.type === "expense")
      .length,
  };
});

// Category data for pie chart
const categoryData = computed(() => {
  const expenses = filteredEntries.value.filter((e) => e.type === "expense");
  const categories: Record<string, number> = {};

  expenses.forEach((e) => {
    categories[e.category] = (categories[e.category] || 0) + e.amount_fiat;
  });

  return Object.entries(categories).map(([name, value]) => ({
    name,
    value: Math.round(value),
  }));
});

// Category breakdown
const categoryBreakdown = computed(() => {
  const expenses = filteredEntries.value.filter((e) => e.type === "expense");
  const total = expenses.reduce((sum, e) => sum + e.amount_fiat, 0);
  const categories: Record<string, number> = {};

  expenses.forEach((e) => {
    categories[e.category] = (categories[e.category] || 0) + e.amount_fiat;
  });

  return Object.entries(categories)
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
});

// Top category
const topCategory = computed(() => {
  return categoryBreakdown.value[0] || null;
});

// Savings rate
const savingsRate = computed(() => {
  if (periodStats.value.income === 0) return 0;
  return (
    ((periodStats.value.income - periodStats.value.expenses) /
      periodStats.value.income) *
    100
  );
});

// Daily average spending
const dailyAverage = computed(() => {
  const days =
    selectedPeriod.value === "week"
      ? 7
      : selectedPeriod.value === "month"
        ? 30
        : selectedPeriod.value === "quarter"
          ? 90
          : selectedPeriod.value === "year"
            ? 365
            : 365;
  return periodStats.value.expenses / days;
});

// Chart Label helper
const getChartLabels = (period: string) => {
  const now = new Date();

  if (period === "week") {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const labels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      labels.push(days[d.getDay()]);
    }
    return labels;
  }

  if (period === "month") {
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
  }

  if (period === "quarter") {
    const quarter = Math.floor(now.getMonth() / 3);
    const startMonth = quarter * 3;
    const allMonths = [
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
    return allMonths.slice(startMonth, startMonth + 3);
  }

  return [
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
};

const trendChart = computed(() => {
  const labels = getChartLabels(selectedPeriod.value);
  const dataMap: Record<string, { income: number; expense: number }> = {};

  // Initialize map
  labels.forEach((label) => {
    dataMap[label] = { income: 0, expense: 0 };
  });

  const now = new Date();

  filteredEntries.value.forEach((e) => {
    const date = new Date(e.created_at);
    let label = "";

    if (selectedPeriod.value === "week") {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      // Only verify it matches one of our labels (simple approach for last 7 days)
      label = days[date.getDay()];
    } else if (selectedPeriod.value === "month") {
      label = date.getDate().toString();
    } else if (selectedPeriod.value === "quarter") {
      const allMonths = [
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
      label = allMonths[date.getMonth()];
    } else {
      const allMonths = [
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
      label = allMonths[date.getMonth()];
    }

    if (dataMap[label]) {
      if (e.type === "income") dataMap[label].income += e.amount_fiat;
      else dataMap[label].expense += e.amount_fiat;
    }
  });

  return [
    {
      name: "Income",
      type: "line",
      smooth: true,
      symbol: "none",
      areaStyle: { opacity: 0.2 },
      data: labels.map((l) => dataMap[l]?.income || 0),
      color: "#22C55E",
      lineStyle: { width: 3 },
    },
    {
      name: "Expense",
      type: "line",
      smooth: true,
      symbol: "none",
      areaStyle: { opacity: 0.2 },
      data: labels.map((l) => dataMap[l]?.expense || 0),
      color: "#EF4444",
      lineStyle: { width: 3 },
    },
  ];
});

// Category styling helpers
const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    Food: "heroicons:cake",
    Groceries: "heroicons:shopping-cart",
    Transport: "heroicons:truck",
    Entertainment: "heroicons:tv",
    Shopping: "heroicons:shopping-bag",
    Bills: "heroicons:document-text",
    Health: "heroicons:heart",
    Salary: "heroicons:banknotes",
    Freelance: "heroicons:computer-desktop",
    Investments: "heroicons:chart-bar-square",
    Other: "heroicons:ellipsis-horizontal-circle",
  };
  return icons[category] || icons.Other;
};

const getCategoryBg = (category: string) => {
  const bgs: Record<string, string> = {
    Food: "bg-orange-100 dark:bg-orange-900/30",
    Groceries: "bg-green-100 dark:bg-green-900/30",
    Transport: "bg-blue-100 dark:bg-blue-900/30",
    Entertainment: "bg-purple-100 dark:bg-purple-900/30",
    Shopping: "bg-pink-100 dark:bg-pink-900/30",
    Bills: "bg-gray-100 dark:bg-gray-700",
    Health: "bg-red-100 dark:bg-red-900/30",
    Salary: "bg-emerald-100 dark:bg-emerald-900/30",
    Freelance: "bg-cyan-100 dark:bg-cyan-900/30",
    Investments: "bg-indigo-100 dark:bg-indigo-900/30",
    Other: "bg-gray-100 dark:bg-gray-700",
  };
  return bgs[category] || bgs.Other;
};

const getCategoryIconColor = (category: string) => {
  const colors: Record<string, string> = {
    Food: "text-orange-600 dark:text-orange-400",
    Groceries: "text-green-600 dark:text-green-400",
    Transport: "text-blue-600 dark:text-blue-400",
    Entertainment: "text-purple-600 dark:text-purple-400",
    Shopping: "text-pink-600 dark:text-pink-400",
    Bills: "text-gray-600 dark:text-gray-400",
    Health: "text-red-600 dark:text-red-400",
    Salary: "text-emerald-600 dark:text-emerald-400",
    Freelance: "text-cyan-600 dark:text-cyan-400",
    Investments: "text-indigo-600 dark:text-indigo-400",
    Other: "text-gray-600 dark:text-gray-400",
  };
  return colors[category] || colors.Other;
};

const progressColors = [
  "bg-primary-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-amber-500",
  "bg-red-500",
  "bg-purple-500",
];

const getCategoryProgressColor = (index: number) => {
  return progressColors[index % progressColors.length];
};

// Export data
const exportData = () => {
  const data = filteredEntries.value.map((e) => ({
    date: e.created_at,
    type: e.type,
    category: e.category,
    amount_fiat: e.amount_fiat,
    amount_sats: e.amount_sats,
    currency: e.fiat_currency,
    note: e.note,
  }));

  const csv = [
    Object.keys(data[0] || {}).join(","),
    ...data.map((row) => Object.values(row).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `locosats-report-${selectedPeriod.value}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// Load data
onMounted(() => {
  finance.loadEntries();
});

useHead({
  title: "Reports - Sats Wallet",
});
</script>
