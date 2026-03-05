<template>
  <div class="space-y-6">
    <!-- ROI Summary cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-center">
        <p class="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">{{ $t('stats.total_cost') }}</p>
        <p class="text-xl font-bold text-red-600 dark:text-red-400">{{ formatCurrency(totalCost) }}</p>
      </div>
      <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-center">
        <p class="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">{{ $t('stats.total_revenue') }}</p>
        <p class="text-xl font-bold text-green-600 dark:text-green-400">{{ formatCurrency(totalRevenue) }}</p>
      </div>
      <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-center">
        <p class="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">{{ $t('stats.net_profit') }}</p>
        <p
          class="text-xl font-bold"
          :class="netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'"
        >
          {{ formatCurrency(netProfit) }}
        </p>
      </div>
      <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-center">
        <p class="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">{{ $t('stats.roi') }}</p>
        <p
          class="text-xl font-bold"
          :class="roi >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'"
        >
          {{ roi >= 0 ? '+' : '' }}{{ roi.toFixed(0) }}%
        </p>
      </div>
    </div>

    <!-- Charts row -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Cost by Activity (pie) -->
      <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ $t('stats.cost_by_activity') }}</span>
        </div>
        <div v-if="costByActivity.length === 0" class="flex items-center justify-center h-40 text-gray-400 text-sm">
          {{ $t('stats.no_cost_data') }}
        </div>
        <CommonPieChart v-else :data="costByActivity" class="h-52 px-2 py-2" />
      </div>

      <!-- Monthly Harvest Revenue (line) -->
      <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ $t('stats.monthly_revenue') }}</span>
        </div>
        <div v-if="monthlyXAxis.length === 0" class="flex items-center justify-center h-40 text-gray-400 text-sm">
          {{ $t('stats.no_harvest_data') }}
        </div>
        <CommonLineChart
          v-else
          :x-axis-data="monthlyXAxis"
          :series="monthlyRevenueSeries"
          class="h-52 px-2 py-2"
        />
      </div>
    </div>

    <!-- Activity summary table -->
    <div
      v-if="activitySummary.length > 0"
      class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
    >
      <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ $t('stats.activity_summary') }}</span>
      </div>
      <div class="divide-y divide-gray-100 dark:divide-gray-800">
        <div
          v-for="item in activitySummary"
          :key="item.activity"
          class="flex items-center justify-between px-5 py-3"
        >
          <div class="flex items-center gap-3">
            <Icon :name="getCareIcon(item.activity)" class="h-4 w-4 text-gray-400" />
            <span class="text-sm text-gray-700 dark:text-gray-300 capitalize">
              {{ $t(`care.activities.${item.activity}`) }}
            </span>
          </div>
          <div class="flex items-center gap-6 text-sm">
            <span class="text-gray-500 dark:text-gray-400">{{ item.count }}× {{ $t('stats.times') }}</span>
            <span v-if="item.cost > 0" class="font-medium text-red-500 dark:text-red-400">
              {{ formatCurrency(item.cost) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="plantCareLogs.length === 0 && plantHarvests.length === 0" class="py-16 text-center">
      <div class="mx-auto w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mb-4">
        <Icon name="lucide:bar-chart-2" class="h-8 w-8 text-purple-400" />
      </div>
      <p class="text-sm font-medium text-gray-600 dark:text-gray-400">{{ $t('stats.no_data') }}</p>
      <p class="text-xs text-gray-400 mt-1">{{ $t('stats.start_logging_for_stats') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ plantId: string; plantingCost?: number }>();
const { t } = useI18n();
const { careLogs, harvests } = useNostrGms();

const plantCareLogs = computed(() =>
  careLogs.value.filter((l) => l.plantId === props.plantId),
);
const plantHarvests = computed(() =>
  harvests.value.filter((h) => h.plantId === props.plantId),
);

/* ─── cost / revenue aggregates ─────────────────────── */
const totalCost = computed(() => {
  const planting = props.plantingCost ?? 0;
  const careCost = plantCareLogs.value.reduce((acc, l) => acc + (l.cost ?? 0), 0);
  return planting + careCost;
});

const totalRevenue = computed(() =>
  plantHarvests.value.reduce((acc, h) => acc + (h.revenue ?? 0), 0),
);

const netProfit = computed(() => totalRevenue.value - totalCost.value);

const roi = computed(() =>
  totalCost.value > 0
    ? ((totalRevenue.value - totalCost.value) / totalCost.value) * 100
    : 0,
);

/* ─── cost by activity (for pie chart) ──────────────── */
const costByActivity = computed(() => {
  const map = new Map<string, number>();
  if ((props.plantingCost ?? 0) > 0) map.set('Planting', props.plantingCost!);
  for (const log of plantCareLogs.value) {
    if (log.cost) {
      const key = t(`care.activities.${log.activity}`);
      map.set(key, (map.get(key) ?? 0) + log.cost);
    }
  }
  return [...map.entries()].map(([name, value]) => ({ name, value }));
});

/* ─── monthly revenue (for line chart) ──────────────── */
const monthlyRevenueSeries = computed(() => {
  const map = new Map<string, number>();
  for (const h of plantHarvests.value) {
    const mo = h.date.substring(0, 7); // YYYY-MM
    map.set(mo, (map.get(mo) ?? 0) + (h.revenue ?? 0));
  }
  const sorted = [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  return [{ name: t('stats.revenue'), data: sorted.map(([, v]) => v), type: 'line', smooth: true }];
});

const monthlyXAxis = computed(() => {
  const map = new Map<string, number>();
  for (const h of plantHarvests.value) {
    const mo = h.date.substring(0, 7);
    map.set(mo, 0);
  }
  return [...map.keys()].sort();
});

/* ─── activity summary table ─────────────────────────── */
const activitySummary = computed(() => {
  const map = new Map<string, { count: number; cost: number }>();
  for (const log of plantCareLogs.value) {
    const existing = map.get(log.activity) ?? { count: 0, cost: 0 };
    map.set(log.activity, { count: existing.count + 1, cost: existing.cost + (log.cost ?? 0) });
  }
  return [...map.entries()]
    .map(([activity, v]) => ({ activity, ...v }))
    .sort((a, b) => b.count - a.count);
});

/* ─── helpers ─────────────────────────────────────────── */
const formatCurrency = (n: number) =>
  new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' }).format(n);

const getCareIcon = (a: string) =>
  ({
    watering: 'lucide:droplets',
    fertilizing: 'lucide:flask-conical',
    pruning: 'lucide:scissors',
    pest_control: 'lucide:bug',
    weeding: 'lucide:shovel',
    mulching: 'lucide:layers',
  })[a as string] || 'lucide:clipboard';
</script>
