<template>
  <div class="max-w-4xl mx-auto py-6 w-full px-4 pb-24">
    <!-- Account Section -->
    <div class="mb-4">
      <div
        class="bg-white dark:bg-gray-800 rounded-2xl border-gray-100 dark:border-gray-700 p-2 shadow-xs"
      >
        <UserAccountSwitchModal />
      </div>
    </div>

    <!-- Quick Settings -->
    <div class="grid grid-cols-2 gap-3 mb-6">
      <!-- Theme Toggle -->
      <button
        @click="toggleTheme"
        class="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border-gray-100 dark:border-gray-700 shadow-xs active:scale-95 transition-transform w-full"
      >
        <div
          class="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300 shrink-0"
          :class="
            isDark
              ? 'bg-gray-700 text-yellow-400'
              : 'bg-orange-50 text-orange-500'
          "
        >
          <Icon
            :name="isDark ? 'solar:moon-bold' : 'solar:sun-2-bold'"
            class="w-6 h-6"
          />
        </div>
        <div class="text-left">
          <span
            class="block text-xs font-medium text-gray-500 dark:text-gray-400"
            >Theme</span
          >
          <span
            class="block text-sm font-bold text-gray-900 dark:text-white leading-tight"
          >
            {{ isDark ? "Dark" : "Light" }}
          </span>
        </div>
      </button>

      <!-- Language Toggle -->
      <button
        @click="toggleLanguage"
        class="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border-gray-100 dark:border-gray-700 shadow-xs active:scale-95 transition-transform w-full"
      >
        <div
          class="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0"
        >
          <Icon name="solar:globe-bold" class="w-6 h-6" />
        </div>
        <div class="text-left">
          <span
            class="block text-xs font-medium text-gray-500 dark:text-gray-400"
            >Lang</span
          >
          <span
            class="block text-sm font-bold text-gray-900 dark:text-white leading-tight uppercase"
          >
            {{ locale }}
          </span>
        </div>
      </button>
    </div>

    <!-- Apps Grid -->
    <div class="grid grid-cols-2 gap-3">
      <NuxtLinkLocale
        v-for="app in apps"
        :key="app.label"
        :to="app.to"
        class="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border-gray-100 dark:border-gray-700 shadow-xs active:scale-95 transition-transform"
      >
        <!-- App Icon -->
        <div
          class="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0"
        >
          <Icon :name="app.icon" class="w-6 h-6" />
        </div>

        <!-- App Label -->
        <span class="text-sm font-bold text-gray-900 dark:text-white truncate">
          {{ app.label }}
        </span>
      </NuxtLinkLocale>
    </div>
  </div>
</template>

<script setup lang="ts">
const colorMode = useColorMode();
const { locale, setLocale } = useI18n();

const isDark = computed(() => colorMode.value === "dark");

const toggleTheme = () => {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};

const toggleLanguage = () => {
  setLocale(locale.value === "en" ? "lo" : "en");
};

const apps = [
  {
    label: "Feed",
    icon: "solar:home-2-bold",
    to: "/feed",
    description: "Your social timeline",
  },
  {
    label: "Discover",
    icon: "solar:magnifer-bold",
    to: "/discover",
    description: "Find new content",
  },
  {
    label: "Shorts",
    icon: "solar:clapperboard-play-bold",
    to: "/shorts",
    description: "Short video clips",
  },
  {
    label: "Sats Wallet",
    icon: "solar:wallet-bold",
    to: "/locosats",
    description: "Lightning payments",
  },
  {
    label: "Journals",
    icon: "solar:notebook-bold",
    to: "/journals",
    description: "Personal diary & notes",
  },
  {
    label: "Bookmarks",
    icon: "solar:bookmark-bold",
    to: "/bookmarks",
    description: "Saved items",
  },
  {
    label: "Profile",
    icon: "solar:user-circle-bold",
    to: "/profile",
    description: "Your identity",
  },
  {
    label: "Settings",
    icon: "solar:settings-bold",
    to: "/settings",
    description: "App preferences",
  },
];
</script>
