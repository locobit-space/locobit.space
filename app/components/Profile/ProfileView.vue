<template>
  <div>
    <CommonContainer class="bg-white shadow-xs rounded-lg overflow-hidden">
      <!-- Existing banner and profile section -->
      <div class="relative">
        <USkeleton v-if="loading" class="h-48 rounded-lg" />
        <img
          v-else
          :src="profile?.banner || '/default-banner.jpg'"
          alt="Profile Banner"
          class="w-full h-48 object-cover bg-primary-400"
        />

        <div
          class="absolute -bottom-12 left-4 border-4 border-white rounded-full"
        >
          <USkeleton v-if="loading" class="w-24 h-24 rounded-full" />
          <img
            v-else
            :src="profile?.picture || '/default-avatar.png'"
            alt="Profile Picture"
            class="w-24 backdrop-blur bg-white/50 h-24 rounded-full object-cover"
          />
        </div>
      </div>

      <div class="px-4 pt-16 pb-4">
        <div class="flex items-center space-x-2">
          <h2 class="text-xl font-bold">
            {{ profile?.display_name || profile?.name || "N/A" }}
          </h2>
          <span
            v-if="profile?.verified"
            class="text-primary-500"
            title="Verified"
          >
            <Icon name="bitcoin-icons:verify-outline" size="20" />
          </span>
        </div>

        <p class="text-gray-600 mt-1">
          {{ profile?.about }}
        </p>

        <!-- Add followers/following count -->
        <div class="flex mt-3 space-x-4">
          <div class="text-sm">
            <span class="font-bold">{{ profileNotes.length }}</span> Notes
          </div>
          <div class="text-sm">
            <span class="font-bold">{{ followers.length }}</span> Followers
          </div>
          <div class="text-sm">
            <span class="font-bold">{{ following.length }}</span> Following
          </div>
        </div>

        <div class="mt-4 space-y-2">
          <div v-if="profile?.nip05" class="flex items-center space-x-2">
            <span>
              <Icon name="mdi:at" class="w-4 h-4" />
            </span>
            <a
              :href="`https://${profile?.nip05}`"
              target="_blank"
              class="text-blue-600"
            >
              {{ profile?.nip05 }}
            </a>
          </div>

          <div v-if="profile?.website" class="flex items-center space-x-2">
            <span>
              <Icon name="mdi:web" class="w-4 h-4" />
            </span>
            <a
              :href="profile?.website"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600"
            >
              {{ profile?.website }}
            </a>
          </div>

          <div v-if="profile?.lud16" class="flex items-center space-x-2">
            <span>
              <Icon name="system-uicons:lightning" class="w-4 h-4" />
            </span>
            <span>{{ profile?.lud16 }}</span>
          </div>
        </div>
      </div>
    </CommonContainer>

    <CommonContainer class="sticky backdrop-blur bg-white/30 top-0">
      <CommonTab :tabs="tabs" v-model="tab" class="mt-8"> </CommonTab>
    </CommonContainer>

    <!-- Notes tab content -->
    <CommonContainer v-show="tab === 'notes'">
      <div v-if="loading" class="pt-4">
        <article class="flex flex-col gap-4">
          <NoteSkeleton v-for="i in 3" :key="i" />
        </article>
      </div>

      <div v-if="profileNotes.length" class="md:px-0 py-4">
        <div v-for="note in profileNotes" :key="note.id">
          <NoteCard :note="note" />
        </div>
      </div>

      <div v-else-if="!loading" class="py-8 text-center text-gray-500">
        No notes found
      </div>
    </CommonContainer>

    <!-- Followers tab content -->
    <CommonContainer v-show="tab === 'followers'">
      <div v-if="loadingFollowers" class="pt-4">
        <article class="flex flex-col gap-4">
          <ProfileSkeleton v-for="i in 3" :key="i" />
        </article>
      </div>

      <div v-else-if="followers.length" class="md:px-0 py-4">
        <div v-for="follower in followers" :key="follower.pubkey" class="mb-4">
          <UserCard :user="follower" />
        </div>
      </div>

      <div v-else class="py-8 text-center text-gray-500">
        No followers found
      </div>
    </CommonContainer>

    <!-- Following tab content -->
    <CommonContainer v-show="tab === 'following'">
      <div v-if="loadingFollowing" class="pt-4">
        <article class="flex flex-col gap-4">
          <ProfileSkeleton v-for="i in 3" :key="i" />
        </article>
      </div>

      <div v-else-if="following.length" class="md:px-0 py-4">
        <div
          v-for="followedUser in following"
          :key="followedUser.pubkey"
          class="mb-4"
        >
          <UserCard :user="followedUser" />
        </div>
      </div>

      <div v-else class="py-8 text-center text-gray-500">
        No following found
      </div>
    </CommonContainer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useNostr } from "~/composables/useNostr";

const route = useRoute();

const { $nostr } = useNuxtApp();
const { pool } = $nostr;
const { getUserInfo, normalizeKey, RELAYS } = useNostr();

const tab = ref("notes");
const tabs = ref([
  {
    label: "Notes",
    value: "notes",
  },
  {
    label: "Replies",
    value: "replies",
  },
  {
    label: "Media",
    value: "media",
  },
  {
    label: "Followers",
    value: "followers",
  },
  {
    label: "Following",
    value: "following",
  },
]);

const pubkey = ref("");
const profile = ref(null);
const loading = ref(true);
const profileNotes = ref([]);

// For followers and following
const followers = ref([]);
const following = ref([]);
const loadingFollowers = ref(false);
const loadingFollowing = ref(false);

// Watch for tab changes to load data as needed
watch(tab, (newTab) => {
  if (newTab === "followers" && followers.value.length === 0) {
    fetchFollowers();
  }
  if (newTab === "following" && following.value.length === 0) {
    fetchFollowing();
  }
});

onMounted(async () => {
  pubkey.value = route.params.pubkey as string;

  try {
    profile.value = await getUserInfo(pubkey.value);

    // Convert npub to hex
    const hexPubkey = normalizeKey(pubkey.value);
    // Fetch user's notes and replies
    const notes = await pool.querySync(RELAYS, {
      kinds: [1, 6],
      authors: [hexPubkey],
      limit: 20,
    });

    // remove duplication id
    const uniqueNotes = Array.from(
      new Map(notes.map((note) => [note.id, note])).values()
    );

    profileNotes.value = uniqueNotes.sort(
      (a, b) => b.created_at - a.created_at
    );

    // Automatically fetch followers and following if we're on those tabs
    if (tab.value === "followers") {
      fetchFollowers();
    }
    if (tab.value === "following") {
      fetchFollowing();
    }
  } catch (error) {
    console.error("Profile fetch error:", error);
  } finally {
    loading.value = false;
  }
});

// Function to fetch followers (users who follow the current profile)
const fetchFollowers = async () => {
  if (loadingFollowers.value) return;
  loadingFollowers.value = true;

  try {
    const hexPubkey = normalizeKey(pubkey.value);

    // Query for contacts that include our pubkey (users following the current profile)
    // NIP-02: kind 3 events are contact lists
    const followerEvents = await pool.querySync(RELAYS, {
      kinds: [3],
      "#p": [hexPubkey],
      limit: 50,
    });

    // Extract unique pubkeys of followers
    const followerPubkeys = [
      ...new Set(followerEvents.map((event) => event.pubkey)),
    ];

    // Fetch user info for each follower
    const followerProfiles = await Promise.all(
      followerPubkeys.map(async (pk) => {
        try {
          const userInfo = await getUserInfo(pk);
          return {
            ...userInfo,
            pubkey: pk,
          };
        } catch (error) {
          console.error(`Error fetching follower info for ${pk}:`, error);
          return {
            pubkey: pk,
            name: "Unknown User",
          };
        }
      })
    );

    followers.value = followerProfiles;
  } catch (error) {
    console.error("Error fetching followers:", error);
  } finally {
    loadingFollowers.value = false;
  }
};

// Function to fetch following (users that the current profile follows)
const fetchFollowing = async () => {
  if (loadingFollowing.value) return;
  loadingFollowing.value = true;

  try {
    const hexPubkey = normalizeKey(pubkey.value);

    // Get the contact list of the current profile
    const contactListEvents = await pool.querySync(RELAYS, {
      kinds: [3],
      authors: [hexPubkey],
      limit: 1, // We only need the most recent contact list
    });

    // If no contact list found
    if (!contactListEvents.length) {
      loadingFollowing.value = false;
      return;
    }

    // Extract the pubkeys from the tags
    const contactList = contactListEvents[0];
    const followingPubkeys = contactList.tags
      .filter((tag) => tag[0] === "p")
      .map((tag) => tag[1]);

    // Fetch user info for each followed user
    const followingProfiles = await Promise.all(
      followingPubkeys.map(async (pk) => {
        try {
          const userInfo = await getUserInfo(pk);
          return {
            ...userInfo,
            pubkey: pk,
          };
        } catch (error) {
          console.error(`Error fetching following info for ${pk}:`, error);
          return {
            pubkey: pk,
            name: "Unknown User",
          };
        }
      })
    );

    following.value = followingProfiles;
  } catch (error) {
    console.error("Error fetching following:", error);
  } finally {
    loadingFollowing.value = false;
  }
};
</script>
