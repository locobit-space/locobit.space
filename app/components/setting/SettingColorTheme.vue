<script setup lang="ts">
import colors from "tailwindcss/colors";

const appConfig = useAppConfig();
const colorMode = useColorMode();

const neutralColors = ["slate", "gray", "zinc", "neutral", "stone"];
const neutral = computed({
  get() {
    return appConfig.ui.colors.neutral;
  },
  set(option) {
    appConfig.ui.colors.neutral = option;
    window.localStorage.setItem("nuxt-ui-neutral", appConfig.ui.colors.neutral);
  },
});

const colorsToOmit = [
  "inherit",
  "current",
  "transparent",
  "black",
  "white",
  ...neutralColors,
];
const primaryColors = Object.keys(colors)
  .filter((color) => !colorsToOmit.includes(color))
  .concat("amethyst");

// bg color class from primary color
const bgColorClass = new Map(
  primaryColors.map((color) => [color, `bg-${color}-500`])
);
console.log(bgColorClass);

const primary = computed({
  get() {
    return appConfig.ui.colors.primary;
  },
  set(option) {
    appConfig.ui.colors.primary = option;
    window.localStorage.setItem("nuxt-ui-primary", appConfig.ui.colors.primary);
    setBlackAsPrimary(false);
  },
});

function setBlackAsPrimary(value: boolean) {
  window.localStorage.setItem("nuxt-ui-black-as-primary", String(value));
}

onMounted(() => {
  const blackAsPrimary = window.localStorage.getItem(
    "nuxt-ui-black-as-primary"
  );
  if (blackAsPrimary === "true") {
    setBlackAsPrimary(true);
  }

  const primary = window.localStorage.getItem("nuxt-ui-primary");
  if (primary) {
    appConfig.ui.colors.primary = primary;
  }
});
</script>

<template>
  <div>
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Primary</label>
        <ul class="flex gap-3 flex-wrap mt-2">
          <li v-for="color in primaryColors" :key="color">
            <UButton
              :class="{
                'ring-2 ring-offset-2 scale-110 ring-primary-500':
                  primary === color,
              }"
              :color="color"
              @click="primary = color"
              class="w-6 h-6 scale-100 rounded-full border-gray-300 shadow-sm sm:text-sm"
            ></UButton>
          </li>
        </ul>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Neutral</label>
        <ul class="flex gap-3 flex-wrap mt-2">
          <li v-for="color in neutralColors" :key="color">
            <UButton
              size="sm"
              color="neutral"
              variant="outline"
              class="capitalize ring-(--ui-border) rounded-[calc(var(--ui-radius))] text-[11px]"
              :class="[
                color === neutral
                  ? 'bg-(--ui-bg-elevated)'
                  : 'hover:bg-(--ui-bg-elevated)/50',
              ]"
              @click="neutral = color"
            >
              <span
                class="inline-block size-2 rounded-full"
                :class="`bg-(--color-light) dark:bg-(--color-dark)`"
                :style="{
                  '--color-light': `var(--color-${color}-500)`,
                  '--color-dark': `var(--color-${color}-400)`,
                }"
              />
              {{ color }}
            </UButton>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
