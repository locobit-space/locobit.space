<template>
  <div class="min-h-screen">
    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <!-- Animated Background -->
      <div class="absolute inset-0 opacity-30">
        <div class="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div class="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div class="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      <div class="relative max-w-7xl mx-auto px-4 py-24 sm:py-32">
        <div class="text-center">
          <h1 class="text-4xl md:text-6xl font-bold mb-6">
            {{ $t('home.welcome_title') }}
          </h1>
          <p class="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            {{ $t('home.welcome_subtitle') }}
          </p>
          
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <UButton 
              size="xl" 
              color="neutral"
              to="/feed"
              class="px-8"
            >
              <Icon name="heroicons:play-circle" class="w-5 h-5 mr-2" />
              {{ $t('home.explore_feed') }}
            </UButton>
            
            <UButton 
              size="xl" 
              variant="outline"
              color="neutral"
              to="/discover"
              class="px-8"
            >
              <Icon name="heroicons:magnifying-glass" class="w-5 h-5 mr-2" />
              {{ $t('home.discover') }}
            </UButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-20 bg-white dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          {{ $t('home.features_title') }}
        </h2>
        
        <div class="grid md:grid-cols-3 gap-8">
          <!-- Feature 1: Shorts -->
          <div class="text-center p-6 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
            <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
              <Icon name="heroicons:play-circle" class="w-8 h-8 text-white" />
            </div>
            <h3 class="text-xl font-bold mb-2 text-gray-900 dark:text-white">{{ $t('home.feature_shorts') }}</h3>
            <p class="text-gray-600 dark:text-gray-400">{{ $t('home.feature_shorts_desc') }}</p>
          </div>

          <!-- Feature 2: Nostr -->
          <div class="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
            <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Icon name="heroicons:globe-alt" class="w-8 h-8 text-white" />
            </div>
            <h3 class="text-xl font-bold mb-2 text-gray-900 dark:text-white">{{ $t('home.feature_decentralized') }}</h3>
            <p class="text-gray-600 dark:text-gray-400">{{ $t('home.feature_decentralized_desc') }}</p>
          </div>

          <!-- Feature 3: Bitcoin -->
          <div class="text-center p-6 rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
            <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <Icon name="lets-icons:lightning-light" class="w-8 h-8 text-white" />
            </div>
            <h3 class="text-xl font-bold mb-2 text-gray-900 dark:text-white">{{ $t('home.feature_bitcoin') }}</h3>
            <p class="text-gray-600 dark:text-gray-400">{{ $t('home.feature_bitcoin_desc') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Trending Section -->
    <section class="py-20 bg-gray-50 dark:bg-gray-800">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ $t('home.trending_now') }}
          </h2>
          <NuxtLink to="/discover" class="text-primary-500 hover:text-primary-600 flex items-center gap-1">
            {{ $t('common.view_all') }}
            <Icon name="heroicons:arrow-right" class="w-4 h-4" />
          </NuxtLink>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NuxtLink 
            v-for="(item, index) in trendingItems"
            :key="index"
            to="/shorts"
            class="relative aspect-[9/16] rounded-xl overflow-hidden group"
          >
            <NuxtImg 
              :src="item.thumbnail" 
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div class="absolute bottom-3 left-3 right-3">
              <div class="flex items-center gap-2 text-white">
                <Icon name="heroicons:play-circle-solid" class="w-5 h-5" />
                <span class="text-sm">{{ item.views }}</span>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-20 bg-gradient-to-r from-primary-600 to-purple-600">
      <div class="max-w-4xl mx-auto px-4 text-center">
        <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
          {{ $t('home.cta_title') }}
        </h2>
        <p class="text-xl text-white/80 mb-8">
          {{ $t('home.cta_subtitle') }}
        </p>
        <UButton size="xl" color="neutral" to="/feed" class="px-8">
          {{ $t('home.get_started') }}
        </UButton>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// Demo trending items
const trendingItems = [
  { thumbnail: 'https://picsum.photos/300/500?random=1', views: '1.2K' },
  { thumbnail: 'https://picsum.photos/300/500?random=2', views: '856' },
  { thumbnail: 'https://picsum.photos/300/500?random=3', views: '2.3K' },
  { thumbnail: 'https://picsum.photos/300/500?random=4', views: '567' },
]

// Auto-redirect logged in users to feed
const { user } = useNostrUser()

onMounted(() => {
  if (user.value) {
    navigateTo('/feed')
  }
})

useHead({
  title: 'LocoBit Space - Decentralized Social on Nostr'
})
</script>

<style scoped>
.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}

@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}
</style>