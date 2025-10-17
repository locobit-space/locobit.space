<template>
  <div>
    <div
      v-if="user"
      class="cursor-pointer flex mt-4 items-center relative gap-2"
      @click="switchAccountModal = true"
    >
      <span>
        <UAvatar :src="currentUserInfo?.picture" size="xl" />
      </span>
      <span>
        {{ currentUserInfo?.display_name || "Nostr User" }}
      </span>
      <span v-if="currentUserInfo?.nip05">
        <Icon name="ic:round-verified" class="text-primary-500 w-4 h-4" />
      </span>
    </div>
    <div v-else>
      <UButton
        icon="i-heroicons-user"
        variant="ghost"
        class="flex"
        color="primary"
        @click="switchAccountModal = true"
      >
        Login / Import Key
      </UButton>
    </div>
    <UModal
      v-model:open="switchAccountModal"
      :ui="{
        content: 'w-full md:max-w-xs',
      }"
      title="Switch Account"
      description=" "
    >
      <template #content>
        <div class="flex flex-col p-4">
          <nav class="flex justify-between items-center">
            <h1 class="text-lg px-4 py-2 font-bold">
              {{ user ? "Switch Account" : "Login / Import Key" }}
            </h1>
            <span>
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-heroicons-x-mark"
                @click="switchAccountModal = false"
              />
            </span>
          </nav>

          <figure
            v-if="currentUserInfo?.pubkey"
            class="p-4 flex gap-4 border border-slate-100 dark:border-slate-800 rounded-xl mb-2"
          >
            <div class="flex gap-2 items-center flex-grow">
              <UAvatar
                :src="currentUserInfo?.picture"
                icon="i-heroicons-user"
                size="2xl"
              />
              <div class="">
                <h3>
                  {{ currentUserInfo?.display_name || "Nostr User" }}
                  <span v-if="currentUserInfo?.nip05">
                    <Icon
                      name="ic:round-verified"
                      class="text-primary-500 w-4 h-4"
                    />
                  </span>
                </h3>
                <small class="text-gray-500" v-if="currentUserInfo?.nip05">
                  @{{ currentUserInfo?.nip05 }}
                </small>
              </div>
            </div>

            <div>
              <UButton
                icon="i-heroicons-arrow-right-on-rectangle"
                color="error"
                variant="ghost"
                class="mt-2"
                label="Logout"
                @click="logout"
              />
            </div>
          </figure>

          <ul class="p-1 overflow-y-scroll max-h-72 flex-grow">
            <li
              v-for="(account, index) in accounts"
              :key="index"
              class="flex gap-4 items-center cursor-pointer rounded-lg py-2 px-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
              :class="{
                'bg-gray-50 dark:bg-gray-600 dark:text-white':
                  account.pubkey === user?.publicKey,
              }"
              @click="switchAccount(account)"
            >
              <span>
                <UAvatar :src="account?.picture" icon="i-heroicons-user" />
              </span>
              <span class="flex-grow">
                {{ account.display_name || "Nostr User" }}
                <span v-if="account?.nip05">
                  <Icon
                    name="ic:round-verified"
                    class="text-primary-500 w-4 h-4"
                  />
                </span>
              </span>
              <span v-if="account.pubkey === user?.publicKey">
                <Icon
                  name="system-uicons:check-circle"
                  class="text-primary-500"
                />
              </span>
            </li>
          </ul>

          <article class="p-0.5 flex flex-col space-y-2">
            <UButton
              icon="i-heroicons-plus-circle"
              color="primary"
              block
              class="mt-2"
              variant="outline"
              :loading="isCreateAccount"
              @click="handleCreateAccount()"
            >
              Create New Account
            </UButton>
            <UButton
              v-if="!isImportKey"
              icon="material-symbols-light:key-outline"
              color="primary"
              variant="outline"
              block
              @click="isImportKey = true"
            >
              Import Private Key
            </UButton>
          </article>

          <div v-show="isImportKey">
            <h3 class="text-lg font-bold mt-4">Import Private Key</h3>
            <div class="my-2">
              <UInput
                ref="keyInput"
                v-model="importKey"
                placeholder="Enter your hex private key"
                :type="show ? 'text' : 'password'"
                class="w-full"
                icon="ic:outline-vpn-key"
                trailing-icon="streamline:copy-paste-remix"
                @keyup.enter="importUserKey"
              >
                <template #trailing>
                  <div class="flex gap-2">
                    <UTooltip
                      text="Paste from clipboard"
                      :content="{ side: 'right' }"
                    >
                      <UButton
                        variant="link"
                        size="sm"
                        icon="streamline:copy-paste-remix"
                        aria-label=""
                        @click="pasteText"
                      />
                    </UTooltip>
                    <UButton
                      color="neutral"
                      variant="link"
                      size="sm"
                      :icon="show ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                      :aria-label="show ? 'Hide password' : 'Show password'"
                      :aria-pressed="show"
                      aria-controls="password"
                      @click="show = !show"
                    />
                  </div>
                </template>
              </UInput>
            </div>

            <nav class="flex gap-2">
              <UButton block color="neutral" @click="isImportKey = false">
                Cancel
              </UButton>
              <UButton
                color="primary"
                block
                :disabled="!importKey"
                :loading="loading"
                @click="importUserKey"
              >
                Import
              </UButton>
            </nav>
          </div>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="switchAccountEffect"
      :ui="{ content: 'w-full md:max-w-xs' }"
    >
      <template #content>
        <MatrixEffect class="text-primary-500">
          <div class="flex flex-col items-center gap-4">
            <h3 class="text-lg font-bold">Switching Account...</h3>
            <div class="bg-primary-500 p-2 rounded-full">
              <UAvatar
                :src="currentUserInfo?.picture"
                icon="i-heroicons-user"
                size="2xl"
              />
            </div>
          </div>
        </MatrixEffect>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { UserInfo } from "~/types";

const { accounts, updateAccountsList, clearUserData, removeAccount } =
  useNostrStorage();
const { currentUserInfo, user, createUser, setupUser } = useNostrUser();

const show = ref(false);
const isImportKey = ref(false);
const importKey = ref("");
const keyInput = ref<null | HTMLInputElement>(null);

const toast = useToast();
const switchAccountModal = useState("switchAccountModal", () => false);
const switchAccountEffect = ref(false);
const isCreateAccount = ref(false);
const loading = ref(false);

function pasteText() {
  // paste from clipboard
  navigator.clipboard.readText().then((text) => {
    importKey.value = text;
  });
}

async function switchAccount(account: UserInfo) {
  if (account.pubkey === user?.value?.publicKey) {
    switchAccountModal.value = false;
    return;
  }

  setupUser(account.userKeys?.privateKey || "");
  updateAccountsList(account);
  switchAccountEffect.value = true;
  switchAccountModal.value = false;

  setTimeout(() => {
    switchAccountEffect.value = false;
  }, 600);
}

const handleCreateAccount = () => {
  isCreateAccount.value = true;
  createUser();
  isCreateAccount.value = false;
  switchAccountModal.value = false;
};

const importUserKey = () => {
  if (importKey.value) {
    loading.value = true;
    setupUser(importKey.value);
    toast.add({ title: "Private key imported!" });
    isImportKey.value = false;
    loading.value = false;
    switchAccountModal.value = false;
    importKey.value = "";
  } else {
    toast.add({ title: "Please enter a private key", color: "error" });
  }
};

const logout = () => {
  // check accounts list
  if (accounts.value.length > 1) {
    const _user = accounts.value[0];
    removeAccount(user?.value?.publicKey || "");
    if (_user) {
      setupUser(_user.userKeys?.privateKey || "");
      updateAccountsList(_user);
    }
  } else {
    removeAccount(user?.value?.publicKey || "");
    currentUserInfo.value = {
      pubkey: "",
      display_name: "",
      picture: "",
      userKeys: {
        privateKey: "",
        publicKey: "",
        nsec: "",
        npub: "",
      },
    };
    user.value = null;
  }

  toast.add({ title: "Logged out" });
  clearUserData();
  switchAccountModal.value = false;
};
</script>

<style scoped></style>
