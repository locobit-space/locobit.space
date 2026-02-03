<template>
  <div>
    <!-- Desktop Sidebar -->
    <nav class="space-y-1 flex-col md:flex hidden h-full">
      <div class="flex-1 space-y-1">
        <h1
          class="text-3xl font-bold hidden md:block py-2 mb-6 px-4"
          title="bitos.space"
        >
          <nuxt-link-locale to="/" class="flex items-center gap-2">
            <img src="/logo.png" alt="BitOS" class="h-8 w-auto" />
            <span
              class="text-xl tracking-tight text-primary-600 dark:text-primary-400"
              >BitOS</span
            >
          </nuxt-link-locale>
        </h1>

        <UButton
          v-for="item in sidebarNavItems"
          :key="item.label"
          :icon="item.icon"
          :to="item.to"
          color="neutral"
          variant="ghost"
          block
          class="justify-start mb-1"
          active-class="bg-gray-100 dark:bg-gray-800 text-primary-500 font-bold"
        >
          <span class="hidden md:block ml-2 text-base">
            {{ item.label }}
          </span>
        </UButton>

        <UButton
          v-if="user"
          icon="solar:add-circle-bold"
          color="primary"
          variant="solid"
          to="/create-note"
          block
          class="mt-6 mb-2 mx-auto w-[90%] justify-center font-bold shadow-lg shadow-primary-500/20"
        >
          <span class="hidden md:block">Create Note</span>
        </UButton>
      </div>

      <!-- User Profile (Desktop) -->
      <section
        class="md:block hidden mt-auto pt-4 border-t border-gray-100 dark:border-gray-800"
      >
        <UserAccountSwitchModal />
      </section>
    </nav>

    <!-- Mobile Bottom Navigation -->
    <!-- Mobile Bottom Navigation (Facebook Style) -->
    <nav
      class="md:hidden z-50 fixed left-0 bottom-0 w-full bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pb-safe"
    >
      <div class="grid grid-cols-5 h-[50px]">
        <!-- Feed -->
        <NuxtLinkLocale
          to="/feed"
          class="flex flex-col items-center justify-center gap-0.5 h-full w-full"
          :class="
            route.path === '/feed'
              ? 'text-primary-600 border-t-2 dark:text-primary-400'
              : 'text-gray-500 dark:text-gray-400'
          "
        >
          <Icon
            :name="
              route.path === '/feed'
                ? 'solar:home-2-bold'
                : 'solar:home-2-linear'
            "
            class="w-7 h-7"
          />
          <span class="text-[10px] font-medium leading-none">Home</span>
        </NuxtLinkLocale>

        <!-- Shorts -->
        <NuxtLinkLocale
          to="/shorts"
          class="flex flex-col items-center justify-center gap-0.5 h-full w-full"
          :class="
            route.path === '/shorts'
              ? 'text-primary-600 border-t-2 dark:text-primary-400'
              : 'text-gray-500 dark:text-gray-400'
          "
        >
          <Icon
            :name="
              route.path === '/shorts'
                ? 'solar:clapperboard-play-bold'
                : 'solar:clapperboard-play-linear'
            "
            class="w-7 h-7"
          />
          <span class="text-[10px] font-medium leading-none">Shorts</span>
        </NuxtLinkLocale>

        <!-- Create (Flat Plus) -->
        <NuxtLinkLocale
          to="/create-note"
          class="flex flex-col items-center justify-center gap-0.5 h-full w-full"
          :class="
            route.path === '/create-note'
              ? 'text-primary-600 border-t-2 dark:text-primary-400'
              : 'text-gray-500 dark:text-gray-400'
          "
        >
          <div class="relative">
            <Icon
              :name="
                route.path === '/create-note'
                  ? 'solar:add-circle-bold'
                  : 'solar:add-circle-linear'
              "
              class="w-7 h-7"
            />
          </div>
          <span class="text-[10px] font-medium leading-none">Create</span>
        </NuxtLinkLocale>

        <!-- Wallet -->
        <NuxtLinkLocale
          to="/locosats"
          class="flex flex-col items-center justify-center gap-0.5 h-full w-full"
          :class="
            route.path.startsWith('/locosats')
              ? 'text-primary-600 border-t-2 dark:text-primary-400'
              : 'text-gray-500 dark:text-gray-400'
          "
        >
          <Icon
            :name="
              route.path.startsWith('/locosats')
                ? 'solar:wallet-bold'
                : 'solar:wallet-linear'
            "
            class="w-7 h-7"
          />
          <span class="text-[10px] font-medium leading-none">Wallet</span>
        </NuxtLinkLocale>

        <!-- Account (Apps) -->
        <NuxtLinkLocale
          to="/apps"
          class="flex flex-col items-center justify-center gap-0.5 h-full w-full"
          :class="
            ['/apps', '/settings', '/profile'].some((p) =>
              route.path.startsWith(p),
            )
              ? 'text-primary-600 border-t-2 dark:text-primary-400'
              : 'text-gray-500 dark:text-gray-400'
          "
        >
          <UAvatar
            v-if="currentUserInfo?.picture"
            :src="currentUserInfo.picture"
            size="2xs"
            class="ring-2 ring-transparent mb-0.5"
            :class="{
              'ring-primary-600 dark:ring-primary-400': [
                '/apps',
                '/settings',
                '/profile',
              ].some((p) => route.path.startsWith(p)),
            }"
          />
          <Icon
            v-else
            :name="
              ['/apps', '/settings', '/profile'].some((p) =>
                route.path.startsWith(p),
              )
                ? 'solar:user-circle-bold'
                : 'solar:user-circle-linear'
            "
            size="2xs"
          />
          <span class="text-[10px] font-medium leading-none">Account</span>
        </NuxtLinkLocale>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
// Sidebar Navigation Items
const { user, currentUserInfo } = useNostrUser();
const switchAccountModal = useState("switchAccountModal", () => false);
const route = useRoute();

const sidebarNavItems = computed(() => [
  {
    label: "Feed",
    icon: "solar:home-2-linear",
    to: "/feed",
  },
  {
    label: "Discover",
    icon: "solar:magnifer-linear",
    to: "/discover",
  },
  {
    label: "Shorts",
    icon: "solar:clapperboard-play-linear",
    to: "/shorts",
  },
  {
    label: "Sats Wallet",
    icon: "solar:wallet-linear",
    to: "/locosats",
  },
  {
    label: "Journals",
    icon: "solar:notebook-linear",
    to: "/journals",
  },
  {
    label: "Bookmarks",
    icon: "solar:bookmark-linear",
    to: "/bookmarks",
  },
  {
    label: "Settings",
    icon: "solar:settings-linear",
    to: "/settings",
  },
]);
</script>

<style scoped>
/* Safe area padding for iPhones with replacement Home button */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
