<template>
  <div
    class="flex w-full h-full divide-x divide-slate-100 dark:divide-slate-800"
  >
    <aside class="">
      <nav class="space-y-1 w-64 p-4 px-2 sticky top-0">
        <UButton
          v-for="item in items"
          :key="item.label"
          :icon="item.icon"
          color="neutral"
          variant="ghost"
          block
          class="justify-start"
          :to="item.to"
        >
          {{ item.label }}
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
    label: "Nostr Key Management",
    icon: "i-heroicons-key",
    to: "/settings/nostr",
  },
  {
    label: "Privacy Settings",
    icon: "i-heroicons-lock-closed",
    to: "/settings/privacy",
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
