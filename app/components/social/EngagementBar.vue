<template>
  <div class="engagement-container">
    <!-- Floating Reaction Picker -->
    <Transition name="scale">
      <div 
        v-if="showReactions" 
        class="reaction-picker"
        @mouseleave="hideReactions"
      >
        <button 
          v-for="reaction in reactions" 
          :key="reaction.emoji"
          class="reaction-item"
          :class="{ 'active': selectedReaction === reaction.emoji }"
          @click="selectReaction(reaction)"
        >
          <span class="text-2xl hover:scale-125 transition-transform">{{ reaction.emoji }}</span>
          <span class="text-[10px] text-gray-500">{{ reaction.label }}</span>
        </button>
      </div>
    </Transition>

    <!-- Quick Engagement Bar -->
    <div class="engagement-bar" v-if="note">
      <!-- Like with long press for reactions -->
      <button 
        class="engagement-btn"
        @click="handleQuickLike"
        @mousedown="startLongPress"
        @mouseup="endLongPress"
        @mouseleave="endLongPress"
        @touchstart="startLongPress"
        @touchend="endLongPress"
      >
        <div class="relative">
          <Icon 
            :name="isLiked ? 'heroicons:heart-solid' : 'heroicons:heart'" 
            :class="isLiked ? 'text-red-500' : ''"
            class="w-7 h-7 transition-all"
          />
          <!-- Reaction indicator -->
          <span 
            v-if="selectedReaction && selectedReaction !== '❤️'" 
            class="absolute -top-1 -right-1 text-sm"
          >
            {{ selectedReaction }}
          </span>
        </div>
        <span class="engagement-count">{{ formatCount(likeCount) }}</span>
      </button>

      <!-- Comment -->
      <button class="engagement-btn" @click="$emit('comment')">
        <Icon name="heroicons:chat-bubble-oval-left" class="w-7 h-7" />
        <span class="engagement-count">{{ formatCount(commentCount) }}</span>
      </button>

      <!-- Repost Menu -->
      <UDropdown :items="repostOptions" :popper="{ placement: 'top' }">
        <button class="engagement-btn">
          <Icon name="system-uicons:retweet" class="w-7 h-7" />
          <span class="engagement-count">{{ formatCount(repostCount) }}</span>
        </button>
      </UDropdown>

      <!-- Zap -->
      <button class="engagement-btn" @click="openZapModal">
        <Icon name="lets-icons:lightning-light" class="w-7 h-7 text-yellow-500" />
        <span class="engagement-count">{{ formatZaps(zapAmount) }}</span>
      </button>

      <!-- Share Menu -->
      <UDropdown :items="shareOptions" :popper="{ placement: 'top' }">
        <button class="engagement-btn">
          <Icon name="heroicons:share" class="w-7 h-7" />
        </button>
      </UDropdown>

      <!-- Bookmark -->
      <button class="engagement-btn" @click="toggleBookmark">
        <Icon 
          :name="isBookmarked ? 'heroicons:bookmark-solid' : 'heroicons:bookmark'" 
          :class="isBookmarked ? 'text-yellow-500' : ''"
          class="w-7 h-7"
        />
      </button>
    </div>

    <!-- Zap Modal -->
    <UModal v-model="showZapModal">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-lg">⚡ {{ $t('social.send_zap') }}</h3>
            <UButton icon="i-heroicons-x-mark" color="gray" variant="ghost" @click="showZapModal = false" />
          </div>
        </template>

        <div class="space-y-4">
          <!-- Quick amounts -->
          <div class="grid grid-cols-4 gap-2">
            <button 
              v-for="amount in quickZapAmounts" 
              :key="amount"
              class="zap-amount-btn"
              :class="{ 'active': zapAmountInput === amount }"
              @click="zapAmountInput = amount"
            >
              {{ formatZaps(amount) }}
            </button>
          </div>

          <!-- Custom amount -->
          <UFormGroup :label="$t('social.custom_amount')">
            <UInput 
              v-model="zapAmountInput" 
              type="number" 
              placeholder="21"
              icon="i-lets-icons-lightning-light"
            >
              <template #trailing>
                <span class="text-gray-400 text-sm">sats</span>
              </template>
            </UInput>
          </UFormGroup>

          <!-- Zap message -->
          <UFormGroup :label="$t('social.zap_message')">
            <UTextarea 
              v-model="zapMessage"
              :placeholder="$t('social.optional_message')"
              :rows="2"
            />
          </UFormGroup>

          <!-- Estimated USD -->
          <p class="text-sm text-gray-500 text-center">
            ≈ ${{ estimatedUSD }} USD
          </p>

          <UButton 
            block 
            color="yellow" 
            :loading="isSendingZap"
            @click="sendZap"
          >
            <Icon name="lets-icons:lightning-light" class="w-5 h-5 mr-2" />
            {{ $t('social.zap') }} {{ formatZaps(zapAmountInput) }}
          </UButton>
        </div>
      </UCard>
    </UModal>

    <!-- Share Sheet -->
    <UModal v-model="showShareSheet">
      <UCard>
        <template #header>
          <h3 class="font-bold text-lg">{{ $t('social.share') }}</h3>
        </template>

        <div class="grid grid-cols-4 gap-4 mb-6">
          <button class="share-option" @click="shareAction('copy')">
            <div class="share-icon bg-gray-500">
              <Icon name="heroicons:link" class="w-6 h-6 text-white" />
            </div>
            <span class="text-xs mt-2">{{ $t('social.copy_link') }}</span>
          </button>

          <button class="share-option" @click="shareAction('qr')">
            <div class="share-icon bg-black">
              <Icon name="heroicons:qr-code" class="w-6 h-6 text-white" />
            </div>
            <span class="text-xs mt-2">QR Code</span>
          </button>

          <button class="share-option" @click="shareAction('embed')">
            <div class="share-icon bg-blue-500">
              <Icon name="heroicons:code-bracket" class="w-6 h-6 text-white" />
            </div>
            <span class="text-xs mt-2">{{ $t('social.embed') }}</span>
          </button>

          <button class="share-option" @click="shareAction('native')">
            <div class="share-icon bg-green-500">
              <Icon name="heroicons:share" class="w-6 h-6 text-white" />
            </div>
            <span class="text-xs mt-2">{{ $t('social.more') }}</span>
          </button>
        </div>

        <!-- Social share buttons -->
        <div class="border-t pt-4">
          <p class="text-sm text-gray-500 mb-3">{{ $t('social.share_external') }}</p>
          <div class="flex gap-3">
            <button 
              v-for="social in socialShares" 
              :key="social.name"
              class="flex-1 py-2 rounded-lg text-white text-sm font-medium"
              :style="{ backgroundColor: social.color }"
              @click="shareToSocial(social)"
            >
              {{ social.name }}
            </button>
          </div>
        </div>
      </UCard>
    </UModal>

    <!-- Quote Modal -->
    <UModal v-model="showQuoteModal">
      <UCard>
        <template #header>
          <h3 class="font-bold text-lg">{{ $t('social.quote_post') }}</h3>
        </template>

        <div class="space-y-4">
          <UTextarea 
            v-model="quoteText"
            :placeholder="$t('social.add_your_thoughts')"
            :rows="3"
            autofocus
          />

          <!-- Quoted note preview -->
          <div class="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
            <div class="flex items-center gap-2 mb-2">
              <UAvatar :src="note?.userInfo?.picture" size="xs" />
              <span class="text-sm font-medium">{{ note?.userInfo?.display_name }}</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {{ note?.content }}
            </p>
          </div>

          <UButton 
            block 
            :disabled="!quoteText.trim()"
            :loading="isPosting"
            @click="submitQuote"
          >
            {{ $t('social.post_quote') }}
          </UButton>
        </div>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Event } from 'nostr-tools'

const props = defineProps<{
  note?: Event & { userInfo?: any }
  likeCount?: number
  commentCount?: number
  repostCount?: number
  zapAmount?: number
  isLiked?: boolean
  isBookmarked?: boolean
}>()

const emit = defineEmits(['like', 'comment', 'repost', 'zap', 'bookmark', 'share', 'quote'])

// Composables
const { bookmarkNote, items: bookmarks } = useBookmark()
const toast = useToast()

// Reactions
const reactions = [
  { emoji: '❤️', label: 'Love' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '👏', label: 'Clap' },
  { emoji: '😂', label: 'Haha' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '🙏', label: 'Thanks' },
  { emoji: '💜', label: 'Purple' },
]

// State
const showReactions = ref(false)
const selectedReaction = ref<string | null>(null)
const longPressTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const showZapModal = ref(false)
const showShareSheet = ref(false)
const showQuoteModal = ref(false)
const zapAmountInput = ref(21)
const zapMessage = ref('')
const isSendingZap = ref(false)
const quoteText = ref('')
const isPosting = ref(false)

// Quick zap amounts
const quickZapAmounts = [21, 100, 500, 1000, 5000, 10000, 21000, 100000]

// Social share options
const socialShares = [
  { name: 'Twitter', color: '#1DA1F2', url: 'https://twitter.com/intent/tweet?url=' },
  { name: 'Telegram', color: '#0088cc', url: 'https://t.me/share/url?url=' },
  { name: 'WhatsApp', color: '#25D366', url: 'https://wa.me/?text=' },
]

// Computed
const estimatedUSD = computed(() => {
  // Assuming ~$60,000 BTC price, 1 sat = $0.0006
  return ((zapAmountInput.value || 0) * 0.0006).toFixed(2)
})

const repostOptions = computed(() => [
  [{
    label: 'Repost',
    icon: 'i-system-uicons-retweet',
    click: () => handleRepost()
  }],
  [{
    label: 'Quote',
    icon: 'i-heroicons-chat-bubble-bottom-center-text',
    click: () => showQuoteModal.value = true
  }]
])

const shareOptions = computed(() => [
  [{
    label: 'Copy Link',
    icon: 'i-heroicons-link',
    click: () => shareAction('copy')
  }],
  [{
    label: 'Share to...',
    icon: 'i-heroicons-share',
    click: () => showShareSheet.value = true
  }]
])

// Methods
const startLongPress = () => {
  longPressTimer.value = setTimeout(() => {
    showReactions.value = true
  }, 500)
}

const endLongPress = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

const hideReactions = () => {
  setTimeout(() => {
    showReactions.value = false
  }, 200)
}

const handleQuickLike = () => {
  if (!showReactions.value) {
    emit('like', selectedReaction.value || '❤️')
  }
}

const selectReaction = (reaction: typeof reactions[0]) => {
  selectedReaction.value = reaction.emoji
  emit('like', reaction.emoji)
  showReactions.value = false
}

const handleRepost = () => {
  emit('repost')
  toast.add({ title: 'Reposted!' })
}

const toggleBookmark = () => {
  if (props.note) {
    bookmarkNote(props.note.id)
  }
}

const openZapModal = () => {
  showZapModal.value = true
}

const sendZap = async () => {
  isSendingZap.value = true
  
  try {
    emit('zap', { amount: zapAmountInput.value, message: zapMessage.value })
    
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate
    
    toast.add({ 
      title: `⚡ Zapped ${formatZaps(zapAmountInput.value)}!`,
      color: 'yellow'
    })
    
    showZapModal.value = false
    zapMessage.value = ''
  } catch (e) {
    toast.add({ title: 'Zap failed', color: 'red' })
  } finally {
    isSendingZap.value = false
  }
}

const shareAction = async (type: string) => {
  if (!props.note) return
  
  const noteUrl = `https://nostr.guru/e/${props.note.id}`
  
  switch (type) {
    case 'copy':
      await navigator.clipboard.writeText(noteUrl)
      toast.add({ title: 'Link copied!' })
      break
    case 'qr':
      // Open QR modal
      toast.add({ title: 'QR feature coming soon!' })
      break
    case 'embed':
      const embedCode = `<iframe src="${noteUrl}/embed" width="400" height="300"></iframe>`
      await navigator.clipboard.writeText(embedCode)
      toast.add({ title: 'Embed code copied!' })
      break
    case 'native':
      if (navigator.share) {
        await navigator.share({ url: noteUrl })
      }
      break
  }
  
  showShareSheet.value = false
}

const shareToSocial = (social: typeof socialShares[0]) => {
  if (!props.note) return
  
  const noteUrl = `https://nostr.guru/e/${props.note.id}`
  window.open(`${social.url}${encodeURIComponent(noteUrl)}`, '_blank')
  showShareSheet.value = false
}

const submitQuote = async () => {
  if (!quoteText.value.trim()) return
  
  isPosting.value = true
  
  try {
    emit('quote', quoteText.value)
    
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate
    
    toast.add({ title: 'Quote posted!' })
    showQuoteModal.value = false
    quoteText.value = ''
  } finally {
    isPosting.value = false
  }
}

const formatCount = (count: number = 0) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return count.toString()
}

const formatZaps = (sats: number = 0) => {
  if (sats >= 1000000) return `${(sats / 1000000).toFixed(1)}M`
  if (sats >= 1000) return `${(sats / 1000).toFixed(1)}K`
  return sats.toString()
}
</script>

<style scoped>
.engagement-bar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  border-top-width: 1px;
  border-color: rgb(243 244 246);
}

:root.dark .engagement-bar {
  border-color: rgb(31 41 55);
}

.engagement-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition-property: color, background-color, border-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.engagement-btn:hover {
  background-color: rgb(243 244 246);
}

:root.dark .engagement-btn:hover {
  background-color: rgb(31 41 55);
}

.engagement-count {
  font-size: 0.75rem;
  line-height: 1rem;
  color: rgb(107 114 128);
}

.reaction-picker {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 0.5rem;
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
  background-color: white;
  border-radius: 9999px;
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  border-width: 1px;
  border-color: rgb(243 244 246);
  animation: slideUp 0.2s ease;
}

:root.dark .reaction-picker {
  background-color: rgb(31 41 55);
  border-color: rgb(55 65 81);
}

.reaction-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.25rem;
  border-radius: 0.5rem;
  transition-property: color, background-color, border-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
  cursor: pointer;
}

.reaction-item:hover {
  background-color: rgb(243 244 246);
}

:root.dark .reaction-item:hover {
  background-color: rgb(55 65 81);
}

.reaction-item.active {
  background-color: rgb(243 244 246);
}

:root.dark .reaction-item.active {
  background-color: rgb(55 65 81);
}

.zap-amount-btn {
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border-width: 1px;
  border-color: rgb(229 231 235);
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 500;
  transition-property: color, background-color, border-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

:root.dark .zap-amount-btn {
  border-color: rgb(55 65 81);
}

.zap-amount-btn:hover {
  border-color: rgb(234 179 8);
  color: rgb(234 179 8);
}

.zap-amount-btn.active {
  border-color: rgb(234 179 8);
  background-color: rgb(254 252 232);
  color: rgb(202 138 4);
}

:root.dark .zap-amount-btn.active {
  background-color: rgb(133 77 14 / 0.2);
}

.share-option {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.share-icon {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Animations */
.scale-enter-active,
.scale-leave-active {
  transition: all 0.2s ease;
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(10px);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
