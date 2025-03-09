import { ref, watch } from 'vue';
import { COLOR_SPACES } from '@/services/imageAnalyzerSupport';
import { DISTANCE_METHODS } from '@/services/imageAnalyzer';

// Storage key for persisting settings
const STORAGE_KEY = 'image-analysis-settings';

/**
 * Default settings for image analysis
 * Using only LAB color space and Delta E as per requirements
 */
const defaultSettings = {
  sampleSize: 10000,       // Number of pixels to sample
  k: 13,                   // Number of color clusters to find
  colorSpace: COLOR_SPACES.LAB,  // Using LAB color space only
  distanceMethod: DISTANCE_METHODS.DELTA_E,  // Using Delta E only
  confidenceThreshold: 20, // Threshold for problematic matches
};

/**
 * Composable for managing image analysis settings
 * @returns {Object} - Settings and related functions
 */
export const useAnalysisSettings = () => {
  /**
   * Load settings from localStorage or use defaults
   * @returns {Object} - Settings object
   */
  const loadStoredSettings = () => {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          // Get stored settings but ensure LAB and DELTA_E are used
          const parsedSettings = JSON.parse(stored);
          return { 
            ...defaultSettings, 
            ...parsedSettings,
            // Force LAB and DELTA_E regardless of stored settings
            colorSpace: COLOR_SPACES.LAB,
            distanceMethod: DISTANCE_METHODS.DELTA_E
          };
        } catch (e) {
          console.error('Error parsing stored settings:', e);
          return defaultSettings;
        }
      }
    }
    return defaultSettings;
  };

  // Initialize settings from storage or defaults
  const settings = ref(loadStoredSettings());

  // Persist settings to localStorage whenever they change
  watch(settings, (newSettings) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    }
  }, { deep: true });

  /**
   * Validate and update settings
   * @param {Object} newSettings - Settings to update
   */
  const updateSettings = (newSettings) => {
    // Create a copy of the incoming settings to avoid modifying the original
    const updatedSettings = { ...newSettings };
    
    // Ensure sampleSize is within reasonable bounds
    if (updatedSettings.sampleSize) {
      updatedSettings.sampleSize = Math.max(1000, Math.min(100000, updatedSettings.sampleSize));
    }

    // Ensure k is within reasonable bounds
    if (updatedSettings.k) {
      updatedSettings.k = Math.max(3, Math.min(20, updatedSettings.k));
    }

    // Force LAB color space
    updatedSettings.colorSpace = COLOR_SPACES.LAB;
    
    // Force Delta E distance method
    updatedSettings.distanceMethod = DISTANCE_METHODS.DELTA_E;

    // Update settings
    settings.value = {
      ...settings.value,
      ...updatedSettings
    };
  };

  /**
   * Reset settings to defaults
   */
  const resetSettings = () => {
    settings.value = { ...defaultSettings };
  };

  return {
    settings,
    updateSettings,
    resetSettings
  };
}; 