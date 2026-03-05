<template>
  <div class="pb-24">
    <!-- Header -->
    <div
      class="border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10"
    >
      <div class="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        <NuxtLink
          to="/locosats"
          class="text-gray-400 flex items-center hover:text-gray-600 dark:hover:text-gray-200"
        >
          <Icon name="heroicons:arrow-left" class="w-5 h-5" />
        </NuxtLink>
        <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
          Wallet Settings
        </h1>
      </div>
    </div>

    <div class="max-w-2xl mx-auto px-4 py-5">
      <FinanceSetting />
    </div>
  </div>
</template>

<script setup lang="ts">
const finance = useFinance();

onMounted(() => {
  finance.loadEntries();
});

useHead({
  title: "Wallet Settings - BitOS Space",
});
</script>
