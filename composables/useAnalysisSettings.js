import { ref, watch } from 'vue';
import { COLOR_SPACES } from '@/services/imageAnalyzerSupport';
import { DISTANCE_METHODS } from '@/services/imageAnalyzer';

// Storage key for persisting settings
const STORAGE_KEY = 'image-analysis-settings';

/**
 * Default settings for image analysis with detailed documentation
 * These default values are chosen to balance performance and accuracy
 */
const defaultSettings = {
  // Image Analysis Settings
  sampleSize: 10000,         // Number of pixels to sample from the image (1,000-100,000)
  k: 13,                     // Number of color clusters to find (3-20)
  maxImageSize: 800,         // Maximum image dimension for processing (200-1600px)
  maxIterations: 30,         // Maximum iterations for k-means clustering (10-100)
  
  // Color Matching Settings
  colorSpace: COLOR_SPACES.LAB,     // Color space used for analysis (LAB only supported)
  distanceMethod: DISTANCE_METHODS.DELTA_E,  // Method for color distance (Delta E only supported)
  confidenceThreshold: 20,   // Threshold for flagging problematic matches (10-50%)
};

/**
 * Composable for managing image analysis settings
 * Provides reactive settings state and methods to manage settings
 * 
 * @returns {Object} - Settings state and management functions
 * @property {Object} settings - Reactive settings object
 * @property {Function} updateSettings - Update settings with validation
 * @property {Function} resetSettings - Reset to default settings
 */
export const useAnalysisSettings = () => {
  /**
   * Load settings from localStorage or use defaults
   * Ensures required settings are always present and valid
   * 
   * @returns {Object} - Validated settings object
   */
  const loadStoredSettings = () => {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          // Load stored settings and validate them
          const parsedSettings = JSON.parse(stored);
          
          // Create a new settings object with defaults for missing properties
          const validatedSettings = {
            ...defaultSettings,
            ...parsedSettings,
            // Force LAB and DELTA_E regardless of stored settings
            colorSpace: COLOR_SPACES.LAB,
            distanceMethod: DISTANCE_METHODS.DELTA_E
          };
          
          // Apply range constraints to numeric settings
          return validateSettingsRanges(validatedSettings);
        } catch (e) {
          console.error('Error parsing stored settings:', e);
          return { ...defaultSettings };
        }
      }
    }
    return { ...defaultSettings };
  };

  /**
   * Validate numeric settings to ensure they are within acceptable ranges
   * 
   * @param {Object} settings - Settings object to validate
   * @returns {Object} - Validated settings with constrained values
   */
  const validateSettingsRanges = (settings) => {
    const validated = { ...settings };
    
    // Image Analysis Settings
    validated.sampleSize = Math.max(1000, Math.min(100000, validated.sampleSize || defaultSettings.sampleSize));
    validated.k = Math.max(3, Math.min(20, validated.k || defaultSettings.k));
    validated.maxImageSize = Math.max(200, Math.min(1600, validated.maxImageSize || defaultSettings.maxImageSize));
    validated.maxIterations = Math.max(10, Math.min(100, validated.maxIterations || defaultSettings.maxIterations));
    
    // Color Matching Settings
    validated.confidenceThreshold = Math.max(10, Math.min(50, validated.confidenceThreshold || defaultSettings.confidenceThreshold));
    
    return validated;
  };

  // Initialize settings from storage or defaults
  const settings = ref(loadStoredSettings());

  // Persist settings to localStorage whenever they change
  watch(settings, (newSettings) => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
        console.log('Settings saved to localStorage');
      } catch (error) {
        console.error('Failed to save settings to localStorage:', error);
      }
    }
  }, { deep: true });

  /**
   * Update settings with validation
   * Can be called with no parameters to just validate/apply current settings
   * 
   * @param {Object} newSettings - Optional settings to update
   */
  const updateSettings = (newSettings = {}) => {
    // Apply new settings if provided
    if (Object.keys(newSettings).length > 0) {
      settings.value = validateSettingsRanges({
        ...settings.value,
        ...newSettings
      });
    } else {
      // Just validate current settings
      settings.value = validateSettingsRanges(settings.value);
    }
    
    // Emit change event if needed (to be implemented in parent component)
    console.log('Settings updated:', settings.value);
  };

  /**
   * Reset all settings to default values
   */
  const resetSettings = () => {
    settings.value = { ...defaultSettings };
    console.log('Settings reset to defaults');
  };

  return {
    settings,
    updateSettings,
    resetSettings
  };
}; 