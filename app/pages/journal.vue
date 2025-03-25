<!-- pages/journal.vue -->
<template>
  <div class="container mx-auto py-8">
    <div class="mb-6 text-center">
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
          <UButton to="/login" color="primary">Go to Login</UButton>
        </div>
      </UCard>
    </div>

    <PrivateJournal v-else />
  </div>
</template>

<script setup>
const { user } = useNostr();
</script>
