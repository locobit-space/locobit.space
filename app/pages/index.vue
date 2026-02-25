<template>
  <div class="min-h-screen">
    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-linear-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div class="text-center">
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
            {{ $t("home.welcome_title") }}
          </h1>
          <p class="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            {{ $t("home.welcome_subtitle") }}
          </p>

          <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <UButton size="lg" color="primary" to="/feed" variant="solid" class="w-full sm:w-auto px-8">
              <Icon name="heroicons:play-circle" class="w-5 h-5 mr-2" />
              {{ $t("home.explore_feed") }}
            </UButton>

            <UButton
              size="lg"
              variant="outline"
              color="neutral"
              to="/discover"
              class="w-full sm:w-auto px-8"
            >
              <Icon name="heroicons:magnifying-glass" class="w-5 h-5 mr-2" />
              {{ $t("home.discover") }}
            </UButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-16 sm:py-20 lg:py-24 bg-white dark:bg-gray-950">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12 sm:mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {{ $t("home.features_title") }}
          </h2>
          <p class="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Everything you need to connect, share, and transact on the decentralized web.
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-6 sm:gap-8">
          <!-- Feature 1: Shorts -->
          <Card hoverable padding="lg" class="h-full">
            <div class="text-center">
              <div
                class="w-14 h-14 mx-auto mb-4 sm:mb-5 rounded-2xl bg-linear-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg shadow-pink-500/20"
              >
                <Icon name="heroicons:play-circle" class="w-7 h-7 text-white" />
              </div>
              <h3 class="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                {{ $t("home.feature_shorts") }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
                {{ $t("home.feature_shorts_desc") }}
              </p>
            </div>
          </Card>

          <!-- Feature 2: Nostr -->
          <Card hoverable padding="lg" class="h-full">
            <div class="text-center">
              <div
                class="w-14 h-14 mx-auto mb-4 sm:mb-5 rounded-2xl bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20"
              >
                <Icon name="heroicons:globe-alt" class="w-7 h-7 text-white" />
              </div>
              <h3 class="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                {{ $t("home.feature_decentralized") }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
                {{ $t("home.feature_decentralized_desc") }}
              </p>
            </div>
          </Card>

          <!-- Feature 3: Bitcoin -->
          <Card hoverable padding="lg" class="h-full">
            <div class="text-center">
              <div
                class="w-14 h-14 mx-auto mb-4 sm:mb-5 rounded-2xl bg-linear-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/20"
              >
                <Icon name="lets-icons:lightning-light" class="w-7 h-7 text-white" />
              </div>
              <h3 class="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                {{ $t("home.feature_bitcoin") }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
                {{ $t("home.feature_bitcoin_desc") }}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>

    <!-- Trending Section -->
    <section class="py-16 sm:py-20 lg:py-24 bg-gray-50 dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between mb-8 sm:mb-10">
          <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {{ $t("home.trending_now") }}
          </h2>
          <NuxtLink
            to="/discover"
            class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1 text-sm font-medium transition-colors"
          >
            {{ $t("common.view_all") }}
            <Icon name="heroicons:arrow-right" class="w-4 h-4" />
          </NuxtLink>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          <NuxtLink
            v-for="(item, index) in trendingItems"
            :key="index"
            to="/shorts"
            class="relative aspect-[9/16] rounded-xl overflow-hidden group shadow-sm hover:shadow-lg transition-all duration-300"
          >
            <NuxtImg
              :src="item.thumbnail"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div class="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
            <div class="absolute bottom-3 left-3 right-3">
              <div class="flex items-center gap-2 text-white">
                <Icon name="heroicons:play-circle-solid" class="w-4 h-4" />
                <span class="text-sm font-medium">{{ item.views }}</span>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16 sm:py-20 lg:py-24">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div class="bg-linear-to-br from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-2xl sm:rounded-3xl p-8 sm:p-12 lg:p-16">
          <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {{ $t("home.cta_title") }}
          </h2>
          <p class="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            {{ $t("home.cta_subtitle") }}
          </p>
          <UButton size="lg" color="primary" to="/feed" class="px-8 shadow-lg shadow-primary-500/25">
            {{ $t("home.get_started") }}
          </UButton>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-8 border-t border-gray-200 dark:border-gray-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>&copy; {{ new Date().getFullYear() }} BitOS. Built on Nostr & Lightning.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
// Demo trending items
const trendingItems = [
  { thumbnail: "https://picsum.photos/300/500?random=1", views: "1.2K" },
  { thumbnail: "https://picsum.photos/300/500?random=2", views: "856" },
  { thumbnail: "https://picsum.photos/300/500?random=3", views: "2.3K" },
  { thumbnail: "https://picsum.photos/300/500?random=4", views: "567" },
];

// Auto-redirect logged in users to feed
const { user } = useNostrUser();

onMounted(() => {
  if (user.value) {
    navigateTo("/feed");
  }
});

useHead({
  title: "BitOS - Decentralized Social on Nostr",
  meta: [
    {
      name: "description",
      content: "Connect, share, and transact on the decentralized web. Powered by Nostr and Bitcoin Lightning.",
    },
  ],
});
</script>
