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
                @click="showScreenshotModal = true"
                class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
                title="Take a screenshot of the analysis"
              >
                Screenshot
              </button>
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
          <AnalysisStatsCard 
            :averageDistance="calculateAverageDistance()"
            :problematicMatchesCount="image.metadata?.problematicMatches?.length || 0"
          />

          <!-- Analysis Settings Card -->
          <AnalysisSettingsCard 
            :analysisSettings="image.analysisSettings"
          />
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
          <MobileColorGrid 
            :colors="image.colors"
            @feedback="provideFeedback"
            @copy="handleCopy"
          />

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
          <ProblematicMatches 
            :problematicMatches="image.metadata?.problematicMatches"
            @feedback="provideFeedback"
            @copy="handleCopy"
          />
        </div>
      </div>
    </div>
    
    <!-- Screenshot Modal -->
    <div v-if="showScreenshotModal" class="fixed inset-0 z-50">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-gray-500/75" @click="showScreenshotModal = false"></div>

      <!-- Modal content -->
      <div class="absolute inset-4 rounded-lg bg-white p-6 shadow-xl overflow-auto">
        <!-- Action buttons -->
        <div class="absolute right-6 top-6 flex gap-2 z-10">
          <button @click="downloadScreenshot"
            class="rounded-lg bg-green-500 text-white px-3 py-2 shadow-sm hover:bg-green-600 transition">
            Download
          </button>
          <button @click="showScreenshotModal = false"
            class="rounded-lg bg-white/80 p-2 shadow-sm hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Screenshot content -->
        <div class="max-w-7xl mx-auto screenshot-modal-content">
          <!-- Header -->
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-gray-800">{{ image.name }}</h2>
            <p class="text-gray-600 text-lg">Color Analysis Screenshot</p>
          </div>

          <!-- Content grid -->
          <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <!-- Left: Stacked Thumbnail and Color Groups -->
            <div class="lg:col-span-1 space-y-4">
              <!-- Original Image (Smaller) -->
              <img 
                :src="image.sourceImage" 
                :alt="image.name" 
                class="w-full h-32 object-contain rounded-lg border border-gray-100 shadow-sm" 
              />
              
              <!-- Analysis Stats (Compact) -->
              <div class="bg-gray-50 rounded-lg p-3 text-xs">
                <h4 class="font-medium text-gray-700 mb-2">Overview</h4>
                <div class="space-y-1">
                  <div class="flex justify-between items-center">
                    <span class="text-gray-600">Avg Δ:</span>
                    <span class="font-medium">{{ calculateAverageDistance() }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-gray-600">Issues:</span>
                    <span class="font-medium">{{ image.metadata?.problematicMatches?.length || 0 }}</span>
                  </div>
                </div>
              </div>

              <!-- Color Family Breakdown (Compact) -->
              <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <h4 class="font-medium text-gray-700 mb-2 text-sm">Color Groups</h4>
                <div class="space-y-2">
                  <div v-for="(colors, family) in colorFamilies" :key="family" class="bg-white p-2 rounded shadow-sm border border-gray-100">
                    <h5 class="font-medium text-xs mb-1">{{ family }}</h5>
                    <div class="flex flex-wrap gap-1">
                      <div
                        v-for="color in colors.slice(0, 3)"
                        :key="color.color"
                        class="w-3 h-3 rounded-full border shadow-sm"
                        :style="{ backgroundColor: color.color }"
                        :title="getColorDescription(color.color)"
                      ></div>
                      <span v-if="colors.length > 3" class="text-xs text-gray-500">+{{ colors.length - 3 }}</span>
                    </div>
                    <p class="text-xs mt-1 text-gray-500">
                      {{ Math.round(colors.reduce((sum, c) => sum + c.percentage, 0)) }}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Center: Dominant Chart (Now takes 4 columns) -->
            <div class="lg:col-span-4">
              <!-- Color Distribution Chart (Much Larger) -->
              <div class="h-[1000px] relative">
                <GroupedColorsDoughnut v-if="chartData" :chartDataProp="chartData" />
              </div>
            </div>
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
import html2canvas from "html2canvas";
import { getConfidenceClass, groupColors, createGroupedChartData } from "@/services/colorUtils";
import ColorPercentages from "./ColorPercentages.vue";
import GroupedColorsDoughnut from "./GroupedColorsDoughnut.vue";
import ColorFamilyBreakdown from "./ColorFamilyBreakdown.vue";
import ColorDetailsTable from "./ColorDetailsTable.vue";
import MobileColorGrid from "./MobileColorGrid.vue";
import ProblematicMatches from "./ProblematicMatches.vue";
import AnalysisStatsCard from "./AnalysisStatsCard.vue";
import AnalysisSettingsCard from "./AnalysisSettingsCard.vue";

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
const showScreenshotModal = ref(false);
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
 * Download screenshot as PNG
 */
const downloadScreenshot = () => {
  const modalContent = document.querySelector('.screenshot-modal-content');
  if (modalContent) {
    html2canvas(modalContent, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: true,
      logging: false
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = `${props.image.name}-color-analysis.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      // Show success toast
      toastMessage.value = 'Screenshot downloaded successfully!';
      showToast.value = true;
      toastFading.value = false;
      
      setTimeout(() => {
        toastFading.value = true;
        setTimeout(() => {
          showToast.value = false;
        }, 300);
      }, 2000);
    }).catch(error => {
      console.error('Screenshot error:', error);
      toastMessage.value = 'Failed to generate screenshot';
      showToast.value = true;
      toastFading.value = false;
      
      setTimeout(() => {
        toastFading.value = true;
        setTimeout(() => {
          showToast.value = false;
        }, 300);
      }, 3000);
    });
  }
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
 * Group colors by color family for screenshot display
 */
const colorFamilies = computed(() => {
  if (!props.image.colors || !props.image.colors.length) {
    return {};
  }

  try {
    const families = {
      'Reds': [],
      'Oranges': [],
      'Yellows': [],
      'Greens': [],
      'Blues': [],
      'Purples': [],
      'Pinks': [],
      'Browns': [],
      'Grays': [],
      'Blacks & Whites': []
    };

    props.image.colors.forEach(color => {
      try {
        const c = chroma(color.color);
        const [h, s, l] = c.hsl();
        
        // Handle NaN values in HSL
        const hue = isNaN(h) ? 0 : h;
        const saturation = isNaN(s) ? 0 : s;
        const lightness = isNaN(l) ? 0 : l;
        
        // Categorize by color family
        if (saturation < 0.08) {
          if (lightness < 0.15) {
            families['Blacks & Whites'].push(color);
          } else if (lightness > 0.85) {
            families['Blacks & Whites'].push(color);
          } else {
            families['Grays'].push(color);
          }
        } else if (saturation < 0.2 && lightness < 0.4) {
          families['Browns'].push(color);
        } else if ((hue >= 350 || hue < 10) && lightness > 0.4) {
          families['Reds'].push(color);
        } else if ((hue >= 350 || hue < 10) && lightness <= 0.4) {
          families['Browns'].push(color);
        } else if (hue >= 10 && hue < 45 && lightness > 0.4) {
          families['Oranges'].push(color);
        } else if (hue >= 10 && hue < 45 && lightness <= 0.4) {
          families['Browns'].push(color);
        } else if (hue >= 45 && hue < 70) {
          families['Yellows'].push(color);
        } else if (hue >= 70 && hue < 160) {
          families['Greens'].push(color);
        } else if (hue >= 160 && hue < 250) {
          families['Blues'].push(color);
        } else if (hue >= 250 && hue < 320) {
          families['Purples'].push(color);
        } else if (hue >= 320 && hue < 350) {
          families['Pinks'].push(color);
        } else {
          families['Grays'].push(color);
        }
      } catch (e) {
        console.error('Error categorizing color:', e);
      }
    });

    // Filter out empty families
    return Object.fromEntries(
      Object.entries(families).filter(([_, colors]) => colors.length > 0)
    );
  } catch (error) {
    console.error('Error calculating color families:', error);
    return {};
  }
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

/* Screenshot modal chart optimization */
.screenshot-modal-content .h-\[600px\] {
  min-height: 600px;
}

.screenshot-modal-content .h-\[600px\] :deep(.highcharts-container) {
  width: 100% !important;
  height: 100% !important;
}
</style>
