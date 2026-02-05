<template>
  <div class="space-y-10">
    <!-- Content Filtering -->
    <section>
      <h2
        class="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 mb-5"
      >
        Content Filtering
      </h2>

      <div class="space-y-4">
        <!-- Sensitive Content -->
        <div
          class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800"
        >
          <div>
            <div class="font-medium text-gray-900 dark:text-white">
              Sensitive Content
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              Show content marked as sensitive (NSFW)
            </div>
          </div>
          <USwitch v-model="settings.showSensitiveContent" color="primary" />
        </div>

        <!-- Blur Sensitive Content (Nested) -->
        <div
          v-if="!settings.showSensitiveContent"
          class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 ml-6 relative"
        >
          <!-- Visual connector -->
          <div
            class="absolute -left-6 top-1/2 -translate-y-1/2 w-4 h-px bg-gray-300 dark:bg-gray-700"
          ></div>

          <div>
            <div class="font-medium text-gray-900 dark:text-white">
              Blur Sensitive Content
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              Blur images/videos instead of hiding them completely
            </div>
          </div>
          <USwitch v-model="settings.blurSensitiveContent" color="primary" />
        </div>
      </div>
    </section>

    <!-- Feed Behavior -->
    <section>
      <h2
        class="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 mb-5"
      >
        Feed Behavior
      </h2>

      <div class="grid gap-6 md:grid-cols-2 mb-6">
        <UFormField
          label="Default Feed"
          help="Which feed to load when you start the app"
          class="w-full"
        >
          <USelect
            v-model="settings.defaultFeed"
            :items="[
              { label: 'For You', value: 'for-you' },
              { label: 'Following', value: 'following' },
              { label: 'Trending', value: 'trending' },
            ]"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Autoplay Media"
          help="When to automatically play videos/GIFs"
          class="w-full"
        >
          <USelect
            v-model="settings.autoplayMedia"
            :items="[
              { label: 'Always', value: 'always' },
              { label: 'Wi-Fi Only', value: 'wifi' },
              { label: 'Never', value: 'never' },
            ]"
            class="w-full"
          />
        </UFormField>
      </div>

      <!-- Easy Scroll Card -->
      <div
        class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800"
      >
        <div>
          <div class="font-medium text-gray-900 dark:text-white">
            Easy Scroll
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            Automatically load more posts when you reach the bottom
          </div>
        </div>
        <USwitch v-model="settings.easyScroll" color="primary" />
      </div>
    </section>

    <!-- Privacy & Interactions -->
    <section>
      <h2
        class="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 mb-5"
      >
        Privacy & Interactions
      </h2>

      <div class="max-w-md">
        <UFormField
          label="Default Zap Amount (Sats)"
          help="Amount to send when doing a Quick Zap"
        >
          <UInput
            v-model="settings.defaultZapAmount"
            type="number"
            icon="heroicons:bolt"
            class="w-full max-w-32"
            placeholder="21"
          />
        </UFormField>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { settings } = useAppSettings();
</script>

<style scoped></style>
