<!-- ImageInput.vue -->
<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="mb-6">
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        Image Analysis Settings
      </h3>
      <div class="flex items-center space-x-4">
        <select
          v-model="selectedMethod"
          class="form-select rounded-md border-gray-300 flex-grow"
          :disabled="isProcessing"
        >
          <option value="chroma">Local Color Analysis</option>
          <option value="api">AI-Powered Analysis</option>
        </select>

        <div class="text-sm text-gray-500">
          {{
            selectedMethod === "chroma"
              ? "Fast local processing"
              : "Enhanced accuracy using AI"
          }}
        </div>
      </div>
    </div>

    <!-- File Input Zone -->
    <div
      class="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors"
      :class="{
        'border-blue-500 bg-blue-50': isDragging,
        'cursor-pointer': !isProcessing,
      }"
      @click="!isProcessing && triggerFileInput()"
      @dragenter.prevent="handleDragEnter"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <!-- Overlay for processing state -->
      <div
        v-if="isProcessing"
        class="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg"
      >
        <div class="flex items-center space-x-3">
          <svg class="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
              fill="none"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span class="text-blue-500 font-medium">Processing images...</span>
        </div>
      </div>

      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/gif,image/webp"
        class="hidden"
        @change="handleFileSelect"
      />

      <div class="flex flex-col items-center justify-center space-y-4">
        <div class="h-12 w-12 text-gray-400">
          <svg
            class="h-full w-full"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <div>
          <p class="text-gray-600 font-medium">
            {{
              isProcessing
                ? "Processing..."
                : "Drop images here or click to upload"
            }}
          </p>
          <p class="text-sm text-gray-500 mt-1">
            Supports JPG, PNG, GIF, WebP (max 5MB each)
          </p>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div
      v-if="error"
      class="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
    >
      {{ error }}
    </div>

    <!-- Selected Files Preview -->
    <div v-if="selectedFiles.length" class="mt-4 space-y-2">
      <div
        v-for="file in selectedFiles"
        :key="file.name"
        class="flex items-center justify-between bg-gray-50 p-2 rounded"
      >
        <div class="flex items-center space-x-2">
          <img
            :src="getPreviewUrl(file)"
            class="w-12 h-12 object-cover rounded"
            alt="Preview"
          />
          <div class="flex flex-col">
            <span class="text-sm text-gray-600">{{ file.name }}</span>
            <span class="text-xs text-gray-500">{{
              formatFileSize(file.size)
            }}</span>
          </div>
        </div>
        <button
          @click="removeFile(file)"
          class="text-red-500 hover:text-red-700"
          :disabled="isProcessing"
        >
          Remove
        </button>
      </div>
    </div>

    <!-- Analysis Button -->
    <div class="mt-6">
      <button
        @click="startAnalysis"
        :disabled="!selectedFiles.length || isProcessing"
        class="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {{ isProcessing ? "Processing..." : "Analyze Images" }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  isProcessing: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["analyze", "filesSelected"]);

const selectedMethod = ref("chroma");
const isDragging = ref(false);
const error = ref(null);
const fileInput = ref(null);
const selectedFiles = ref([]);
const previewUrls = ref({});

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// Prevent default drag behaviors
const handleDragEnter = (e) => {
  e.preventDefault();
  isDragging.value = true;
};

const handleDragOver = (e) => {
  e.preventDefault();
  isDragging.value = true;
};

const handleDragLeave = (e) => {
  e.preventDefault();
  isDragging.value = false;
};

const validateFile = (file) => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      `Invalid file type: ${file.name}. Only JPG, PNG, GIF, and WebP files are allowed.`
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${file.name}. Maximum size is 5MB.`);
  }

  return true;
};

const getPreviewUrl = (file) => {
  if (!previewUrls.value[file.name]) {
    previewUrls.value[file.name] = URL.createObjectURL(file);
  }
  return previewUrls.value[file.name];
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const handleFileSelect = (event) => {
  error.value = null;
  try {
    const files = [...event.target.files];
    files.forEach(validateFile);
    selectedFiles.value = files;
    emit("filesSelected", files);
  } catch (err) {
    error.value = err.message;
    event.target.value = null;
  }
};

const handleDrop = (e) => {
  e.preventDefault();
  isDragging.value = false;
  error.value = null;

  try {
    const files = [...e.dataTransfer.files];
    files.forEach(validateFile);
    selectedFiles.value = files;
    emit("filesSelected", files);
  } catch (err) {
    error.value = err.message;
  }
};

const removeFile = (fileToRemove) => {
  if (props.isProcessing) return;

  if (previewUrls.value[fileToRemove.name]) {
    URL.revokeObjectURL(previewUrls.value[fileToRemove.name]);
    delete previewUrls.value[fileToRemove.name];
  }

  selectedFiles.value = selectedFiles.value.filter(
    (file) => file !== fileToRemove
  );
  emit("filesSelected", selectedFiles.value);
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const startAnalysis = () => {
  if (error.value || !selectedFiles.value.length) return;
  emit("analyze", {
    files: selectedFiles.value,
    method: selectedMethod.value,
  });
};

// Cleanup preview URLs when component is unmounted
onUnmounted(() => {
  Object.values(previewUrls.value).forEach((url) => {
    URL.revokeObjectURL(url);
  });
});
</script>
