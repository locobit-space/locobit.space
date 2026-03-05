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
        class="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border-gray-100 dark:border-gray-700 border active:scale-95 transition-transform w-full"
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
          >
            Theme
          </span>
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
        class="flex items-center gap-3 p-3 border bg-white dark:bg-gray-800 rounded-xl border-gray-100 dark:border-gray-700 active:scale-95 transition-transform w-full"
      >
        <div
          class="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0"
        >
          <Icon name="solar:globe-bold" class="w-6 h-6" />
        </div>
        <div class="text-left">
          <span
            class="block text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            Language
          </span>
          <span
            class="block text-sm font-bold text-gray-900 dark:text-white leading-tight en"
          >
            {{ getLangLabel(locale) }}
          </span>
        </div>
      </button>
    </div>

    <!-- Apps Grid -->
    <div class="mb-2 flex items-center justify-between">
      <h2
        class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
      >
        Apps
      </h2>
      <NuxtLink
        to="/settings/navigation"
        class="flex items-center gap-1 text-xs font-medium text-primary-600 dark:text-primary-400"
      >
        <Icon name="heroicons:adjustments-horizontal" class="w-3.5 h-3.5" />
        Manage Sidebar
      </NuxtLink>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      <div v-for="app in allApps" :key="app.key" class="relative">
        <NuxtLinkLocale
          :to="app.to"
          class="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border-gray-100 border dark:border-gray-700 active:scale-95 transition-transform w-full"
        >
          <!-- App Icon -->
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors"
            :class="
              app.navKey && isNavItemVisible(app.navKey)
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
            "
          >
            <Icon :name="app.icon" class="w-6 h-6" />
          </div>

          <!-- App Label -->
          <div class="flex-1 min-w-0">
            <span
              class="block text-sm font-bold text-gray-900 dark:text-white truncate"
              >{{ app.label }}</span
            >
            <span
              v-if="app.description"
              class="block text-xs text-gray-400 dark:text-gray-500 truncate"
              >{{ app.description }}</span
            >
          </div>
        </NuxtLinkLocale>

        <!-- Sidebar pin toggle -->
        <button
          v-if="app.navKey"
          :title="
            isNavItemVisible(app.navKey)
              ? 'Remove from sidebar'
              : 'Add to sidebar'
          "
          class="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-sm border"
          :class="
            isNavItemVisible(app.navKey)
              ? 'bg-primary-600 dark:bg-primary-500 border-primary-700 dark:border-primary-600 text-gray-200'
              : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-400'
          "
          :disabled="isNavRequired(app.navKey)"
          @click.prevent="
            !isNavRequired(app.navKey) && toggleNavItem(app.navKey)
          "
        >
          <Icon
            :name="
              isNavItemVisible(app.navKey)
                ? 'heroicons:check'
                : 'heroicons:plus'
            "
            class="w-3 h-3"
          />
        </button>
      </div>
    </div>

    <!-- Hint -->
    <p class="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
      Tap
      <Icon name="heroicons:check" class="inline w-3 h-3 text-primary-500" />
      to pin / unpin apps from your sidebar
    </p>
  </div>
</template>

<script setup lang="ts">
import { ALL_NAV_ITEMS } from "~/composables/useAppSettings";

const colorMode = useColorMode();
const { locale, setLocale, locales } = useI18n();
const { isNavItemVisible, toggleNavItem } = useAppSettings();

useHead({ title: "BitOS Apps" });

const isDark = computed(() => colorMode.value === "dark");
const toggleTheme = () => {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};
const toggleLanguage = () => {
  setLocale(locale.value === "en" ? "lo" : "en");
};

const getLangLabel = (lang: string) => {
  const current = locales.value.find((l) => l.code === lang);
  return current?.name ?? "Unknown";
};

const isNavRequired = (key: string) =>
  ALL_NAV_ITEMS.find((i) => i.key === key)?.required ?? false;

const BOLD_ICONS: Record<string, string> = {
  feed: "solar:home-2-bold",
  discover: "solar:magnifer-bold",
  shorts: "solar:clapperboard-play-bold",
  locosats: "solar:wallet-bold",
  journals: "solar:notebook-bold",
  bookmarks: "solar:bookmark-bold",
  gms: "mynaui:sprout",
  gardenos: "lucide:cpu",
  settings: "solar:settings-bold",
};

const { currentUserInfo } = useNostrUser();

const allApps = [
  ...ALL_NAV_ITEMS.map((item) => ({
    key: item.key,
    navKey: item.key as string | null,
    label: item.label,
    icon: BOLD_ICONS[item.key] ?? item.icon,
    to: item.to,
    description: item.description,
  })),
  {
    key: "profile",
    navKey: null as string | null,
    label: "Profile",
    icon: "solar:user-circle-bold",
    to: `/profile/${currentUserInfo.value?.pubkey}`,
    description: "Your identity",
  },
];
</script>
