// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  future: {
    compatibilityVersion: 4,
  },

  ssr: false,

  css: ["~/assets/css/main.css"],

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
    "@vite-pwa/nuxt",
  ],
  runtimeConfig: {
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY, // Server-only
    public: {
      version: process.env.npm_package_version,
      buildDate: process.env.NUXT_PUBLIC_BUILD_DATE || new Date().toISOString(),
      supabaseUrl: process.env.SUPABASE_URL,
      relayUrls: [
        "wss://relay.damus.io",
        "wss://nos.lol",
        "wss://relay.nostr.info",
        "wss://nostr-pub.wellorder.net",
      ],
    },
  },

  app: {
    baseURL: "/", // keep '/' if hosted at domain root
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

  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "LocoBit Space",
      short_name: "LocoBit",
      description: "LocoSats - Social and Bitcoin Lightning for the Web",
      theme_color: "#8C00FF", // Bitcoin orange
      background_color: "#FFFFFF",
      display: "standalone",
      scope: "/",
      start_url: "/",
      icons: [
        {
          src: "/icons/icon-192-192.png", // Folder icon for smaller displays
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/icons/icon-512-512.png", // Folder icon for larger displays
          sizes: "512x512",
          type: "image/png",
        },
      ],
    },
    devOptions: {
      enabled: true,
      type: "module",
      navigateFallback: "/",
    },
  },
});
