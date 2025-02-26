import { ref, watch } from 'vue';
import { COLOR_SPACES } from '@/services/imageAnalyzerSupport';
import { DISTANCE_METHODS } from '@/services/colorMatcher';

const STORAGE_KEY = 'image-analysis-settings';

const defaultSettings = {
  sampleSize: 10000,
  k: 13,
  colorSpace: COLOR_SPACES.LAB,
  distanceMethod: DISTANCE_METHODS.DELTA_E,
  confidenceThreshold: 20, // Threshold for problematic matches
};

export const useAnalysisSettings = () => {
  // Load settings from localStorage or use defaults
  const loadStoredSettings = () => {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return { ...defaultSettings, ...JSON.parse(stored) };
        } catch (e) {
          console.error('Error parsing stored settings:', e);
          return defaultSettings;
        }
      }
    }
    return defaultSettings;
  };

  const settings = ref(loadStoredSettings());

  // Persist settings to localStorage whenever they change
  watch(settings, (newSettings) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    }
  }, { deep: true });

  // Validate and update settings
  const updateSettings = (newSettings) => {
    // Ensure sampleSize is within reasonable bounds
    if (newSettings.sampleSize) {
      newSettings.sampleSize = Math.max(1000, Math.min(100000, newSettings.sampleSize));
    }

    // Ensure k is within reasonable bounds
    if (newSettings.k) {
      newSettings.k = Math.max(3, Math.min(20, newSettings.k));
    }

    // Ensure valid color space
    if (newSettings.colorSpace && !COLOR_SPACES[newSettings.colorSpace]) {
      newSettings.colorSpace = defaultSettings.colorSpace;
    }

    // Ensure valid distance method
    if (newSettings.distanceMethod && !DISTANCE_METHODS[newSettings.distanceMethod]) {
      newSettings.distanceMethod = defaultSettings.distanceMethod;
    }

    // Update settings
    settings.value = {
      ...settings.value,
      ...newSettings
    };
  };

  // Reset settings to defaults
  const resetSettings = () => {
    settings.value = { ...defaultSettings };
  };

  return {
    settings,
    updateSettings,
    resetSettings,
    COLOR_SPACES,
    DISTANCE_METHODS
  };
}; 