<template>
  <div class="text-center py-12 sm:py-16">
    <!-- Icon -->
    <div
      class="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 mb-4 sm:mb-6"
    >
      <Icon
        :name="icon"
        class="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 dark:text-gray-500"
      />
    </div>

    <!-- Title -->
    <h3 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
      {{ title }}
    </h3>

    <!-- Description -->
    <p v-if="description" class="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto px-4">
      {{ description }}
    </p>

    <!-- Actions -->
    <div v-if="$slots.actions || actionText" class="flex justify-center gap-3">
      <slot name="actions">
        <UButton v-if="actionText" :to="actionTo" :icon="actionIcon">
          {{ actionText }}
        </UButton>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description?: string
  icon?: string
  actionText?: string
  actionTo?: string
  actionIcon?: string
}

withDefaults(defineProps<Props>(), {
  icon: 'heroicons:inbox',
  actionIcon: 'heroicons:plus',
})
</script>
