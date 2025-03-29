<template>
  <div class="grid grid-cols-2 md:grid-cols-3 gap-2 p-2">
    <div
      v-for="(post, index) in posts"
      :key="index"
      class="relative aspect-[3/4] rounded-md overflow-hidden group cursor-pointer"
    >
      <!-- Video Thumbnail -->
      <img
        :src="post.thumbnail"
        alt="Video thumbnail"
        class="w-full h-full object-cover"
      />

      <!-- Video Information Overlay -->
      <div
        class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2"
      >
        <div class="flex items-center text-white mb-1">
          <UIcon name="i-heroicons-play" class="mr-1 h-4 w-4" />
          <span class="text-xs font-medium">{{ formatCount(post.views) }}</span>
        </div>

        <p class="text-white text-xs line-clamp-2">{{ post.caption }}</p>
      </div>

      <!-- Play Button Overlay (appears on hover) -->
      <div
        class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <UButton
          variant="ghost"
          color="white"
          icon="i-heroicons-play"
          class="h-12 w-12 bg-black/40 rounded-full"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Post {
  id: string;
  thumbnail: string;
  caption: string;
  views: number;
  likes: number;
  user: {
    id: string;
    username: string;
    avatar: string;
  };
}

// Sample data (replace with your actual data source)
const posts = ref<Post[]>([
  {
    id: "1",
    thumbnail:
      "https://i.ytimg.com/an_webp/8P4hJkOw1dQ/mqdefault_6s.webp?du=3000&sqp=CJD1nb8G&rs=AOn4CLBRTuRxkqy7RR1K9wm0Wqdrdp_y2w",
    caption: "Check out this amazing sunset #sunset #vibes",
    views: 1234567,
    likes: 98765,
    user: {
      id: "user1",
      username: "sunsetlover",
      avatar:
        "https://image.nostr.build/5529bba593484f4c89669cfa881619dc9b4a08ea942bd5c35b43f528c939ff74.gif",
    },
  },
  {
    id: "2",
    thumbnail:
      "https://i.ytimg.com/an_webp/8P4hJkOw1dQ/mqdefault_6s.webp?du=3000&sqp=CJD1nb8G&rs=AOn4CLBRTuRxkqy7RR1K9wm0Wqdrdp_y2w",
    caption: "Dancing to the new trending song 🔥 #dance #trending",
    views: 543210,
    likes: 43210,
    user: {
      id: "user2",
      username: "dancequeen",
      avatar:
        "https://image.nostr.build/5529bba593484f4c89669cfa881619dc9b4a08ea942bd5c35b43f528c939ff74.gif",
    },
  },
  {
    id: "3",
    thumbnail:
      "https://i.ytimg.com/an_webp/8P4hJkOw1dQ/mqdefault_6s.webp?du=3000&sqp=CJD1nb8G&rs=AOn4CLBRTuRxkqy7RR1K9wm0Wqdrdp_y2w",
    caption: "My cooking tutorial for the best pasta ever! #cooking #pasta",
    views: 987654,
    likes: 87654,
    user: {
      id: "user3",
      username: "chefmaster",
      avatar:
        "https://image.nostr.build/5529bba593484f4c89669cfa881619dc9b4a08ea942bd5c35b43f528c939ff74.gif",
    },
  },
  {
    id: "4",
    thumbnail:
      "https://i.ytimg.com/an_webp/8P4hJkOw1dQ/mqdefault_6s.webp?du=3000&sqp=CJD1nb8G&rs=AOn4CLBRTuRxkqy7RR1K9wm0Wqdrdp_y2w",
    caption: "Daily fitness motivation #fitness #workout",
    views: 654321,
    likes: 54321,
    user: {
      id: "user4",
      username: "fitnessguru",
      avatar:
        "https://image.nostr.build/5529bba593484f4c89669cfa881619dc9b4a08ea942bd5c35b43f528c939ff74.gif",
    },
  },
  {
    id: "5",
    thumbnail:
      "https://i.ytimg.com/an_webp/8P4hJkOw1dQ/mqdefault_6s.webp?du=3000&sqp=CJD1nb8G&rs=AOn4CLBRTuRxkqy7RR1K9wm0Wqdrdp_y2w",
    caption: "Travel vlog: hidden gems in Tokyo #travel #tokyo",
    views: 876543,
    likes: 76543,
    user: {
      id: "user5",
      username: "worldtraveler",
      avatar:
        "https://image.nostr.build/5529bba593484f4c89669cfa881619dc9b4a08ea942bd5c35b43f528c939ff74.gif",
    },
  },
  {
    id: "6",
    thumbnail:
      "https://i.ytimg.com/an_webp/8P4hJkOw1dQ/mqdefault_6s.webp?du=3000&sqp=CJD1nb8G&rs=AOn4CLBRTuRxkqy7RR1K9wm0Wqdrdp_y2w",
    caption: "Unboxing the latest tech gadget #tech #unboxing",
    views: 765432,
    likes: 65432,
    user: {
      id: "user6",
      username: "techreviewr",
      avatar:
        "https://image.nostr.build/5529bba593484f4c89669cfa881619dc9b4a08ea942bd5c35b43f528c939ff74.gif",
    },
  },
]);

// Format view counts with K, M, etc.
const formatCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};
</script>
