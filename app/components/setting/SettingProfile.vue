<template>
  <div>
    <h2 class="text-xl font-semibold">Profile Settings</h2>

    <div class="space-y-4 flex flex-col">
      <UFormField label="Display Name" class="mt-4">
        <UInput
          v-model="profileSettings.display_name"
          placeholder="Your display name"
          icon="i-heroicons-user-circle"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Name">
        <UInput
          v-model="profileSettings.name"
          placeholder="Name"
          icon="i-heroicons-at-symbol"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Bio">
        <UTextarea
          v-model="profileSettings.bio"
          placeholder="Tell us about yourself"
          :rows="3"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="NIP-05(Your NIP-05 identifier)"
        help="For example name@domain.com"
      >
        <UInput
          v-model="profileSettings.nip05"
          placeholder="name@domain.com"
          icon="ri:verified-badge-fill"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Your Lightning Address(LUD-16)" help="">
        <UInput
          v-model="profileSettings.lud16"
          placeholder="Your Lightning Address"
          icon="system-uicons:lightning"
          class="w-full"
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
      <UButton color="neutral" label="Cancel" @click="$router.back()" />
      <UButton
        color="primary"
        label="Save Changes"
        icon="i-heroicons-check"
        :loading="loading"
        @click="saveSettings"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { UserInfo } from "~~/types";

const toast = useToast();
const { saveUser } = useNostrStorage();
const { user, currentUserInfo } = useNostrUser();
const { updateProfile } = useProfile();
const profileSettings = ref<UserInfo>({
  username: "",
  bio: "",
  avatarUrl: "",
  nip05: "",
  lud16: "",
  pubkey: "",
  display_name: "",
});

const loading = ref(false);

function openImageUpload() {
  // Implement image upload logic
  console.log("Open image upload");
}

async function saveSettings() {
  try {
    const { name, display_name, bio, avatarUrl } = profileSettings.value;

    if (!user.value) {
      throw new Error("No user found");
    }

    if (!display_name.trim()) {
      toast.add({
        title: "Name and display name are required",
        color: "error",
      });
      return;
    }

    loading.value = true;
    const input: UserInfo = {
      display_name: display_name,
      name: name,
      about: bio,
      picture: avatarUrl,
      pubkey: `${user.value?.publicKey}`,
      lud16: "",
      nip05: "",
      website: "",
      banner: "",
    };
    await updateProfile(input); // async to nostr
    saveUser({ ...input, userKeys: user.value }); // local storage

    toast.add({
      title: "Profile updated successfully",
      color: "success",
    });
  } catch (error) {
    toast.add({ title: "Error updating profile", color: "error" });
    throw new Error(`[useProfile] Error updating profile: ${error}`);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  profileSettings.value = {
    ...currentUserInfo.value,
  };
});
</script>
