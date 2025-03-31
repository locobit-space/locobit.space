<template>
  <div
    class="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
  >
    <div class="flex items-start space-x-3">
      <div class="flex-shrink-0">
        <NuxtLink :to="`/profile/${user.pubkey}`">
          <UAvatar
            :src="user.picture"
            alt="Profile Picture"
            icon="i-heroicons-user-circle"
          />
        </NuxtLink>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center space-x-2">
          <NuxtLink :to="`/profile/${user.pubkey}`" class="hover:underline">
            <h3 class="text-sm font-bold truncate">
              {{ user.display_name || user.name || "Unknown User" }}
            </h3>
          </NuxtLink>
          <span v-if="user.verified" class="text-primary-500" title="Verified">
            <Icon name="bitcoin-icons:verify-outline" size="20" />
          </span>
        </div>

        <p v-if="user.nip05" class="text-xs text-gray-500 truncate">
          {{ user.nip05 }}
        </p>

        <p v-if="user.about" class="text-sm text-gray-600 mt-1 line-clamp-2">
          {{ user.about }}
        </p>

        <div class="mt-2">
          <button
            class="text-xs px-3 py-1 rounded-full bg-primary-100 text-primary-700 hover:bg-primary-200 transition-colors"
            @click="toggleFollow"
          >
            {{ isFollowing ? "Unfollow" : "Follow" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
});

const { isFollowing, toggleFollow } = useFollowUser(props.user.pubkey);
</script>
