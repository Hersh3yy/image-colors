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

    <!-- Main toolbar -->
    <div class="fixed top-0 left-0 right-0 bg-gray-800 shadow-md p-2 text-white z-10 flex justify-between items-center">
      <div class="flex items-center">
        <h1 class="text-lg font-semibold">Color Analyzer</h1>
        <button 
          class="ml-2 text-gray-400 hover:text-white"
          title="About this tool"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
      <div class="flex items-center space-x-3">
        <button 
          @click="viewKnowledgeBase" 
          class="flex items-center space-x-1 px-3 py-1 bg-purple-700 text-white text-sm rounded hover:bg-purple-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span>View Knowledge Base</span>
        </button>
        <button 
          @click="showPlayModal" 
          class="flex items-center space-x-1 px-3 py-1 bg-blue-700 text-white text-sm rounded hover:bg-blue-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Play Mode</span>
        </button>
      </div>
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

    <!-- Knowledge Base Modal -->
    <div v-if="showKnowledgeBaseModal" class="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-75">
      <div class="bg-gray-800 text-white rounded-lg shadow-xl max-w-4xl p-6 m-4 overflow-auto max-h-[90vh]">
        <h3 class="text-xl font-bold mb-4 flex justify-between items-center">
          <span>Knowledge Base</span>
          <button 
            @click="showKnowledgeBaseModal = false" 
            class="p-1 hover:bg-gray-700 rounded"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </h3>
        
        <div v-if="knowledgeBaseLoading" class="flex justify-center items-center py-12">
          <div class="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p class="ml-4">Loading knowledge base...</p>
        </div>
        
        <div v-else-if="knowledgeBaseError" class="p-4 bg-red-900 text-white rounded-lg">
          <p>{{ knowledgeBaseError }}</p>
        </div>
        
        <div v-else>
          <div class="mb-4 grid grid-cols-2 gap-4">
            <div class="bg-gray-700 p-3 rounded">
              <p><strong>Version:</strong> {{ knowledgeBase.version }}</p>
              <p><strong>Last Updated:</strong> {{ new Date(knowledgeBase.lastUpdated).toLocaleString() }}</p>
            </div>
            <div class="bg-gray-700 p-3 rounded">
              <p><strong>Patterns:</strong> {{ knowledgeBase.patternCount }}</p>
              <p><strong>Parent Patterns:</strong> {{ knowledgeBase.parentPatternCount }}</p>
            </div>
          </div>
          
          <div class="mb-4">
            <h4 class="font-semibold mb-2">Parameters</h4>
            <div class="bg-gray-700 p-3 rounded">
              <table class="w-full">
                <tr v-for="(value, key) in knowledgeBase.parameters" :key="key">
                  <td class="pr-4 py-1">{{ key }}</td>
                  <td>{{ value }}</td>
                </tr>
              </table>
            </div>
          </div>
          
          <div class="mb-4">
            <h4 class="font-semibold mb-2">Pantone Patterns</h4>
            <div v-if="knowledgeBase.patterns.length" class="space-y-2">
              <div v-for="(pattern, index) in knowledgeBase.patterns" :key="index" class="bg-gray-700 p-3 rounded">
                <p><strong>Type:</strong> {{ pattern.type }}</p>
                <p><strong>Confidence:</strong> {{ pattern.confidence }}%</p>
                <p><strong>Used:</strong> {{ pattern.usageCount }} times</p>
                <div v-if="pattern.condition.hueRange">
                  <p><strong>Hue Range:</strong> {{ pattern.condition.hueRange[0].toFixed(1) }} - {{ pattern.condition.hueRange[1].toFixed(1) }}</p>
                </div>
              </div>
            </div>
            <div v-else class="bg-gray-700 p-3 rounded">
              <p class="text-gray-400">No patterns yet</p>
            </div>
          </div>
          
          <div>
            <h4 class="font-semibold mb-2">Parent Color Patterns</h4>
            <div v-if="knowledgeBase.parentPatterns.length" class="space-y-2">
              <div v-for="(pattern, index) in knowledgeBase.parentPatterns" :key="index" class="bg-gray-700 p-3 rounded">
                <p><strong>Type:</strong> {{ pattern.type }}</p>
                <p><strong>Preferred Parent:</strong> {{ pattern.correctParent }}</p>
                <p><strong>Confidence:</strong> {{ pattern.confidence }}%</p>
                <p><strong>Used:</strong> {{ pattern.usageCount }} times</p>
                <div>
                  <p><strong>Color Properties:</strong></p>
                  <p>Hue: {{ pattern.condition.hue?.toFixed(1) }}</p>
                  <p>Saturation: {{ pattern.condition.saturation?.toFixed(2) }}</p>
                  <p>Lightness: {{ pattern.condition.lightness?.toFixed(2) }}</p>
                </div>
              </div>
            </div>
            <div v-else class="bg-gray-700 p-3 rounded">
              <p class="text-gray-400">No parent patterns yet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
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
  { name: "Dark Red", hex: "#8B0000" },
  { name: "Salmon", hex: "#FA8072" },
  { name: "Pink", hex: "#FFC0CB" },
  { name: "Hot Pink", hex: "#FF69B4" },
  { name: "Orange", hex: "#FFA500" },
  { name: "Dark Orange", hex: "#FF8C00" },
  { name: "Coral", hex: "#FF7F50" },
  { name: "Gold", hex: "#FFD700" },
  { name: "Yellow", hex: "#FFFF00" },
  { name: "Lime", hex: "#00FF00" },
  { name: "Green", hex: "#008000" },
  { name: "Forest Green", hex: "#228B22" },
  { name: "Olive", hex: "#808000" },
  { name: "Mint", hex: "#98FB98" },
  { name: "Teal", hex: "#008080" },
  { name: "Cyan", hex: "#00FFFF" },
  { name: "Sky Blue", hex: "#87CEEB" },
  { name: "Light Blue", hex: "#ADD8E6" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Navy", hex: "#000080" },
  { name: "Purple", hex: "#800080" },
  { name: "Violet", hex: "#EE82EE" },
  { name: "Magenta", hex: "#FF00FF" },
  { name: "Brown", hex: "#A52A2A" },
  { name: "Chocolate", hex: "#D2691E" },
  { name: "Tan", hex: "#D2B48C" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Silver", hex: "#C0C0C0" },
  { name: "Gray", hex: "#808080" },
  { name: "Dark Gray", hex: "#404040" },
  { name: "Black", hex: "#000000" }
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

// Knowledge Base state
const showKnowledgeBaseModal = ref(false);
const knowledgeBase = ref(null);
const knowledgeBaseLoading = ref(false);
const knowledgeBaseError = ref(null);

/**
 * Fetch and display the knowledge base
 */
const viewKnowledgeBase = async () => {
  showKnowledgeBaseModal.value = true;
  knowledgeBaseLoading.value = true;
  knowledgeBaseError.value = null;
  
  try {
    const response = await fetch('/.netlify/functions/match/match', {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch knowledge base: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      knowledgeBase.value = result.knowledgeBase;
    } else {
      throw new Error(result.error || 'Failed to retrieve knowledge base');
    }
  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    knowledgeBaseError.value = error.message;
  } finally {
    knowledgeBaseLoading.value = false;
  }
};
</script>

<style>
/* Global styles can be added here */
</style>
