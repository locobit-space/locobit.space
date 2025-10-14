// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  future: {
    compatibilityVersion: 4,
  },

  ssr: false,

  css: ['~/assets/css/main.css'],

  ui: {
    theme: {
      colors: [
        "red",
        "orange",
        "amber",
        "yellow",
        "lime",
        "green",
        "emerald",
        "teal",
        "cyan",
        "sky",
        "blue",
        "indigo",
        "violet",
        "purple",
        "fuchsia",
        "pink",
        "rose",
        "amethyst",
        "slate",
        "gray",
        "zinc",
        "neutral",
        "stone",
        "error",
        "warning",
        "info",
        "success",
      ],
    },
  },

  modules: [
    "@nuxt/eslint",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxt/test-utils",
    "@nuxt/ui",
    "@nuxtjs/i18n",
  ],
  runtimeConfig: {
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY, // Server-only
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      relayUrls: [
        "wss://relay.damus.io",
        "wss://nos.lol",
        "wss://relay.nostr.info",
        "wss://nostr-pub.wellorder.net",
      ],
    },
  },

  i18n: {
    locales: [
      {
        code: "lo",
        name: "Lao PDR",
        file: "lo-LA.json",
      },
      {
        code: "en",
        name: "English (US)",
        file: "en-US.json",
      },
    ],
    defaultLocale: "lo",
    vueI18n: "./i18n.config.ts",
  },
});
