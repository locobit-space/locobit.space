<template>
  <div>
    <CommonContainer>
      <ul class="flex gap-4 flex-wrap py-4">
        <li
          class="bg-primary-100 p-4 rounded-xl text-primary-600 dark:bg-gray-700"
        >
          <NuxtLinkLocale to="/locosats/create">
            <Icon name="ic:round-add" size="20" />
            Create
          </NuxtLinkLocale>
        </li>
        <li
          class="bg-primary-100 p-4 rounded-xl text-blue-600 dark:bg-gray-700"
        >
          <NuxtLinkLocale to="/locosats/report">
            <Icon name="material-symbols:bar-chart" size="20" />
            Report
          </NuxtLinkLocale>
        </li>
        <li class="bg-teal-100 p-4 rounded-xl dark:bg-gray-700 text-teal-600">
          <NuxtLinkLocale to="/locosats/settings">
            <Icon name="ic:round-settings" size="20" />
            Settings
          </NuxtLinkLocale>
        </li>
      </ul>
      <FinanceTransactionList />
    </CommonContainer>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: "LocoBit Sats",
});
</script>

<style scoped></style>
