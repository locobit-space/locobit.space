<template>
  <div class="space-y-10">
    <!-- Appearance Section -->
    <section>
      <h2
        class="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 mb-5"
      >
        Appearance
      </h2>

      <div class="space-y-6">
        <div>
          <label
            class="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300"
          >
            Color Mode
          </label>
          <SettingColorMode />
        </div>

        <div>
          <label
            class="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300"
          >
            Theme Color
          </label>
          <SettingColorTheme />
        </div>
      </div>
    </section>

    <!-- Layout Section -->
    <section>
      <h2
        class="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 mb-5"
      >
        Layout
      </h2>

      <div class="grid gap-6 md:grid-cols-2">
        <UFormField
          label="Feed Density"
          help="Choose how compact posts appear in your feed"
        >
          <USelect
            v-model="settings.feedDensity"
            :items="[
              { label: 'Comfortable', value: 'comfortable' },
              { label: 'Compact', value: 'compact' },
            ]"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Avatars" help="Show user profile pictures">
          <div class="flex items-center mt-2.5">
            <USwitch v-model="showAvatars" color="primary" />
            <span
              class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300"
              >{{ showAvatars ? "Shown" : "Hidden" }}</span
            >
          </div>
        </UFormField>
      </div>
    </section>

    <!-- Accessibility Section -->
    <section>
      <h2
        class="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 mb-5"
      >
        Accessibility
      </h2>

      <div class="max-w-md">
        <UFormField
          label="Reduce Motion"
          help="Minimize animations and transitions"
        >
          <div class="flex items-center mt-2.5">
            <USwitch v-model="settings.reduceMotion" color="primary" />
            <span
              class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300"
              >{{ settings.reduceMotion ? "Enabled" : "Disabled" }}</span
            >
          </div>
        </UFormField>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { settings } = useAppSettings();

const showAvatars = computed({
  get: () => !settings.value.hideAvatars,
  set: (val) => (settings.value.hideAvatars = !val),
});
</script>

<style scoped></style>
