<script setup lang="ts">
import { defineProps, defineEmits } from "vue";

interface Props {
  value: string;
  label: string;
  icon?: string;
  content?: string;
}

const props = defineProps<{
  modelValue?: string;
  tabs: Props[];
  paddingClass?: string;
}>();

const emit = defineEmits(["update:modelValue"]);

const selectTab = (tab: string) => {
  emit("update:modelValue", tab);
};
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Mobile Dropdown -->
    <div class="sm:hidden" :class="paddingClass">
      <label for="Tab" class="sr-only">Tab</label>
      <select
        :value="modelValue"
        class="w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        @change="selectTab($event?.target?.value || '')"
      >
        <option v-for="tab in tabs" :key="tab.value" :value="tab.value">
          {{ tab.label }}
        </option>
      </select>
    </div>

    <!-- Desktop Tabs -->
    <div class="hidden sm:block">
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="-mb-px flex" aria-label="Tabs">
          <slot name="tab">
            <div
              v-for="tab in tabs"
              :key="tab.value"
              class="inline-flex shrink-0 cursor-default items-center gap-2 border-b-2 p-2 px-4 text-sm font-medium"
              :class="{
                'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-300':
                  modelValue === tab.value,
                'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-200':
                  modelValue !== tab.value,
                [`${paddingClass}`]: true,
              }"
              @click.prevent="selectTab(tab.value)"
            >
              <Icon v-if="tab.icon" :name="tab.icon" size="24" />
              {{ tab.label }}
            </div>
          </slot>
        </nav>
      </div>
    </div>

    <slot name="header" />

    <!-- Tab Content -->
    <div class="h-full flex-grow overflow-y-auto">
      <template v-for="tab in tabs" :key="tab.value">
        <div v-if="modelValue === tab.value" class="dark:prose-invert h-full">
          <slot :name="tab.value">
            {{ tab.content }}
          </slot>
        </div>
      </template>
    </div>
  </div>
</template>
