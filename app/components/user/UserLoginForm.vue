<template>
  <div>
    <slot>
      <UButton
        icon="material-symbols-light:key-outline"
        variant="ghost"
        :block="block"
        color="primary"
        @click="importKeyModal = true"
      >
        Login / Import Key
      </UButton>
    </slot>
    <!-- Import Key Modal -->
    <UModal
      v-model:open="importKeyModal"
      :ui="{ content: 'w-full md:max-w-sm' }"
    >
      <template #content>
        <UCard>
          <h3 class="text-lg font-bold">Import Private Key</h3>

          <div class="my-4">
            <UInput
              ref="keyInput"
              v-model="importKey"
              placeholder="Enter your hex private key"
              type="password"
              class="w-full"
              @keyup.enter="importUserKey"
            />
          </div>

          <div class="flex justify-end gap-2">
            <UButton color="neutral" @click="importKeyModal = false">
              Cancel
            </UButton>
            <UButton
              color="primary"
              :disabled="!importKey"
              @click="importUserKey"
            >
              Import
            </UButton>
          </div>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  block?: boolean;
}>();

const toast = useToast();
const { setupUser } = useNostrUser();
const { loadNotesOnce } = useNostrFeed();

const importKeyModal = ref(false);
const importKey = ref("");
const keyInput = ref<null | HTMLInputElement>(null);

const importUserKey = () => {
  if (importKey.value) {
    setupUser(importKey.value);
    toast.add({ title: "Private key imported!" });
    importKeyModal.value = false;
    importKey.value = "";
    loadNotesOnce();
  } else {
    toast.add({ title: "Please enter a private key", color: "error" });
  }
};
</script>
