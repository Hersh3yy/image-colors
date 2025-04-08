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
                @click="$emit('reanalyze', image)"
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
      <div class="flex-1">
        <!-- Color Distribution Section -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-4">
            <h4 class="font-medium text-gray-700">Color Distribution</h4>
            <div class="relative group">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 cursor-help" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
              </svg>
              <div class="absolute bottom-full right-0 transform -translate-y-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 w-64 z-10">
                This bar shows the proportion of each color in the image. Hover over sections to see color details.
              </div>
            </div>
          </div>

          <!-- Color Percentages Bar -->
          <div class="mb-6">
            <ColorPercentages :colors="image.colors" />
          </div>

          <!-- Artist-friendly color breakdown - Now using the new component -->
          <div class="mb-6">
            <ColorFamilyBreakdown 
              :colors="image.colors" 
              @feedback="provideFeedback"
            />
          </div>

          <!-- Color Grid View (Mobile-friendly alternative to table) -->
          <div class="block md:hidden mb-6">
            <div class="flex items-center justify-between mb-4">
              <h4 class="font-medium text-gray-700">Color Palette</h4>
              <div class="flex gap-2">
                <button 
                  @click="viewMode = 'grid'" 
                  class="text-xs px-2 py-1 rounded"
                  :class="viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200'"
                >
                  Grid
                </button>
                <button 
                  @click="viewMode = 'list'" 
                  class="text-xs px-2 py-1 rounded"
                  :class="viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200'"
                >
                  List
                </button>
              </div>
            </div>
            
            <!-- Color Grid -->
            <div v-if="viewMode === 'grid'" class="grid grid-cols-2 gap-3">
              <div v-for="color in sortedColors" :key="color.color" class="border rounded-lg p-3 shadow-sm hover:shadow transition">
                <!-- Color swatch -->
                <div class="relative">
                  <div class="h-20 rounded mb-2" :style="{ backgroundColor: color.color }"></div>
                  <span class="absolute top-1 right-1 text-xs bg-black bg-opacity-50 text-white px-1 rounded">
                    {{ color.percentage.toFixed(1) }}%
                  </span>
                  <span class="absolute bottom-1 left-1 text-xs bg-black bg-opacity-50 text-white px-1 rounded max-w-[80%] truncate">
                    {{ getColorDescription(color.color) }}
                  </span>
                </div>
                
                <!-- Parent match - highlighted as PRIMARY match -->
                <div class="flex items-center gap-1 mt-2 pb-2 border-b border-gray-100">
                  <div class="w-3 h-3 rounded-full border" :style="{ backgroundColor: color.parent.hex }"></div>
                  <div class="flex flex-col flex-1">
                    <span class="text-xs font-medium">{{ color.parent.name }}</span>
                    <div class="flex items-center mt-1">
                      <span class="text-xs" :class="getDistanceClass(color.parent.distance)">
                        {{ color.parent.distance?.toFixed(1) || 'N/A' }} Δ
                      </span>
                    </div>
                  </div>
                </div>
                
                <!-- Pantone match - secondary -->
                <div class="flex items-center gap-1 mt-2">
                  <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: color.pantone.hex }"></div>
                  <div class="flex flex-col">
                    <span class="text-xs">{{ color.pantone.code || 'N/A' }}</span>
                  </div>
                </div>
                
                <!-- Action button -->
                <button 
                  @click="provideFeedback(color)" 
                  class="mt-2 w-full text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                  Improve Match
                </button>
              </div>
            </div>
            
            <!-- Color List (Simplified for mobile) -->
            <div v-if="viewMode === 'list'" class="space-y-3">
              <div v-for="color in sortedColors" :key="color.color" class="border rounded-lg p-3 flex items-center gap-3">
                <!-- Color swatch -->
                <div class="h-10 w-10 rounded" :style="{ backgroundColor: color.color }"></div>
                
                <!-- Color info -->
                <div class="flex-1">
                  <div class="flex items-center justify-between">
                    <span class="text-xs">{{ getColorDescription(color.color) }}</span>
                    <span class="text-xs">{{ color.percentage.toFixed(1) }}%</span>
                  </div>
                  
                  <div class="flex items-center justify-between text-xs mt-1">
                    <span class="font-medium">{{ color.parent.name }}</span>
                    <span class="text-xs" :class="getDistanceClass(color.parent.distance)">
                      {{ color.parent.distance?.toFixed(1) || 'N/A' }} Δ
                    </span>
                  </div>
                </div>
                
                <!-- Action button -->
                <button 
                  @click="provideFeedback(color)" 
                  class="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                  Improve
                </button>
              </div>
            </div>
          </div>

          <!-- Color Details Table (Desktop) - Now using the new component -->
          <div class="hidden md:block mt-6">
            <ColorDetailsTable 
              :colors="image.colors" 
              :analysisSettings="image.analysisSettings"
              @feedback="provideFeedback"
              @copy="handleCopy"
            />
          </div>

          <!-- Problematic Matches Section -->
          <div v-if="image.metadata?.problematicMatches?.length" class="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-medium text-yellow-800">Colors Needing Attention</h4>
              <div class="relative group">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-yellow-600 cursor-help" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                </svg>
                <div class="absolute bottom-full right-0 transform -translate-y-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 w-64 z-10">
                  These colors have high distance values. Your feedback would be especially valuable for improving the matching system.
                </div>
              </div>
            </div>
            
            <ul class="space-y-2">
              <li v-for="match in image.metadata.problematicMatches" :key="match.color" class="text-sm text-yellow-700 bg-yellow-100 rounded-lg p-2">
                <div class="flex flex-wrap items-center gap-2">
                  <div 
                    class="w-6 h-6 rounded border cursor-pointer hover:shadow-md transition" 
                    :style="{ backgroundColor: match.color }"
                    @click="copyToClipboard(match.color)"
                  ></div>
                  <div>
                    <span class="font-medium">{{ getColorDescription(match.color) }}</span>
                    <span class="ml-2 text-yellow-600 text-xs">
                      Distance: {{ match.parent.distance?.toFixed(1) }} Δ
                    </span>
                  </div>
                  <button 
                    @click="provideFeedback(match)"
                    class="ml-auto text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    title="Provide feedback to improve this match"
                  >
                    Improve Match
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Toast Notification -->
    <div 
      v-if="showToast" 
      class="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity"
      :class="{ 'opacity-0': toastFading }"
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
import { ref, computed } from "vue";
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
      toastMessage.value = `Copied ${colorCode} to clipboard`;
      showToast.value = true;
      toastFading.value = false;
      
      // Hide toast after 2 seconds
      setTimeout(() => {
        toastFading.value = true;
        setTimeout(() => {
          showToast.value = false;
        }, 300);
      }, 2000);
    })
    .catch(err => {
      console.error('Failed to copy: ', err);
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
  emit("feedback", { 
    image: props.image,
    colorMatch: color 
  });
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
