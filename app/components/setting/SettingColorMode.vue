<template>
  <div>
    <ul class="flex gap-4 flex-wrap">
      <li
        v-for="item in items"
        :key="item.value"
        class="flex items-center cursor-pointer flex-1 relative  border border-slate-100 dark:border-slate-800 rounded-xl p-4"
        @click="$colorMode.preference = item.value"
      >
        <Icon :name="item.icon" class="w-5 h-5" />
        <span class="ml-2">{{ item.label }}</span>
        <span>
          <Icon
            v-if="$colorMode.preference === item.value"
            name="ri:check-fill"
            class="absolute right-4 top-4 text-primary-500"
          />
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const items = [
  { label: "Light", value: "light", icon: "ri:moon-line" },
  { label: "Dark", value: "dark", icon: "ri:sun-line" },
  { label: "System", value: "system", icon: "ri:computer-line" },
];

</script>
