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
        <div class="flex flex-col">
          <h1 class="text-lg px-4 py-2 font-bold">Switch Account</h1>
          <ul class="p-1 overflow-y-scroll max-h-72 flex-grow">
            <li
              v-for="(account, index) in accounts"
              :key="index"
              class="flex gap-4 items-center cursor-pointer rounded-md py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
              :class="{
                'bg-gray-50 dark:bg-gray-600 dark:text-white':
                  account.pubkey === user?.publicKey,
              }"
              @click="switchAccount(account.userKeys?.privateKey || '')"
            >
              <span>
                <UAvatar
                  :src="currentUserInfo?.picture"
                  icon="i-heroicons-user"
                />
              </span>
              <span class="flex-grow">
                {{ account.display_name || "Nostr User" }}
              </span>
              <span v-if="account.pubkey === user?.publicKey">
                <Icon
                  name="system-uicons:check-circle"
                  class="text-primary-500"
                />
              </span>
            </li>
          </ul>

          <article class="p-0.5">
            <UButton
              icon="i-heroicons-plus-circle"
              color="primary"
              block
              class="mt-2"
              variant="ghost"
              @click="createUser()"
            >
              Create New Account
            </UButton>
            <UserLoginForm block />
          </article>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const { accounts } = useNostrStorage();
const { currentUserInfo, user, createUser, setupUser } = useNostrUser();

const toast = useToast();
const switchAccountModal = ref(false);

function switchAccount(privateKey: string) {
  setupUser(privateKey);
  switchAccountModal.value = false;
}

const logout = () => {
  localStorage.removeItem("nostrUser");
  user.value = null;
  toast.add({ title: "Logged out" });
};
</script>

<style scoped></style>
