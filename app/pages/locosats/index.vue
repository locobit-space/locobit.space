<template>
  <div>
    <CommonContainer>
      <ul class="flex gap-4 flex-wrap my-4">
        <li class="bg-primary-100 p-4 rounded-xl text-primary-600">
          <NuxtLinkLocale to="/locosats/create">
            <Icon name="ic:round-add" class="w-5 h-5" />
            Create
          </NuxtLinkLocale>
        </li>
        <li class="bg-teal-100 p-4 rounded-xl text-teal-600">
          <NuxtLinkLocale to="/locosats/settings">
            <Icon name="ic:round-settings" class="w-5 h-5" />
            Settings
          </NuxtLinkLocale>
        </li>
      </ul>
      <!-- <FinanceAnalytics /> -->
      <FinanceTransactionList />
    </CommonContainer>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped></style>
