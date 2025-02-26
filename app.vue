<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader ref="headerRef" />
    <AppStatus :analysis-status="analysisStatus" :preset-status="presetStatus" />

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
          <ImageAnalysisResult :image="image" :parent-colors="parentColors" @reanalyze="handleReanalysis" @delete="handleDeleteImage(index)" />
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
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { COLOR_SPACES } from '@/services/imageAnalyzerSupport';
import { DISTANCE_METHODS } from "@/services/imageAnalyzer";
import { useImageAnalysis } from '@/composables/useImageAnalysis';
import { usePresets } from '@/composables/usePresets';

useHead({
  script: [
    {
      src: 'https://code.highcharts.com/12.1.2/highcharts.js',
      body: true
    }
  ]
});

// Composables
const {
  isProcessing,
  error,
  processedImages,
  analysisStatus,
  handleAnalysis: handleImageAnalysis,
  handleReanalysis: handleImageReanalysis
} = useImageAnalysis();

const {
  presets,
  activePreset,
  activePresetImages,
  presetStatus,
  loadPresets,
  handleLoadPreset,
  handleSaveAsPreset: handlePresetSave,
  handleSavePreset: handlePresetUpdate,
  handleDeletePreset: handlePresetDelete
} = usePresets();

// Header ref for notifications
const headerRef = ref(null);
const showNotification = (message, type = "success") => {
  headerRef.value?.showNotification(message, type);
};

// Analysis settings
const analysisSettings = ref({
  colorSpace: COLOR_SPACES.LAB,
  distanceMethod: DISTANCE_METHODS.DELTA_E
});

const handleSettingsUpdate = (newSettings) => {
  analysisSettings.value = newSettings;
};

// File selection
const selectedFiles = ref(null);
const handleFileSelection = (files) => {
  selectedFiles.value = files;
};

// Analysis handlers
const handleAnalysis = async ({ files }) => {
  await handleImageAnalysis({
    files,
    parentColors: parentColors.value,
    analysisSettings: analysisSettings.value,
    activePreset: activePreset.value,
    activePresetImages: activePresetImages.value
  });
};

const handleReanalysis = async (image) => {
  await handleImageReanalysis(
    image,
    parentColors.value,
    analysisSettings.value,
    activePreset.value,
    activePresetImages.value
  );
};

// Preset handlers
const handleSaveAsPreset = async (presetData) => {
  await handlePresetSave(presetData, showNotification, (error) => showNotification(error, "error"));
};

const handleSavePreset = async (images) => {
  await handlePresetUpdate(images, showNotification, (error) => showNotification(error, "error"));
};

const handleDeletePreset = async () => {
  await handlePresetDelete(showNotification, (error) => showNotification(error, "error"));
};

const handleDeleteImage = (index) => {
  if (activePreset.value) {
    activePresetImages.value = activePresetImages.value.filter((_, i) => i !== index);
  } else {
    processedImages.value = processedImages.value.filter((_, i) => i !== index);
  }
};

// Parent colors
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

// Initialize
onMounted(async () => {
  await loadPresets();
});
</script>
