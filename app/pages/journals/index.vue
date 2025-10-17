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
      <UCard class="max-w-md mx-auto">
        <div class="text-center py-6">
          <UIcon name="i-heroicons-lock-closed" class="text-4xl mb-4" />
          <h2 class="text-xl font-bold mb-2">Login Required</h2>
          <p class="mb-4">
            Please log in or create an account to use the private journal
            feature
          </p>
        </div>
      </UCard>
    </div>

    <PrivateJournal v-else />
  </div>
</template>

<script setup>
const { user } = useNostrUser();
</script>
