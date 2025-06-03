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
  <div class="min-h-screen bg-gray-100">
    <!-- Header and Status Components -->
    <AppHeader ref="headerRef" />
    <AppStatus 
      :analysis-status="analysisStatus" 
      :preset-status="presetStatus" 
    />

    <!-- Main toolbar -->
    <MainToolbar 
      @viewKnowledgeBase="showKnowledgeBase = true"
      @showPlayModal="showPlayModal = true"
      @showTrainModal="showTrainModal = true"
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
        <div v-for="(image, index) in processedImages" :key="index" :id="`image-result-${index}`">
          <ImageAnalysisResult 
            :image="image" 
            :parent-colors="parentColors" 
            @reanalyze="(img) => handleReanalysis(img, index)" 
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
      @feedback-submitted="handleFeedbackSubmitted"
      @save-match-preference="handleSaveMatchPreference"
    />

    <!-- Knowledge Base Modal -->
    <KnowledgeBaseModal
      :isVisible="showKnowledgeBase"
      :knowledge-base="knowledgeBase"
      :loading="knowledgeBaseLoading"
      :error="knowledgeBaseError"
      :parent-colors="parentColors"
      @close="showKnowledgeBase = false"
    />

    <PlayModal
      :isVisible="showPlayModal"
      :parent-colors="parentColors"
      @close="showPlayModal = false"
      @feedback-submitted="handleFeedbackSubmitted"
    />

    <TrainModal
      :isVisible="showTrainModal"
      @close="showTrainModal = false"
    />

    <InfoTooltip 
      :isVisible="showTooltip"
      :content="tooltipContent"
      :position="tooltipPosition"
      @close="showTooltip = false"
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
import PlayModal from '@/components/feedback/PlayModal.vue';
import TrainModal from '@/components/TrainModal.vue';

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
const handleAnalysis = async ({ files, settings: providedSettings }) => {
  // Use provided settings or fall back to current settings from composable
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
 * Reprocesses an existing image with current settings
 * @param {Object} image - Image to reanalyze
 * @param {number} index - Index of the image being reanalyzed
 */
const handleReanalysis = async (image, index) => {
  try {
    // Safely access the settings with fallbacks
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
    
    // No need for scroll management since image stays in position
    
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
const showKnowledgeBase = ref(false);
const knowledgeBase = ref(null);
const knowledgeBaseLoading = ref(false);
const knowledgeBaseError = ref(null);

/**
 * Fetch and display the knowledge base
 */
const viewKnowledgeBase = async () => {
  showKnowledgeBase.value = true;
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
  // Load presets from storage
  await loadPresets();
});

// State
const showPlayModal = ref(false);
const showTrainModal = ref(false);
const showTooltip = ref(false);
const tooltipContent = ref('');
const tooltipPosition = ref({ x: 0, y: 0 });

// Refs to manage component references
const imageAnalysisResults = ref([]);

// Methods
const handleFeedbackSubmitted = (feedback) => {
  console.log('Feedback received in app.vue:', feedback);
  
  // Apply the feedback to update the current image match
  updateCurrentColorMatch(feedback);
  
  // Show notification
  showTooltip.value = true;
  tooltipContent.value = 'Thank you for your feedback! The match has been updated.';
  tooltipPosition.value = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  
  // Auto-hide the tooltip after 3 seconds
  setTimeout(() => {
    showTooltip.value = false;
  }, 3000);
};

/**
 * Update a color match immediately based on user feedback
 * @param {Object} feedback - Feedback data containing originalColor and correction
 */
const updateCurrentColorMatch = (feedback) => {
  if (!feedback || !feedback.originalColor || !feedback.correction) {
    console.warn('Invalid feedback data:', feedback);
    return;
  }
  
  console.log('Updating color match based on feedback:', feedback);
  
  // Find the image and color to update - check active preset first, then processed images
  let targetImage = null;
  let isPresetImage = false;
  
  if (activePreset.value) {
    // Search in active preset images
    targetImage = activePresetImages.value.find(img => {
      return img.colors.some(color => color.color === feedback.originalColor);
    });
    isPresetImage = !!targetImage;
  }
  
  if (!targetImage && feedback.colorMatch?.image) {
    // If feedback contains a direct reference to the image
    targetImage = feedback.colorMatch.image;
  }
  
  if (!targetImage) {
    // If not found in preset, search in processed images
    targetImage = processedImages.value.find(img => {
      return img.colors.some(color => color.color === feedback.originalColor);
    });
  }
  
  if (!targetImage) {
    console.warn('Could not find the image containing the original color:', feedback.originalColor);
    return;
  }
  
  // Find the specific color to update
  const colorToUpdate = targetImage.colors.find(color => color.color === feedback.originalColor);
  
  if (!colorToUpdate) {
    console.warn('Could not find the color to update:', feedback.originalColor);
    return;
  }
  
  console.log('Found color to update:', colorToUpdate);
  console.log('Updating with correction:', feedback.correction);
  
  // Create a backup of the original parent before updating
  if (!colorToUpdate.originalParent) {
    colorToUpdate.originalParent = { ...colorToUpdate.parent };
  }
  
  // Update the parent color match with the user's correction
  colorToUpdate.parent = {
    name: feedback.correction.parentName,
    hex: feedback.correction.parentHex,
    distance: feedback.colorInfo?.distances?.deltaE || 0,
    confidence: calculateConfidence(feedback.colorInfo?.distances?.deltaE || 0)
  };
  
  console.log('Updated color data:', colorToUpdate);
  
  // Update metadata if needed
  if (targetImage.metadata?.problematicMatches) {
    // Remove this color from problematic matches if it was there
    targetImage.metadata.problematicMatches = targetImage.metadata.problematicMatches.filter(
      match => match.color !== feedback.originalColor
    );
  }
  
  // Force a direct update to any currently rendered ImageAnalysisResult components
  // First, try to update by index
  const imageIndex = targetImage.index || -1;
  if (imageIndex >= 0 && imageAnalysisResults.value?.[imageIndex]) {
    const resultComponent = imageAnalysisResults.value[imageIndex];
    if (resultComponent && typeof resultComponent.updateColorMatch === 'function') {
      console.log('Updating ImageAnalysisResult component by index', imageIndex);
      resultComponent.updateColorMatch(feedback.originalColor, colorToUpdate.parent);
    }
  }
  
  // Also try to update all ImageAnalysisResult components that might contain this image
  if (typeof document !== 'undefined') {
    setTimeout(() => {
      // Get access to all ImageAnalysisResult components rendered in the DOM
      const resultComponents = document.querySelectorAll('.image-analysis-result');
      console.log(`Found ${resultComponents.length} ImageAnalysisResult components in DOM`);
      
      // Try to update any components that need updating
      resultComponents.forEach(component => {
        // This is a workaround since we can't directly access component instances
        // The real fix would be to properly track and reference components in Vue
        const imageNameEl = component.querySelector('.image-name');
        if (imageNameEl && imageNameEl.textContent === targetImage.name) {
          console.log('Found matching ImageAnalysisResult component to update');
          
          // Force DOM update for table cells with this color
          const colorCells = component.querySelectorAll(`[data-color="${feedback.originalColor}"]`);
          colorCells.forEach(cell => {
            const parentNameCell = cell.parentElement.querySelector('.parent-name');
            if (parentNameCell) {
              parentNameCell.textContent = feedback.correction.parentName;
              console.log('Updated parent name cell content');
            }
            
            const parentColorCell = cell.parentElement.querySelector('.parent-color');
            if (parentColorCell) {
              parentColorCell.style.backgroundColor = feedback.correction.parentHex;
              console.log('Updated parent color cell background');
            }
          });
        }
      });
    }, 100); // Small delay to ensure Vue has updated the DOM
  }
  
  console.log('Color match updated successfully');
  
  // If this is a preset image, show notification about saving
  if (isPresetImage) {
    showNotification(
      "Match updated! Click 'Save Changes' to update this preset permanently.", 
      "info"
    );
  } else {
    // Regular update notification
    showNotification(
      "Color match updated successfully!", 
      "success"
    );
  }
};

/**
 * Calculate confidence score based on color distance
 * @param {number} distance - Color distance
 * @returns {number} - Confidence score 0-100
 */
const calculateConfidence = (distance) => {
  // 0 distance = 100% confidence
  // Large distances = low confidence
  const max = 50; // Maximum reasonable distance
  const confidence = Math.max(0, 100 - (distance * 2));
  return Math.round(confidence);
};

/**
 * Handle saving match preferences
 * This is used for both direct preset updates and persistent customizations
 * @param {Object} preference - The match preference to save
 */
const handleSaveMatchPreference = (preference) => {
  // Check if we have valid data
  if (!preference || !preference.originalColor || !preference.matchedColor) {
    console.warn('Invalid match preference data:', preference);
    return;
  }
  
  // Save to preset or update image (updateCurrentColorMatch already handles this)
  // For now we're just logging this, but we could save to a user-specific preferences store
  console.log('Match preference saved:', preference);
};
</script>

<style>
/* Global styles can be added here */
</style>
