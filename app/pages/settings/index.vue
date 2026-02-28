<template>
  <div class="space-y-6">
    <!-- Welcome Section -->
    <div
      class="bg-linear-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 rounded-xl text-white"
    >
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h1 class="text-2xl font-bold mb-2">Settings</h1>
          <p class="text-primary-100 text-sm">
            Manage your account, preferences, and app configuration
          </p>
        </div>
        <div
          class="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
        >
          <Icon name="heroicons:cog-6-tooth" class="w-7 h-7" />
        </div>
      </div>
    </div>

    <!-- Quick Settings -->
    <div>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Quick Settings
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <!-- Profile Card -->
        <NuxtLink
          to="/settings/profile"
          class="group bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all"
        >
          <div class="flex items-start gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors"
            >
              <Icon
                name="heroicons:user-circle"
                class="w-5 h-5 text-primary-600 dark:text-primary-400"
              />
            </div>
            <div class="flex-1 min-w-0">
              <h3
                class="font-medium text-gray-900 dark:text-white text-sm mb-0.5"
              >
                Profile
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                Manage your public profile and display name
              </p>
            </div>
            <Icon
              name="heroicons:chevron-right"
              class="w-4 h-4 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors shrink-0"
            />
          </div>
        </NuxtLink>

        <!-- Nostr Keys Card -->
        <NuxtLink
          to="/settings/keys"
          class="group bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all"
        >
          <div class="flex items-start gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50 transition-colors"
            >
              <Icon
                name="heroicons:key"
                class="w-5 h-5 text-amber-600 dark:text-amber-400"
              />
            </div>
            <div class="flex-1 min-w-0">
              <h3
                class="font-medium text-gray-900 dark:text-white text-sm mb-0.5"
              >
                Nostr Keys
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                Manage your cryptographic keys and security
              </p>
            </div>
            <Icon
              name="heroicons:chevron-right"
              class="w-4 h-4 text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors shrink-0"
            />
          </div>
        </NuxtLink>

        <!-- Interface Card -->
        <NuxtLink
          to="/settings/interface"
          class="group bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all"
        >
          <div class="flex items-start gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-colors"
            >
              <Icon
                name="heroicons:computer-desktop"
                class="w-5 h-5 text-purple-600 dark:text-purple-400"
              />
            </div>
            <div class="flex-1 min-w-0">
              <h3
                class="font-medium text-gray-900 dark:text-white text-sm mb-0.5"
              >
                Interface
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                Customize theme, colors, and appearance
              </p>
            </div>
            <Icon
              name="heroicons:chevron-right"
              class="w-4 h-4 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors shrink-0"
            />
          </div>
        </NuxtLink>

        <!-- Relay Settings Card -->
        <NuxtLink
          to="/settings/relays"
          class="group bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all"
        >
          <div class="flex items-start gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors"
            >
              <Icon
                name="heroicons:server"
                class="w-5 h-5 text-blue-600 dark:text-blue-400"
              />
            </div>
            <div class="flex-1 min-w-0">
              <h3
                class="font-medium text-gray-900 dark:text-white text-sm mb-0.5"
              >
                Relay Settings
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                Configure your Nostr relay connections
              </p>
            </div>
            <Icon
              name="heroicons:chevron-right"
              class="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0"
            />
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- Finance Section -->
    <div>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Finance Management
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <!-- LocoBit Settings Card -->
        <NuxtLink
          to="/settings/locosats"
          class="group bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 hover:border-green-300 dark:hover:border-green-700 hover:shadow-md transition-all"
        >
          <div class="flex items-start gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center group-hover:bg-green-100 dark:group-hover:bg-green-900/50 transition-colors"
            >
              <Icon
                name="heroicons:currency-dollar"
                class="w-5 h-5 text-green-600 dark:text-green-400"
              />
            </div>
            <div class="flex-1 min-w-0">
              <h3
                class="font-medium text-gray-900 dark:text-white text-sm mb-0.5"
              >
                LocoBit Settings
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                Configure currency, categories, and finance options
              </p>
            </div>
            <Icon
              name="heroicons:chevron-right"
              class="w-4 h-4 text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors shrink-0"
            />
          </div>
        </NuxtLink>

        <!-- Budget Management Card -->
        <NuxtLink
          to="/settings/budgets"
          class="group bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 hover:border-green-300 dark:hover:border-green-700 hover:shadow-md transition-all"
        >
          <div class="flex items-start gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center group-hover:bg-green-100 dark:group-hover:bg-green-900/50 transition-colors"
            >
              <Icon
                name="heroicons:chart-pie"
                class="w-5 h-5 text-green-600 dark:text-green-400"
              />
            </div>
            <div class="flex-1 min-w-0">
              <h3
                class="font-medium text-gray-900 dark:text-white text-sm mb-0.5"
              >
                Budget Management
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                Set spending limits and track budget progress
              </p>
            </div>
            <Icon
              name="heroicons:chevron-right"
              class="w-4 h-4 text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors shrink-0"
            />
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- All Settings -->
    <div>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        All Settings
      </h2>
      <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800">
        <NuxtLink
          to="/settings/preferences"
          class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
        >
          <Icon
            name="heroicons:adjustments-horizontal"
            class="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
          />
          <span class="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Preferences
          </span>
          <Icon
            name="heroicons:chevron-right"
            class="w-4 h-4 text-gray-400"
          />
        </NuxtLink>

        <NuxtLink
          to="/settings/about"
          class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
        >
          <Icon
            name="heroicons:information-circle"
            class="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
          />
          <span class="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            About
          </span>
          <Icon
            name="heroicons:chevron-right"
            class="w-4 h-4 text-gray-400"
          />
        </NuxtLink>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <button
        @click="exportSettings"
        class="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm transition-all group"
      >
        <Icon
          name="heroicons:arrow-down-tray"
          class="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400"
        />
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Export Settings
        </span>
      </button>

      <button
        @click="showHelp"
        class="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm transition-all group"
      >
        <Icon
          name="heroicons:question-mark-circle"
          class="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400"
        />
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Help & Support
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const toast = useToast();

const exportSettings = () => {
  toast.add({
    title: "Export Started",
    description: "Your settings are being exported...",
    icon: "heroicons:arrow-down-tray",
  });
  // Add export logic here
};

const showHelp = () => {
  toast.add({
    title: "Help Center",
    description: "Opening help documentation...",
    icon: "heroicons:information-circle",
  });
  // Add help logic here
};

useHead({
  title: "Settings Overview",
});
</script>

<style scoped>
/* Smooth hover animations */
.group:hover {
  transform: translateY(-1px);
}
</style>
