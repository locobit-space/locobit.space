<!-- components/garden/GardenKpiCard.vue — compact stat tile -->
<template>
  <div
    class="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 transition-all"
  >
    <div class="flex items-center gap-3">
      <div
        :class="[
          'shrink-0 h-9 w-9 rounded-lg flex items-center justify-center',
          colorBg,
        ]"
      >
        <Icon :name="icon" :class="['h-4 w-4', colorText]" />
      </div>
      <div class="min-w-0">
        <p class="text-xs text-gray-500 truncate">{{ label }}</p>
        <p class="text-xl font-bold text-white leading-tight">{{ value }}</p>
        <p v-if="sub" class="text-xs text-gray-500 truncate">{{ sub }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  color?: string;
}>();

const colorMap: Record<string, { bg: string; text: string }> = {
  green: { bg: "bg-green-500/15", text: "text-green-400" },
  yellow: { bg: "bg-yellow-500/15", text: "text-yellow-400" },
  red: { bg: "bg-red-500/15", text: "text-red-400" },
  blue: { bg: "bg-blue-500/15", text: "text-blue-400" },
  cyan: { bg: "bg-cyan-500/15", text: "text-cyan-400" },
  purple: { bg: "bg-purple-500/15", text: "text-purple-400" },
};

const { bg: colorBg, text: colorText } =
  colorMap[props.color ?? "green"] ?? colorMap.green!;
</script>
