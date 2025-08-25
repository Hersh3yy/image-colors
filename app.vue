<!--
  App.vue - Simplified Main Application Entry Point
  
  This is the root component that orchestrates the image color analysis application.
  It now uses atomic design principles and composables for better organization.
  
  Main Features:
  - Image analysis and color extraction
  - Color matching with parent colors
  - User feedback collection system
  - Preset management
  - Knowledge base integration
-->

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Header -->
    <OrganismsAppHeader ref="headerRef" />
    
    <!-- Status Bar -->
    <MoleculesAppStatus 
      :analysis-status="analysisStatus" 
      :preset-status="presetStatus" 
    />

    <!-- Main Toolbar -->
    <OrganismsMainToolbar 
      @viewKnowledgeBase="knowledgeBase.viewKnowledgeBase()"
      @showPlayModal="showPlayModal = true"
      @showTrainModal="showTrainModal = true"
    />

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8">
      <!-- Overall Analysis Overview -->
      <OrganismsOverallAnalaysis 
        v-if="shouldShowOverallAnalysis"
        :images="currentImages" 
        class="mt-8" 
      />

      <!-- Active Preset Display -->
      <OrganismsActivePreset 
        v-if="activePreset"
        :preset="activePreset" 
        :images="activePresetImages" 
        :parent-colors="parentColors"
        @save="handleSavePreset"
        @delete="handleDeletePreset" 
        @reanalyze="handleReanalysis" 
        @deleteImage="handleDeleteImage"
        @saveAsNew="handleSaveAsPreset" 
        @selectImage="colorFeedback.handleSelectImage"
        @feedback="(data) => colorFeedback.handleColorFeedback(data, feedbackManagerRef)" 
        class="mt-8"
      />

      <!-- Processed Images Display -->
      <div v-else-if="processedImages.length" class="mt-8 space-y-4">
        <OrganismsImageAnalysisResult 
          v-for="(image, index) in processedImages" 
          :key="index" 
          :id="`image-result-${index}`"
          :image="image" 
          :parent-colors="parentColors" 
          @reanalyze="(img) => handleReanalysis(img, index)" 
          @delete="handleDeleteImage(index)" 
          @selectImage="colorFeedback.handleSelectImage"
          @feedback="(data) => colorFeedback.handleColorFeedback(data, feedbackManagerRef)"
        />
      </div>

      <!-- Error Display -->
      <div v-if="error" class="mt-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p>{{ error }}</p>
      </div>
    </main>

    <!-- Image Controls -->
    <OrganismsImageControls 
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
      
    <!-- Feedback System -->
    <OrganismsFeedbackManager
      ref="feedbackManagerRef"
      :parent-colors="parentColors"
      @notification="showNotification"
      @feedback-submitted="handleFeedbackSubmitted"
      @save-match-preference="colorFeedback.handleSaveMatchPreference"
    />

    <!-- Modals -->
    <OrganismsKnowledgeBaseModal
      :isVisible="knowledgeBase.showKnowledgeBase.value"
      :knowledge-base="knowledgeBase.knowledgeBase.value"
      :loading="knowledgeBase.knowledgeBaseLoading.value"
      :error="knowledgeBase.knowledgeBaseError.value"
      :parent-colors="parentColors"
      @close="knowledgeBase.closeKnowledgeBase()"
    />

    <FeedbackPlayModal
      :isVisible="showPlayModal"
      :parent-colors="parentColors"
      @close="showPlayModal = false"
      @feedback-submitted="handleFeedbackSubmitted"
    />

    <OrganismsTrainModal
      :isVisible="showTrainModal"
      @close="showTrainModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useImageAnalysis } from '@/composables/useImageAnalysis';
import { usePresets } from '@/composables/usePresets';
import { useAnalysisSettings } from '@/composables/useAnalysisSettings';
import { useParentColors } from '@/composables/useParentColors';
import { useColorFeedback } from '@/composables/useColorFeedback';
import { useKnowledgeBase } from '@/composables/useKnowledgeBase';

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
 */

// Image Analysis
const {
  isProcessing,
  error,
  processedImages,
  analysisStatus,
  handleAnalysis: handleImageAnalysis,
  handleReanalysis: handleImageReanalysis
} = useImageAnalysis();

// Presets Management
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

// Analysis Settings
const { settings: analysisSettings } = useAnalysisSettings();

// Parent Colors
const { parentColors, updateParentColors } = useParentColors();

// Color Feedback System
const colorFeedback = useColorFeedback();

// Knowledge Base
const knowledgeBase = useKnowledgeBase();

/**
 * ===================================
 * REFS AND STATE
 * ===================================
 */
const headerRef = ref(null);
const feedbackManagerRef = ref(null);
const selectedFiles = ref(null);
const showPlayModal = ref(false);
const showTrainModal = ref(false);
const showTooltip = ref(false);
const tooltipContent = ref('');
const tooltipPosition = ref({ x: 0, y: 0 });

/**
 * ===================================
 * COMPUTED PROPERTIES
 * ===================================
 */

/**
 * Should show overall analysis based on current state
 */
const shouldShowOverallAnalysis = computed(() => {
  return activePreset.value || processedImages.value.length > 0;
});

/**
 * Current images to display in overall analysis
 */
const currentImages = computed(() => {
  return activePreset.value ? activePresetImages.value : processedImages.value;
});

/**
 * ===================================
 * CORE METHODS
 * ===================================
 */

/**
 * Display a notification message
 */
const showNotification = (message, type = "success") => {
  headerRef.value?.showNotification(message, type);
};

/**
 * Handle file selection from file picker
 */
const handleFileSelection = (files) => {
  selectedFiles.value = files;
};

/**
 * Handle image analysis request
 */
const handleAnalysis = async ({ files, settings: providedSettings }) => {
  const currentSettings = providedSettings || (analysisSettings?.settings?.value || {});
  
  console.log('Analyzing with settings:', currentSettings);
  
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
 */
const handleReanalysis = async (image, index) => {
  try {
    const currentSettings = analysisSettings?.settings?.value || {};
    
    console.log('Reanalyzing with current settings:', currentSettings);
    
    if (!image) {
      throw new Error('No image provided for reanalysis');
    }
    
    await handleImageReanalysis(
      image,
      parentColors.value || [],
      currentSettings,
      activePreset.value,
      activePresetImages.value || []
    );
    
  } catch (error) {
    console.error('Error during reanalysis:', error);
    showNotification('Error reanalyzing image: ' + (error.message || 'Unknown error'), 'error');
  }
};

/**
 * ===================================
 * PRESET MANAGEMENT
 * ===================================
 */

const handleSaveAsPreset = async (presetData) => {
  await handlePresetSave(
    presetData, 
    showNotification, 
    (error) => showNotification(error, "error")
  );
};

const handleSavePreset = async (images) => {
  await handlePresetUpdate(
    images, 
    showNotification, 
    (error) => showNotification(error, "error")
  );
};

const handleDeletePreset = async () => {
  await handlePresetDelete(
    showNotification, 
    (error) => showNotification(error, "error")
  );
};

const handleDeleteImage = (index) => {
  if (activePreset.value) {
    activePresetImages.value = activePresetImages.value.filter((_, i) => i !== index);
  } else {
    processedImages.value = processedImages.value.filter((_, i) => i !== index);
  }
};

/**
 * ===================================
 * SETTINGS MANAGEMENT
 * ===================================
 */

const handleSettingsUpdate = (newSettings) => {
  console.log("Settings updated:", newSettings);
  
  const success = analysisSettings && typeof analysisSettings.updateSettings === 'function'
    ? analysisSettings.updateSettings(newSettings)
    : false;
    
  if (success) {
    showNotification(
      "Settings updated - changes will apply to next analysis", 
      "success"
    );
  } else if (isProcessing.value) {
    showNotification(
      "Settings will apply after current analysis completes", 
      "info"
    );
  }
};

/**
 * ===================================
 * FEEDBACK HANDLING
 * ===================================
 */

const handleFeedbackSubmitted = (feedback) => {
  console.log('Feedback received in app.vue:', feedback);
  
  // Apply the feedback to update the current image match
  colorFeedback.updateCurrentColorMatch(
    feedback,
    activePreset,
    activePresetImages,
    processedImages,
    showNotification
  );
  
  // Show tooltip notification
  showTooltip.value = true;
  tooltipContent.value = 'Thank you for your feedback! The match has been updated.';
  tooltipPosition.value = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  
  // Auto-hide the tooltip after 3 seconds
  setTimeout(() => {
    showTooltip.value = false;
  }, 3000);
};

/**
 * ===================================
 * INITIALIZATION
 * ===================================
 */
onMounted(async () => {
  // Load presets from storage
  await loadPresets();
});
</script>

<style>
/* Global styles */
</style>
