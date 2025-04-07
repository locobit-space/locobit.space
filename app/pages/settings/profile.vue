<!-- pages/settings.vue -->
<template>
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6">User Settings</h1>
  
      <UCard class="mb-6">
        <template #header>
          <h2 class="text-xl font-semibold">Profile Settings</h2>
        </template>
  
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormGroup label="Display Name">
              <UInput
                v-model="profileSettings.displayName"
                placeholder="Your display name"
                icon="i-heroicons-user-circle"
              />
            </UFormGroup>
  
            <UFormGroup label="Username">
              <UInput
                v-model="profileSettings.username"
                placeholder="Choose a username"
                icon="i-heroicons-at-symbol"
              />
            </UFormGroup>
          </div>
  
          <UFormGroup label="Bio">
            <UTextarea
              v-model="profileSettings.bio"
              placeholder="Tell us about yourself"
              :rows="3"
            />
          </UFormGroup>
  
          <UFormGroup label="Profile Picture">
            <div class="flex items-center space-x-4">
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
          </UFormGroup>
        </div>
      </UCard>
  
      <UCard class="mb-6">
        <template #header>
          <h2 class="text-xl font-semibold">Nostr Key Management</h2>
        </template>
  
        <div class="space-y-4">
          <UFormGroup label="Public Key">
            <UInput
              v-model="keySettings.publicKey"
              readonly
              icon="i-heroicons-key"
            />
          </UFormGroup>
  
          <UFormGroup label="Private Key">
            <UInput
              v-model="keySettings.privateKey"
              type="password"
              icon="i-heroicons-lock-closed"
            />
            <UAlert
              color="warning"
              variant="soft"
              title="Keep your private key secret!"
              description="Never share your private key with anyone."
              class="mt-2"
            />
          </UFormGroup>
  
          <div class="flex space-x-4">
            <UButton
              color="primary"
              label="Generate New Key Pair"
              icon="i-heroicons-refresh"
              @click="generateNewKeyPair"
            />
            <UButton
              color="secondary"
              label="Copy Public Key"
              icon="i-heroicons-clipboard"
              @click="copyPublicKey"
            />
          </div>
        </div>
      </UCard>
  
      <UCard class="mb-6">
        <template #header>
          <h2 class="text-xl font-semibold">Privacy Settings</h2>
        </template>
  
        <div class="space-y-4">
          <UFormGroup label="Account Visibility">
            <USelect
              v-model="privacySettings.visibility"
              :options="[
                { label: 'Public', value: 'public' },
                { label: 'Followers Only', value: 'followers' },
                { label: 'Private', value: 'private' },
              ]"
            />
          </UFormGroup>
  
          <UFormGroup label="Relay Preferences">
            <div class="flex items-center space-x-4">
              <UInput
                v-model="newRelay"
                placeholder="Add relay URL"
                class="flex-grow"
              />
              <UButton
                color="primary"
                icon="i-heroicons-plus"
                @click="addRelay"
              />
            </div>
  
            <div class="mt-4">
              <div
                v-for="(relay, index) in privacySettings.relays"
                :key="index"
                class="flex items-center justify-between bg-gray-100 p-2 rounded mb-2"
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
          </UFormGroup>
        </div>
      </UCard>
  
      <div class="flex justify-end space-x-4">
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
  import { generateSecretKey, getPublicKey } from "nostr-tools/pure";
  
  const { createUser } = useNostrUser();
  
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
  
  const privacySettings = ref({
    visibility: "public",
    relays: ["wss://relay.nostr.band", "wss://relay.damus.io"],
  });
  
  const newRelay = ref("");
  
  function openImageUpload() {
    // Implement image upload logic
    console.log("Open image upload");
  }
  
  function generateNewKeyPair() {
    //   const privateKey = generateSecretKey();
    //   const publicKey = getPublicKey(privateKey);
    //   keySettings.value.privateKey = privateKey;
    //   keySettings.value.publicKey = publicKey;
  }
  
  function copyPublicKey() {
    navigator.clipboard.writeText(keySettings.value.publicKey);
    // TODO: Add toast notification
  }
  
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
  
  function saveSettings() {
    // Implement save logic
    console.log("Saving settings", {
      profileSettings: profileSettings.value,
      keySettings: keySettings.value,
      privacySettings: privacySettings.value,
    });
  }
  
  function cancelChanges() {
    // Reset or navigate away
    console.log("Cancelling changes");
  }
  
  // Initialize with some default or stored values
  onMounted(() => {
    // You would typically load existing settings here
    const storedPublicKey = localStorage.getItem("nostrPublicKey");
    if (storedPublicKey) {
      keySettings.value.publicKey = storedPublicKey;
    }
  });
  </script>
  