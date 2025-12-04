<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
    <!-- Desktop Layout -->
    <div class="hidden lg:flex h-screen">
      <!-- Left Panel - Tools -->
      <div class="w-80 bg-gray-900/50 border-r border-gray-800 flex flex-col">
        <!-- Header -->
        <div class="p-4 border-b border-gray-800">
          <div class="flex items-center gap-3">
            <UButton 
              icon="i-heroicons-arrow-left" 
              color="neutral" 
              variant="ghost"
              @click="$router.back()"
            />
            <h1 class="text-xl font-bold text-white">{{ $t('social.create_story') }}</h1>
          </div>
        </div>

        <!-- Tools Section -->
        <div class="flex-1 overflow-y-auto p-4 space-y-6">
          <!-- Media Upload -->
          <div class="space-y-3">
            <h3 class="text-sm font-medium text-gray-400 uppercase tracking-wide">Media</h3>
            <div class="grid grid-cols-2 gap-3">
              <button 
                class="desktop-tool-card"
                @click="openMediaPicker"
              >
                <div class="tool-icon-lg bg-gradient-to-br from-pink-500 to-orange-400">
                  <Icon name="heroicons:photo" class="w-6 h-6" />
                </div>
                <span class="text-sm text-gray-300">{{ $t('social.gallery') }}</span>
              </button>
              
              <button 
                class="desktop-tool-card"
                @click="openCamera"
              >
                <div class="tool-icon-lg bg-gradient-to-br from-blue-500 to-cyan-400">
                  <Icon name="heroicons:camera" class="w-6 h-6" />
                </div>
                <span class="text-sm text-gray-300">{{ $t('social.camera') }}</span>
              </button>
            </div>
          </div>

          <!-- Text Tools -->
          <div class="space-y-3">
            <h3 class="text-sm font-medium text-gray-400 uppercase tracking-wide">{{ $t('social.text') }}</h3>
            <UTextarea 
              v-model="storyText"
              :placeholder="$t('social.type_something')"
              :rows="3"
              class="bg-gray-800/50"
            />
            
            <!-- Font Selection -->
            <div class="flex gap-2 flex-wrap">
              <button 
                v-for="font in fonts"
                :key="font.name"
                class="px-3 py-1.5 rounded-lg text-sm transition-all"
                :class="selectedFont === font.value ? 'bg-primary-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
                :style="{ fontFamily: font.value }"
                @click="selectedFont = font.value"
              >
                {{ font.name }}
              </button>
            </div>

            <!-- Text Colors -->
            <div class="flex gap-2 flex-wrap">
              <button 
                v-for="color in textColors"
                :key="color"
                class="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                :class="textColor === color ? 'border-white scale-110' : 'border-transparent'"
                :style="{ backgroundColor: color }"
                @click="textColor = color"
              />
            </div>

            <!-- Text Background -->
            <div class="flex gap-2 flex-wrap">
              <button 
                v-for="bg in bgColors"
                :key="bg.value"
                class="w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 flex items-center justify-center"
                :class="textBgColor === bg.value ? 'border-white scale-110' : 'border-gray-600'"
                :style="{ backgroundColor: bg.value === 'transparent' ? '#374151' : bg.value }"
                @click="textBgColor = bg.value"
              >
                <Icon v-if="bg.value === 'transparent'" name="heroicons:x-mark" class="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          <!-- Stickers -->
          <div class="space-y-3">
            <h3 class="text-sm font-medium text-gray-400 uppercase tracking-wide">{{ $t('social.stickers') }}</h3>
            <div class="flex gap-2 overflow-x-auto pb-2">
              <button 
                v-for="cat in stickerCategories"
                :key="cat.name"
                class="px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all"
                :class="selectedStickerCat === cat.name ? 'bg-primary-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
                @click="selectedStickerCat = cat.name"
              >
                {{ cat.icon }}
              </button>
            </div>
            <div class="grid grid-cols-8 gap-1">
              <button 
                v-for="emoji in currentStickers"
                :key="emoji"
                class="text-xl p-1.5 hover:bg-gray-700 rounded-lg transition-transform hover:scale-125"
                @click="addSticker(emoji)"
              >
                {{ emoji }}
              </button>
            </div>
          </div>

          <!-- Filters (only if media selected) -->
          <div v-if="selectedMedia && mediaType === 'image'" class="space-y-3">
            <h3 class="text-sm font-medium text-gray-400 uppercase tracking-wide">{{ $t('social.filters') }}</h3>
            <div class="flex gap-2 overflow-x-auto pb-2">
              <button 
                v-for="filter in filters"
                :key="filter.name"
                class="flex-shrink-0 text-center"
                @click="applyFilter(filter)"
              >
                <div 
                  class="w-14 h-14 rounded-lg overflow-hidden mb-1 border-2 transition-all"
                  :class="selectedFilter === filter.css ? 'border-primary-500' : 'border-transparent'"
                >
                  <img 
                    :src="selectedMedia"
                    class="w-full h-full object-cover"
                    :style="{ filter: filter.css }"
                  />
                </div>
                <span class="text-xs text-gray-400">{{ filter.name }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Caption & Post -->
        <div class="p-4 border-t border-gray-800 space-y-4">
          <UTextarea 
            v-model="caption"
            :placeholder="$t('social.add_caption')"
            :rows="2"
            class="bg-gray-800/50"
          />
          <UButton 
            block 
            color="primary" 
            size="lg"
            :loading="isPosting"
            :disabled="!canPost"
            @click="postStory"
          >
            <Icon name="heroicons:paper-airplane" class="w-5 h-5 mr-2" />
            {{ $t('social.share') }}
          </UButton>
        </div>
      </div>

      <!-- Center - Story Preview -->
      <div class="flex-1 flex items-center justify-center p-8 bg-black/30">
        <div class="relative">
          <!-- Phone Frame -->
          <div class="relative w-[320px] h-[640px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl border-4 border-gray-800">
            <!-- Notch -->
            <div class="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-2xl z-10" />
            
            <!-- Story Content -->
            <div class="relative w-full h-full bg-gray-800 rounded-[2.25rem] overflow-hidden">
              <!-- Media Preview -->
              <div v-if="selectedMedia" class="absolute inset-0">
                <video 
                  v-if="mediaType === 'video'"
                  ref="videoPreview"
                  :src="selectedMedia"
                  class="w-full h-full object-cover"
                  playsinline
                  muted
                  loop
                  autoplay
                />
                <img 
                  v-else
                  :src="selectedMedia"
                  class="w-full h-full object-cover"
                  :style="{ filter: selectedFilter }"
                />
              </div>

              <!-- Placeholder -->
              <div v-else class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
                <div class="text-center p-6">
                  <div class="w-16 h-16 mx-auto mb-4 bg-gray-600/50 rounded-full flex items-center justify-center">
                    <Icon name="heroicons:photo" class="w-8 h-8 text-gray-400" />
                  </div>
                  <p class="text-gray-400 text-sm">{{ $t('social.add_photo_or_video') }}</p>
                </div>
              </div>

              <!-- Text Overlay -->
              <div 
                v-if="storyText"
                class="absolute inset-0 flex items-center justify-center p-6 pointer-events-none"
              >
                <div 
                  class="text-lg font-bold text-center drop-shadow-lg p-3 rounded-lg max-w-full"
                  :style="{ 
                    fontFamily: selectedFont,
                    color: textColor,
                    backgroundColor: textBgColor 
                  }"
                >
                  {{ storyText }}
                </div>
              </div>

              <!-- Stickers Layer -->
              <div class="absolute inset-0 pointer-events-none">
                <div 
                  v-for="(sticker, index) in stickers"
                  :key="index"
                  class="absolute text-3xl transform -translate-x-1/2 -translate-y-1/2"
                  :style="{ left: `${sticker.x}%`, top: `${sticker.y}%` }"
                >
                  {{ sticker.emoji }}
                </div>
              </div>

              <!-- Remove Media Button -->
              <button 
                v-if="selectedMedia"
                class="absolute top-4 right-4 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors z-10"
                @click="removeMedia"
              >
                <Icon name="heroicons:x-mark" class="w-4 h-4" />
              </button>

              <!-- Story Header Preview -->
              <div class="absolute top-4 left-4 right-12 flex items-center gap-2 z-10">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-pink-500" />
                <div>
                  <p class="text-white text-xs font-medium">Your Story</p>
                  <p class="text-gray-300 text-xs">Just now</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Clear Stickers Button -->
          <button 
            v-if="stickers.length > 0"
            class="absolute -bottom-12 left-1/2 -translate-x-1/2 text-sm text-gray-400 hover:text-white transition-colors"
            @click="stickers = []"
          >
            Clear all stickers
          </button>
        </div>
      </div>

      <!-- Right Panel - Tips -->
      <div class="w-72 bg-gray-900/30 border-l border-gray-800 p-6 hidden xl:block">
        <h3 class="text-lg font-bold text-white mb-4">Story Tips</h3>
        <div class="space-y-4">
          <div class="flex gap-3 text-sm">
            <div class="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
              <Icon name="heroicons:light-bulb" class="w-4 h-4 text-primary-400" />
            </div>
            <p class="text-gray-400">Stories disappear after 24 hours, perfect for casual moments!</p>
          </div>
          <div class="flex gap-3 text-sm">
            <div class="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
              <Icon name="heroicons:sparkles" class="w-4 h-4 text-pink-400" />
            </div>
            <p class="text-gray-400">Add stickers and text to make your story more engaging</p>
          </div>
          <div class="flex gap-3 text-sm">
            <div class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Icon name="heroicons:photo" class="w-4 h-4 text-blue-400" />
            </div>
            <p class="text-gray-400">Use filters to enhance your photos with one tap</p>
          </div>
          <div class="flex gap-3 text-sm">
            <div class="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <Icon name="heroicons:bolt" class="w-4 h-4 text-yellow-400" />
            </div>
            <p class="text-gray-400">Your followers will see your story at the top of their feed</p>
          </div>
        </div>

        <!-- Keyboard Shortcuts -->
        <div class="mt-8">
          <h4 class="text-sm font-medium text-gray-500 mb-3">Keyboard Shortcuts</h4>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between text-gray-400">
              <span>Post Story</span>
              <kbd class="px-2 py-0.5 bg-gray-800 rounded">⌘ + Enter</kbd>
            </div>
            <div class="flex justify-between text-gray-400">
              <span>Add Media</span>
              <kbd class="px-2 py-0.5 bg-gray-800 rounded">⌘ + O</kbd>
            </div>
            <div class="flex justify-between text-gray-400">
              <span>Go Back</span>
              <kbd class="px-2 py-0.5 bg-gray-800 rounded">Esc</kbd>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Layout -->
    <div class="lg:hidden min-h-screen flex flex-col">
      <!-- Header -->
      <div class="sticky top-0 z-40 flex items-center justify-between p-4 bg-black/80 backdrop-blur-lg">
        <UButton 
          icon="i-heroicons-x-mark" 
          color="neutral" 
          variant="ghost"
          @click="$router.back()"
        />
        
        <h1 class="text-white font-semibold">{{ $t('social.create_story') }}</h1>
        
        <UButton 
          color="primary"
          :loading="isPosting"
          :disabled="!canPost"
          @click="postStory"
        >
          {{ $t('social.share') }}
        </UButton>
      </div>

      <!-- Story Preview -->
      <div class="flex-1 flex items-center justify-center p-4">
        <div class="relative aspect-[9/16] w-full max-w-sm bg-gray-900 overflow-hidden rounded-2xl">
          <!-- Media Preview -->
          <div v-if="selectedMedia" class="absolute inset-0">
            <video 
              v-if="mediaType === 'video'"
              ref="videoPreviewMobile"
              :src="selectedMedia"
              class="w-full h-full object-cover"
              playsinline
              muted
              loop
              autoplay
            />
            <img 
              v-else
              :src="selectedMedia"
              class="w-full h-full object-cover"
              :style="{ filter: selectedFilter }"
            />
          </div>

          <!-- Placeholder -->
          <div v-else class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <div class="text-center p-8">
              <div class="w-20 h-20 mx-auto mb-4 bg-gray-700/50 rounded-full flex items-center justify-center">
                <Icon name="heroicons:photo" class="w-10 h-10 text-gray-400" />
              </div>
              <p class="text-gray-400 mb-4">{{ $t('social.add_photo_or_video') }}</p>
              <UButton color="primary" @click="openMediaPicker">
                <Icon name="heroicons:plus" class="w-4 h-4 mr-2" />
                {{ $t('social.gallery') }}
              </UButton>
            </div>
          </div>

          <!-- Text Overlay -->
          <div 
            v-if="storyText"
            class="absolute inset-0 flex items-center justify-center p-8 pointer-events-none"
          >
            <div 
              class="text-2xl font-bold text-center drop-shadow-lg p-4 rounded-lg"
              :style="{ 
                fontFamily: selectedFont,
                color: textColor,
                backgroundColor: textBgColor 
              }"
            >
              {{ storyText }}
            </div>
          </div>

          <!-- Stickers Layer -->
          <div class="absolute inset-0 pointer-events-none">
            <div 
              v-for="(sticker, index) in stickers"
              :key="index"
              class="absolute text-4xl transform -translate-x-1/2 -translate-y-1/2"
              :style="{ left: `${sticker.x}%`, top: `${sticker.y}%` }"
            >
              {{ sticker.emoji }}
            </div>
          </div>

          <!-- Remove Media Button -->
          <button 
            v-if="selectedMedia"
            class="absolute top-3 right-3 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
            @click="removeMedia"
          >
            <Icon name="heroicons:x-mark" class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Tools Panel -->
      <div class="bg-black/90 backdrop-blur-lg p-4 space-y-4 pb-8">
        <!-- Caption Input -->
        <div class="flex gap-2">
          <UInput 
            v-model="caption"
            :placeholder="$t('social.add_caption')"
            class="flex-1"
            color="neutral"
            variant="subtle"
          />
        </div>

        <!-- Quick Actions -->
        <div class="flex justify-around">
          <button class="tool-btn" @click="openMediaPicker">
            <div class="tool-icon bg-gradient-to-br from-pink-500 to-orange-400">
              <Icon name="heroicons:photo" class="w-5 h-5" />
            </div>
            <span class="text-xs text-gray-400">{{ $t('social.gallery') }}</span>
          </button>
          
          <button class="tool-btn" @click="openCamera">
            <div class="tool-icon bg-gradient-to-br from-blue-500 to-cyan-400">
              <Icon name="heroicons:camera" class="w-5 h-5" />
            </div>
            <span class="text-xs text-gray-400">{{ $t('social.camera') }}</span>
          </button>
          
          <button class="tool-btn" @click="showTextEditor = true">
            <div class="tool-icon bg-gradient-to-br from-purple-500 to-pink-400">
              <Icon name="heroicons:pencil" class="w-5 h-5" />
            </div>
            <span class="text-xs text-gray-400">{{ $t('social.text') }}</span>
          </button>
          
          <button class="tool-btn" @click="showStickers = true">
            <div class="tool-icon bg-gradient-to-br from-yellow-500 to-orange-400">
              <Icon name="heroicons:face-smile" class="w-5 h-5" />
            </div>
            <span class="text-xs text-gray-400">{{ $t('social.stickers') }}</span>
          </button>
          
          <button class="tool-btn" @click="showFilters = true" :disabled="!selectedMedia">
            <div class="tool-icon bg-gradient-to-br from-green-500 to-teal-400" :class="{ 'opacity-50': !selectedMedia }">
              <Icon name="heroicons:sparkles" class="w-5 h-5" />
            </div>
            <span class="text-xs text-gray-400">{{ $t('social.filters') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Hidden File Inputs -->
    <input 
      ref="fileInput"
      type="file" 
      accept="image/*,video/*" 
      class="hidden"
      @change="handleFileSelect"
    />
    <input 
      ref="cameraInput"
      type="file" 
      accept="image/*"
      capture="environment"
      class="hidden"
      @change="handleFileSelect"
    />

    <!-- Mobile Text Editor Modal -->
    <UModal v-model:open="showTextEditor">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-bold">{{ $t('social.add_text') }}</h3>
              <UButton icon="i-heroicons-x-mark" color="neutral" variant="ghost" @click="showTextEditor = false" />
            </div>
          </template>

          <div class="space-y-4">
            <UTextarea 
              v-model="storyText"
              :placeholder="$t('social.type_something')"
              :rows="3"
              autofocus
            />

            <div>
              <label class="text-sm text-gray-500 mb-2 block">{{ $t('social.font') }}</label>
              <div class="flex gap-2 flex-wrap">
                <button 
                  v-for="font in fonts"
                  :key="font.name"
                  class="px-4 py-2 rounded-lg border-2 transition-all"
                  :class="selectedFont === font.value ? 'border-primary-500 bg-primary-500/10' : 'border-gray-200 dark:border-gray-700'"
                  :style="{ fontFamily: font.value }"
                  @click="selectedFont = font.value"
                >
                  {{ font.name }}
                </button>
              </div>
            </div>

            <div>
              <label class="text-sm text-gray-500 mb-2 block">{{ $t('social.color') }}</label>
              <div class="flex gap-2 flex-wrap">
                <button 
                  v-for="color in textColors"
                  :key="color"
                  class="w-10 h-10 rounded-full border-4 transition-transform hover:scale-110"
                  :class="textColor === color ? 'border-primary-500 scale-110' : 'border-transparent'"
                  :style="{ backgroundColor: color }"
                  @click="textColor = color"
                />
              </div>
            </div>

            <div>
              <label class="text-sm text-gray-500 mb-2 block">Background</label>
              <div class="flex gap-2 flex-wrap">
                <button 
                  v-for="bg in bgColors"
                  :key="bg.value"
                  class="w-10 h-10 rounded-lg border-4 transition-transform hover:scale-110 flex items-center justify-center"
                  :class="textBgColor === bg.value ? 'border-primary-500 scale-110' : 'border-gray-200 dark:border-gray-700'"
                  :style="{ backgroundColor: bg.value }"
                  @click="textBgColor = bg.value"
                >
                  <Icon v-if="bg.value === 'transparent'" name="heroicons:x-mark" class="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          <template #footer>
            <div class="flex gap-2">
              <UButton color="neutral" variant="soft" class="flex-1" @click="clearText">
                Clear
              </UButton>
              <UButton color="primary" class="flex-1" @click="showTextEditor = false">
                {{ $t('common.done') }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <!-- Mobile Stickers Modal -->
    <UModal v-model:open="showStickers">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-bold">{{ $t('social.stickers') }}</h3>
              <UButton icon="i-heroicons-x-mark" color="neutral" variant="ghost" @click="showStickers = false" />
            </div>
          </template>
          
          <div class="flex gap-2 mb-4 overflow-x-auto pb-2">
            <UButton 
              v-for="cat in stickerCategories"
              :key="cat.name"
              :color="selectedStickerCat === cat.name ? 'primary' : 'neutral'"
              :variant="selectedStickerCat === cat.name ? 'solid' : 'soft'"
              size="sm"
              @click="selectedStickerCat = cat.name"
            >
              {{ cat.icon }} {{ cat.name }}
            </UButton>
          </div>
          
          <div class="grid grid-cols-8 gap-2 max-h-60 overflow-y-auto">
            <button 
              v-for="emoji in currentStickers"
              :key="emoji"
              class="text-2xl p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-transform hover:scale-125"
              @click="addSticker(emoji)"
            >
              {{ emoji }}
            </button>
          </div>
        </UCard>
      </template>
    </UModal>

    <!-- Mobile Filters Modal -->
    <UModal v-model:open="showFilters">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-bold">{{ $t('social.filters') }}</h3>
              <UButton icon="i-heroicons-x-mark" color="neutral" variant="ghost" @click="showFilters = false" />
            </div>
          </template>
          
          <div class="flex gap-3 overflow-x-auto pb-2">
            <button 
              v-for="filter in filters"
              :key="filter.name"
              class="flex-shrink-0 text-center"
              @click="applyFilter(filter)"
            >
              <div 
                class="w-20 h-20 rounded-xl overflow-hidden mb-2 border-2 transition-all"
                :class="selectedFilter === filter.css ? 'border-primary-500 scale-105' : 'border-transparent'"
              >
                <img 
                  v-if="selectedMedia && mediaType === 'image'"
                  :src="selectedMedia"
                  class="w-full h-full object-cover"
                  :style="{ filter: filter.css }"
                />
                <div v-else class="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" :style="{ filter: filter.css }" />
              </div>
              <span class="text-xs font-medium">{{ filter.name }}</span>
            </button>
          </div>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
// Composables
const toast = useToast()
const { t } = useI18n()
const router = useRouter()

// State
const selectedMedia = ref<string | null>(null)
const mediaFile = ref<File | null>(null)
const mediaType = ref<'image' | 'video'>('image')
const caption = ref('')
const storyText = ref('')
const selectedFont = ref('system-ui, sans-serif')
const textColor = ref('#ffffff')
const textBgColor = ref('transparent')
const selectedFilter = ref('none')
const isPosting = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const cameraInput = ref<HTMLInputElement | null>(null)
const videoPreview = ref<HTMLVideoElement | null>(null)
const videoPreviewMobile = ref<HTMLVideoElement | null>(null)

// UI States
const showTextEditor = ref(false)
const showStickers = ref(false)
const showFilters = ref(false)
const selectedStickerCat = ref('Smileys')

// Stickers
const stickers = ref<{ emoji: string; x: number; y: number }[]>([])

// Computed
const canPost = computed(() => {
  return selectedMedia.value || storyText.value.trim()
})

// Options
const fonts = [
  { name: 'Sans', value: 'system-ui, sans-serif' },
  { name: 'Serif', value: 'Georgia, serif' },
  { name: 'Mono', value: 'ui-monospace, monospace' },
  { name: 'Fun', value: 'Comic Sans MS, cursive' },
]

const textColors = ['#ffffff', '#000000', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

const bgColors = [
  { name: 'None', value: 'transparent' },
  { name: 'White', value: 'rgba(255,255,255,0.9)' },
  { name: 'Black', value: 'rgba(0,0,0,0.7)' },
  { name: 'Blue', value: 'rgba(59,130,246,0.8)' },
  { name: 'Pink', value: 'rgba(236,72,153,0.8)' },
  { name: 'Purple', value: 'rgba(139,92,246,0.8)' },
]

const stickerCategories = [
  { name: 'Smileys', icon: '😀', stickers: ['😀', '😂', '🥰', '😎', '🤩', '🥳', '😇', '🤗', '😍', '🥺', '😢', '😤', '🤯', '😴', '🤔', '🙄'] },
  { name: 'Love', icon: '❤️', stickers: ['❤️', '💜', '💙', '💚', '💛', '🧡', '🖤', '🤍', '💕', '💗', '💖', '💘', '💝', '😘', '🥰', '😍'] },
  { name: 'Fun', icon: '🎉', stickers: ['🎉', '🎊', '🔥', '💯', '⭐', '✨', '🌟', '💫', '🚀', '🎸', '🎮', '🎯', '🏆', '🎁', '🎈', '🎀'] },
  { name: 'Nature', icon: '🌈', stickers: ['🌈', '☀️', '🌙', '⚡', '🌸', '🌺', '🌻', '🍀', '🌴', '🌊', '❄️', '🔮', '🦋', '🌹', '🍂', '🍁'] },
  { name: 'Gestures', icon: '👍', stickers: ['👍', '👎', '👏', '🙌', '🤝', '✌️', '🤞', '🤘', '🤟', '👌', '🫶', '💪', '🙏', '👋', '✋', '🫡'] },
  { name: 'Food', icon: '🍕', stickers: ['🍕', '🍔', '🍟', '🌭', '🍿', '🧁', '🍩', '🍪', '☕', '🧋', '🍺', '🍷', '🍾', '🥂', '🍜', '🍣'] },
]

const currentStickers = computed(() => {
  return stickerCategories.find(c => c.name === selectedStickerCat.value)?.stickers || []
})

const filters = [
  { name: 'None', css: 'none' },
  { name: 'Vivid', css: 'saturate(1.5) contrast(1.1)' },
  { name: 'Warm', css: 'sepia(0.3) saturate(1.2)' },
  { name: 'Cool', css: 'hue-rotate(20deg) saturate(1.1)' },
  { name: 'B&W', css: 'grayscale(1)' },
  { name: 'Vintage', css: 'sepia(0.5) contrast(0.9) brightness(1.1)' },
  { name: 'Drama', css: 'contrast(1.3) brightness(0.9)' },
  { name: 'Fade', css: 'contrast(0.9) brightness(1.1) saturate(0.8)' },
]

// Methods
const openMediaPicker = () => {
  fileInput.value?.click()
}

const openCamera = () => {
  cameraInput.value?.click()
}

const handleFileSelect = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  // Validate file size (max 50MB for video, 10MB for image)
  const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024
  if (file.size > maxSize) {
    toast.add({ 
      title: file.type.startsWith('video/') ? 'Video too large (max 50MB)' : 'Image too large (max 10MB)', 
      color: 'error' 
    })
    return
  }

  mediaType.value = file.type.startsWith('video/') ? 'video' : 'image'
  mediaFile.value = file
  selectedMedia.value = URL.createObjectURL(file)
  selectedFilter.value = 'none'
  
  // Reset input
  if (fileInput.value) fileInput.value.value = ''
  if (cameraInput.value) cameraInput.value.value = ''
}

const removeMedia = () => {
  if (selectedMedia.value) {
    URL.revokeObjectURL(selectedMedia.value)
  }
  selectedMedia.value = null
  mediaFile.value = null
  selectedFilter.value = 'none'
}

const clearText = () => {
  storyText.value = ''
  textColor.value = '#ffffff'
  textBgColor.value = 'transparent'
  selectedFont.value = 'system-ui, sans-serif'
}

const addSticker = (emoji: string) => {
  stickers.value.push({
    emoji,
    x: 30 + Math.random() * 40,
    y: 30 + Math.random() * 40,
  })
  showStickers.value = false
}

const applyFilter = (filter: { name: string; css: string }) => {
  selectedFilter.value = filter.css
  showFilters.value = false
}

const postStory = async () => {
  if (!canPost.value) return

  isPosting.value = true

  try {
    // TODO: Implement actual story posting via Nostr
    // This would involve:
    // 1. Upload media to storage (if any)
    // 2. Create Nostr event with story data
    // 3. Publish to relays
    
    await new Promise(resolve => setTimeout(resolve, 1500))

    toast.add({ 
      title: t('common.success'), 
      description: 'Story posted successfully!',
      color: 'success' 
    })
    navigateTo('/feed')
  } catch (e) {
    toast.add({ 
      title: t('common.error'), 
      description: 'Failed to post story',
      color: 'error' 
    })
  } finally {
    isPosting.value = false
  }
}

// Cleanup
onUnmounted(() => {
  if (selectedMedia.value) {
    URL.revokeObjectURL(selectedMedia.value)
  }
})

// Keyboard shortcuts
onMounted(() => {
  const handleKeydown = (e: KeyboardEvent) => {
    // Cmd/Ctrl + Enter to post
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      if (canPost.value) postStory()
    }
    // Cmd/Ctrl + O to open file picker
    if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
      e.preventDefault()
      openMediaPicker()
    }
    // Escape to go back
    if (e.key === 'Escape') {
      router.back()
    }
  }
  
  window.addEventListener('keydown', handleKeydown)
  
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
})

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
  gap: 0.5rem;
}

.tool-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: transform 0.15s;
}

.tool-btn:hover .tool-icon {
  transform: scale(1.1);
}

.tool-btn:active .tool-icon {
  transform: scale(0.95);
}

/* Desktop tool cards */
.desktop-tool-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(55, 65, 81, 0.3);
  border-radius: 0.75rem;
  transition: all 0.15s;
  border: 1px solid transparent;
}

.desktop-tool-card:hover {
  background: rgba(55, 65, 81, 0.5);
  border-color: rgba(139, 92, 246, 0.3);
}

.tool-icon-lg {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}
</style>
