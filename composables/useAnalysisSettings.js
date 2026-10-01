import { watch } from 'vue';
import { useState } from '#app';

// Storage key for persisting settings
const STORAGE_KEY = 'image-analysis-settings';

/**
 * Default settings for image analysis.
 * Colour space (LAB) and distance metric (CIEDE2000) are fixed facts of the
 * pipeline, not settings, so they no longer live here.
 */
export const defaultSettings = {
  // Image Analysis Settings
  sampleSize: 10000,         // Number of pixels to sample from the image (1,000-100,000)
  k: 13,                     // Number of color clusters to find (3-20)
  maxImageSize: 800,         // Maximum image dimension for processing (200-1600px)
  maxIterations: 30,         // Maximum iterations for k-means clustering (10-100)
  reproducibleRuns: false,   // false: random start each run (variation is expected and wanted)
                             // true: fixed seed, so the same image + settings give the same result

  // Color Matching Settings
  confidenceThreshold: 20,   // Threshold for flagging problematic matches (10-50%)
};

/**
 * Validate numeric settings to ensure they are within acceptable ranges
 *
 * @param {Object} settings - Settings object to validate
 * @returns {Object} - Validated settings with constrained values
 */
export const validateSettingsRanges = (settings) => {
  const validated = { ...settings };

  // Image Analysis Settings
  validated.sampleSize = Math.max(1000, Math.min(100000, validated.sampleSize || defaultSettings.sampleSize));
  validated.k = Math.max(3, Math.min(20, validated.k || defaultSettings.k));
  validated.maxImageSize = Math.max(200, Math.min(1600, validated.maxImageSize || defaultSettings.maxImageSize));
  validated.maxIterations = Math.max(10, Math.min(100, validated.maxIterations || defaultSettings.maxIterations));
  validated.reproducibleRuns = Boolean(validated.reproducibleRuns);

  // Color Matching Settings
  validated.confidenceThreshold = Math.max(10, Math.min(50, validated.confidenceThreshold || defaultSettings.confidenceThreshold));

  // Drop settings that no longer exist (older localStorage payloads carried them)
  delete validated.colorSpace;
  delete validated.distanceMethod;

  return validated;
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
          const parsedSettings = JSON.parse(stored);
          return validateSettingsRanges({ ...defaultSettings, ...parsedSettings });
        } catch (e) {
          console.error('Error parsing stored settings:', e);
          return { ...defaultSettings };
        }
      }
    }
    return { ...defaultSettings };
  };

  // One shared state for the whole app (app.vue and ImageControls each used to
  // own a separate copy, so a slider change in one never reached the other).
  const settings = useState('analysisSettings', loadStoredSettings);

  /**
   * Update settings with validation
   * Can be called with no parameters to just validate/apply current settings
   *
   * @param {Object} newSettings - Optional settings to update
   * @returns {boolean} - Whether settings were successfully updated
   */
  const updateSettings = (newSettings = {}) => {
    try {
      const updatedSettings = Object.keys(newSettings).length > 0
        ? validateSettingsRanges({
            ...settings.value,
            ...newSettings
          })
        : validateSettingsRanges(settings.value);

      // Update the reactive settings reference
      settings.value = { ...updatedSettings };

      console.log('Settings updated:', settings.value);
      return true;
    } catch (error) {
      console.error('Failed to update settings:', error);
      return false;
    }
  };

  /**
   * Reset all settings to default values
   */
  const resetSettings = () => {
    settings.value = { ...defaultSettings };
    console.log('Settings reset to defaults');
  };

  // Single watcher for persisting settings
  watch(
    () => settings.value,
    (newSettings) => {
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
        } catch (error) {
          console.error('Failed to persist settings:', error);
        }
      }
    },
    { deep: true, immediate: true }
  );

  return {
    settings,
    updateSettings,
    resetSettings
  };
};
