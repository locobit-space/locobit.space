<template>
  <div
    class="flex w-full h-full divide-x divide-slate-100 dark:divide-slate-800"
  >
    <aside class="">
      <nav class="space-y-1 md:w-64 w-auto p-4 px-2 sticky flex flex-col top-0">
        <UButton
          v-for="item in items"
          :key="item.label"
          :icon="item.icon"
          variant="ghost"
          class="justify-start md:w-full text-gray-700 dark:text-gray-200"
          :to="item.to"
          active-class="bg-primary-100 dark:text-white dark:bg-primary-400 text-primary-500"
        >
          <span class="hidden md:block">
            {{ item.label }}
          </span>
        </UButton>
      </nav>
    </aside>
    <main class="flex-1 flex flex-col h-full overflow-y-auto">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
const items = [
  {
    label: "Profile",
    icon: "i-heroicons-user-circle",
    to: "/settings/profile",
  },
  {
    label: "Nostr Keys",
    icon: "i-heroicons-key",
    to: "/settings/keys",
  },
  {
    label: "Relay Settings",
    icon: "system-uicons:server",
    to: "/settings/relays",
  },
  {
    label: "Interface",
    icon: "ri:compasses-2-line",
    to: "/settings/interface",
  },
  {
    label: "Preferences",
    icon: "ri:equalizer-line",
    to: "/settings/preferences",
  },
  {
    label: "About",
    icon: "ri:information-line",
    to: "/settings/about",
  },
];
</script>

<style scoped></style>
