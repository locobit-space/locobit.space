<template>
  <div>
    <nav class="space-y-1 flex-col md:flex hidden">
      <h1 class="text-3xl font-bold hidden md:block py-2 mb-2">Nostr Social</h1>

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
        <span class="hidden md:block">
          {{ item.label }}
        </span>
      </UButton>

      <UButton
        v-if="user"
        icon="i-heroicons-plus-circle"
        color="primary"
        to="/create-note"
        block
      >
        Create Note
      </UButton>

      <!-- switch account -->
      <section class="md:block hidden">
        <div v-if="user" class="flex mt-4 items-center gap-2 cursor-pointer">
          <UAvatar :src="currentUserInfo?.picture" />
          <span>
            {{ currentUserInfo?.display_name || "Nostr User" }}
          </span>
        </div>
        <div v-else>
          <UButton
            icon="i-heroicons-user"
            variant="ghost"
            class="w-full"
            color="primary"
          >
            Login
          </UButton>
        </div>
      </section>

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
              >
                <span>
                  <UAvatar :src="currentUserInfo?.picture" />
                </span>
                <span class="flex-grow">
                  {{ account.display_name || "Nostr User" }}
                </span>
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

    <nav
      class="md:hidden z-10 fixed bottom-0 bg-white w-full items-center justify-between flex"
    >
      <UButton
        v-for="item in itemForMobile"
        :key="item.label"
        :icon="item.icon"
        color="neutral"
        variant="ghost"
        block
        size="xl"
        :to="item.to"
      >
        <span class="hidden md:block">
          {{ item.label }}
        </span>
      </UButton>
    </nav>
  </div>
</template>

<script setup lang="ts">
// Sidebar Navigation Items
const { user, currentUserInfo } = useNostr();
const switchAccountModal = ref(false);
const sidebarNavItems = computed(() => [
  {
    label: "Home",
    icon: "i-heroicons-home",
    to: "/",
    isMobile: true,
  },
  {
    label: "Shorts",
    icon: "simple-icons:youtubeshorts",
    to: "/shorts",
    isMobile: true,
  },
  {
    label: "Search",
    icon: "system-uicons:search",
    to: "/search",
    isMobile: true,
  },
  {
    label: "Messages",
    icon: "i-heroicons-chat-bubble-left-right",
    to: "/messages",
    isMobile: true,
  },
  {
    label: "Journals",
    icon: "i-heroicons-book-open",
    to: "/journals",
    isMobile: false,
  },
  {
    label: "Bookmarks",
    icon: "i-heroicons-bookmark",
    to: "/bookmarks",
    class: "hidden md:block",
    isMobile: false,
  },
  {
    label: "Notifications",
    icon: "i-heroicons-bell",
    to: "/notifications",
    isMobile: true,
  },
  {
    label: "Profile",
    icon: "i-heroicons-user-circle",
    to: `/profile/${user.value?.npub}`,
    class: "hidden md:block",
    isMobile: true,
  },
  {
    label: "Settings",
    icon: "i-heroicons-cog",
    to: "/settings",
    isMobile: false,
  },
]);

const itemForMobile = sidebarNavItems.value.filter((item) => item.isMobile);

const accounts = computed(() =>
  [
    user.value?.publicKey && {
      ...currentUserInfo.value,
    },
  ].filter(Boolean)
);
</script>

<style scoped></style>
