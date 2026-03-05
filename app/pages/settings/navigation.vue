<template>
  <div class="max-w-2xl mx-auto px-4 pb-24">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink
        to="/settings"
        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Icon name="heroicons:arrow-left" class="w-5 h-5 text-gray-500" />
      </NuxtLink>
      <div>
        <h1 class="text-lg font-bold text-gray-900 dark:text-white">Navigation & Sidebar</h1>
        <p class="text-xs text-gray-500 dark:text-gray-400">Choose which items appear in your sidebar</p>
      </div>
    </div>

    <!-- Preview strip -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xs p-4 mb-6">
      <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
        Sidebar Preview
      </p>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="item in visibleNavItems"
          :key="item.key"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs font-medium"
        >
          <Icon :name="item.icon" class="w-3.5 h-3.5" />
          {{ item.label }}
        </div>
        <span v-if="visibleNavItems.length === 0" class="text-xs text-gray-400">No items visible</span>
      </div>
    </div>

    <!-- Nav Items List -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xs overflow-hidden mb-4">
      <div
        v-for="(item, index) in ALL_NAV_ITEMS"
        :key="item.key"
        class="flex items-center gap-4 px-4 py-3 transition-colors"
        :class="index < ALL_NAV_ITEMS.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''"
      >
        <!-- Icon -->
        <div
          class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          :class="
            isNavItemVisible(item.key)
              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
              : 'bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
          "
        >
          <Icon :name="item.icon" class="w-5 h-5" />
        </div>

        <!-- Label -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ item.label }}</p>
          <p class="text-xs text-gray-400 dark:text-gray-500">{{ item.to }}</p>
        </div>

        <!-- Required badge / Toggle -->
        <div class="shrink-0">
          <span
            v-if="item.required"
            class="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500"
          >
            <Icon name="heroicons:lock-closed" class="w-3.5 h-3.5" />
            Required
          </span>
          <button
            v-else
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
            :class="
              isNavItemVisible(item.key)
                ? 'bg-gray-300 dark:bg-primary-500'
                : 'bg-gray-200 dark:bg-gray-600'
            "
            @click="toggleNavItem(item.key)"
            :aria-checked="isNavItemVisible(item.key)"
            role="switch"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-green-500 shadow transition-transform"
              :class="isNavItemVisible(item.key) ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Reset button -->
    <button
      class="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      @click="resetNav"
    >
      Reset to defaults
    </button>
  </div>
</template>

<script setup lang="ts">
import { ALL_NAV_ITEMS } from "~/composables/useAppSettings";

useHead({ title: "Navigation Settings" });

const { isNavItemVisible, toggleNavItem, updateSetting } = useAppSettings();

const visibleNavItems = computed(() => ALL_NAV_ITEMS.filter((i) => isNavItemVisible(i.key)));

function resetNav() {
  updateSetting("hiddenNavItems", []);
}
</script>
