<script setup lang="ts">
const { locale } = useI18n();
</script>
<template>
  <Body :class="locale">
    <UApp>
      <VitePwaManifest />
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UApp>
  </Body>
</template>
