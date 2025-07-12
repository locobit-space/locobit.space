<template>
    <div class="">
      <h2 class="text-xl font-semibold">Privacy Settings</h2>
      <div class="space-y-4">
        <UFormField label="Account Visibility" class="block mt-4">
          <USelect
            v-model="privacySettings.visibility"
            :items="[
              { label: 'Public', value: 'public' },
              { label: 'Followers Only', value: 'followers' },
              { label: 'Private', value: 'private' },
            ]"
          />
        </UFormField>
  
        <UFormField label="Relay Preferences" class="mt-4">
          <div class="flex items-center space-x-4">
            <UInput
              v-model="newRelay"
              placeholder="Add relay URL"
              class="flex-grow"
            />
            <UButton color="primary" icon="i-heroicons-plus" @click="addRelay" />
          </div>
  
          <div class="mt-4">
            <div
              v-for="(relay, index) in privacySettings.relays"
              :key="index"
              class="flex items-center justify-between bg-gray-100 dark:bg-slate-800 p-2 rounded mb-2"
            >
              <span>{{ relay }}</span>
              <UButton
                color="error"
                variant="ghost"
                icon="i-heroicons-trash"
                @click="removeRelay(index)"
              />
            </div>
          </div>
        </UFormField>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  const privacySettings = ref({
    visibility: "public",
    relays: ["wss://relay.nostr.band", "wss://relay.damus.io"],
  });
  
  const newRelay = ref("");
  
  function addRelay() {
    if (
      newRelay.value &&
      !privacySettings.value.relays.includes(newRelay.value)
    ) {
      privacySettings.value.relays.push(newRelay.value);
      newRelay.value = "";
    }
  }
  
  function removeRelay(index: number) {
    privacySettings.value.relays.splice(index, 1);
  }
  </script>
  