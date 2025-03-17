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
              <button 
                @click="checkWithAI" 
                :disabled="isCheckingWithAI"
                class="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                :class="{ 'bg-green-500 hover:bg-green-600': hasBeenChecked }"
                title="Use AI to verify color matching accuracy"
              >
                <span v-if="isCheckingWithAI"
                  class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <svg v-else-if="hasBeenChecked" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                {{ isCheckingWithAI ? 'Checking...' : hasBeenChecked ? 'Verified' : 'Check with AI' }}
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
                  <span class="text-gray-600">Average Confidence:</span>
                  <div class="relative ml-1 group">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 cursor-help" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                    </svg>
                    <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 w-48 z-10">
                      Higher confidence indicates better color matches. Values above 75% are considered good matches.
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full"
                      :class="confidenceBarColor"
                      :style="{ width: `${image.metadata?.averageConfidence || 0}%` }"
                    ></div>
                  </div>
                  <span class="font-medium">{{ image.metadata?.averageConfidence.toFixed(1) || 0 }}%</span>
                </div>
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
                      Colors with confidence below the threshold ({{ image.analysisSettings?.confidenceThreshold || 20 }}%). These colors may need manual feedback.
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
                </div>
                
                <!-- Color info -->
                <div class="text-xs font-mono mb-1">{{ color.color }}</div>
                
                <!-- Pantone match -->
                <div class="flex items-center gap-1 mt-2">
                  <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: color.pantone.hex }"></div>
                  <div class="flex flex-col">
                    <span class="text-xs">{{ color.pantone.code || 'N/A' }}</span>
                    <span class="text-xs text-gray-500">{{ color.pantone.name }}</span>
                  </div>
                </div>
                
                <!-- Confidence bar -->
                <div class="mt-1">
                  <div class="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full"
                      :class="getConfidenceClass(color.pantone.confidence)"
                      :style="{ width: `${color.pantone.confidence}%` }"
                    ></div>
                  </div>
                </div>
                
                <!-- Action button -->
                <button 
                  @click="provideFeedback(color)" 
                  class="mt-2 w-full text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                  Feedback
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
                    <span class="text-xs font-mono">{{ color.color }}</span>
                    <span class="text-xs">{{ color.percentage.toFixed(1) }}%</span>
                  </div>
                  
                  <div class="flex items-center justify-between text-xs mt-1">
                    <span>{{ color.pantone.code || 'N/A' }}</span>
                    <span class="text-xs text-gray-500">{{ color.pantone.confidence?.toFixed(0) }}%</span>
                  </div>
                </div>
                
                <!-- Action button -->
                <button 
                  @click="provideFeedback(color)" 
                  class="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                  Feedback
                </button>
              </div>
            </div>
          </div>

          <!-- Color Details Table (Desktop) -->
          <div class="hidden md:block mt-6">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-medium text-gray-700">Color Details</h4>
              <div class="relative group">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 cursor-help" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                </svg>
                <div class="absolute bottom-full right-0 transform -translate-y-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 w-64 z-10">
                  Detailed breakdown of each color with pantone and parent color matches. Click on color swatches to copy the hex code.
                </div>
              </div>
            </div>
            <div class="overflow-x-auto rounded-lg border">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">%</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Parent Match</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pantone Code</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pantone Name</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="color in sortedColors" :key="color.color" class="hover:bg-gray-50">
                    <!-- Original Color -->
                    <td class="px-3 py-2">
                      <div class="flex items-center gap-2">
                        <div 
                          class="w-8 h-8 rounded border cursor-pointer hover:shadow-md transition" 
                          :style="{ backgroundColor: color.color }" 
                          @click="copyToClipboard(color.color)"
                          :title="`Click to copy: ${color.color}`"
                        ></div>
                        <span class="text-sm font-mono">{{ color.color }}</span>
                      </div>
                    </td>
                    
                    <!-- Percentage -->
                    <td class="px-3 py-2 text-sm">{{ color.percentage.toFixed(1) }}%</td>
                    
                    <!-- Parent Match -->
                    <td class="px-3 py-2">
                      <div class="flex items-center gap-2">
                        <div 
                          class="w-6 h-6 rounded border cursor-pointer hover:shadow-md transition" 
                          :style="{ backgroundColor: color.parent.hex }"
                          @click="copyToClipboard(color.parent.hex)"
                          :title="`Click to copy: ${color.parent.hex}`"
                        ></div>
                        <span class="text-sm">{{ color.parent.name || 'N/A' }}</span>
                      </div>
                    </td>
                    
                    <!-- Parent Confidence -->
                    <td class="px-3 py-2">
                      <div class="flex items-center gap-2">
                        <div class="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            class="h-full rounded-full"
                            :class="getConfidenceClass(color.parent.confidence)"
                            :style="{ width: `${color.parent.confidence}%` }"
                          ></div>
                        </div>
                        <span class="text-xs">{{ color.parent.confidence?.toFixed(1) }}%</span>
                      </div>
                    </td>
                    
                    <!-- Pantone Code -->
                    <td class="px-3 py-2">
                      <div class="flex items-center gap-2">
                        <div 
                          class="w-6 h-6 rounded border cursor-pointer hover:shadow-md transition" 
                          :style="{ backgroundColor: color.pantone.hex }"
                          @click="copyToClipboard(color.pantone.hex)"
                          :title="`Click to copy: ${color.pantone.hex}`"
                        ></div>
                        <span class="text-sm font-mono">{{ color.pantone.code || 'N/A' }}</span>
                      </div>
                    </td>
                    
                    <!-- Pantone Name -->
                    <td class="px-3 py-2 text-sm">{{ color.pantone.name || 'N/A' }}</td>
                    
                    <!-- Pantone Confidence -->
                    <td class="px-3 py-2">
                      <div class="flex items-center gap-2">
                        <div class="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            class="h-full rounded-full"
                            :class="getConfidenceClass(color.pantone.confidence)"
                            :style="{ width: `${color.pantone.confidence}%` }"
                          ></div>
                        </div>
                        <span class="text-xs">{{ color.pantone.confidence?.toFixed(1) }}%</span>
                      </div>
                    </td>
                    
                    <!-- Actions -->
                    <td class="px-3 py-2">
                      <button 
                        @click="provideFeedback(color)"
                        class="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                        title="Provide feedback for this color match"
                      >
                        Feedback
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Problematic Matches Section -->
          <div v-if="image.metadata?.problematicMatches?.length" class="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-medium text-yellow-800">Problematic Matches</h4>
              <div class="relative group">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-yellow-600 cursor-help" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                </svg>
                <div class="absolute bottom-full right-0 transform -translate-y-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 w-64 z-10">
                  These colors have low confidence matches. Your feedback would be especially valuable for improving the matching system.
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
                  <span class="font-mono">{{ match.color }}</span>
                  <span class="text-yellow-600 text-xs">
                    (Parent: {{ match.parent.confidence?.toFixed(1) }}%, Pantone: {{ match.pantone.confidence?.toFixed(1) }}%)
                  </span>
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
import { getConfidenceClass, groupColors, createGroupedChartData } from "@/services/colorUtils";
import ColorPercentages from "./ColorPercentages.vue";
import GroupedColorsDoughnut from "./GroupedColorsDoughnut.vue";

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

const emit = defineEmits(["reanalyze", "delete", "aiVerificationResult", "error", "feedback"]);

// State variables
const isCheckingWithAI = ref(false);
const hasBeenChecked = ref(false);
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
 * Get the confidence bar color class based on confidence level
 */
const confidenceBarColor = computed(() => {
  return getConfidenceClass(props.image.metadata?.averageConfidence || 0);
});

/**
 * Sort colors by percentage for display
 */
const sortedColors = computed(() => {
  return [...props.image.colors].sort((a, b) => b.percentage - a.percentage);
});

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
 * Check color matches using AI
 * Uses the verify-colors serverless function to analyze color matches
 */
const checkWithAI = async () => {
  try {
    isCheckingWithAI.value = true;

    const response = await fetch('/.netlify/functions/verify-colors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        colors: props.image.colors.map(color => ({
          originalColor: color.color,
          matchedPantone: {
            name: color.pantone?.name || 'Unknown',
            hex: color.pantone?.hex || '',
            code: color.pantone?.code || '',
            distance: color.pantone?.distance || 0,
            confidence: color.pantone?.confidence || 0
          },
          matchedParent: {
            name: color.parent?.name || 'Unknown',
            hex: color.parent?.hex || '',
            distance: color.parent?.distance || 0,
            confidence: color.parent?.confidence || 0
          },
          percentage: color.percentage
        })),
        parentColors: props.parentColors
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to verify colors');
    }

    hasBeenChecked.value = true;
    emit('aiVerificationResult', data);
  } catch (error) {
    console.error('Error verifying colors:', error);
    emit('error', { message: error.message });
  } finally {
    isCheckingWithAI.value = false;
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
