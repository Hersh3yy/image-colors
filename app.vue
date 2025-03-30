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
    <MainToolbar 
      @view-knowledge-base="viewKnowledgeBase"
      @show-play-modal="feedbackManagerRef.showPlayMode"
    />

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
      
    <!-- Feedback and Learning System -->
    <FeedbackManager
      ref="feedbackManagerRef"
      :parent-colors="parentColors"
      @notification="showNotification"
    />

    <!-- Knowledge Base Modal -->
    <KnowledgeBaseModal
      :is-visible="showKnowledgeBaseModal"
      :knowledge-base="knowledgeBase"
      :loading="knowledgeBaseLoading"
      :error="knowledgeBaseError"
      :parent-colors="parentColors"
      @close="showKnowledgeBaseModal = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useImageAnalysis } from '@/composables/useImageAnalysis';
import { usePresets } from '@/composables/usePresets';
import { useAnalysisSettings } from '@/composables/useAnalysisSettings';
import { useParentColors } from '@/composables/useParentColors';
import MainToolbar from '@/components/MainToolbar.vue';
import FeedbackManager from '@/components/FeedbackManager.vue';
import KnowledgeBaseModal from '@/components/KnowledgeBaseModal.vue';

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
 * 3. useAnalysisSettings - For managing analysis configuration
 * 4. useParentColors - For managing parent color definitions
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
 * Analysis Settings Hook
 * Manages configuration for the analysis process
 */
const {
  settings: analysisSettings // Analysis settings object
} = useAnalysisSettings();

/**
 * Parent Colors Hook
 * Manages the parent colors for color matching
 */
const {
  parentColors,              // Array of parent colors
  updateParentColors         // Function to update parent colors
} = useParentColors();

/**
 * ===================================
 * COMPONENT REFERENCES
 * ===================================
 */
const headerRef = ref(null);
const feedbackManagerRef = ref(null);

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
  // Always use the latest settings from the composable
  const currentSettings = analysisSettings.settings.value;
  
  console.log('Analyzing with current settings:', currentSettings);
  
  await handleImageAnalysis({
    files,
    parentColors: parentColors.value,
    analysisSettings: currentSettings,
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
  // Always use the latest settings from the composable
  // This ensures we're using any settings that were just updated
  const currentSettings = analysisSettings.settings.value;
  
  console.log('Reanalyzing with current settings:', currentSettings);
  
  await handleImageReanalysis(
    image,
    parentColors.value,
    currentSettings,
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
 * FEEDBACK SYSTEM
 * ===================================
 */
const selectedImage = ref(null);

/**
 * Handle image selection for feedback
 * @param {Object} image - Selected image
 */
const handleSelectImage = (image) => {
  selectedImage.value = image;
};

/**
 * Handle feedback request for a specific color
 * @param {Object} data - Object containing image and colorMatch
 */
const handleColorFeedback = (data) => {
  if (!data || !data.colorMatch) {
    return;
  }
  
  // Use the FeedbackManager component to handle the feedback
  feedbackManagerRef.value?.showFeedbackForColor(data.colorMatch);
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
  
  // Update the settings through the composable to ensure 
  // they're properly validated and persisted to localStorage
  const success = analysisSettings && typeof analysisSettings.updateSettings === 'function'
    ? analysisSettings.updateSettings(newSettings)
    : false;
    
  if (success) {
    // Provide feedback that settings are applied
    showNotification(
      "Settings updated - changes will apply to next analysis", 
      "success"
    );
  } else if (isProcessing.value) {
    // Special notice if updating during processing
    showNotification(
      "Settings will apply after current analysis completes", 
      "info"
    );
  }
};

/**
 * ===================================
 * KNOWLEDGE BASE MANAGEMENT
 * ===================================
 */
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

/**
 * ===================================
 * INITIALIZATION
 * ===================================
 */
onMounted(async () => {
  // Fetch pantone colors for color matching
  feedbackManagerRef.value?.fetchPantoneColors();
  
  // Load presets from storage
  await loadPresets();
});
</script>

<style>
/* Global styles can be added here */
</style>
