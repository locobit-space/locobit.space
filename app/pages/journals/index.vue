<!-- pages/journal.vue -->
<template>
  <div class="max-w-3xl mx-auto w-full p-4">
    <div class="mb-6">
      <h1 class="text-3xl font-bold mb-2">Your Private Journal</h1>
      <p class="text-gray-600 dark:text-gray-400">
        Your entries are encrypted and only visible to you
      </p>
    </div>

    <div v-if="!user">
      <UAlert
        type="warning"
        variant="outline"
        icon="i-heroicons-lock-closed"
        title="Login Required"
        description="Please log in or create an account to use the private journal feature"
      />
    </div>
    <PrivateJournal v-else />
  </div>
</template>

<script setup>
const { user } = useNostrUser();

useHead({
  title: "Journal",
});
</script>
