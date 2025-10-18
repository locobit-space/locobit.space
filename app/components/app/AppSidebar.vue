<template>
  <div>
    <nav class="space-y-1 flex-col md:flex hidden">
      <h1
        class="text-3xl font-bold hidden md:block py-2 mb-2"
        title="locobit.space"
      >
        <nuxt-link-locale to="/">LocoBit</nuxt-link-locale>
      </h1>

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
        <UserAccountSwitchModal />
      </section>
    </nav>

    <nav
      class="md:hidden z-10 fixed left-0 bottom-0 backdrop-blur-2xl bg-white/30 w-full items-center justify-between flex"
    >
      <UButton
        v-for="item in itemForMobile"
        :key="item.label"
        :icon="item.icon"
        color="neutral"
        variant="ghost"
        block
        size="xl"
        class="text-2xl py-3"
        :to="item.to"
      >
        <span class="hidden md:block">
          {{ item.label }}
        </span>
      </UButton>
      <UButton
        v-if="user?.publicKey"
        icon="i-heroicons-user-circle"
        color="neutral"
        variant="ghost"
        block
        size="xl"
        class="text-2xl py-3"
        :to="`/profile/${user?.publicKey}`"
      >
        <span class="hidden md:block">Profile</span>
      </UButton>
      <UButton
        v-else
        icon="i-heroicons-user-circle"
        color="neutral"
        variant="ghost"
        block
        size="xl"
        class="text-2xl py-3"
        @click="switchAccountModal = true"
      >
        <span class="hidden md:block">Profile</span>
      </UButton>
    </nav>
  </div>
</template>

<script setup lang="ts">
// Sidebar Navigation Items
const { user, currentUserInfo } = useNostrUser();
const switchAccountModal = useState("switchAccountModal", () => false);
const sidebarNavItems = computed(() => [
  {
    label: "Home",
    icon: "i-heroicons-home",
    to: "/",
    isMobile: true,
  },
  {
    label: "Sats Wallet",
    icon: "bitcoin-icons:lightning-outline",
    to: "/locosats",
    isMobile: true,
  },
  // {
  //   label: "Notifications",
  //   icon: "i-heroicons-bell",
  //   to: "/notifications",
  //   isMobile: true,
  // },
  // {
  //   label: "Bit Zap",
  //   icon: "bitcoin-icons:lightning-outline",
  //   to: "/zaps",
  //   isMobile: true,
  // },
  // {
  //   label: "Search",
  //   icon: "system-uicons:search",
  //   to: "/search",
  //   isMobile: true,
  // },
  // {
  //   label: "Messages",
  //   icon: "i-heroicons-chat-bubble-left-right",
  //   to: "/messages",
  //   isMobile: true,
  // },
  {
    label: "Journals",
    icon: "i-heroicons-book-open",
    to: "/journals",
    isMobile: true,
  },
  // {
  //   label: "Bookmarks",
  //   icon: "i-heroicons-bookmark",
  //   to: "/bookmarks",
  //   class: "hidden md:block",
  //   isMobile: false,
  // },
  //  {
  //   label: "Profile",
  //   icon: "i-heroicons-user-circle",
  //   to: `/profile/${user.value?.publicKey}`,
  //   class: "hidden md:block",
  //   isMobile: true,
  // },
  {
    label: "Settings",
    icon: "i-heroicons-cog",
    to: "/settings",
    isMobile: true,
  },
]);

const itemForMobile = sidebarNavItems.value.filter((item) => item.isMobile);
</script>
