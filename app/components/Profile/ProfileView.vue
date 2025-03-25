<template>
  <div>
    <div v-if="loading" class="text-center py-4">
      <span>Loading profile...</span>
    </div>

    <div
      v-else-if="profile"
      class="max-w-xl mx-auto bg-white shadow-xs rounded-lg overflow-hidden"
    >
      <div class="relative">
        <img
          :src="profile.banner || '/default-banner.jpg'"
          alt="Profile Banner"
          class="w-full h-48 object-cover"
        />
        <div
          class="absolute -bottom-12 left-4 border-4 border-white rounded-full"
        >
          <img
            :src="profile.picture || '/default-avatar.png'"
            alt="Profile Picture"
            class="w-24 h-24 rounded-full object-cover"
          />
        </div>
      </div>

      <div class="px-4 pt-16 pb-4">
        <div class="flex items-center space-x-2">
          <h2 class="text-xl font-bold">
            {{ profile.display_name || profile.name }}
          </h2>
          <span v-if="profile.verified" class="text-blue-500" title="Verified">
            ✓
          </span>
        </div>

        <p class="text-gray-600 mt-1">
          {{ profile.about }}
        </p>

        <div class="mt-4 space-y-2">
          <div v-if="profile.nip05" class="flex items-center space-x-2">
            <span>🆔</span>
            <a
              :href="`https://${profile.nip05}`"
              target="_blank"
              class="text-blue-600"
            >
              {{ profile.nip05 }}
            </a>
          </div>

          <div v-if="profile.website" class="flex items-center space-x-2">
            <span>🌐</span>
            <a :href="profile.website" target="_blank" class="text-blue-600">
              {{ profile.website }}
            </a>
          </div>

          <div v-if="profile.lud16" class="flex items-center space-x-2">
            <span>⚡</span>
            <span>{{ profile.lud16 }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="profileNotes.length" class="mt-8 max-w-xl mx-auto">
      <h3 class="text-xl font-semibold mb-4">Notes</h3>
      <div v-for="note in profileNotes" :key="note.id">
        <NoteCard :note="note" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useNostr } from "~/composables/useNostr";

const route = useRoute();
const { getUserInfo, pool, normalizeKey, RELAYS } = useNostr();

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
    // Fetch user's notes
    const notes = await pool.querySync(RELAYS, {
      kinds: [1],
      authors: [hexPubkey],
      limit: 20,
    });

    // remove duplication id
    const uniqueNotes = Array.from(
      new Map(notes.map((note) => [note.id, note])).values()
    );

    profileNotes.value = uniqueNotes.sort((a, b) => b.created_at - a.created_at);
  } catch (error) {
    console.error("Profile fetch error:", error);
  } finally {
    loading.value = false;
  }
});
</script>
