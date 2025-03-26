<template>
  <div class="container mx-auto space-y-6">
    <!-- File Upload Input -->
    <div class="flex items-center mt-4 justify-center w-full">
      <label
        class="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
      >
        <div class="flex flex-col items-center justify-center pt-5 pb-6">
          <Icon
            name="heroicons:arrow-up-tray"
            class="w-10 h-10 mb-3 text-gray-400"
          />
          <p class="mb-2 text-sm text-gray-500">
            <span class="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p class="text-xs text-gray-500">Images, Videos, PDFs (Max 10MB)</p>
        </div>
        <input
          type="file"
          multiple
          accept="image/*,video/*,application/pdf"
          class="hidden"
          @change="onFilesSelected"
        />
      </label>
    </div>

    <!-- Preview Modal -->
    <div
      v-if="selectedFile"
      class="fixed inset-0 z-50 flex items-center justify-center bg-opacity-70"
      @click.self="closePreview"
    >
      <div class="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-lg">
        <!-- Video Preview -->
        <video
          v-if="selectedFile.type.startsWith('video/')"
          controls
          autoplay
          class="w-full h-auto max-h-[80vh] object-contain"
        >
          <source :src="selectedFile.previewUrl" :type="selectedFile.type" />
        </video>

        <!-- PDF Preview -->
        <iframe
          v-else-if="selectedFile.type === 'application/pdf'"
          :src="selectedFile.previewUrl"
          class="w-full h-[80vh]"
          frameborder="0"
        ></iframe>

        <!-- Close Button -->
        <button
          @click="closePreview"
          class="absolute w-8 h-8 flex items-center justify-center top-4 right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
        >
          <Icon name="heroicons:x-mark" class="h-6 w-6" />
        </button>
      </div>
    </div>

    <!-- File Preview Grid -->
    <div
      v-if="uploadedFiles.length"
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      <div v-for="file in uploadedFiles" :key="file.id" class="relative group">
        <!-- File Preview -->
        <div class="relative rounded-lg overflow-hidden shadow-md">
          <img
            v-if="file.type.startsWith('image')"
            :src="file.previewUrl"
            :alt="file.name"
            class="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div
            v-else-if="file.type.startsWith('video')"
            class="w-full h-48 bg-gray-200 flex items-center justify-center relative"
          >
            <Icon
              name="heroicons:video-camera"
              class="h-12 w-12 text-gray-600"
            />
            <div
              class="absolute inset-0 hover:bg-black hover:bg-opacity-30 transition-all"
            ></div>
          </div>
          <div
            v-else-if="file.type === 'application/pdf'"
            class="w-full h-48 bg-red-100 flex items-center justify-center relative"
          >
            <Icon name="heroicons:document" class="h-12 w-12 text-red-600" />
            <div
              class="absolute inset-0 hover:bg-black hover:bg-opacity-30 transition-all"
            ></div>
          </div>

          <!-- Overlay Actions -->
          <div
            class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <button
              @click="openPreview(file)"
              class="mx-2 w-8 h-8 flex items-center justify-center p-2 bg-white rounded-full hover:bg-gray-200"
            >
              <Icon name="heroicons:eye" class="h-6 w-6" />
            </button>
            <button
              @click="downloadFile(file)"
              class="mx-2 w-8 h-8 flex items-center justify-center p-2 bg-white rounded-full hover:bg-gray-200"
            >
              <Icon name="heroicons:arrow-down-tray" class="h-6 w-6" />
            </button>
            <button
              @click="removeFile(file)"
              class="mx-2 w-8 h-8 flex items-center justify-center p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <Icon name="heroicons:trash" class="h-6 w-6" />
            </button>
          </div>
        </div>

        <!-- File Details -->
        <div class="mt-2 text-sm">
          <p class="truncate font-medium">{{ file.name }}</p>
          <p class="text-xs text-gray-500">
            {{ formatFileSize(file.size) }} • {{ file.type }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { xchacha20poly1305 } from "@noble/ciphers/chacha";
import { randomBytes } from "@noble/hashes/utils";

// Types
interface EncryptedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  extension: string;
  previewUrl: string;
  encryptedUrl: string;
  encrypted: Uint8Array;
  key: string;
  nonce: string;
}

const uploadedFiles = ref<EncryptedFile[]>([]);
const selectedFile = ref<EncryptedFile | null>(null);

// Utility: Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Utility: Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Encrypt File
async function encryptFile(file: File): Promise<EncryptedFile> {
  const key = randomBytes(32);
  const nonce = randomBytes(24);

  const buffer = await file.arrayBuffer();
  const cipher = xchacha20poly1305(key, nonce);
  const encrypted = cipher.encrypt(new Uint8Array(buffer));

  // Simulate upload (replace with actual upload logic)
  const encryptedBlob = new Blob([encrypted], { type: file.type });
  const encryptedUrl = URL.createObjectURL(encryptedBlob);

  // Create preview
  const previewUrl = await createPreview(file);

  return {
    id: generateId(),
    name: file.name,
    type: file.type,
    size: file.size,
    extension: file.name.split(".").pop() || "",
    previewUrl,
    encryptedUrl,
    encrypted,
    key: btoa(String.fromCharCode(...key)),
    nonce: btoa(String.fromCharCode(...nonce)),
  };
}

// Create File Preview
async function createPreview(file: File): Promise<string> {
  if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
    return URL.createObjectURL(file);
  }
  if (file.type === "application/pdf") {
    // For PDFs, create a blob URL that can be used in an iframe
    return URL.createObjectURL(file);
  }
  return "";
}

// Open Preview Modal
const openPreview = (file: EncryptedFile) => {
  selectedFile.value = file;
};

// Close Preview Modal
const closePreview = () => {
  selectedFile.value = null;
};

// File Selection Handler
const onFilesSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files) return;

  const files = Array.from(input.files);

  // Optional: Add file size limit
  const largeFiles = files.filter((file) => file.size > 10 * 1024 * 1024);
  if (largeFiles.length > 0) {
    alert("Some files exceed 10MB limit and were not uploaded.");
    return;
  }

  for (const file of files) {
    try {
      const encryptedFile = await encryptFile(file);
      uploadedFiles.value.push(encryptedFile);
    } catch (error) {
      console.error("File encryption failed:", error);
    }
  }
};

// Download Encrypted File
const downloadFile = async (file: EncryptedFile) => {
  const a = document.createElement("a");
  a.href = file.encryptedUrl;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// Remove File
const removeFile = (file: EncryptedFile) => {
  uploadedFiles.value = uploadedFiles.value.filter((f) => f.id !== file.id);
  URL.revokeObjectURL(file.previewUrl);
  URL.revokeObjectURL(file.encryptedUrl);
};


defineExpose({
  uploadedFiles
});

</script>
