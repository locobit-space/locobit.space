<template>
  <div class="mb-6 sm:mb-8">
    <!-- Breadcrumb (optional) -->
    <nav v-if="breadcrumbs?.length" class="flex mb-3" aria-label="Breadcrumb">
      <ol class="flex items-center space-x-2 text-sm">
        <li v-for="(crumb, index) in breadcrumbs" :key="index">
          <NuxtLink
            v-if="crumb.to"
            :to="crumb.to"
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
          >
            {{ crumb.label }}
          </NuxtLink>
          <span v-else class="text-gray-900 dark:text-gray-100">
            {{ crumb.label }}
          </span>
          <Icon
            v-if="index < breadcrumbs.length - 1"
            name="heroicons:chevron-right"
            class="w-4 h-4 text-gray-400"
          />
        </li>
      </ol>
    </nav>

    <!-- Title & Description -->
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div class="flex-1">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {{ title }}
        </h1>
        <p v-if="description" class="text-gray-600 dark:text-gray-400 text-base">
          {{ description }}
        </p>
      </div>

      <!-- Actions slot -->
      <div v-if="$slots.actions" class="flex-shrink-0 flex items-center gap-2">
        <slot name="actions" />
      </div>
    </div>

    <!-- Custom content slot -->
    <slot />
  </div>
</template>

<script setup lang="ts">
interface BreadcrumbItem {
  label: string
  to?: string
}

interface Props {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
}

defineProps<Props>()
</script>
