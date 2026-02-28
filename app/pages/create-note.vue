<template>
  <main class="min-h-screen">
    <CommonContainer class="py-4 sm:py-8">
      <div class="max-w-2xl mx-auto">
        <!-- Main Input Card (X-style) -->
        <div
          class="sm:rounded-2xl rounded-lg sm:border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm sm:shadow-none"
        >
          <div v-if="user" class="px-4 py-3 sm:p-4 flex gap-3 sm:gap-4">
            <!-- Avatar -->
            <div class="flex-shrink-0 mt-1">
              <UAvatar
                :src="currentUserInfo?.picture"
                size="md"
                class="bg-gray-100 dark:bg-gray-800"
              />
            </div>

            <!-- Content Area -->
            <div class="flex-1 min-w-0 flex flex-col pt-1">
              <!-- Audience selector -->
              <div class="mb-2 hidden">
                <button
                  class="inline-flex items-center gap-0.5 px-3 py-[2px] rounded-full border border-primary-500/50 text-[13px] font-bold text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                >
                  Everyone
                  <Icon name="heroicons:chevron-down" class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- Textarea -->
              <textarea
                v-model="newPost"
                :placeholder="$t('social.whats_on_mind', 'What\'s happening?')"
                class="w-full bg-transparent text-[20px] leading-tight font-normal text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none resize-none pt-2 pb-2"
                rows="2"
                :maxlength="maxChars"
                @input="adjustHeight"
                ref="textareaRef"
              ></textarea>

              <!-- Attachments Grid -->
              <TransitionGroup
                name="list"
                tag="div"
                v-if="attachments.length > 0"
                class="grid grid-cols-2 gap-2 mt-2 mb-2"
              >
                <div
                  v-for="(file, index) in attachments"
                  :key="file.preview"
                  class="group relative aspect-video rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800"
                >
                  <img
                    :src="file.preview"
                    class="w-full h-full object-cover"
                    alt="Preview"
                  />
                  <div
                    class="absolute inset-0 bg-black/0 transition-colors duration-300 pointer-events-none"
                  ></div>
                  <button
                    @click="removeAttachment(index)"
                    class="absolute top-2 right-2 w-8 h-8 flex items-center justify-center p-1.5 bg-gray-900/60 hover:bg-gray-800 text-gray-100 rounded-full transition-colors backdrop-blur-sm shadow-sm"
                    title="Remove"
                  >
                    <Icon
                      name="heroicons:x-mark"
                      class="w-4 h-4 cursor-pointer"
                    />
                  </button>
                </div>
              </TransitionGroup>

              <!-- Reply indicator -->
              <div
                class="pb-3 border-b border-gray-100 dark:border-gray-800 mt-2"
              >
                <button
                  class="inline-flex items-center gap-1.5 text-[14px] font-bold text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 px-3 py-0.5 -ml-3 rounded-full transition-colors"
                >
                  <Icon name="heroicons:globe-americas" class="w-4 h-4" />
                  Everyone can reply
                </button>
              </div>

              <!-- Action Bar -->
              <div class="flex items-center justify-between pt-3 pb-1">
                <!-- Toolbar -->
                <div
                  class="flex items-center gap-0 flex-wrap text-primary-500 -ml-2"
                >
                  <UTooltip text="Media">
                    <UButton
                      icon="heroicons:photo"
                      color="primary"
                      variant="ghost"
                      class="rounded-full w-9 h-9 flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-900/20 p-0"
                      @click="triggerFileInput"
                    />
                  </UTooltip>
                  <UTooltip text="GIF">
                    <UButton
                      icon="heroicons:gif"
                      color="primary"
                      variant="ghost"
                      class="rounded-full w-9 h-9 flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-900/20 p-0 opacity-50 cursor-not-allowed hidden sm:flex"
                    />
                  </UTooltip>
                  <UTooltip text="Poll">
                    <UButton
                      icon="heroicons:list-bullet"
                      color="primary"
                      variant="ghost"
                      class="rounded-full w-9 h-9 flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-900/20 p-0 opacity-50 cursor-not-allowed"
                    />
                  </UTooltip>
                  <UTooltip text="Emoji">
                    <UButton
                      icon="heroicons:face-smile"
                      color="primary"
                      variant="ghost"
                      class="rounded-full w-9 h-9 flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-900/20 p-0 opacity-50 cursor-not-allowed"
                    />
                  </UTooltip>
                  <UTooltip text="Schedule">
                    <UButton
                      icon="heroicons:calendar"
                      color="primary"
                      variant="ghost"
                      class="rounded-full w-9 h-9 flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-900/20 p-0 opacity-50 cursor-not-allowed hidden sm:flex"
                    />
                  </UTooltip>
                  <UTooltip text="Location">
                    <UButton
                      icon="heroicons:map-pin"
                      color="primary"
                      variant="ghost"
                      class="rounded-full w-9 h-9 flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-900/20 p-0 opacity-50 cursor-not-allowed hidden sm:flex"
                    />
                  </UTooltip>
                </div>

                <!-- Right side (Meter & Button) -->
                <div class="flex items-center gap-3">
                  <!-- Conditional container for ring/plus -->
                  <div
                    class="flex items-center gap-3 transition-opacity duration-200"
                    :class="
                      newPost.length > 0
                        ? 'opacity-100'
                        : 'opacity-0 pointer-events-none'
                    "
                  >
                    {{ charCount }}
                    <!-- Ring progress -->
                    <div
                      class="relative w-6 h-6 flex items-center justify-center"
                    >
                      <!-- Show remaining chars when close to limit -->
                      <span
                        v-if="charCount > maxChars - 50"
                        class="absolute text-[9px] font-bold"
                        :class="
                          charCount > maxChars * 0.9
                            ? 'text-red-500'
                            : 'text-sky-500'
                        "
                        >{{ maxChars - charCount }}</span
                      >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        class="transform -rotate-90"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          class="text-gray-200 dark:text-gray-800"
                          stroke="currentColor"
                          stroke-width="2"
                          fill="none"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          :class="[
                            charCount > maxChars * 0.9
                              ? 'text-red-500'
                              : 'text-sky-500',
                            'transition-all duration-150 ease-out',
                          ]"
                          stroke="currentColor"
                          stroke-width="2"
                          fill="none"
                          stroke-dasharray="62.83"
                          :stroke-dashoffset="
                            62.83 -
                            62.83 * Math.sqrt(Math.min(1, charCount / maxChars))
                          "
                          stroke-linecap="round"
                        />
                      </svg>
                    </div>

                    <div class="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>

                    <UButton
                      icon="heroicons:plus"
                      color="primary"
                      variant="ghost"
                      class="rounded-full border border-gray-200 dark:border-gray-700 w-7 h-7 flex items-center justify-center p-0 hover:bg-primary-50 dark:hover:bg-primary-900/20 disabled:opacity-50 text-primary-500"
                      :disabled="isPosting"
                    />
                  </div>

                  <UButton
                    @click="submitPost"
                    :loading="isPosting"
                    :disabled="!canPost"
                    color="primary"
                    class="rounded-full px-5 py-1.5 font-bold transition-all flex justify-center text-[15px] disabled:opacity-50 shadow-none"
                  >
                    {{ $t("social.post", "Post") }}
                  </UButton>
                </div>
              </div>
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

          <!-- Not Logged In -->
          <div
            v-else
            class="p-8 sm:p-12 text-center bg-gray-50 dark:bg-gray-900/50"
          >
            <div
              class="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Icon
                name="heroicons:lock-closed"
                class="w-8 h-8 text-gray-500 dark:text-gray-400"
              />
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {{ $t("social.login_to_post") }}
            </h3>
            <p
              class="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto text-sm"
            >
              {{ $t("social.connect_wallet_to_post") }}
            </p>
            <UButton
              to="/settings"
              color="primary"
              size="lg"
              class="rounded-full px-8 font-bold"
            >
              {{ $t("common.login") }}
            </UButton>
          </div>
        </div>
      </div>
    </CommonContainer>
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
