// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  future: {
    compatibilityVersion: 4,
  },

  ssr: false,

  css: ["~/assets/fonts/stylesheet.css", "~/assets/css/main.css"],

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
        "nero",
        "white"
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
      version: process.env.npm_package_version || "0.1.0",
      buildDate: new Date().toISOString(),
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
      name: "BitOS",
      short_name: "BitOS",
      description: "BitOS - Social and Bitcoin Lightning for the Web",
      theme_color: "#0D0D0D", // Bitcoin orange
      background_color: "#FFFFFF",
      display: "standalone",
      scope: "/",
      start_url: "/",
      icons: [
        {
          src: "/icons/icon-48-48.png", // Folder icon for smaller displays
          sizes: "48x48",
          type: "image/png",
        },
        {
          src: "/icons/icon-72-72.png", // Folder icon for smaller displays
          sizes: "72x72",
          type: "image/png",
        },
        {
          src: "/icons/icon-96-96.png", // Folder icon for smaller displays
          sizes: "96x96",
          type: "image/png",
        },
        {
          src: "/icons/icon-144-144.png", // Folder icon for smaller displays
          sizes: "144x144",
          type: "image/png",
        },
        {
          src: "/icons/icon-152-152.png", // Folder icon for smaller displays
          sizes: "152x152",
          type: "image/png",
        },
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
    workbox: {
      navigateFallback: "/",
      navigateFallbackAllowlist: [/^(?!\/__).*/],
      globPatterns: ["**/*.{js,css,html,png,svg,ico,woff2,woff,ttf,json}"],
      globIgnores: ["**/node_modules/**/*", "sw.js", "workbox-*.js"],
      cleanupOutdatedCaches: true,
      runtimeCaching: [
        // Fonts - Cache First (never change)
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "google-fonts-cache",
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 365 days
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "gstatic-fonts-cache",
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 365 days
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        // Images - Cache First with fallback
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
          handler: "CacheFirst",
          options: {
            cacheName: "image-cache",
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        // App routes - Cache First (enables offline)
        {
          urlPattern:
            /^https?:\/\/[^/]+\/(locosats|journals|feed|profile|settings|apps)/,
          handler: "CacheFirst",
          options: {
            cacheName: "app-routes-cache",
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        // JS/CSS - Cache First with Network Fallback
        {
          urlPattern: /\.(?:js|css)$/i,
          handler: "CacheFirst",
          options: {
            cacheName: "static-assets-cache",
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        // API calls - Network First with Cache Fallback
        {
          urlPattern: /^https?:\/\/.*\/api\/.*/i,
          handler: "NetworkFirst",
          options: {
            cacheName: "api-cache",
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60, // 1 hour
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
            networkTimeoutSeconds: 5,
          },
        },
        // Everything else - Cache First (for offline support)
        {
          urlPattern: /.*/,
          handler: "CacheFirst",
          options: {
            cacheName: "general-cache",
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
    },
    devOptions: {
      enabled: true,
      type: "module",
      navigateFallback: "/",
    },
  },

  nitro: {
    externals: {
      inline: ["vue", "vue-router"],
    },
  },
});
