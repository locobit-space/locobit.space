<template>
  <div>
    <div
      v-if="user"
      class="cursor-pointer flex mt-4 items-center gap-2"
      @click="switchAccountModal = true"
    >
      <UAvatar :src="currentUserInfo?.picture" />
      <span>
        {{ currentUserInfo?.display_name || "Nostr User" }}
      </span>
    </div>
    <UModal
      v-model:open="switchAccountModal"
      :ui="{
        content: 'w-full md:max-w-xs',
      }"
    >
      <template #content>
        <div>
          <h1 class="text-lg px-4 py-2 font-bold">Switch Account</h1>
          <ul class="p-1">
            <li
              v-for="(account, index) in accounts"
              :key="index"
              class="flex gap-4 items-center cursor-pointer rounded-md py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
              @click="switchAccount(account.userKeys?.privateKey || '')"
            >
              <span>
                <UAvatar :src="currentUserInfo?.picture" />
              </span>
              <span class="flex-grow">
                {{ account.display_name || "Nostr User" }}
              </span>
              <span v-if="account.pubkey === user?.publicKey">
                <Icon name="i-heroicons-check" />
              </span>
            </li>
            <li>
              <UButton
                icon="i-heroicons-plus-circle"
                color="primary"
                block
                class="mt-2"
                variant="ghost"
                @click="createUser"
              >
                Add Account
              </UButton>
            </li>
            <li>
              <UserLoginForm block />
            </li>
          </ul>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const { currentUserInfo, user, createUser, accounts, setupUser } = useNostr();

const switchAccountModal = ref(false);

function switchAccount(privateKey: string) {
  setupUser(privateKey);
  switchAccountModal.value = false;
}
</script>

<style scoped></style>
