<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Notification Banner -->
    <div
      v-if="notification.message"
      :class="[
        'transition-all duration-300 px-4 py-3 shadow-sm',
        notification.type === 'error'
          ? 'bg-red-50 text-red-700'
          : 'bg-green-50 text-green-700',
      ]"
    >
      <div class="container mx-auto flex justify-between items-center">
        <p>{{ notification.message }}</p>
        <button @click="clearNotification" class="ml-4">×</button>
      </div>
    </div>

    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center gap-2">
          <h1 class="text-2xl font-bold text-gray-900">Color Analyzer</h1>
          <InfoTooltip />
        </div>
      </div>
    </header>

    <main class="container mx-auto px-4 py-8">
      <!-- Overall Analysis -->
      <OverallAnalaysis
        v-if="activePreset || processedImages.length"
        :images="activePreset ? activePresetImages : processedImages"
        class="mt-8"
      />

      <!-- Active Preset Display -->
      <div v-if="activePreset" class="mt-8">
        <ActivePreset
          :preset="activePreset"
          :images="activePresetImages"
          @save="handleSavePreset"
          @delete="handleDeletePreset"
          @reanalyze="handleReanalysis"
          @deleteImage="handleDeleteImage"
          @saveAsNew="handleSaveAsPreset"
        />
      </div>

      <!-- Processed Images Display -->
      <div v-else-if="processedImages.length" class="mt-8 space-y-4">
        <div v-for="(image, index) in processedImages" :key="index">
          <ImageAnalysisResult
            :image="image"
            @reanalyze="handleReanalysis"
            @delete="handleDeleteImage(index)"
          />
        </div>
      </div>

      <!-- Processing Status -->
      <div
        v-if="isProcessing"
        class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4"
      >
        <p>
          Processing image {{ currentImageIndex + 1 }} of
          {{ selectedFiles?.length }}...
        </p>
        <p class="text-sm text-gray-600">{{ processingStatus }}</p>
      </div>

      <!-- Error Display -->
      <div
        v-if="error"
        class="mt-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
      >
        <p>{{ error }}</p>
      </div>
    </main>

    <!-- Image Controls -->
    <ImageControls
      :is-processing="isProcessing"
      :colors="parentColors"
      :presets="presets"
      @analyze="handleAnalysis"
      @filesSelected="handleFileSelection"
      @update:colors="updateParentColors"
      @loadPreset="handleLoadPreset"
      @saveAsPreset="handleSaveAsPreset"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "#app";
import { analyzeImage } from "@/services/imageAnalyzer";
import { usePresets } from "@/composables/usePresets";

// Composables setup
const route = useRoute();
const { fetchPresets, createPreset, deletePreset, updatePreset } = usePresets();

// State management with descriptive refs
const isProcessing = ref(false);
const currentImageIndex = ref(-1);
const processingStatus = ref("");
const error = ref(null);
const selectedFiles = ref(null);
const processedImages = ref([]);
const presets = ref([]);
const activePreset = ref(null);
const activePresetImages = ref([]);

// Notification system
const notification = ref({ message: "", type: "success" });
const showNotification = (message, type = "success") => {
  notification.value = { message, type };
  setTimeout(clearNotification, 5000);
};
const clearNotification = () => {
  notification.value = { message: "", type: "success" };
};

// Load presets on component mount
onMounted(async () => {
  await loadPresets();
});

// Image processing handlers
const handleFileSelection = (files) => {
  selectedFiles.value = files;
};

const handleAnalysis = async ({ files }) => {
  if (!files?.length) return;
  isProcessing.value = true;
  error.value = null;

  try {
    for (let i = 0; i < files.length; i++) {
      currentImageIndex.value = i;
      const file = files[i];
      const sourceImage = URL.createObjectURL(file);
      const result = await analyzeImage(file, parentColors.value);

      const newImage = {
        name: file.name,
        sourceImage,
        colors: result,
      };

      if (activePreset.value) {
        activePresetImages.value.unshift(newImage);
      } else {
        processedImages.value.unshift(newImage);
      }
    }
  } catch (err) {
    error.value = err.message || "Analysis failed";
  } finally {
    isProcessing.value = false;
    currentImageIndex.value = -1;
  }
};

const handleReanalysis = async (image) => {
  isProcessing.value = true;
  error.value = null;

  try {
    const response = await fetch(image.sourceImage);
    const blob = await response.blob();
    const file = new File([blob], image.name, { type: blob.type });
    const result = await analyzeImage(file, parentColors.value);

    const updatedImage = {
      ...image,
      colors: result,
    };

    const targetArray = activePreset.value
      ? activePresetImages
      : processedImages;
    const index = targetArray.value.findIndex((img) => img.name === image.name);
    if (index !== -1) {
      targetArray.value[index] = updatedImage;
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    isProcessing.value = false;
  }
};

// Preset management
const loadPresets = async () => {
  try {
    const response = await fetchPresets();
    presets.value = Array.isArray(response)
      ? response
      : response?.data
        ? response.data
        : [];
  } catch (err) {
    error.value = "Failed to load presets";
    console.error("Failed to load presets:", err);
  }
};

const handleLoadPreset = (preset) => {
  if (!preset) return;

  activePreset.value = preset;
  const images =
    preset.attributes?.processed_images || preset.processed_images || [];
  activePresetImages.value = Array.isArray(images)
    ? images
    : typeof images === "string"
      ? JSON.parse(images)
      : [];
};

const handleSaveAsPreset = async ({ name }) => {
  try {
    console.log("Creating preset with:", {
      name,
      images: processedImages.value,
    });

    const thumbnail = processedImages.value[0]?.sourceImage
      ? await getImageBase64(processedImages.value[0].sourceImage)
      : null;

    await createPreset({
      name,
      images: processedImages.value,
      sourceImage: thumbnail,
    });

    await loadPresets();
    processedImages.value = [];
    showNotification("Preset created successfully");
  } catch (err) {
    console.error("Preset creation error:", err);
    showNotification("Failed to create preset", "error");
  }
};

const handleSavePreset = async (images) => {
  try {
    const thumbnail = images[0]?.sourceImage
      ? await getImageBase64(images[0].sourceImage)
      : null;

    await updatePreset(activePreset.value.id, {
      name: activePreset.value.attributes.Name,
      images,
      sourceImage: thumbnail,
    });

    await loadPresets();
    showNotification("Preset saved successfully");
  } catch (err) {
    showNotification("Failed to save preset", "error");
    console.error("Preset save error:", err);
  }
};

const handleDeletePreset = async () => {
  try {
    await deletePreset(activePreset.value.id);
    activePreset.value = null;
    activePresetImages.value = [];
    await loadPresets();
    showNotification("Preset deleted successfully");
  } catch (err) {
    showNotification("Failed to delete preset", "error");
    console.error("Preset deletion error:", err);
  }
};

// Utility functions
const getImageBase64 = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Failed to convert image to base64:", error);
    return null;
  }
};

const handleDeleteImage = (index) => {
  if (activePreset.value) {
    activePresetImages.value.splice(index, 1);
  } else {
    processedImages.value.splice(index, 1);
  }
};

// Color palette management
const parentColors = ref([
  { name: "Red", hex: "#FF0000" },
  { name: "Cyan", hex: "#00FFFF" },
  { name: "Blue", hex: "#0000FF" },
  { name: "DarkBlue", hex: "#00008B" },
  { name: "LightBlue", hex: "#ADD8E6" },
  { name: "Purple", hex: "#800080" },
  { name: "Gold", hex: "#FFD700" },
  { name: "Lime", hex: "#00FF00" },
  { name: "Magenta", hex: "#FF00FF" },
  { name: "Apricot", hex: "#FFD8B1" },
  { name: "Lavender", hex: "#DCBEFF" },
  { name: "Silver", hex: "#C0C0C0" },
  { name: "Orange", hex: "#FFA500" },
  { name: "Brown", hex: "#A52A2A" },
  { name: "Maroon", hex: "#800000" },
  { name: "Green", hex: "#008000" },
  { name: "Mint", hex: "#AAFFC3" },
  { name: "Olive", hex: "#808000" },
  { name: "Aquamarine", hex: "#7FFFD4" },
  { name: "Grey", hex: "#808080" },
  { name: "Cream", hex: "#FFFDD0" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Black", hex: "#000000" },
  { name: "Burlywood", hex: "#DEB887" },
  { name: "Saddle Brown", hex: "#8B4513" },
  { name: "Orange Red", hex: "#FF4500" },
  { name: "Slate Blue", hex: "#6A5ACD" },
  { name: "Cadet Blue", hex: "#5F9EA0" },
  { name: "Pale Green", hex: "#98FB98" },
  { name: "Pale Violet Red", hex: "#DB7093" },
  { name: "Steel Blue", hex: "#4682B4" },
  { name: "Goldenrod", hex: "#DAA520" },
  { name: "Turquoise", hex: "#40E0D0" },
  { name: "Blue Violet", hex: "#8A2BE2" },
  { name: "Salmon", hex: "#FA8072" },
]);

const updateParentColors = (newColors) => {
  parentColors.value = newColors;
};
</script>
