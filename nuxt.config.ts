// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  future: {
    compatibilityVersion: 4,
  },

  ssr: false,

  css: ["~/assets/css/main.css"],

  colorMode: {
    preference: "light",
  },

  modules: [
    "@nuxt/eslint",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxt/test-utils",
    "@nuxt/ui",
  ],
  runtimeConfig: {
    public: {
      relayUrls: [
        "wss://relay.damus.io",
        "wss://nos.lol",
        "wss://relay.nostr.info",
        "wss://nostr-pub.wellorder.net",
      ],
    },
  },
});
