<template>
  <div>
    <slot>
      <UButton
        icon="i-heroicons-user"
        variant="ghost"
        :block="block"
        color="primary"
        @click="importKeyModal = true"
      >
        Login
      </UButton>
    </slot>
    <!-- Import Key Modal -->
    <UModal
      v-model:open="importKeyModal"
      :ui="{ content: 'w-full md:max-w-sm' }"
    >
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-bold">Import Private Key</h3>
          </template>

          <div class="mb-4">
            <UInput
              ref="keyInput"
              v-model="importKey"
              placeholder="Enter your hex private key"
              type="password"
              class="w-full"
            />
          </div>

          <template #footer>
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
          </template>
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
const { setupUser, loadNotesOnce } = useNostr();

const importKeyModal = ref(false);
const importKey = ref("");

const importUserKey = () => {
  if (importKey.value) {
    setupUser(importKey.value);
    toast.add({ title: "Private key imported!" });
    importKeyModal.value = false;
    importKey.value = "";
    loadNotesOnce();
  }
};
</script>
