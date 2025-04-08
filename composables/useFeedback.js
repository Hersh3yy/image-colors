/**
 * useFeedback.js - Feedback System Composable
 * 
 * This composable provides functionality for collecting user feedback on color matching:
 * - Manages feedback and play modals state
 * - Coordinates feedback submission
 * 
 * It serves as the main interface between the UI components and the feedback system,
 * enabling users to provide corrections that help train and improve the color matching
 * enhancement system.
 */

import { ref, computed } from 'vue';

export function useFeedback() {
  /**
   * ===================================
   * STATE MANAGEMENT
   * ===================================
   */
  // Modal visibility state
  const isFeedbackModalVisible = ref(false);
  const isPlayModalVisible = ref(false);
  
  // Data for feedback
  const selectedMatch = ref(null);
  const pantoneColors = ref([]);
  const feedbackHistory = ref([]);
  
  /**
   * ===================================
   * DATA FETCHING
   * ===================================
   */
  
  /**
   * Fetch Pantone colors from assets
   * Loads the complete Pantone color library for color matching
   * Caches results to avoid repeated fetching
   */
  const fetchPantoneColors = async () => {
    try {
      // Check if we already have the colors
      if (pantoneColors.value.length > 0) return;
      
      // Import the colors directly instead of using fetch
      import('@/assets/processed_colors.json')
        .then(module => {
          pantoneColors.value = module.default;
          console.log(`Loaded ${pantoneColors.value.length} Pantone colors`);
        })
        .catch(error => {
          console.error('Error importing Pantone colors:', error);
          pantoneColors.value = []; // Set empty array on error
        });
    } catch (error) {
      console.error('Error fetching pantone colors:', error);
    }
  };
  
  /**
   * ===================================
   * MODAL MANAGEMENT
   * ===================================
   */
  
  /**
   * Show feedback modal for a specific match
   * @param {Object} match - The color match to provide feedback for
   */
  const showFeedbackModal = (match) => {
    selectedMatch.value = match;
    
    // Fetch pantone colors if not already loaded
    fetchPantoneColors();
    
    // Show modal
    isFeedbackModalVisible.value = true;
  };
  
  /**
   * Close feedback modal
   */
  const closeFeedbackModal = () => {
    isFeedbackModalVisible.value = false;
  };
  
  /**
   * Show play modal for training mode
   */
  const showPlayModal = () => {
    // Fetch pantone colors if not already loaded
    fetchPantoneColors();
    
    // Show modal
    isPlayModalVisible.value = true;
  };
  
  /**
   * Close play modal
   */
  const closePlayModal = () => {
    isPlayModalVisible.value = false;
  };
  
  /**
   * ===================================
   * FEEDBACK HANDLING
   * ===================================
   */
  
  /**
   * Handle feedback submission from modals
   * Logs feedback and adds to local history
   * @param {Object} feedback - Feedback data object
   */
  const handleFeedbackSubmitted = (feedback) => {
    // Add to feedback history
    feedbackHistory.value.push({
      ...feedback,
      timestamp: new Date().toISOString()
    });
    
    // Log for debugging
    console.log('Feedback submitted:', feedback);
  };
  
  /**
   * ===================================
   * COMPUTED PROPERTIES
   * ===================================
   */
  
  /**
   * Check if there's any feedback history
   */
  const hasFeedbackHistory = computed(() => feedbackHistory.value.length > 0);
  
  /**
   * Get the latest feedback entry
   */
  const latestFeedback = computed(() => 
    feedbackHistory.value.length > 0 
      ? feedbackHistory.value[feedbackHistory.value.length - 1] 
      : null
  );
  
  /**
   * ===================================
   * PUBLIC API
   * ===================================
   */
  return {
    // State
    isFeedbackModalVisible,
    isPlayModalVisible,
    selectedMatch,
    pantoneColors,
    feedbackHistory,
    
    // Getters
    hasFeedbackHistory,
    latestFeedback,
    
    // Methods
    fetchPantoneColors,
    showFeedbackModal,
    closeFeedbackModal,
    showPlayModal,
    closePlayModal,
    handleFeedbackSubmitted
  };
} 