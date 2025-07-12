<template>
  <div class="p-4 max-w-xl w-full">
    <component :is="componentName" />
  </div>
</template>

<script setup lang="ts">
const allowKeys = [
  "profile",
  "keys",
  "relays",
  "interface",
  "preferences",
  "about",
];

import {
  SettingProfile,
  SettingKeys,
  SettingRelays,
  SettingInterface,
  SettingPreferences,
  SettingAbout,
} from "#components";

const componentMap = {
  interface: SettingInterface,
  keys: SettingKeys,
  profile: SettingProfile,
  relays: SettingRelays,
  preferences: SettingPreferences,
  about: SettingAbout,
};

const { id } = useRoute().params;

if (!allowKeys.includes(`${id}`)) {
  navigateTo("/settings");
}

const componentName = computed(
  () => componentMap[id as keyof typeof componentMap]
);
</script>

<style scoped></style>
