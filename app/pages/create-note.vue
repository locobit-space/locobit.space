<template>
  <main class="min-h-screen bg-gray-50/50 dark:bg-gray-950">
    <!-- Overlay for contrast -->
    <div
      class="min-h-screen w-full bg-white/90 dark:bg-gray-950/90 backdrop-blur-3xl"
    >
      <CommonContainer class="py-8 sm:py-16">
        <div class="max-w-3xl mx-auto space-y-8">
          <!-- Page Header -->
          <div class="text-center space-y-2">
            <h1
              class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white"
            >
              {{ $t("social.create_new_story") || "Create New Story" }}
            </h1>
            <p class="text-gray-500 dark:text-gray-400 font-medium">
              {{
                $t("social.share_thoughts_subtitle") ||
                "Share your thoughts with the world"
              }}
            </p>
          </div>

          <!-- Main Input Card -->
          <div
            class="relative rounded-2xl overflow-hidden bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800"
          >
            <div v-if="user" class="p-6 sm:p-8 flex items-start gap-4 sm:gap-6">
              <!-- User Avatar -->
              <UAvatar
                :src="currentUserInfo?.picture"
                size="xl"
                class="flex-shrink-0 ring-2 ring-white dark:ring-gray-800"
              />

              <div class="flex-1 min-w-0 pt-1">
                <!-- Text Input -->
                <div class="relative group">
                  <UTextarea
                    v-model="newPost"
                    :placeholder="
                      $t('social.whats_on_mind') || 'What\'s on your mind?'
                    "
                    class="w-full"
                    :maxlength="maxChars"
                    @input="adjustHeight"
                    ref="textareaRef"
                  ></UTextarea>

                  <!-- Character Limit Indicator -->
                  <div
                    class="absolute bottom-2 right-0 transition-opacity duration-300"
                    :class="{
                      'opacity-100': newPost.length > 0,
                      'opacity-0': newPost.length === 0,
                    }"
                  >
                    <URingProgress
                      :model-value="(charCount / maxChars) * 100"
                      :color="charCount > maxChars * 0.9 ? 'orange' : 'primary'"
                      size="xs"
                      class="w-6 h-6"
                      :thickness="0.15"
                      bg="bg-gray-200 dark:bg-gray-800"
                    />
                  </div>
                </div>

                <!-- Attachments Grid -->
                <!-- Hashtags Preview -->
                <div
                  v-if="hashtags.length > 0"
                  class="flex flex-wrap gap-2 my-4"
                >
                  <span
                    v-for="tag in hashtags"
                    :key="tag"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 transition-transform hover:scale-105"
                  >
                    #{{ tag }}
                  </span>
                </div>

                <TransitionGroup
                  name="list"
                  tag="div"
                  v-if="attachments.length > 0"
                  class="grid grid-cols-2 gap-3 mt-4"
                >
                  <div
                    v-for="(file, index) in attachments"
                    :key="file.preview"
                    class="group relative aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800"
                  >
                    <img
                      :src="file.preview"
                      class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      alt="Preview"
                    />
                    <div
                      class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"
                    ></div>
                    <button
                      @click="removeAttachment(index)"
                      class="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100 backdrop-blur-sm"
                      title="Remove"
                    >
                      <Icon name="heroicons:x-mark" class="w-4 h-4" />
                    </button>
                  </div>
                </TransitionGroup>

                <!-- Action Bar -->
                <div
                  class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800/50"
                >
                  <!-- Tools -->
                  <div class="flex items-center gap-1 -ml-2">
                    <UTooltip text="Add image">
                      <UButton
                        icon="heroicons:photo"
                        color="gray"
                        variant="ghost"
                        class="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        @click="triggerFileInput"
                      />
                    </UTooltip>

                    <UTooltip text="Add poll">
                      <UButton
                        icon="heroicons:chart-bar"
                        color="gray"
                        variant="ghost"
                        class="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors opacity-50 cursor-not-allowed"
                      />
                    </UTooltip>

                    <UTooltip text="Add emoji">
                      <UButton
                        icon="heroicons:face-smile"
                        color="gray"
                        variant="ghost"
                        class="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors opacity-50 cursor-not-allowed"
                      />
                    </UTooltip>

                    <div
                      class="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-2"
                    ></div>

                    <span
                      class="text-xs text-gray-400 dark:text-gray-500 font-mono"
                    >
                      {{ charCount }}/{{ maxChars }}
                    </span>
                  </div>

                  <!-- Post Button -->
                  <UButton
                    @click="submitPost"
                    :loading="isPosting"
                    :disabled="!canPost"
                    size="md"
                    color="primary"
                    class="rounded-full px-8 transition-all duration-300"
                  >
                    <span class="font-bold">{{
                      isPosting ? $t("social.posting") : $t("social.post")
                    }}</span>
                    <template #trailing>
                      <Icon
                        v-if="!isPosting"
                        name="heroicons:paper-airplane"
                        class="w-4 h-4 -mr-1"
                      />
                    </template>
                  </UButton>
                </div>
              </div>
            </div>

            <!-- Not Logged In State with Glassmorphism -->
            <div v-else class="p-12 text-center">
              <div
                class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Icon
                  name="heroicons:lock-closed"
                  class="w-8 h-8 text-gray-400"
                />
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {{ $t("social.login_to_post") }}
              </h3>
              <p class="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                {{ $t("social.connect_wallet_to_post") }}
              </p>
              <UButton
                to="/settings"
                color="primary"
                size="lg"
                class="rounded-full px-8"
              >
                {{ $t("common.login") }}
                <template #trailing>
                  <Icon name="heroicons:arrow-right" class="w-4 h-4" />
                </template>
              </UButton>
            </div>

            <!-- Hidden File Input -->
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              multiple
              class="hidden"
              @change="handleFileSelect"
            />
          </div>

          <!-- Helpful Tips (Redesigned) -->
          <div class="grid sm:grid-cols-3 gap-4">
            <div
              v-for="(tip, idx) in tips"
              :key="idx"
              class="p-4 rounded-xl bg-white/50 dark:bg-gray-900/40 backdrop-blur-sm border border-white/10 dark:border-gray-800 flex items-start gap-3 transition-colors hover:bg-white/70 dark:hover:bg-gray-900/60"
            >
              <div
                :class="`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${tip.colorBg} ${tip.colorText}`"
              >
                <Icon :name="tip.icon" class="w-4 h-4" />
              </div>
              <div>
                <h4 class="font-medium text-sm text-gray-900 dark:text-white">
                  {{ tip.title }}
                </h4>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {{ tip.description }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CommonContainer>
    </div>
  </main>
</template>

<script setup lang="ts">
const toast = useToast();
const { currentUserInfo, user } = useNostrUser();
const { postNote } = useNostrFeed();
const { t } = useI18n(); // Access translation function

const newPost = ref("");
const isPosting = ref(false);
const maxChars = 5000;
const attachments = ref<Array<{ file: File; preview: string }>>([]);
const fileInput = ref<HTMLInputElement | null>(null);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

// Character count
const charCount = computed(() => newPost.value.length);

// Can post?
const canPost = computed(() => {
  return newPost.value.trim().length > 0 && !isPosting.value;
});

// Extract hashtags
const hashtags = computed(() => {
  const matches = newPost.value.match(/#\w+/g);
  return matches ? matches.map((tag) => tag.replace("#", "")) : [];
});

// Tips Data
const tips = computed(() => [
  {
    icon: "heroicons:hashtag",
    title: t("social.tip_hashtags") || "Use Hashtags",
    description: "Reach more people by adding relevant tags",
    colorBg: "bg-blue-100 dark:bg-blue-900/30",
    colorText: "text-blue-600 dark:text-blue-400",
  },
  {
    icon: "heroicons:at-symbol",
    title: t("social.tip_mentions") || "Mention Others",
    description: "Connect with the community using @",
    colorBg: "bg-purple-100 dark:bg-purple-900/30",
    colorText: "text-purple-600 dark:text-purple-400",
  },
  {
    icon: "heroicons:photo",
    title: t("social.tip_media") || "Add Media",
    description: "Images make posts more engaging",
    colorBg: "bg-green-100 dark:bg-green-900/30",
    colorText: "text-green-600 dark:text-green-400",
  },
]);

// Adjust textarea height
const adjustHeight = () => {
  const el = textareaRef.value;
  if (el) {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }
};

// Trigger file input
const triggerFileInput = () => {
  fileInput.value?.click();
};

// Handle file selection
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;

  if (files) {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        attachments.value.push({
          file,
          preview: e.target?.result as string,
        });
      };
      reader.readAsDataURL(file);
    });
  }

  // Reset input
  target.value = "";
};

// Remove attachment
const removeAttachment = (index: number) => {
  attachments.value.splice(index, 1);
};

// Submit post
const submitPost = async () => {
  if (!canPost.value) return;

  isPosting.value = true;

  try {
    // For now, just post text (image upload to come)
    const success = await postNote(newPost.value);

    if (success) {
      newPost.value = "";
      attachments.value = [];
      if (textareaRef.value) textareaRef.value.style.height = "auto";

      toast.add({
        title: t("social.post_published"),
        description: t("social.post_published_desc"),
        icon: "heroicons:check-circle",
      });

      await navigateTo("/feed");
    } else {
      toast.add({
        title: t("social.error_posting"),
        description: t("social.error_posting_desc"),
        color: "red",
        icon: "heroicons:exclamation-circle",
      });
    }
  } catch (error) {
    console.error("Error posting:", error);
    toast.add({
      title: t("social.error_posting"),
      description: t("social.something_went_wrong"),
      color: "red",
      icon: "heroicons:exclamation-circle",
    });
  } finally {
    isPosting.value = false;
  }
};

useHead({
  title: (t("social.create_post") || "Create Post") + " - BitOS",
});
</script>

<style scoped>
/* List animations */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
