<template>
  <div class="min-h-screen bg-gray-50">


    <!-- Notification Banner -->
    <div v-if="notification.message" :class="[
      'transition-all duration-300 px-4 py-3 shadow-sm',
      notification.type === 'error'
        ? 'bg-red-50 text-red-700'
        : 'bg-green-50 text-green-700',
    ]">
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

    <!-- Analysis Status -->
    <div v-if="analysisStatus && analysisStatus.total > 0" class="container mx-auto px-4 py-4">
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex justify-between text-sm text-gray-600 mb-2">
          <span>Analyzing images...</span>
          <span>{{ analysisStatus.current }} / {{ analysisStatus.total }}</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-blue-500 h-2 rounded-full transition-all duration-300"
            :style="`width: ${(analysisStatus.current / analysisStatus.total) * 100}%`"></div>
        </div>
      </div>
    </div>

    <main class="container mx-auto px-4 py-8">
      <!-- Overall Analysis -->
      <OverallAnalaysis v-if="activePreset || processedImages.length"
        :images="activePreset ? activePresetImages : processedImages" class="mt-8" />

      <!-- Active Preset Display -->
      <div v-if="activePreset" class="mt-8">
        <ActivePreset :preset="activePreset" :images="activePresetImages" @save="handleSavePreset"
          @delete="handleDeletePreset" @reanalyze="handleReanalysis" @deleteImage="handleDeleteImage"
          @saveAsNew="handleSaveAsPreset" />
      </div>

      <!-- Processed Images Display -->
      <div v-else-if="processedImages.length" class="mt-8 space-y-4">
        <div v-for="(image, index) in processedImages" :key="index">
          <ImageAnalysisResult :image="image" @reanalyze="handleReanalysis" @delete="handleDeleteImage(index)" />
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="mt-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p>{{ error }}</p>
      </div>
    </main>

    <!-- Image Controls -->
    <ImageControls :is-processing="isProcessing" :colors="parentColors" :presets="presets"
      :processed-images="processedImages" :analysis-status="analysisStatus" @analyze="handleAnalysis"
      @filesSelected="handleFileSelection" @update:colors="updateParentColors" @loadPreset="handleLoadPreset"
      @saveAsPreset="handleSaveAsPreset" @updateSettings="handleSettingsUpdate" :preset-status="presetStatus" />

    <!-- Add global progress indicator for preset operations -->
    <div v-if="presetStatus.isCreating || presetStatus.isUpdating"
      class="fixed top-0 left-0 right-0 z-50 bg-blue-50 border-b border-blue-200 p-4">
      <div class="container mx-auto">
        <div class="flex justify-between text-sm text-gray-600 mb-2">
          <span>{{ presetStatus.isCreating ? 'Creating preset...' : 'Updating preset...' }}</span>
          <span>{{ presetStatus.current }} / {{ presetStatus.total }}</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-blue-500 h-2 rounded-full transition-all duration-300"
            :style="`width: ${(presetStatus.current / presetStatus.total) * 100}%`"></div>
        </div>
        <div v-if="presetStatus.failed.length" class="mt-2 text-amber-600 text-sm">
          Failed uploads: {{ presetStatus.failed.length }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute } from "#app";
import { analyzeImage } from "@/services/imageAnalyzer";
import { DISTANCE_METHODS } from "@/services/imageAnalyzer";
import { COLOR_SPACES } from '@/services/imageAnalyzerSupport';

useHead({
  script: [
    {
      src: 'https://code.highcharts.com/12.1.2/highcharts.js',
      body: true
    }
  ]
});

// Composables setup
const route = useRoute();
const { fetchPresets, createPreset, deletePreset, updatePreset, uploadStatus } = usePresets();

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
const analysisStatus = ref({
  total: 0,
  current: 0,
  failed: []
});

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

const analysisSettings = ref({
  colorSpace: COLOR_SPACES.LAB,
  distanceMethod: DISTANCE_METHODS.DELTA_E
});

const handleAnalysis = async ({ files }) => {
  if (!files?.length) return;
  isProcessing.value = true;
  error.value = null;

  // Initialize analysis status
  analysisStatus.value = {
    total: files.length,
    current: 0,
    failed: []
  };

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sourceImage = URL.createObjectURL(file);

      try {
        const result = await analyzeImage(file, parentColors.value, {
          colorSpace: analysisSettings.value.colorSpace,
          distanceMethod: analysisSettings.value.distanceMethod
        });

        const newImage = {
          name: file.name,
          sourceImage,
          colors: result.colors,
          analysisSettings: result.analysisSettings
        };

        if (activePreset.value) {
          activePresetImages.value.push(newImage);
        } else {
          processedImages.value.push(newImage);
        }

        analysisStatus.value.current++;
      } catch (err) {
        analysisStatus.value.failed.push(file.name);
        console.error(`Failed to analyze ${file.name}:`, err);
      }
    }
  } finally {
    isProcessing.value = false;
    // Reset analysis status after a delay
    setTimeout(() => {
      analysisStatus.value = {
        total: 0,
        current: 0,
        failed: []
      };
    }, 3000);
  }
};

const handleReanalysis = async (image) => {
  isProcessing.value = true;
  error.value = null;

  try {
    // Fetch the image from the URL
    const response = await fetch(image.sourceImage);
    const blob = await response.blob();
    const file = new File([blob], image.name, { type: blob.type });

    // Analyze the image
    const result = await analyzeImage(
      file,
      parentColors.value,
      {
        colorSpace: analysisSettings.value.colorSpace,
        distanceMethod: analysisSettings.value.distanceMethod
      }
    );

    const updatedImage = {
      ...image,
      colors: result.colors,
      analysisSettings: result.analysisSettings
    };

    // Update the correct array
    const targetArray = activePreset.value ? activePresetImages : processedImages;
    const index = targetArray.value.findIndex((img) => img.name === image.name);
    if (index !== -1) {
      targetArray.value[index] = updatedImage;
    }
  } catch (err) {
    error.value = err.message || "Failed to reanalyze image";
    console.error("Reanalysis error:", err);
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
    // error.value = "Failed to load presets";
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

// Add new ref for preset operations status
const presetStatus = ref({
  isCreating: false,
  isUpdating: false,
  total: 0,
  current: 0,
  failed: []
});

const handleSaveAsPreset = async (presetData) => {
  presetStatus.value = {
    isCreating: true,
    isUpdating: false,
    total: presetData.images.length,
    current: 0,
    failed: []
  };

  try {
    // Watch uploadStatus changes to update presetStatus
    const unwatch = watch(() => uploadStatus.value, (newStatus) => {
      presetStatus.value.current = newStatus.current;
      presetStatus.value.failed = newStatus.failed;
    }, { deep: true });

    const result = await createPreset({
      name: presetData.name,
      images: presetData.images
    });

    unwatch(); // Stop watching once complete

    if (result.failedUploads?.length) {
      showNotification(`Preset created but ${result.failedUploads.length} images failed to upload`, "warning");
    } else {
      showNotification("Preset created successfully");
    }

    await loadPresets();
  } catch (error) {
    console.error("Failed to create preset:", error);
    showNotification(`Failed to create preset: ${error.message}`, "error");
  } finally {
    // Reset after a delay to show completion
    setTimeout(() => {
      presetStatus.value = {
        isCreating: false,
        isUpdating: false,
        total: 0,
        current: 0,
        failed: []
      };
    }, 3000);
  }
};

const handleSavePreset = async (images) => {
  presetStatus.value = {
    isCreating: false,
    isUpdating: true,
    total: images.length,
    current: 0,
    failed: []
  };

  try {
    const presetId = activePreset.value?.id;
    if (!presetId) throw new Error("Missing preset ID");

    const result = await updatePreset(presetId, {
      name: activePreset.value.attributes.Name,
      images,
      sourceImage: images[0]?.sourceImage || null,
    });

    if (result.failedUploads?.length) {
      showNotification(`Preset updated but ${result.failedUploads.length} images failed to upload`, "warning");
      presetStatus.value.failed = result.failedUploads;
    } else {
      showNotification("Preset saved successfully");
    }

    await loadPresets();
  } catch (err) {
    console.error("Preset save error:", err);
    showNotification(`Failed to save preset: ${err.message || 'Unknown error'}`, "error");
  } finally {
    setTimeout(() => {
      presetStatus.value = {
        isCreating: false,
        isUpdating: false,
        total: 0,
        current: 0,
        failed: []
      };
    }, 3000);
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
    activePresetImages.value = activePresetImages.value.filter((_, i) => i !== index);
  } else {
    processedImages.value = processedImages.value.filter((_, i) => i !== index);
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

const handleSettingsUpdate = (newSettings) => {
  analysisSettings.value = newSettings;
};
</script>
