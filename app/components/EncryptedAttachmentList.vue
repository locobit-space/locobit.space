<template>
  <div
    v-if="attachments.length"
    class="grid my-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
  >
    <div
      v-for="file in attachments"
      :key="file.url"
      class="relative group overflow-hidden rounded-lg shadow-sm transition-all duration-300 hover:shadow-xl"
    >
      <!-- Preview Section -->
      <div class="relative">
        <!-- Image Preview -->
        <img
          v-if="file.mime.startsWith('image/')"
          :src="file.previewUrl"
          class="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
        />

        <!-- Video Preview -->
        <div v-else-if="file.mime.startsWith('video/')" class="relative">
          <video
            :src="file.previewUrl"
            class="w-full h-48 object-cover"
            preload="metadata"
            controls
          />
        </div>

        <!-- Other File Types -->
        <div
          v-else
          class="w-full h-48 bg-gray-100 flex items-center justify-center flex-col text-gray-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-12 w-12 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0013.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <a
            :href="file.previewUrl"
            target="_blank"
            class="text-blue-600 hover:underline"
          >
            Download {{ file.name }}
          </a>
        </div>
      </div>
      <br />
      <!-- Info Section -->
      <div
        class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 text-white text-xs transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"
      >
        <div class="font-semibold truncate">{{ file.name }}</div>
        <div class="opacity-75">
          {{ file.mime }} • {{ formatSize(file.size) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { xchacha20poly1305 } from "@noble/ciphers/chacha";

// Props
const props = defineProps<{
  event: {
    tags: string[][];
  };
}>();

// Format size
function formatSize(bytes: number) {
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
}

// Parsing and decryption functions
function parseEncryptedAttachmentsFromTags(tags: string[][]) {
  const result = [];
  for (let i = 0; i < tags.length; i++) {
    if (tags[i][0] === "url") {
      const url = tags[i][1];
      const mime = tags[i + 1]?.[1] || "";
      const size = parseInt(tags[i + 2]?.[1] || "0");
      const name = tags[i + 3]?.[1] || "unknown";
      const key = tags[i + 4]?.[1];
      const nonce = tags[i + 5]?.[1];

      result.push({ url, mime, size, name, key, nonce });
      i += 5;
    }
  }
  return result;
}

async function decryptFile(
  url: string,
  base64Key: string,
  base64Nonce: string
) {
  const key = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));
  const nonce = Uint8Array.from(atob(base64Nonce), (c) => c.charCodeAt(0));

  const response = await fetch(url);
  const buffer = await response.arrayBuffer();

  if (buffer.byteLength < 16) {
    throw new Error("Encrypted file is too small to contain a valid tag.");
  }

  const encrypted = new Uint8Array(buffer);
  const cipher = xchacha20poly1305(key, nonce);
  const decrypted = cipher.decrypt(encrypted);

  return new Blob([decrypted], { type: "video/mp4" });
}

// Attachments ref
const attachments = ref<any[]>([]);

// Run on mount
onMounted(async () => {
  const files = parseEncryptedAttachmentsFromTags(props.event.tags);
  for (const file of files) {
    try {
      const blob = await decryptFile(file.url, file.key, file.nonce);
      file.previewUrl = URL.createObjectURL(blob);
      attachments.value.push(file);
    } catch (err) {
      console.error("Decryption failed for:", file.url, err);
    }
  }
});
</script>

<style scoped>
.grid {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}
</style>
