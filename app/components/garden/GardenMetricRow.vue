<!-- components/garden/GardenMetricRow.vue — single labelled metric used in telemetry cards -->
<template>
  <div class="flex items-center gap-1.5 text-xs">
    <Icon
      :name="icon"
      :class="[
        'h-3 w-3 shrink-0',
        warn
          ? 'text-yellow-400 dark:text-yellow-400'
          : 'text-gray-500 dark:text-gray-400',
      ]"
    />
    <span class="text-gray-700 dark:text-gray-200 font-medium truncate">
      {{ label }}
    </span>
    <span
      :class="[
        'ml-auto font-medium',
        warn
          ? 'text-yellow-400 dark:text-yellow-400'
          : 'text-gray-800 dark:text-gray-400',
      ]"
      >{{ value }}</span
    >
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
  label: string;
  value: string;
  warn?: boolean;
}>();
</script>
