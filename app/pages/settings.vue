<template>
  <div class="flex w-full divide-x divide-slate-100 h-dvh">
    <aside>
      <nav class="space-y-1 w-64 p-4 px-2 h-screen sticky top-0">
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
    <main class="flex-1 flex flex-col overflow-y-scroll">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
const items = [
  {
    label: "Profile",
    icon: "i-heroicons-user-circle",
    to: "/profile",
  },
  {
    label: "Nostr Key Management",
    icon: "i-heroicons-key",
    to: "/nostr",
  },
  {
    label: "Privacy Settings",
    icon: "i-heroicons-lock-closed",
    to: "/privacy",
  },
];
</script>

<style scoped></style>
