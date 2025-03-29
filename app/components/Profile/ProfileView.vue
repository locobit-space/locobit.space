<template>
  <div>
    <CommonContainer class="bg-white shadow-xs rounded-lg overflow-hidden">
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
          <span v-if="profile?.verified" class="text-blue-500" title="Verified">
            ✓
          </span>
        </div>

        <p class="text-gray-600 mt-1">
          {{ profile?.about }}
        </p>

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
    </CommonContainer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
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

    console.log(uniqueNotes);
  } catch (error) {
    console.error("Profile fetch error:", error);
  } finally {
    loading.value = false;
  }
});
</script>
