<template>
  <div
    class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
  >
    <dt class="text-sm text-gray-500 dark:text-gray-400">{{ label }}</dt>
    <dd class="text-sm font-medium text-gray-900 dark:text-white text-right">
      {{ value }}
    </dd>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: string }>();
</script>
