<template>
  <div class="rounded-lg flex flex-col">
    <h2 class="mb-4 text-2xl font-bold text-gray-800 dark:text-white">
      Nostr Keys
    </h2>

    <!-- Public Key Section -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-lg font-medium text-gray-700 dark:text-gray-200">
          Public Key
        </h3>
        <UButton
          v-if="user?.publicKey"
          color="primary"
          variant="soft"
          icon="i-heroicons-clipboard"
          size="sm"
          @click="copyToClipboard(user.publicKey)"
        >
          Copy
        </UButton>
      </div>
      <div class="p-3 rounded-md bg-gray-100 dark:bg-gray-800">
        <p
          v-if="user?.publicKey"
          class="font-mono text-sm text-gray-800 break-all dark:text-gray-200"
        >
          {{ user.publicKey }}
        </p>
        <p v-else class="font-mono text-sm text-gray-500 dark:text-gray-400">
          Not available
        </p>
      </div>
    </div>

    <!-- Private Key Section -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-lg font-medium text-gray-700 dark:text-gray-200">
          Private Key
        </h3>
        <div class="flex space-x-2">
          <UButton
            v-if="privateKey"
            color="primary"
            variant="soft"
            icon="i-heroicons-clipboard"
            size="sm"
            @click="copyToClipboard(privateKey)"
          >
            Copy
          </UButton>
          <UButton
            color="gray"
            variant="soft"
            :icon="showPrivateKey ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
            size="sm"
            @click="togglePrivateKey"
          >
            {{ showPrivateKey ? "Hide" : "Show" }}
          </UButton>
        </div>
      </div>
      <div class="p-3 bg-gray-100 rounded-md dark:bg-slate-800">
        <p
          v-if="showPrivateKey && privateKey"
          class="font-mono text-sm text-gray-800 break-all dark:text-gray-200"
        >
          {{ privateKey }}
        </p>
        <p
          v-else-if="privateKey"
          class="font-mono text-sm text-gray-500 break-all flex flex-col dark:text-gray-400"
        >
          •••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
        </p>
        <p v-else class="font-mono text-sm text-gray-500 dark:text-gray-400">
          Not available
        </p>
        <p class="text-xs text-gray-500 mt-2 dark:text-gray-400">
          Do not share your private key with anyone, You can copy to connect
          another Nostr clients
        </p>
      </div>

      <UButton color="primary" class="mt-4" block @click="exportKey"
        >Export keys</UButton
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const toast = useToast();
const { user } = useNostrUser();

// State
const privateKey = ref<string | null>(null);
const showPrivateKey = ref(false);

// Load private key from local storage on mount
onMounted(() => {
  const storedKey = user.value?.privateKey;
  if (storedKey) {
    privateKey.value = storedKey;
  }
});

// Methods
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.add({
    title: "Copied to clipboard",
    description: "Key has been copied to your clipboard",
    icon: "i-heroicons-check-circle",
    color: "green",
  });
}

function togglePrivateKey() {
  showPrivateKey.value = !showPrivateKey.value;
}

function exportKey() {
  if (privateKey.value) {
    const blob = new Blob([privateKey.value], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "nostr-private-key.txt";
    link.click();
    URL.revokeObjectURL(url);
  }
}
</script>
