<template>
  <div>
    <h2 class="text-xl font-semibold">Profile Settings</h2>

    <div class="space-y-4 flex flex-col">
      <UFormField label="Display Name" class="mt-4">
        <UInput
          v-model="profileSettings.displayName"
          placeholder="Your display name"
          icon="i-heroicons-user-circle" class="w-full"
        />
      </UFormField>

      <UFormField label="Username">
        <UInput
          v-model="profileSettings.username"
          placeholder="Choose a username"
          icon="i-heroicons-at-symbol" class="w-full"
        />
      </UFormField>

      <UFormField label="Bio">
        <UTextarea
          v-model="profileSettings.bio"
          placeholder="Tell us about yourself"
          :rows="3" class="w-full"
        />
      </UFormField>

      <UFormField label="Profile Picture">
        <div class="flex items-center justify-between space-x-4">
          <UAvatar
            :src="profileSettings.avatarUrl"
            size="xl"
            alt="Profile Picture"
          />
          <UButton
            color="primary"
            variant="outline"
            label="Upload Picture"
            icon="i-heroicons-photo-up"
            @click="openImageUpload"
          />
        </div>
      </UFormField>
    </div>

    <div class="flex justify-end space-x-4 mt-6">
      <UButton color="neutral" label="Cancel" @click="cancelChanges" />
      <UButton
        color="primary"
        label="Save Changes"
        icon="i-heroicons-check"
        @click="saveSettings"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const profileSettings = ref({
  displayName: "",
  username: "",
  bio: "",
  avatarUrl: "",
});

const keySettings = ref({
  publicKey: "",
  privateKey: "",
});

function openImageUpload() {
  // Implement image upload logic
  console.log("Open image upload");
}

function saveSettings() {
  // Implement save logic
  console.log("Saving settings", {
    profileSettings: profileSettings.value,
    keySettings: keySettings.value,
  });
}

function cancelChanges() {
  // Reset or navigate away
  console.log("Cancelling changes");
}
</script>
