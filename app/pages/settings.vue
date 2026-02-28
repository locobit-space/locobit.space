<template>
  <div class="min-h-screen">
    <!-- Mobile Header -->
    <div
      class="lg:hidden sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800"
    >
      <div class="flex items-center justify-between px-4 py-3">
        <div class="flex items-center gap-3">
          <button
            @click="mobileMenuOpen = true"
            class="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Icon name="heroicons:bars-3" class="w-6 h-6" />
          </button>
          <div>
            <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
              Settings
            </h1>
            <p
              v-if="currentSection"
              class="text-xs text-gray-500 dark:text-gray-400"
            >
              {{ currentSection }}
            </p>
          </div>
        </div>
        <NuxtLink
          to="/feed"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <Icon name="heroicons:x-mark" class="w-6 h-6" />
        </NuxtLink>
      </div>
    </div>

    <!-- Desktop Layout -->
    <div class="flex max-w-7xl mx-auto">
      <!-- Desktop Sidebar -->
      <aside
        class="hidden lg:block w-56 xl:w-64 sticky top-0 h-screen border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
      >
        <div class="p-4 border-b border-gray-100 dark:border-gray-800">
          <div class="flex items-center justify-between mb-3">
            <h1 class="text-lg font-bold text-gray-900 dark:text-white">
              Settings
            </h1>
            <NuxtLink
              to="/feed"
              class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              <Icon name="heroicons:x-mark" class="w-4 h-4" />
            </NuxtLink>
          </div>

          <!-- Search Settings -->
           <UInput
            v-model="searchQuery"
            placeholder="Search settings..."
            icon="heroicons:magnifying-glass"
            size="sm"
            class="w-full"
          />
        </div>

        <nav class="p-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-140px)]">
          <template v-for="section in sections" :key="section.name">
            <!-- Section Header -->
            <div
              v-if="section.items.some((item) => shouldShowItem(item))"
              class="px-2 pt-3 pb-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              {{ section.name }}
            </div>

            <!-- Section Items -->
            <NuxtLink
              v-for="item in section.items.filter(shouldShowItem)"
              :key="item.to"
              :to="item.to"
              class="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-all group"
              :class="
                isActiveRoute(item.to)
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              "
            >
              <Icon
                :name="item.icon"
                class="w-4 h-4 shrink-0"
                :class="
                  isActiveRoute(item.to)
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                "
              />
              <span class="flex-1 truncate">{{ item.label }}</span>
              <Icon
                v-if="item.badge"
                name="heroicons:exclamation-circle"
                class="w-3 h-3 text-amber-500"
              />
            </NuxtLink>
          </template>

          <!-- Logout/Dangerous Actions -->
          <div class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              @click="handleLogout"
              class="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group"
            >
              <Icon
                name="heroicons:arrow-right-on-rectangle"
                class="w-4 h-4 shrink-0"
              />
              <span class="flex-1 text-left truncate">Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 min-h-screen">
        <div class="max-w-4xl mx-auto px-4 lg:px-6 py-4 lg:py-6">
          <NuxtPage />
        </div>
      </main>
    </div>

    <!-- Mobile Menu Drawer -->
    <USlideover v-model:open="mobileMenuOpen" side="left">
      <template #content>
        <div class="flex flex-col h-full bg-white dark:bg-gray-900">
          <!-- Header -->
          <div
            class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800"
          >
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Settings
            </h2>
            <button
              @click="mobileMenuOpen = false"
              class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Icon name="heroicons:x-mark" class="w-5 h-5" />
            </button>
          </div>

          <!-- Search -->
          <div class="p-3 border-b border-gray-100 dark:border-gray-800">
            <div class="relative">
              <Icon
                name="heroicons:magnifying-glass"
                class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              />
              <UInput
                v-model="searchQuery"
                placeholder="Search..."
                icon="mynaui:search"
              />
            </div>
          </div>

          <!-- Navigation -->
          <nav class="flex-1 overflow-y-auto p-3 space-y-0.5">
            <template v-for="section in sections" :key="section.name">
              <div
                v-if="section.items.some((item) => shouldShowItem(item))"
                class="px-2 pt-3 pb-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {{ section.name }}
              </div>

              <NuxtLink
                v-for="item in section.items.filter(shouldShowItem)"
                :key="item.to"
                :to="item.to"
                @click="mobileMenuOpen = false"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                :class="
                  isActiveRoute(item.to)
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-gray-800'
                "
              >
                <Icon
                  :name="item.icon"
                  class="w-5 h-5 shrink-0"
                  :class="
                    isActiveRoute(item.to)
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-400'
                  "
                />
                <span class="flex-1">{{ item.label }}</span>
                <Icon
                  name="heroicons:chevron-right"
                  class="w-4 h-4 text-gray-400"
                />
              </NuxtLink>
            </template>

            <!-- Logout -->
            <div
              class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800"
            >
              <button
                @click="handleLogout"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 active:bg-red-50 dark:active:bg-red-900/20 transition-all"
              >
                <Icon
                  name="heroicons:arrow-right-on-rectangle"
                  class="w-5 h-5 shrink-0"
                />
                <span class="flex-1 text-left">Logout</span>
              </button>
            </div>
          </nav>
        </div>
      </template>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();

// State
const mobileMenuOpen = ref(false);
const searchQuery = ref("");

// Current section based on route
const currentSection = computed(() => {
  const path = route.path;
  const item = sections.flatMap((s) => s.items).find((i) => i.to === path);
  return item?.label || "";
});

// Settings sections organized by category
const sections = [
  {
    name: "Account",
    items: [
      {
        label: "Profile",
        icon: "heroicons:user-circle",
        to: "/settings/profile",
        description: "Manage your profile information",
      },
      {
        label: "Nostr Keys",
        icon: "heroicons:key",
        to: "/settings/keys",
        description: "Manage your cryptographic keys",
      },
    ],
  },
  {
    name: "App Settings",
    items: [
      {
        label: "Interface",
        icon: "heroicons:computer-desktop",
        to: "/settings/interface",
        description: "Customize appearance and theme",
      },
      {
        label: "Preferences",
        icon: "heroicons:adjustments-horizontal",
        to: "/settings/preferences",
        description: "General app preferences",
      },
    ],
  },
  {
    name: "Connections",
    items: [
      {
        label: "Relay Settings",
        icon: "heroicons:server",
        to: "/settings/relays",
        description: "Manage your Nostr relays",
      },
    ],
  },
  {
    name: "Finance",
    items: [
      {
        label: "LocoBit Settings",
        icon: "heroicons:currency-dollar",
        to: "/settings/locosats",
        description: "Manage your finance settings",
      },
      {
        label: "Budget Management",
        icon: "heroicons:chart-pie",
        to: "/settings/budgets",
        description: "Set and track spending budgets",
      },
    ],
  },
  {
    name: "Help & Info",
    items: [
      {
        label: "About",
        icon: "heroicons:information-circle",
        to: "/settings/about",
        description: "App information and version",
      },
    ],
  },
];

// Check if route is active
const isActiveRoute = (path: string) => {
  return route.path === path;
};

// Filter items based on search
const shouldShowItem = (item: any) => {
  if (!searchQuery.value) return true;
  const query = searchQuery.value.toLowerCase();
  return (
    item.label.toLowerCase().includes(query) ||
    item.description?.toLowerCase().includes(query)
  );
};

// Handle logout
// Handle logout
const { logout } = useNostrUser();
const handleLogout = () => {
  logout();
  mobileMenuOpen.value = false;
};

// Close mobile menu on route change
watch(
  () => route.path,
  () => {
    mobileMenuOpen.value = false;
  },
);

useHead({
  title: "Settings - BitOS Space",
});
</script>

<style scoped>
/* Custom scrollbar for sidebar */
nav::-webkit-scrollbar {
  width: 6px;
}

nav::-webkit-scrollbar-track {
  background: transparent;
}

nav::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 3px;
}

nav::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.5);
}

/* Dark mode scrollbar */
.dark nav::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.3);
}

.dark nav::-webkit-scrollbar-thumb:hover {
  background: rgba(75, 85, 99, 0.5);
}
</style>
