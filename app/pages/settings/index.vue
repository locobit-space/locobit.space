<template>
  <div class="space-y-6">
    <!-- Welcome Section -->
    <div class="">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h1 class="text-2xl font-bold mb-2">Settings</h1>
          <p class="text-sm">
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

    <!-- Card Sections (data-driven) -->
    <div v-for="section in cardSections" :key="section.title">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {{ section.title }}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <NuxtLink
          v-for="card in section.items"
          :key="card.to"
          :to="card.to"
          class="group bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all"
          :class="`hover:border-${card.color}-300 dark:hover:border-${card.color}-700`"
        >
          <div class="flex items-start gap-3">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center transition-colors shrink-0"
              :class="[
                `bg-${card.color}-50 dark:bg-${card.color}-900/30`,
                `group-hover:bg-${card.color}-100 dark:group-hover:bg-${card.color}-900/50`,
              ]"
            >
              <Icon
                :name="card.icon"
                class="w-5 h-5"
                :class="`text-${card.color}-600 dark:text-${card.color}-400`"
              />
            </div>
            <div class="flex-1 min-w-0">
              <h3
                class="font-medium text-gray-900 dark:text-white text-sm mb-0.5"
              >
                {{ card.label }}
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                {{ card.description }}
              </p>
            </div>
            <Icon
              name="heroicons:chevron-right"
              class="w-4 h-4 text-gray-400 transition-colors shrink-0"
              :class="`group-hover:text-${card.color}-600 dark:group-hover:text-${card.color}-400`"
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
      <div
        class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800"
      >
        <NuxtLink
          v-for="item in listItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
        >
          <Icon
            :name="item.icon"
            class="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
          />
          <span
            class="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {{ item.label }}
          </span>
          <Icon name="heroicons:chevron-right" class="w-4 h-4 text-gray-400" />
        </NuxtLink>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <button
        v-for="action in quickActions"
        :key="action.label"
        class="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm transition-all group"
        @click="action.handler"
      >
        <Icon
          :name="action.icon"
          class="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400"
        />
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ action.label }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: "Settings Overview" });

const toast = useToast();

// ─── Types ────────────────────────────────────────────────────────────────────

interface SettingsCard {
  label: string;
  icon: string;
  to: string;
  description: string;
  color: string;
}

interface CardSection {
  title: string;
  items: SettingsCard[];
}

// ─── Card grid sections ───────────────────────────────────────────────────────

const cardSections: CardSection[] = [
  {
    title: "Quick Settings",
    items: [
      {
        label: "Profile",
        icon: "heroicons:user-circle",
        to: "/settings/profile",
        description: "Manage your public profile and display name",
        color: "primary",
      },
      {
        label: "Nostr Keys",
        icon: "heroicons:key",
        to: "/settings/keys",
        description: "Manage your cryptographic keys and security",
        color: "amber",
      },
      {
        label: "Interface",
        icon: "heroicons:computer-desktop",
        to: "/settings/interface",
        description: "Customize theme, colors, and appearance",
        color: "purple",
      },
      {
        label: "Relay Settings",
        icon: "heroicons:server",
        to: "/settings/relays",
        description: "Configure your Nostr relay connections",
        color: "blue",
      },
      {
        label: "Navigation",
        icon: "heroicons:bars-3",
        to: "/settings/navigation",
        description: "Customize sidebar items",
        color: "primary",
      },
    ],
  },
  {
    title: "Finance Management",
    items: [
      {
        label: "LocoBit Settings",
        icon: "heroicons:currency-dollar",
        to: "/settings/locosats",
        description: "Configure currency, categories, and finance options",
        color: "green",
      },
      {
        label: "Budget Management",
        icon: "heroicons:chart-pie",
        to: "/settings/budgets",
        description: "Set spending limits and track budget progress",
        color: "green",
      },
    ],
  },
];

// ─── Simple list items ────────────────────────────────────────────────────────

const listItems = [
  {
    label: "Preferences",
    icon: "heroicons:adjustments-horizontal",
    to: "/settings/preferences",
  },
  {
    label: "About",
    icon: "heroicons:information-circle",
    to: "/settings/about",
  },
];

// ─── Quick action buttons ─────────────────────────────────────────────────────

const quickActions = [
  {
    label: "Export Settings",
    icon: "heroicons:arrow-down-tray",
    handler: () =>
      toast.add({
        title: "Export Started",
        description: "Your settings are being exported...",
        icon: "heroicons:arrow-down-tray",
      }),
  },
  {
    label: "Help & Support",
    icon: "heroicons:question-mark-circle",
    handler: () =>
      toast.add({
        title: "Help Center",
        description: "Opening help documentation...",
        icon: "heroicons:information-circle",
      }),
  },
];
</script>
