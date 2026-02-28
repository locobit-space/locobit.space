<template>
  <div class="animate-pulse space-y-4">
    <!-- Avatar Skeleton -->
    <div v-if="showAvatar" class="flex items-center space-x-4">
      <div class="rounded-full bg-gray-200 dark:bg-gray-700 h-10 w-10" />
      <div class="flex-1 space-y-2">
        <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      </div>
    </div>

    <!-- Card Skeleton -->
    <div v-if="type === 'card'" class="space-y-3">
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
    </div>

    <!-- List Skeleton -->
    <div v-else-if="type === 'list'" class="space-y-3">
      <div v-for="i in count" :key="i" class="flex items-center space-x-4">
        <div class="rounded bg-gray-200 dark:bg-gray-700 h-12 w-12" />
        <div class="flex-1 space-y-2">
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        </div>
      </div>
    </div>

    <!-- Note Skeleton -->
    <div v-else-if="type === 'note'" class="space-y-3 p-4 border border-gray-200 dark:border-gray-800 rounded-xl">
      <div class="flex items-center space-x-3">
        <div class="rounded-full bg-gray-200 dark:bg-gray-700 h-10 w-10" />
        <div class="flex-1 space-y-2">
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        </div>
      </div>
      <div class="space-y-2 pt-2">
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
      </div>
    </div>

    <!-- Custom Skeleton -->
    <div v-else class="space-y-3">
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  type?: 'default' | 'card' | 'list' | 'note'
  count?: number
  showAvatar?: boolean
}

withDefaults(defineProps<Props>(), {
  type: 'default',
  count: 3,
  showAvatar: false,
})
</script>
