<template>
  <nav class="space-y-1">
    <h1 class="text-3xl font-bold py-2 mb-2">Nostr Social</h1>

    <UButton
      v-for="item in sidebarNavItems"
      :key="item.label"
      :icon="item.icon"
      color="neutral"
      variant="ghost"
      block
      class="justify-start"
      :to="item.to"
    >
      {{ item.label }}
    </UButton>

    <UButton
      v-if="user"
      icon="i-heroicons-plus-circle"
      color="primary"
      block
      to="/new-post"
    >
      Create Post
    </UButton>

    <!-- switch account -->
    <UModal
      :ui="{
        content: 'w-full md:max-w-xs',
      }"
    >
      <div class="flex mt-4 items-center gap-2 cursor-pointer">
        <UAvatar :src="currentUserInfo?.picture" />
        <span>
          {{ currentUserInfo?.display_name || "Nostr User" }}
        </span>
      </div>

      <template #content>
        <div>
          <h1 class="text-lg px-4 py-2 font-bold">Switch Account</h1>
          <ul class="p-1">
            <li
              v-for="(account, index) in accounts"
              :key="index"
              class="flex gap-4 items-center cursor-pointer rounded-md py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
            >
              <span>
                <UAvatar :src="currentUserInfo?.picture" />
              </span>
              <span class="flex-grow">{{ account.display_name }}</span>
              <span v-if="index === 0">
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
              >
                Add Account
              </UButton>
            </li>
          </ul>
        </div>
      </template>
    </UModal>
  </nav>
</template>

<script setup lang="ts">
// Sidebar Navigation Items
const { user, currentUserInfo } = useNostr();
const sidebarNavItems = computed(() => [
  {
    label: "Home",
    icon: "i-heroicons-home",
    to: "/",
  },
  {
    label: "Messages",
    icon: "i-heroicons-chat-bubble-left-right",
    to: "/messages",
  },
  {
    label: "Journals",
    icon: "i-heroicons-book-open",
    to: "/journals",
  },
  {
    label: "Bookmarks",
    icon: "i-heroicons-bookmark",
    to: "/bookmarks",
  },
  {
    label: "Notifications",
    icon: "i-heroicons-bell",
    to: "/notifications",
  },
  {
    label: "Profile",
    icon: "i-heroicons-user-circle",
    to: `/profile/${user.value?.npub}`,
  },
  {
    label: "Settings",
    icon: "i-heroicons-cog-6-tooth",
    to: "/settings",
  },
]);

const accounts = computed(() => [
  {
    ...currentUserInfo.value,
  },
]);
</script>

<style scoped></style>
