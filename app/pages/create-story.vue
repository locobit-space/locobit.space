<template>
  <div class="min-h-screen bg-black">
    <!-- Header -->
    <div class="sticky top-0 z-40 flex items-center justify-between p-4 bg-black/80 backdrop-blur-lg">
      <UButton 
        icon="i-heroicons-x-mark" 
        color="white" 
        variant="ghost"
        @click="$router.back()"
      />
      
      <h1 class="text-white font-semibold">{{ $t('social.create_story') }}</h1>
      
      <UButton 
        color="primary"
        :loading="isPosting"
        :disabled="!selectedMedia"
        @click="postStory"
      >
        {{ $t('social.share') }}
      </UButton>
    </div>

    <!-- Story Preview -->
    <div class="relative aspect-[9/16] max-w-md mx-auto bg-gray-900">
      <!-- Media Preview -->
      <div v-if="selectedMedia" class="absolute inset-0">
        <video 
          v-if="mediaType === 'video'"
          :src="selectedMedia"
          class="w-full h-full object-cover"
          controls
          playsinline
        />
        <NuxtImg 
          v-else
          :src="selectedMedia"
          class="w-full h-full object-cover"
        />
      </div>

      <!-- Placeholder -->
      <div v-else class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <Icon name="heroicons:photo" class="w-16 h-16 text-gray-500 mb-4" />
          <p class="text-gray-400">{{ $t('social.add_photo_or_video') }}</p>
        </div>
      </div>

      <!-- Text Overlay -->
      <div 
        v-if="storyText"
        class="absolute inset-0 flex items-center justify-center p-8"
      >
        <p 
          class="text-2xl font-bold text-white text-center drop-shadow-lg"
          :style="{ 
            fontFamily: selectedFont,
            color: textColor 
          }"
        >
          {{ storyText }}
        </p>
      </div>

      <!-- Stickers Layer -->
      <div class="absolute inset-0 pointer-events-none">
        <div 
          v-for="(sticker, index) in stickers"
          :key="index"
          class="absolute text-4xl"
          :style="{ left: `${sticker.x}%`, top: `${sticker.y}%` }"
        >
          {{ sticker.emoji }}
        </div>
      </div>
    </div>

    <!-- Tools Panel -->
    <div class="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg p-4 space-y-4">
      <!-- Caption Input -->
      <div class="flex gap-2">
        <UInput 
          v-model="caption"
          :placeholder="$t('social.add_caption')"
          class="flex-1"
          variant="none"
          :ui="{ wrapper: 'bg-gray-800 rounded-lg' }"
        />
      </div>

      <!-- Quick Actions -->
      <div class="flex justify-around">
        <button class="tool-btn" @click="openMediaPicker">
          <Icon name="heroicons:photo" class="w-6 h-6" />
          <span class="text-xs">{{ $t('social.gallery') }}</span>
        </button>
        
        <button class="tool-btn" @click="openCamera">
          <Icon name="heroicons:camera" class="w-6 h-6" />
          <span class="text-xs">{{ $t('social.camera') }}</span>
        </button>
        
        <button class="tool-btn" @click="showTextEditor = true">
          <Icon name="heroicons:pencil" class="w-6 h-6" />
          <span class="text-xs">{{ $t('social.text') }}</span>
        </button>
        
        <button class="tool-btn" @click="showStickers = true">
          <Icon name="heroicons:face-smile" class="w-6 h-6" />
          <span class="text-xs">{{ $t('social.stickers') }}</span>
        </button>
        
        <button class="tool-btn" @click="showFilters = true">
          <Icon name="heroicons:sparkles" class="w-6 h-6" />
          <span class="text-xs">{{ $t('social.filters') }}</span>
        </button>
      </div>

      <!-- File Input (hidden) -->
      <input 
        ref="fileInput"
        type="file" 
        accept="image/*,video/*" 
        class="hidden"
        @change="handleFileSelect"
      />
    </div>

    <!-- Text Editor Modal -->
    <UModal v-model="showTextEditor">
      <UCard>
        <template #header>
          <h3 class="font-bold">{{ $t('social.add_text') }}</h3>
        </template>

        <div class="space-y-4">
          <UTextarea 
            v-model="storyText"
            :placeholder="$t('social.type_something')"
            :rows="3"
            autofocus
          />

          <!-- Font Selection -->
          <div>
            <label class="text-sm text-gray-500 mb-2 block">{{ $t('social.font') }}</label>
            <div class="flex gap-2">
              <button 
                v-for="font in fonts"
                :key="font.name"
                class="px-3 py-2 rounded-lg border"
                :class="selectedFont === font.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200'"
                :style="{ fontFamily: font.value }"
                @click="selectedFont = font.value"
              >
                Aa
              </button>
            </div>
          </div>

          <!-- Color Selection -->
          <div>
            <label class="text-sm text-gray-500 mb-2 block">{{ $t('social.color') }}</label>
            <div class="flex gap-2">
              <button 
                v-for="color in colors"
                :key="color"
                class="w-8 h-8 rounded-full border-2"
                :class="textColor === color ? 'border-gray-800' : 'border-transparent'"
                :style="{ backgroundColor: color }"
                @click="textColor = color"
              />
            </div>
          </div>
        </div>

        <template #footer>
          <UButton block @click="showTextEditor = false">
            {{ $t('common.done') }}
          </UButton>
        </template>
      </UCard>
    </UModal>

    <!-- Stickers Modal -->
    <USlideover v-model="showStickers" side="bottom">
      <div class="p-4">
        <h3 class="font-bold mb-4">{{ $t('social.stickers') }}</h3>
        
        <div class="grid grid-cols-8 gap-2">
          <button 
            v-for="emoji in emojiStickers"
            :key="emoji"
            class="text-2xl p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            @click="addSticker(emoji)"
          >
            {{ emoji }}
          </button>
        </div>
      </div>
    </USlideover>

    <!-- Filters Modal -->
    <USlideover v-model="showFilters" side="bottom">
      <div class="p-4">
        <h3 class="font-bold mb-4">{{ $t('social.filters') }}</h3>
        
        <div class="flex gap-3 overflow-x-auto pb-2">
          <button 
            v-for="filter in filters"
            :key="filter.name"
            class="flex-shrink-0 text-center"
            @click="selectedFilter = filter.name"
          >
            <div 
              class="w-16 h-16 rounded-lg bg-gray-200 mb-1"
              :class="{ 'ring-2 ring-primary-500': selectedFilter === filter.name }"
              :style="{ filter: filter.css }"
            />
            <span class="text-xs">{{ filter.name }}</span>
          </button>
        </div>
      </div>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
// Composables
const toast = useToast()

// State
const selectedMedia = ref<string | null>(null)
const mediaType = ref<'image' | 'video'>('image')
const caption = ref('')
const storyText = ref('')
const selectedFont = ref('sans-serif')
const textColor = ref('#ffffff')
const selectedFilter = ref('none')
const isPosting = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// UI States
const showTextEditor = ref(false)
const showStickers = ref(false)
const showFilters = ref(false)

// Stickers
const stickers = ref<{ emoji: string; x: number; y: number }[]>([])

// Options
const fonts = [
  { name: 'Sans', value: 'sans-serif' },
  { name: 'Serif', value: 'serif' },
  { name: 'Mono', value: 'monospace' },
  { name: 'Cursive', value: 'cursive' },
]

const colors = ['#ffffff', '#000000', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']

const emojiStickers = ['😀', '😂', '🥰', '😎', '🤩', '🥳', '🔥', '💯', '❤️', '💜', '⭐', '✨', '🎉', '🎊', '👍', '🙏', '💪', '🚀', '🌟', '💫', '🌈', '☀️', '🌙', '⚡']

const filters = [
  { name: 'None', css: 'none' },
  { name: 'Vivid', css: 'saturate(1.5)' },
  { name: 'Warm', css: 'sepia(0.3)' },
  { name: 'Cool', css: 'hue-rotate(30deg)' },
  { name: 'B&W', css: 'grayscale(1)' },
  { name: 'Vintage', css: 'sepia(0.5) contrast(0.9)' },
]

// Methods
const openMediaPicker = () => {
  fileInput.value?.click()
}

const openCamera = () => {
  // In a real app, this would open the camera
  toast.add({ title: 'Camera feature coming soon!' })
}

const handleFileSelect = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  mediaType.value = file.type.startsWith('video/') ? 'video' : 'image'
  selectedMedia.value = URL.createObjectURL(file)
}

const addSticker = (emoji: string) => {
  stickers.value.push({
    emoji,
    x: 30 + Math.random() * 40, // Random position
    y: 30 + Math.random() * 40,
  })
  showStickers.value = false
}

const postStory = async () => {
  if (!selectedMedia.value) return

  isPosting.value = true

  try {
    // TODO: Implement story posting via Nostr
    await new Promise(resolve => setTimeout(resolve, 1500))

    toast.add({ title: 'Story posted!', color: 'green' })
    navigateTo('/feed')
  } catch (e) {
    toast.add({ title: 'Failed to post story', color: 'red' })
  } finally {
    isPosting.value = false
  }
}

// SEO
useHead({
  title: 'Create Story | LocoBit Space'
})
</script>

<style scoped>
.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  color: white;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background-color 0.15s;
}

.tool-btn:hover {
  background-color: rgb(31 41 55);
}
</style>
