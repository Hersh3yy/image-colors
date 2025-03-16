<!--
  App.vue - Main Application Entry Point
  
  This is the root component of the application that organizes:
  1. Image analysis and color extraction using the LAB color space
  2. Color matching with parent colors and Pantone database
  3. User feedback collection for color matching improvement
  4. Preset management for saving and loading analysis results
  
  Component Flow:
  - Image Upload → Analysis → Color Extraction → Color Matching → Results Display
  - Feedback Collection → Knowledge Base Updates → Enhanced Matching
  
  Data Flow:
  - Image Analysis Pipeline: 
      Image → Preprocessing → Color Extraction → Color Matching → Results
  - Feedback System:
      User Input → Feedback Processing → Knowledge Base → Enhanced Matching
-->

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header and Status Components -->
    <AppHeader ref="headerRef" />
    <AppStatus 
      :analysis-status="analysisStatus" 
      :preset-status="presetStatus" 
    />

    <!-- Feedback and Play Mode Actions -->
    <div class="container mx-auto px-4 py-2 flex justify-end space-x-3">
      <button 
        @click="handlePlayMode" 
        class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
        title="Train the system with random colors"
      >
        <span class="mr-2">🎮</span> Play Mode
      </button>
      <button 
        v-if="selectedImage" 
        @click="handleFeedback(selectedImage)" 
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
        title="Provide feedback on color matching results"
      >
        <span class="mr-2">📝</span> Provide Feedback
      </button>
    </div>

    <!-- Main Content Area -->
    <main class="container mx-auto px-4 py-8">
      <!-- Overall Analysis Overview -->
      <OverallAnalaysis 
        v-if="activePreset || processedImages.length"
        :images="activePreset ? activePresetImages : processedImages" 
        class="mt-8" 
      />

      <!-- Active Preset Display Section -->
      <div v-if="activePreset" class="mt-8">
        <ActivePreset 
          :preset="activePreset" 
          :images="activePresetImages" 
          :parent-colors="parentColors"
          @save="handleSavePreset"
          @delete="handleDeletePreset" 
          @reanalyze="handleReanalysis" 
          @deleteImage="handleDeleteImage"
          @saveAsNew="handleSaveAsPreset" 
          @selectImage="handleSelectImage"
          @feedback="handleColorFeedback" 
        />
      </div>

      <!-- Processed Images Display Section -->
      <div v-else-if="processedImages.length" class="mt-8 space-y-4">
        <div v-for="(image, index) in processedImages" :key="index">
          <ImageAnalysisResult 
            :image="image" 
            :parent-colors="parentColors" 
            @reanalyze="handleReanalysis" 
            @delete="handleDeleteImage(index)" 
            @selectImage="handleSelectImage"
            @feedback="handleColorFeedback"
          />
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="mt-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p>{{ error }}</p>
      </div>
    </main>

    <!-- Image Controls Section -->
    <ImageControls 
      :is-processing="isProcessing" 
      :colors="parentColors" 
      :presets="presets"
      :processed-images="processedImages" 
      :analysis-status="analysisStatus" 
      :preset-status="presetStatus"
      @analyze="handleAnalysis"
      @filesSelected="handleFileSelection" 
      @update:colors="updateParentColors" 
      @loadPreset="handleLoadPreset"
      @saveAsPreset="handleSaveAsPreset" 
      @updateSettings="handleSettingsUpdate" 
    />
      
    <!-- Learning System Modals -->
    <FeedbackModal 
      :is-visible="isFeedbackModalVisible" 
      :match="selectedColorMatch" 
      :pantone-colors="pantoneColors"
      :parent-colors="parentColors"
      @close="closeFeedbackModal" 
      @feedback-submitted="handleFeedbackSubmitted" 
    />
    
    <PlayModal 
      :is-visible="isPlayModalVisible" 
      :pantone-colors="pantoneColors"
      :parent-colors="parentColors"
      @close="closePlayModal" 
      @feedback-submitted="handleFeedbackSubmitted"
      @request-pantone-colors="handleRequestPantoneColors"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useImageAnalysis } from '@/composables/useImageAnalysis';
import { usePresets } from '@/composables/usePresets';
import { useFeedback } from '@/composables/useFeedback';
import { useAnalysisSettings } from '@/composables/useAnalysisSettings';
import FeedbackModal from '@/components/feedback/FeedbackModal.vue';
import PlayModal from '@/components/feedback/PlayModal.vue';

/**
 * Add Highcharts script for data visualization
 */
useHead({
  script: [
    {
      src: 'https://code.highcharts.com/12.1.2/highcharts.js',
      body: true
    }
  ]
});

/**
 * ===================================
 * COMPOSABLE HOOKS
 * ===================================
 * The application uses composition API with four main composable hooks:
 * 1. useImageAnalysis - For image processing and color analysis
 * 2. usePresets - For saving and loading analysis results
 * 3. useFeedback - For collecting user feedback and improving matches
 * 4. useAnalysisSettings - For managing analysis configuration
 */

/**
 * Image Analysis Hook
 * Manages the image processing and color extraction pipeline
 */
const {
  isProcessing,          // Whether an analysis is in progress
  error,                 // Error message if any
  processedImages,       // Array of processed image results
  analysisStatus,        // Status object for UI updates
  handleAnalysis: handleImageAnalysis,       // Main analysis function
  handleReanalysis: handleImageReanalysis    // Reanalysis function
} = useImageAnalysis();

/**
 * Presets Management Hook
 * Handles saving, loading, and managing preset configurations
 */
const {
  presets,               // Array of available presets
  activePreset,          // Currently active preset if any
  activePresetImages,    // Images for the active preset
  presetStatus,          // Status object for preset operations
  loadPresets,           // Function to load presets from storage
  handleLoadPreset,      // Function to load a specific preset
  handleSaveAsPreset: handlePresetSave,      // Save as new preset
  handleSavePreset: handlePresetUpdate,      // Update existing preset
  handleDeletePreset: handlePresetDelete     // Delete a preset
} = usePresets();

/**
 * Feedback System Hook
 * Manages user feedback collection for improving color matching
 */
const { 
  isFeedbackModalVisible,    // Whether feedback modal is visible
  isPlayModalVisible,        // Whether play mode modal is visible
  pantoneColors,             // Array of available pantone colors
  fetchPantoneColors,        // Function to fetch pantone colors
  showFeedbackModal,         // Show feedback modal function
  closeFeedbackModal,        // Close feedback modal function
  showPlayModal,             // Show play mode modal function
  closePlayModal,            // Close play mode modal function
  handleFeedbackSubmitted    // Handle feedback submission
} = useFeedback();

/**
 * Analysis Settings Hook
 * Manages configuration for the analysis process
 */
const {
  settings: analysisSettings // Analysis settings object
} = useAnalysisSettings();

/**
 * ===================================
 * NOTIFICATIONS SYSTEM
 * ===================================
 */
const headerRef = ref(null);

/**
 * Display a notification message
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, error, warning, info)
 */
const showNotification = (message, type = "success") => {
  headerRef.value?.showNotification(message, type);
};

/**
 * ===================================
 * FILE SELECTION AND ANALYSIS
 * ===================================
 */
const selectedFiles = ref(null);

/**
 * Handle file selection from file picker
 * @param {FileList} files - Selected files
 */
const handleFileSelection = (files) => {
  selectedFiles.value = files;
};

/**
 * Handle image analysis request
 * Processes images using configured settings
 * @param {Object} params - Analysis parameters including files
 */
const handleAnalysis = async ({ files }) => {
  await handleImageAnalysis({
    files,
    parentColors: parentColors.value,
    analysisSettings: analysisSettings.value,
    activePreset: activePreset.value,
    activePresetImages: activePresetImages.value
  });
};

/**
 * Handle image reanalysis request
 * Reprocesses an existing image with current settings
 * @param {Object} image - Image to reanalyze
 */
const handleReanalysis = async (image) => {
  await handleImageReanalysis(
    image,
    parentColors.value,
    analysisSettings.value,
    activePreset.value,
    activePresetImages.value
  );
};

/**
 * ===================================
 * PRESET MANAGEMENT
 * ===================================
 */

/**
 * Handle saving as a new preset
 * @param {Object} presetData - Preset data to save
 */
const handleSaveAsPreset = async (presetData) => {
  await handlePresetSave(
    presetData, 
    showNotification, 
    (error) => showNotification(error, "error")
  );
};

/**
 * Handle updating an existing preset
 * @param {Array} images - Images to save in preset
 */
const handleSavePreset = async (images) => {
  await handlePresetUpdate(
    images, 
    showNotification, 
    (error) => showNotification(error, "error")
  );
};

/**
 * Handle deleting a preset
 */
const handleDeletePreset = async () => {
  await handlePresetDelete(
    showNotification, 
    (error) => showNotification(error, "error")
  );
};

/**
 * Handle deleting an image
 * @param {number} index - Index of image to delete
 */
const handleDeleteImage = (index) => {
  if (activePreset.value) {
    activePresetImages.value = activePresetImages.value.filter((_, i) => i !== index);
  } else {
    processedImages.value = processedImages.value.filter((_, i) => i !== index);
  }
};

/**
 * ===================================
 * PARENT COLOR MANAGEMENT
 * ===================================
 */
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

/**
 * Update parent colors
 * @param {Array} newColors - New parent colors
 */
const updateParentColors = (newColors) => {
  parentColors.value = newColors;
};

/**
 * ===================================
 * FEEDBACK SYSTEM
 * ===================================
 */
const selectedImage = ref(null);
const selectedColorMatch = ref(null);

/**
 * Handle image selection for feedback
 * @param {Object} image - Selected image
 */
const handleSelectImage = (image) => {
  selectedImage.value = image;
};

/**
 * Handle feedback request
 * @param {Object} image - Image to provide feedback for
 */
const handleFeedback = (image) => {
  if (!image || !image.colors || image.colors.length === 0) {
    return;
  }
  
  // Select the first color by default, can be changed to let user select
  selectedColorMatch.value = image.colors[0];
  showFeedbackModal(selectedColorMatch.value);
};

/**
 * Handle feedback request for a specific color
 * @param {Object} data - Object containing image and colorMatch
 */
const handleColorFeedback = (data) => {
  if (!data || !data.colorMatch) {
    return;
  }
  
  // Set the selected match and show the feedback modal
  selectedColorMatch.value = data.colorMatch;
  showFeedbackModal(selectedColorMatch.value);
};

/**
 * Handle play mode request to train the system
 */
const handlePlayMode = () => {
  showPlayModal();
};

/**
 * ===================================
 * SETTINGS MANAGEMENT
 * ===================================
 */

/**
 * Handle updates to analysis settings
 * @param {Object} newSettings - Updated settings
 */
const handleSettingsUpdate = (newSettings) => {
  console.log("Settings updated:", newSettings);
  
  // If settings change during analysis, show notification
  if (isProcessing.value) {
    showNotification(
      "Settings will apply to the next analysis", 
      "info"
    );
  }
};

/**
 * ===================================
 * INITIALIZATION
 * ===================================
 */
onMounted(async () => {
  // Fetch pantone colors for color matching
  fetchPantoneColors();
  
  // Load presets from storage
  await loadPresets();
});

/**
 * Handle request to reload Pantone colors
 * Manually triggers the fetchPantoneColors function when requested
 */
const handleRequestPantoneColors = async () => {
  console.log('Request to fetch pantone colors received');
  await fetchPantoneColors();
};
</script>

<style>
/* Global styles can be added here */
</style>
