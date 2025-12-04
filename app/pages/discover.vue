<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Search Header -->
    <div class="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <div class="p-4">
        <div class="relative">
          <UInput 
            v-model="searchQuery"
            :placeholder="$t('social.search_placeholder')"
            icon="i-heroicons-magnifying-glass"
            size="lg"
            class="w-full"
            @focus="isSearchFocused = true"
            @blur="handleBlur"
            @keyup.enter="performSearch"
          />
          <button 
            v-if="searchQuery"
            class="absolute right-3 top-1/2 -translate-y-1/2"
            @click="clearSearch"
          >
            <Icon name="heroicons:x-circle-solid" class="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <!-- Search Suggestions -->
        <Transition name="fade">
          <div v-if="isSearchFocused && !searchQuery" class="mt-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {{ $t('social.recent_searches') }}
              </span>
              <button class="text-xs text-primary-500" @click="clearRecentSearches">
                {{ $t('common.clear') }}
              </button>
            </div>
            <div class="flex flex-wrap gap-2">
              <button 
                v-for="search in recentSearches" 
                :key="search"
                class="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm"
                @click="searchQuery = search; performSearch()"
              >
                {{ search }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
      
      <!-- Category Tabs -->
      <div class="flex gap-2 px-4 pb-3 overflow-x-auto" v-if="!isSearchFocused">
        <button
          v-for="category in categories"
          :key="category.key"
          class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
          :class="activeCategory === category.key 
            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' 
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'"
          @click="activeCategory = category.key"
        >
          {{ $t(`social.categories.${category.key}`) }}
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <!-- Trending Hashtags -->
      <section v-if="activeCategory === 'all'" class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">
            {{ $t('social.trending_hashtags') }}
          </h2>
          <NuxtLink to="/trending" class="text-sm text-primary-500">
            {{ $t('common.view_all') }}
          </NuxtLink>
        </div>
        
        <div class="flex gap-2 overflow-x-auto pb-2">
          <NuxtLink 
            v-for="(tag, index) in trendingHashtags" 
            :key="tag.name"
            :to="`/hashtag/${tag.name}`"
            class="flex-shrink-0 px-4 py-3 bg-gradient-to-br rounded-xl min-w-[140px]"
            :class="getTagGradient(index)"
          >
            <div class="text-white">
              <p class="font-bold">#{{ tag.name }}</p>
              <p class="text-xs opacity-80">{{ formatCount(tag.count) }} {{ $t('social.posts') }}</p>
            </div>
          </NuxtLink>
        </div>
      </section>

      <!-- Suggested Users -->
      <section v-if="activeCategory === 'all' || activeCategory === 'people'" class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">
            {{ $t('social.suggested_for_you') }}
          </h2>
          <button class="text-sm text-primary-500" @click="refreshSuggestions">
            <Icon name="heroicons:arrow-path" class="w-4 h-4" />
          </button>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div 
            v-for="user in suggestedUsers" 
            :key="user.pubkey"
            class="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-sm"
          >
            <NuxtLink :to="`/profile/${user.pubkey}`">
              <UAvatar :src="user.picture" size="xl" class="mx-auto mb-3" />
              <p class="font-semibold text-gray-900 dark:text-white truncate">
                {{ user.display_name }}
              </p>
              <p class="text-xs text-gray-500 truncate mb-3">
                @{{ user.name || 'nostr' }}
              </p>
            </NuxtLink>
            
            <p class="text-xs text-gray-500 mb-3">
              {{ user.mutualFollowers }} {{ $t('social.mutual_followers') }}
            </p>
            
            <UButton 
              :color="user.isFollowing ? 'gray' : 'primary'"
              :variant="user.isFollowing ? 'soft' : 'solid'"
              size="sm"
              block
              @click="toggleFollow(user)"
            >
              {{ user.isFollowing ? $t('social.following') : $t('social.follow') }}
            </UButton>
          </div>
        </div>
      </section>

      <!-- Trending Content Grid -->
      <section v-if="activeCategory === 'all' || activeCategory === 'trending'">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">
            {{ $t('social.explore') }}
          </h2>
          <div class="flex gap-2">
            <button 
              :class="gridView === 'grid' ? 'text-primary-500' : 'text-gray-400'"
              @click="gridView = 'grid'"
            >
              <Icon name="heroicons:squares-2x2" class="w-5 h-5" />
            </button>
            <button 
              :class="gridView === 'large' ? 'text-primary-500' : 'text-gray-400'"
              @click="gridView = 'large'"
            >
              <Icon name="heroicons:rectangle-stack" class="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <!-- Masonry Grid -->
        <div 
          class="grid gap-1"
          :class="gridView === 'grid' ? 'grid-cols-3' : 'grid-cols-2'"
        >
          <NuxtLink
            v-for="(item, index) in trendingContent"
            :key="item.id"
            :to="item.type === 'video' ? `/shorts?id=${item.id}` : `/notes/${item.id}`"
            class="relative aspect-square overflow-hidden bg-gray-200 dark:bg-gray-800"
            :class="{ 
              'row-span-2': gridView === 'grid' && (index === 0 || index === 7),
              'aspect-[4/5]': gridView === 'large'
            }"
          >
            <NuxtImg 
              :src="item.thumbnail || item.url" 
              class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              :alt="item.caption"
            />
            
            <!-- Video indicator -->
            <div v-if="item.type === 'video'" class="absolute top-2 right-2">
              <Icon name="heroicons:play-circle-solid" class="w-6 h-6 text-white drop-shadow-lg" />
            </div>
            
            <!-- Multiple images indicator -->
            <div v-if="item.imageCount > 1" class="absolute top-2 right-2">
              <Icon name="heroicons:squares-2x2-solid" class="w-5 h-5 text-white drop-shadow-lg" />
            </div>
            
            <!-- Stats overlay -->
            <div class="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <div class="flex gap-4 text-white">
                <div class="flex items-center gap-1">
                  <Icon name="heroicons:heart-solid" class="w-5 h-5" />
                  <span class="font-semibold">{{ formatCount(item.likes) }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <Icon name="heroicons:chat-bubble-left-solid" class="w-5 h-5" />
                  <span class="font-semibold">{{ formatCount(item.comments) }}</span>
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- Load More -->
        <div class="flex justify-center mt-6">
          <UButton 
            v-if="hasMore"
            color="gray" 
            variant="soft" 
            :loading="isLoadingMore"
            @click="loadMore"
          >
            {{ $t('common.load_more') }}
          </UButton>
        </div>
      </section>

      <!-- Live Now Section -->
      <section v-if="activeCategory === 'live'" class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span class="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            {{ $t('social.live_now') }}
          </h2>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div 
            v-for="stream in liveStreams"
            :key="stream.id"
            class="relative rounded-xl overflow-hidden aspect-video bg-gray-900"
          >
            <NuxtImg :src="stream.thumbnail" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            <div class="absolute top-2 left-2 flex items-center gap-2">
              <span class="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded">LIVE</span>
              <span class="px-2 py-0.5 bg-black/50 text-white text-xs rounded">
                {{ formatCount(stream.viewers) }} {{ $t('social.watching') }}
              </span>
            </div>
            
            <div class="absolute bottom-2 left-2 right-2">
              <div class="flex items-center gap-2">
                <UAvatar :src="stream.host.picture" size="sm" />
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-white text-sm truncate">{{ stream.title }}</p>
                  <p class="text-xs text-white/70 truncate">{{ stream.host.display_name }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <p v-if="liveStreams.length === 0" class="text-center text-gray-500 py-8">
          {{ $t('social.no_live_streams') }}
        </p>
      </section>

      <!-- Events Section -->
      <section v-if="activeCategory === 'events'">
        <div class="space-y-4">
          <div 
            v-for="event in upcomingEvents"
            :key="event.id"
            class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
          >
            <div class="flex gap-4">
              <div class="text-center bg-primary-50 dark:bg-primary-900/30 rounded-lg p-3 min-w-[60px]">
                <p class="text-xs text-primary-600 dark:text-primary-400 font-medium">
                  {{ event.month }}
                </p>
                <p class="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {{ event.day }}
                </p>
              </div>
              
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900 dark:text-white">{{ event.title }}</h3>
                <p class="text-sm text-gray-500 mt-1">{{ event.location }}</p>
                <div class="flex items-center gap-2 mt-2">
                  <div class="flex -space-x-2">
                    <UAvatar 
                      v-for="attendee in event.attendees.slice(0, 3)" 
                      :key="attendee.pubkey"
                      :src="attendee.picture" 
                      size="xs"
                      class="ring-2 ring-white dark:ring-gray-800"
                    />
                  </div>
                  <span class="text-xs text-gray-500">
                    +{{ event.attendees.length - 3 }} {{ $t('social.attending') }}
                  </span>
                </div>
              </div>
              
              <UButton color="primary" variant="soft" size="sm">
                {{ $t('social.interested') }}
              </UButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// State
const searchQuery = ref('')
const isSearchFocused = ref(false)
const activeCategory = ref('all')
const gridView = ref<'grid' | 'large'>('grid')
const isLoadingMore = ref(false)
const hasMore = ref(true)

// Categories
const categories = [
  { key: 'all', icon: 'heroicons:squares-2x2' },
  { key: 'trending', icon: 'heroicons:fire' },
  { key: 'people', icon: 'heroicons:users' },
  { key: 'live', icon: 'heroicons:signal' },
  { key: 'events', icon: 'heroicons:calendar' },
]

// Recent searches
const recentSearches = ref(['bitcoin', 'nostr', 'photography', 'music'])

// Demo data - replace with real Nostr data
const trendingHashtags = ref([
  { name: 'bitcoin', count: 125000 },
  { name: 'nostr', count: 89000 },
  { name: 'photography', count: 67000 },
  { name: 'music', count: 45000 },
  { name: 'art', count: 38000 },
  { name: 'tech', count: 32000 },
])

const suggestedUsers = ref([
  { pubkey: 'user1', display_name: 'Satoshi', name: 'satoshi', picture: 'https://i.pravatar.cc/150?u=1', mutualFollowers: 12, isFollowing: false },
  { pubkey: 'user2', display_name: 'Alice Bitcoin', name: 'alice', picture: 'https://i.pravatar.cc/150?u=2', mutualFollowers: 8, isFollowing: false },
  { pubkey: 'user3', display_name: 'Bob Nostr', name: 'bob', picture: 'https://i.pravatar.cc/150?u=3', mutualFollowers: 5, isFollowing: true },
  { pubkey: 'user4', display_name: 'Carol Dev', name: 'carol', picture: 'https://i.pravatar.cc/150?u=4', mutualFollowers: 3, isFollowing: false },
])

const trendingContent = ref([
  { id: '1', type: 'image', url: 'https://picsum.photos/400/400?random=1', thumbnail: 'https://picsum.photos/400/400?random=1', caption: '', likes: 1234, comments: 56, imageCount: 1 },
  { id: '2', type: 'video', url: '', thumbnail: 'https://picsum.photos/400/400?random=2', caption: '', likes: 5678, comments: 234, imageCount: 1 },
  { id: '3', type: 'image', url: 'https://picsum.photos/400/400?random=3', thumbnail: 'https://picsum.photos/400/400?random=3', caption: '', likes: 890, comments: 12, imageCount: 3 },
  { id: '4', type: 'image', url: 'https://picsum.photos/400/400?random=4', thumbnail: 'https://picsum.photos/400/400?random=4', caption: '', likes: 456, comments: 78, imageCount: 1 },
  { id: '5', type: 'video', url: '', thumbnail: 'https://picsum.photos/400/400?random=5', caption: '', likes: 2345, comments: 89, imageCount: 1 },
  { id: '6', type: 'image', url: 'https://picsum.photos/400/400?random=6', thumbnail: 'https://picsum.photos/400/400?random=6', caption: '', likes: 678, comments: 23, imageCount: 1 },
  { id: '7', type: 'image', url: 'https://picsum.photos/400/400?random=7', thumbnail: 'https://picsum.photos/400/400?random=7', caption: '', likes: 1111, comments: 44, imageCount: 2 },
  { id: '8', type: 'video', url: '', thumbnail: 'https://picsum.photos/400/400?random=8', caption: '', likes: 3456, comments: 123, imageCount: 1 },
  { id: '9', type: 'image', url: 'https://picsum.photos/400/400?random=9', thumbnail: 'https://picsum.photos/400/400?random=9', caption: '', likes: 789, comments: 34, imageCount: 1 },
])

const liveStreams = ref([
  { id: '1', title: 'Bitcoin Talk Show', thumbnail: 'https://picsum.photos/400/225?random=10', viewers: 1234, host: { display_name: 'BTC Max', picture: 'https://i.pravatar.cc/150?u=10' } },
  { id: '2', title: 'Nostr Development AMA', thumbnail: 'https://picsum.photos/400/225?random=11', viewers: 567, host: { display_name: 'Dev Alice', picture: 'https://i.pravatar.cc/150?u=11' } },
])

const upcomingEvents = ref([
  { id: '1', title: 'Bitcoin Conference 2025', month: 'DEC', day: '15', location: 'Miami, FL', attendees: [{ pubkey: '1', picture: 'https://i.pravatar.cc/150?u=20' }, { pubkey: '2', picture: 'https://i.pravatar.cc/150?u=21' }, { pubkey: '3', picture: 'https://i.pravatar.cc/150?u=22' }, { pubkey: '4', picture: '' }] },
  { id: '2', title: 'Nostr Meetup', month: 'DEC', day: '20', location: 'Online', attendees: [{ pubkey: '1', picture: 'https://i.pravatar.cc/150?u=23' }, { pubkey: '2', picture: 'https://i.pravatar.cc/150?u=24' }] },
])

// Methods
const performSearch = () => {
  if (!searchQuery.value.trim()) return
  
  // Add to recent searches
  if (!recentSearches.value.includes(searchQuery.value)) {
    recentSearches.value.unshift(searchQuery.value)
    recentSearches.value = recentSearches.value.slice(0, 10)
  }
  
  navigateTo(`/search?q=${encodeURIComponent(searchQuery.value)}`)
}

const clearSearch = () => {
  searchQuery.value = ''
}

const clearRecentSearches = () => {
  recentSearches.value = []
}

const handleBlur = () => {
  setTimeout(() => {
    isSearchFocused.value = false
  }, 200)
}

const refreshSuggestions = () => {
  // Shuffle suggestions
  suggestedUsers.value = [...suggestedUsers.value].sort(() => Math.random() - 0.5)
}

const toggleFollow = (user: any) => {
  user.isFollowing = !user.isFollowing
}

const loadMore = async () => {
  isLoadingMore.value = true
  // Simulate loading
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Add more content
  const newContent = Array.from({ length: 6 }, (_, i) => ({
    id: `new-${Date.now()}-${i}`,
    type: Math.random() > 0.7 ? 'video' : 'image',
    url: `https://picsum.photos/400/400?random=${Date.now() + i}`,
    thumbnail: `https://picsum.photos/400/400?random=${Date.now() + i}`,
    caption: '',
    likes: Math.floor(Math.random() * 5000),
    comments: Math.floor(Math.random() * 200),
    imageCount: 1,
  }))
  
  trendingContent.value.push(...newContent)
  isLoadingMore.value = false
}

const getTagGradient = (index: number) => {
  const gradients = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
    'from-teal-500 to-green-500',
  ]
  return gradients[index % gradients.length]
}

const formatCount = (count: number) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return count.toString()
}

// SEO
useHead({
  title: 'Discover | LocoBit Space'
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
