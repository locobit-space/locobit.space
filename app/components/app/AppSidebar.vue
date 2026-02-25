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
      class="md:hidden z-50 fixed left-0 bottom-0 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 pb-safe"
    >
      <div class="grid grid-cols-5 h-[60px]">
        <!-- Feed -->
        <NuxtLinkLocale
          to="/feed"
          class="flex flex-col items-center justify-center gap-1 h-full w-full transition-all duration-200 relative"
          :class="
            route.path === '/feed'
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-gray-500 dark:text-gray-400'
          "
        >
          <div
            class="absolute top-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400 transition-all duration-200"
            :class="route.path === '/feed' ? 'opacity-100' : 'opacity-0'"
          />
          <Icon
            :name="
              route.path === '/feed'
                ? 'solar:home-2-bold'
                : 'solar:home-2-linear'
            "
            class="w-6 h-6"
          />
          <span class="text-[11px] font-medium">Home</span>
        </NuxtLinkLocale>

        <!-- Shorts -->
        <NuxtLinkLocale
          to="/shorts"
          class="flex flex-col items-center justify-center gap-1 h-full w-full transition-all duration-200 relative"
          :class="
            route.path === '/shorts'
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-gray-500 dark:text-gray-400'
          "
        >
          <div
            class="absolute top-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400 transition-all duration-200"
            :class="route.path === '/shorts' ? 'opacity-100' : 'opacity-0'"
          />
          <Icon
            :name="
              route.path === '/shorts'
                ? 'solar:clapperboard-play-bold'
                : 'solar:clapperboard-play-linear'
            "
            class="w-6 h-6"
          />
          <span class="text-[11px] font-medium">Shorts</span>
        </NuxtLinkLocale>

        <!-- Create -->
        <NuxtLinkLocale
          to="/create-note"
          class="flex flex-col items-center justify-center gap-1 h-full w-full transition-all duration-200 relative"
          :class="
            route.path === '/create-note'
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-gray-500 dark:text-gray-400'
          "
        >
          <div
            class="absolute top-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400 transition-all duration-200"
            :class="route.path === '/create-note' ? 'opacity-100' : 'opacity-0'"
          />
          <Icon
            :name="
              route.path === '/create-note'
                ? 'solar:add-circle-bold'
                : 'solar:add-circle-linear'
            "
            class="w-7 h-7"
          />
          <span class="text-[11px] font-medium">Create</span>
        </NuxtLinkLocale>

        <!-- Wallet -->
        <NuxtLinkLocale
          to="/locosats"
          class="flex flex-col items-center justify-center gap-1 h-full w-full transition-all duration-200 relative"
          :class="
            route.path.startsWith('/locosats')
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-gray-500 dark:text-gray-400'
          "
        >
          <div
            class="absolute top-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400 transition-all duration-200"
            :class="
              route.path.startsWith('/locosats') ? 'opacity-100' : 'opacity-0'
            "
          />
          <Icon
            :name="
              route.path.startsWith('/locosats')
                ? 'solar:wallet-bold'
                : 'solar:wallet-linear'
            "
            class="w-6 h-6"
          />
          <span class="text-[11px] font-medium">Wallet</span>
        </NuxtLinkLocale>

        <!-- Account -->
        <NuxtLinkLocale
          to="/apps"
          class="flex flex-col items-center justify-center gap-1 h-full w-full transition-all duration-200 relative"
          :class="
            ['/apps', '/settings', '/profile'].some((p) =>
              route.path.startsWith(p),
            )
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-gray-500 dark:text-gray-400'
          "
        >
          <div
            class="absolute top-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400 transition-all duration-200"
            :class="
              ['/apps', '/settings', '/profile'].some((p) =>
                route.path.startsWith(p),
              )
                ? 'opacity-100'
                : 'opacity-0'
            "
          />
          <UAvatar
            v-if="currentUserInfo?.picture"
            :src="currentUserInfo.picture"
            size="2xs"
            class="mb-0.5 ring-2 ring-transparent transition-all duration-200"
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
          <span class="text-[11px] font-medium">Account</span>
        </NuxtLinkLocale>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
// Sidebar Navigation Items
const { user, currentUserInfo } = useNostrUser();
const route = useRoute();
const { visibleNavItems } = useAppSettings();

const sidebarNavItems = visibleNavItems;
</script>

<style scoped>
/* Safe area padding for iPhones with replacement Home button */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
