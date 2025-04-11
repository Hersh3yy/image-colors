<!-- Image Analysis Result Component
  Displays comprehensive information about analyzed image colors including:
  - Color distribution visualization
  - Pantone and parent color matches
  - Confidence metrics and feedback mechanisms
  - Responsive design for all devices
-->
<template>
  <div class="bg-white rounded-lg shadow p-4 sm:p-6">
    <div class="flex flex-col lg:flex-row gap-6">
      <!-- LEFT SECTION: Image and Chart Section -->
      <div class="w-full lg:w-1/3">
        <!-- Original Image -->
        <img 
          :src="image.sourceImage" 
          :alt="image.name" 
          class="w-full h-64 object-contain rounded-lg mb-4 border border-gray-100 shadow-sm" 
          @click="toggleImageZoom" 
          :class="{'cursor-zoom-in': !showZoomedImage}"
        />
        
        <!-- Zoomed Image Modal -->
        <div v-if="showZoomedImage" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" @click="toggleImageZoom">
          <img :src="image.sourceImage" alt="Zoomed view" class="max-w-[90vw] max-h-[90vh] object-contain" />
          <button class="absolute top-4 right-4 p-2 bg-white rounded-full" @click.stop="toggleImageZoom">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Color Distribution Chart -->
        <div class="h-[29rem] mb-4">
          <GroupedColorsDoughnut v-if="chartData" :chartDataProp="chartData" />
        </div>
        
        <!-- Image Controls -->
        <div class="space-y-2">
          <div class="flex flex-wrap justify-between items-center gap-2">
            <h3 class="text-lg font-semibold">{{ image.name }}</h3>
            <div class="flex flex-wrap gap-2">
              <button 
                @click="$emit('delete')" 
                class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                title="Delete this analysis"
              >
                Delete
              </button>
              <button 
                @click="handleReanalyze"
                class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                title="Run the analysis again with current settings"
              >
                Reanalyze
              </button>
            </div>
          </div>

          <!-- Analysis Stats Card -->
          <div class="bg-gray-50 rounded-lg p-4 mt-4">
            <h4 class="font-medium text-gray-700 mb-3">Analysis Overview</h4>
            <div class="space-y-2 text-sm">
              <!-- Average Confidence -->
              <div class="flex justify-between items-center">
                <div class="flex items-center">
                  <span class="text-gray-600">Average Delta (Δ):</span>
                  <div class="relative ml-1 group">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 cursor-help" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                    </svg>
                    <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 w-48 z-10">
                      Average color distance (Delta) for all matches. Lower values indicate better matches.
                    </div>
                  </div>
                </div>
                <span class="font-medium">{{ calculateAverageDistance() }}</span>
              </div>
              
              <!-- Problematic Matches -->
              <div class="flex justify-between items-center">
                <div class="flex items-center">
                  <span class="text-gray-600">Problematic Matches:</span>
                  <div class="relative ml-1 group">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 cursor-help" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                    </svg>
                    <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 w-48 z-10">
                      Colors with high distance values (>20). These colors may need manual feedback.
                    </div>
                  </div>
                </div>
                <span 
                  class="font-medium" 
                  :class="{ 'text-yellow-600': image.metadata?.problematicMatches?.length > 0 }"
                >
                  {{ image.metadata?.problematicMatches?.length || 0 }}
                </span>
              </div>
            </div>
          </div>

          <!-- Analysis Settings Card -->
          <div class="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
            <div class="flex justify-between items-center mb-2">
              <h4 class="font-medium text-gray-700">Analysis Settings</h4>
              <div class="relative group">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 cursor-help" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                </svg>
                <div class="absolute bottom-full right-0 transform -translate-y-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 w-64 z-10">
                  These settings determine how colors are analyzed and matched. Different settings may produce different results.
                </div>
              </div>
            </div>
            <div class="space-y-1 text-gray-600">
              <div class="flex justify-between">
                <span>Color Space:</span>
                <span class="font-medium">{{ image.analysisSettings?.colorSpace || 'LAB' }}</span>
              </div>
              <div class="flex justify-between">
                <span>Distance Method:</span>
                <span class="font-medium">{{ image.analysisSettings?.distanceMethod || 'DELTA_E' }}</span>
              </div>
              <div class="flex justify-between">
                <span>Sample Size:</span>
                <span class="font-medium">{{ image.analysisSettings?.sampleSize?.toLocaleString() || '10000' }} pixels</span>
              </div>
              <div class="flex justify-between">
                <span>Color Clusters:</span>
                <span class="font-medium">{{ image.analysisSettings?.k || '13' }}</span>
              </div>
              <div class="flex justify-between">
                <span>Confidence Threshold:</span>
                <span class="font-medium">{{ image.analysisSettings?.confidenceThreshold || '20' }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT SECTION: Results -->
      <div class="w-full lg:w-2/3">
        <div class="overflow-y-auto" style="max-height: calc(100vh - 12rem);">
          <!-- Tabs for results view selection on mobile -->
          <div class="lg:hidden mb-4">
            <div class="flex justify-center bg-gray-100 rounded-lg">
              <button 
                @click="viewMode = 'grid'" 
                class="flex-1 py-2 text-sm font-medium rounded-l-lg"
                :class="viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600'"
              >
                Color Grid
              </button>
              <button 
                @click="viewMode = 'list'" 
                class="flex-1 py-2 text-sm font-medium rounded-r-lg"
                :class="viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600'"
              >
                Detailed List
              </button>
            </div>
          </div>
          
          <!-- Main Results Tabs -->
          <div class="mb-6">
            <div class="flex border-b border-gray-200">
              <button 
                v-for="tab in tabs" 
                :key="tab.id" 
                @click="activeTab = tab.id"
                class="py-2 px-4 font-medium text-base transition-colors"
                :class="activeTab === tab.id ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>
          
          <!-- Color Visualization Tab -->
          <div v-if="activeTab === 'colors'" class="space-y-8">
            <!-- Color Percentages Section -->
            <section>
              <ColorPercentages :colors="image.colors" @copy="handleCopyColor" />
            </section>
            
            <!-- Color Family Breakdown -->
            <section>
              <ColorFamilyBreakdown :colors="image.colors" @copy="handleCopyColor" />
            </section>
          </div>
          
          <!-- Detailed Table tab -->
          <div v-if="activeTab === 'details'" class="space-y-6">
            <ColorDetailsTable 
              :colors="image.colors" 
              :analysis-settings="image.analysisSettings"
              @feedback="handleColorFeedback"
              @copy="handleCopyColor"
              ref="detailsTableRef"
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Toast Notification -->
    <div 
      v-if="showToast" 
      class="fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity"
      :class="{ 
        'opacity-0': toastFading,
        'bg-gray-800 text-white': toastType === 'info',
        'bg-green-700 text-white': toastType === 'success',
        'bg-red-700 text-white': toastType === 'error'
      }"
    >
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup>
/**
 * @component ImageAnalysisResult
 * @description Displays the results of an image color analysis including Pantone matches, confidence levels, and color distribution
 * 
 * Expected props:
 * image: {
 *   name: string,
 *   sourceImage: string (URL),
 *   colors: Array<{
 *     color: string (hex),
 *     percentage: number,
 *     pantone: {
 *       name: string,
 *       code: string,
 *       hex: string,
 *       distance: number,
 *       confidence: number
 *     },
 *     parent: {
 *       name: string,
 *       hex: string,
 *       distance: number,
 *       confidence: number
 *     }
 *   }>,
 *   analysisSettings: {
 *     colorSpace: string,
 *     distanceMethod: string,
 *     sampleSize: number,
 *     k: number,
 *     maxImageSize: number,
 *     maxIterations: number,
 *     confidenceThreshold: number
 *   },
 *   metadata: {
 *     problematicMatches: Array,
 *     averageConfidence: number,
 *     timestamp: string
 *   }
 * }
 */
import { ref, computed, nextTick } from "vue";
import chroma from "chroma-js";
import { getConfidenceClass, groupColors, createGroupedChartData } from "@/services/colorUtils";
import ColorPercentages from "./ColorPercentages.vue";
import GroupedColorsDoughnut from "./GroupedColorsDoughnut.vue";
import ColorFamilyBreakdown from "./ColorFamilyBreakdown.vue";
import ColorDetailsTable from "./ColorDetailsTable.vue";

const props = defineProps({
  /**
   * The analyzed image data object
   */
  image: {
    type: Object,
    required: true,
    validator: (obj) => {
      return obj.sourceImage && obj.name && obj.colors;
    },
  },
  /**
   * Whether this is a preset example
   */
  isPreset: Boolean,
  /**
   * Name of the preset if applicable
   */
  presetName: String,
  /**
   * Array of parent colors for matching
   */
  parentColors: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(["reanalyze", "delete", "error", "feedback"]);

// State variables
const showZoomedImage = ref(false);
const viewMode = ref('grid'); // 'grid' or 'list' for mobile view
const showToast = ref(false);
const toastMessage = ref('');
const toastFading = ref(false);
const toastType = ref('info'); // 'info', 'success', 'error'

// Refs
const detailsTableRef = ref(null);

/**
 * Toggle image zoom modal
 */
const toggleImageZoom = () => {
  showZoomedImage.value = !showZoomedImage.value;
};

/**
 * Copy a color code to clipboard
 * @param {string} colorCode - The color hex code to copy
 */
const copyToClipboard = (colorCode) => {
  navigator.clipboard.writeText(colorCode)
    .then(() => {
      showToastMessage(`Copied ${colorCode} to clipboard`);
    })
    .catch(err => {
      console.error('Failed to copy:', err);
      showToastMessage("Failed to copy to clipboard", "error");
    });
};

/**
 * Handle copy event from ColorDetailsTable
 */
const handleCopy = (colorCode) => {
  copyToClipboard(colorCode);
};

/**
 * Calculate average distance across all colors
 */
const calculateAverageDistance = () => {
  if (!props.image.colors || !props.image.colors.length) return 'N/A';
  
  const totalDistance = props.image.colors.reduce((sum, color) => {
    return sum + (color.parent.distance || 0);
  }, 0);
  
  return (totalDistance / props.image.colors.length).toFixed(1) + ' Δ';
};

/**
 * Get styling class based on distance value
 * Lower is better
 */
const getDistanceClass = (distance) => {
  if (!distance && distance !== 0) return 'text-gray-400';
  if (distance < 2) return 'text-green-600 font-medium';
  if (distance < 5) return 'text-green-500';
  if (distance < 10) return 'text-yellow-600';
  if (distance < 20) return 'text-orange-500';
  return 'text-red-500';
};

/**
 * Sort colors by percentage for display
 */
const sortedColors = computed(() => {
  return [...props.image.colors].sort((a, b) => b.percentage - a.percentage);
});

/**
 * Get user-friendly color description
 * @param {string} hexColor - Hex color to describe
 * @returns {string} - Artist-friendly description
 */
const getColorDescription = (hexColor) => {
  try {
    const color = chroma(hexColor);
    const [h, s, l] = color.hsl();
    
    // Handle NaN values
    const hue = isNaN(h) ? 0 : h;
    const saturation = isNaN(s) ? 0 : s;
    const lightness = isNaN(l) ? 0 : l;
    
    // Lightness description
    let lightnessDesc = '';
    if (lightness < 0.15) lightnessDesc = 'very dark';
    else if (lightness < 0.35) lightnessDesc = 'dark';
    else if (lightness > 0.85) lightnessDesc = 'very light';
    else if (lightness > 0.65) lightnessDesc = 'light';
    else lightnessDesc = 'medium';
    
    // Saturation description
    let saturationDesc = '';
    if (saturation < 0.1) saturationDesc = 'neutral';
    else if (saturation < 0.3) saturationDesc = 'muted';
    else if (saturation > 0.8) saturationDesc = 'vibrant';
    else if (saturation > 0.5) saturationDesc = 'rich';
    else saturationDesc = '';
    
    // Hue description
    let hueDesc = '';
    if (saturation < 0.1) {
      if (lightness < 0.15) hueDesc = 'black';
      else if (lightness > 0.85) hueDesc = 'white';
      else hueDesc = 'gray';
    } else if (hue >= 350 || hue < 10) hueDesc = 'red';
    else if (hue >= 10 && hue < 45) {
      if (lightness < 0.4 && saturation < 0.6) hueDesc = 'brown';
      else hueDesc = 'orange';
    }
    else if (hue >= 45 && hue < 70) hueDesc = 'yellow';
    else if (hue >= 70 && hue < 160) hueDesc = 'green';
    else if (hue >= 160 && hue < 190) hueDesc = 'teal';
    else if (hue >= 190 && hue < 250) hueDesc = 'blue';
    else if (hue >= 250 && hue < 290) hueDesc = 'purple';
    else if (hue >= 290 && hue < 320) hueDesc = 'violet';
    else if (hue >= 320 && hue < 350) hueDesc = 'pink';
    
    // Combine descriptions
    const parts = [lightnessDesc, saturationDesc, hueDesc].filter(part => part);
    return parts.join(' ');
  } catch (error) {
    return 'color';
  }
};

/**
 * Prepare data for the doughnut chart
 */
const chartData = computed(() => {
  const groupedColorsData = groupColors(props.image);
  return createGroupedChartData(groupedColorsData);
});

/**
 * Emit feedback event for a specific color
 * @param {Object} color - The color to provide feedback for
 */
const provideFeedback = (color) => {
  try {
    emit("feedback", { 
      image: props.image,
      colorMatch: color 
    });
  } catch (error) {
    console.error("Error providing feedback:", error);
    showToastMessage("Error providing feedback. Please try again.", "error");
  }
};

/**
 * Check if a color is grayscale (very low saturation)
 * @param {string} hexColor - Hex color to check
 * @returns {boolean} - True if grayscale
 */
const isGrayscale = (hexColor) => {
  try {
    const color = chroma(hexColor);
    const [h, s, l] = color.hsl();
    // If saturation is very low, it's effectively grayscale
    return isNaN(s) || s < 0.08;
  } catch (e) {
    return false;
  }
};

// Toast display helper function
const showToastMessage = (message, type = 'info') => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
  toastFading.value = false;
  
  // Hide toast after delay
  setTimeout(() => {
    toastFading.value = true;
    setTimeout(() => {
      showToast.value = false;
    }, 300);
  }, 3000);
};

// Reanalyze button handler
const handleReanalyze = () => {
  try {
    emit("reanalyze", props.image);
  } catch (error) {
    console.error("Error triggering reanalysis:", error);
    showToastMessage("Failed to start reanalysis. Please try again.", "error");
  }
};

// Handle color feedback request
const handleColorFeedback = (colorMatch) => {
  // Add reference to the parent image
  const data = {
    colorMatch,
    image: props.image
  };
  
  emit('feedback', data);
};

// Handle color copied to clipboard
const handleCopyColor = (color) => {
  navigator.clipboard.writeText(color)
    .then(() => {
      showToast.value = true;
      toastMessage.value = `Copied ${color} to clipboard`;
      toastType.value = 'success';
      
      // Auto hide after 2 seconds
      setTimeout(() => {
        toastFading.value = true;
        setTimeout(() => {
          showToast.value = false;
          toastFading.value = false;
        }, 300);
      }, 2000);
    })
    .catch(err => {
      console.error('Failed to copy color:', err);
      showToast.value = true;
      toastMessage.value = 'Failed to copy color';
      toastType.value = 'error';
    });
};

// External method to update a color match in the table
// This can be called by parent when feedback is submitted
const updateColorMatch = (originalColor, updatedMatch) => {
  // Find the color in the image colors array
  const colorToUpdate = props.image.colors.find(c => c.color === originalColor);
  
  if (colorToUpdate) {
    // Update the parent color
    colorToUpdate.parent = {
      ...updatedMatch
    };
    
    // If we have a reference to the details table, force a refresh
    if (detailsTableRef.value) {
      // Use nextTick to ensure the UI updates properly
      nextTick(() => {
        if (typeof detailsTableRef.value.refreshTable === 'function') {
          detailsTableRef.value.refreshTable();
        }
      });
    }
    
    return true;
  }
  
  return false;
};

// Expose updateColorMatch method to parent components
defineExpose({
  updateColorMatch
});
</script>

<style scoped>
/* Fade animation for toast */
.transition-opacity {
  transition: opacity 0.3s ease-in-out;
}

/* Making color swatches clickable */
[title] {
  position: relative;
}

/* Mobile optimization */
@media (max-width: 768px) {
  .overflow-x-auto {
    -webkit-overflow-scrolling: touch;
  }
}
</style>
