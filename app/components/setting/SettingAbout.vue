<template>
  <div class="">
    <!-- Logo and Title Section -->
    <div class="flex flex-col items-center">
      <h1 class="text-2xl mt-6 font-medium">LocoBit Nostr client</h1>
      <p class="mt-2 text-sm text-center text-gray-500 dark:text-gray-400">
        LocoBit is a free and open source Nostr client. <br />
        Sats/Fiat Manager Budget Tracker
      </p>
    </div>

    <!-- Version and Build Info -->
    <div class="px-6">
      <div class="flex justify-between py-4">
        <div class="font-medium">Version</div>
        <div class="text-gray-400">v{{ version }}</div>
      </div>

      <div class="flex justify-between py-4">
        <div class="font-medium">Built</div>
        <div class="text-gray-400">{{ new Date(buildDate).toISOString() }}</div>
      </div>

      <div class="border-t border-slate-100 dark:border-slate-800 my-4"></div>

      <!-- Navigation Links -->
      <nav class="flex flex-col space-y-1">
        <button class="flex items-center py-2">
          <span class="mr-4">
            <Icon name="ri:article-line" class="w-6 h-6" />
          </span>
          Show intro
        </button>

        <button class="flex items-center justify-between py-2">
          <div class="flex items-center">
            <span class="mr-4">
              <Icon name="ri:book-open-line" class="w-6 h-6" />
            </span>
            Documentation
          </div>
          <span>
            <Icon name="ri:arrow-right-s-line" class="w-6 h-6" />
          </span>
        </button>

        <button class="flex items-center justify-between py-2">
          <div class="flex items-center">
            <span class="mr-4">
              <Icon name="ri:code-block" class="w-6 h-6" />
            </span>
            Nostr
          </div>
          <span>
            <Icon name="ri:external-link-line" class="w-6 h-6" />
          </span>
        </button>

        <button class="flex items-center justify-between py-2">
          <div class="flex items-center">
            <span class="mr-4">
              <Icon name="ri:discord-line" class="w-6 h-6" />
            </span>
            Discord
          </div>
          <span>
            <Icon name="ri:external-link-line" class="w-6 h-6" />
          </span>
        </button>

        <a
          href="https://github.com/locobit-space/locobit.space"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-between py-2 hover:text-primary-600"
        >
          <div class="flex items-center">
            <span class="mr-4">
              <Icon name="ri:github-line" class="w-6 h-6" />
            </span>
            GitHub
          </div>
          <span>
            <Icon name="ri:external-link-line" class="w-6 h-6" />
          </span>
        </a>
      </nav>

      <div class="border-t border-gray-100 dark:border-slate-800 my-4"></div>

      <!-- Sponsors Section -->
      <div class="py-6">
        <h2 class="text-2xl font-medium mb-4">Sponsors</h2>
        <p class="text-gray-400">
          Nostr is made possible thanks the generous sponsoring and help of:
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const {
  public: { version, buildDate },
} = useRuntimeConfig();
</script>

<style></style>
