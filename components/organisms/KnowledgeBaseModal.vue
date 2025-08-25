<!-- 
  KnowledgeBaseModal.vue - Component for displaying the color learning system
  
  This component shows:
  - System version and learning progress
  - Parent Color Learning patterns
  - Hue Range Learning patterns
  - Visualizations for color patterns
  - Machine Learning model stats
-->

<template>
  <div v-if="isVisible" class="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-75">
    <div class="bg-white text-gray-800 rounded-lg shadow-xl max-w-4xl p-6 m-4 overflow-auto max-h-[90vh]">
      <h3 class="text-2xl font-bold mb-4 flex justify-between items-center text-blue-800">
        <span>Color Learning System</span>
        <button 
          @click="$emit('close')" 
          class="p-1 hover:bg-gray-100 rounded"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </h3>
      
      <p class="mb-6 text-gray-600">
        This is how the system learns from your feedback to improve color matching over time. 
        Every correction you make helps the system understand your color preferences better!
      </p>
      
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="ml-4 text-gray-600">Loading color learning data...</p>
      </div>
      
      <div v-else-if="error" class="p-4 bg-red-100 text-red-700 rounded-lg">
        <p>{{ error }}</p>
      </div>
      
      <div v-else>
        <div class="mb-6 flex flex-row gap-4">
          <div class="bg-blue-50 p-4 rounded-lg flex-1 border border-blue-100">
            <h4 class="font-semibold text-blue-800 mb-2">Learning Progress</h4>
            <div class="flex items-center gap-2 mb-2">
              <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold">
                {{ knowledgeBase.version }}
              </div>
              <div>
                <p class="font-medium">System Version</p>
                <p class="text-sm text-gray-500">Updated {{ new Date(knowledgeBase.lastUpdated).toLocaleDateString() }}</p>
              </div>
            </div>
            <div class="mt-3 flex gap-3">
              <div class="bg-white p-2 rounded flex items-center gap-2 flex-1 border border-gray-200">
                <div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 font-bold">
                  {{ knowledgeBase.patternCount }}
                </div>
                <span class="text-sm">Pantone Patterns</span>
              </div>
              <div class="bg-white p-2 rounded flex items-center gap-2 flex-1 border border-gray-200">
                <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold">
                  {{ knowledgeBase.parentPatternCount }}
                </div>
                <span class="text-sm">Parent Patterns</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Machine Learning Model Stats -->
        <div class="mb-8">
          <h4 class="font-semibold text-lg mb-3 text-blue-800">Machine Learning Model</h4>
          <p class="mb-4 text-gray-600">
            Our ML model learns from your feedback to provide better color matches over time.
          </p>
          
          <div class="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="bg-white p-3 rounded-lg border border-purple-100 flex flex-col items-center">
                <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 font-bold mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p class="font-medium text-sm">Model Status</p>
                <p class="text-center mt-1">
                  <span class="text-sm" :class="modelStats.isModelTrained ? 'text-green-600' : 'text-gray-500'">
                    {{ modelStats.isModelTrained ? 'Trained and Active' : 'Not Yet Trained' }}
                  </span>
                </p>
              </div>
              
              <div class="bg-white p-3 rounded-lg border border-purple-100 flex flex-col items-center">
                <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 font-bold mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p class="font-medium text-sm">Training Examples</p>
                <p class="text-center mt-1">
                  <span class="font-bold text-purple-800">{{ modelStats.trainingExamplesCount }}</span>
                  <span class="text-xs text-gray-500 ml-1">collected</span>
                </p>
                <p class="text-xs text-gray-500 mt-1" v-if="modelStats.pendingExamplesCount > 0">
                  ({{ modelStats.pendingExamplesCount }} pending training)
                </p>
              </div>
              
              <div class="bg-white p-3 rounded-lg border border-purple-100 flex flex-col items-center">
                <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 font-bold mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p class="font-medium text-sm">Last Trained</p>
                <p class="text-center text-sm mt-1">
                  {{ modelStats.lastTrainedDate ? formatDate(modelStats.lastTrainedDate) : 'Never' }}
                </p>
              </div>
            </div>
            
            <div class="mt-4 text-sm text-gray-600">
              <p>The machine learning model supplements our traditional mathematical color matching with learned corrections based on your feedback.</p>
              <p class="mt-2" v-if="!modelStats.isModelTrained">
                <span class="font-medium text-purple-800">How to activate ML:</span> 
                Continue providing feedback on color matches. Once we collect enough examples, the system will automatically train a model.
              </p>
              <p class="mt-2" v-else>
                <span class="font-medium text-purple-800">ML is active:</span>
                The system will now override mathematical matches when it has high confidence in a better match.
              </p>
            </div>
          </div>
        </div>
        
        <!-- Parent Color Patterns - More Visual Approach -->
        <div class="mb-8">
          <h4 class="font-semibold text-lg mb-3 text-blue-800">Parent Color Learning</h4>
          <p class="mb-4 text-gray-600">
            These patterns show how the system has learned to associate specific colors with their parent categories.
          </p>
          
          <div v-if="knowledgeBase.parentPatterns.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="(pattern, index) in knowledgeBase.parentPatterns" :key="index" 
              class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div class="flex">
                <!-- Color visualization -->
                <div class="w-1/3 relative">
                  <div class="absolute inset-0" 
                    :style="{
                      backgroundColor: getColorFromHSL(
                        pattern.condition.hue, 
                        pattern.condition.saturation, 
                        pattern.condition.lightness
                      )
                    }">
                  </div>
                  <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                    Example Color
                  </div>
                </div>
                
                <!-- Parent color -->
                <div class="w-1/3 relative">
                  <div class="absolute inset-0" 
                    :style="{
                      backgroundColor: getParentColorHex(pattern.correctParent)
                    }">
                  </div>
                  <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                    Parent: {{ pattern.correctParent }}
                  </div>
                </div>
                
                <!-- Confidence visualization -->
                <div class="w-1/3 p-2 flex flex-col justify-center items-center">
                  <div class="w-16 h-16 rounded-full relative">
                    <svg viewBox="0 0 36 36" class="w-full h-full">
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#E6E6E6"
                        stroke-width="3"
                      />
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#4CAF50"
                        stroke-width="3"
                        :stroke-dasharray="`${pattern.confidence}, 100`"
                      />
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center text-sm font-bold">
                      {{ pattern.confidence }}%
                    </div>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">{{ pattern.usageCount }} uses</p>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center text-gray-500">
            No parent color patterns yet. Keep providing feedback to help the system learn!
          </div>
        </div>
        
        <!-- Pantone Patterns - More Visual Approach -->
        <div>
          <h4 class="font-semibold text-lg mb-3 text-blue-800">Hue Range Learning</h4>
          <p class="mb-4 text-gray-600">
            These patterns show how the system adjusts Pantone matches for specific hue ranges based on your feedback.
          </p>
          
          <div v-if="knowledgeBase.patterns.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="(pattern, index) in knowledgeBase.patterns" :key="index" 
              class="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
              
              <!-- Hue range visualization -->
              <div class="mb-3 h-12 rounded-lg overflow-hidden relative">
                <div class="absolute inset-0 flex">
                  <div v-for="i in 36" :key="i" class="flex-1 h-full"
                    :style="{
                      backgroundColor: `hsl(${i * 10}, 80%, 60%)`,
                      opacity: isInHueRange(i * 10, pattern.condition.hueRange) ? 1 : 0.2
                    }">
                  </div>
                </div>
              </div>
              
              <div class="flex justify-between items-center">
                <div>
                  <p class="text-sm"><span class="font-medium">Hue Range:</span> {{ pattern.condition.hueRange[0].toFixed(0) }}° - {{ pattern.condition.hueRange[1].toFixed(0) }}°</p>
                  <p class="text-sm mt-1"><span class="font-medium">Used:</span> {{ pattern.usageCount }} times</p>
                </div>
                
                <!-- Confidence circle -->
                <div class="w-14 h-14 rounded-full relative">
                  <svg viewBox="0 0 36 36" class="w-full h-full">
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#E6E6E6"
                      stroke-width="3"
                    />
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#2196F3"
                      stroke-width="3"
                      :stroke-dasharray="`${pattern.confidence}, 100`"
                    />
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center text-sm font-bold">
                    {{ pattern.confidence }}%
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center text-gray-500">
            No pantone patterns yet. Keep providing feedback to help the system learn!
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useColorMatcherService } from '@/composables/useColorMatcherService';
import { useColorUtils } from '@/composables/useColorUtils';

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  knowledgeBase: {
    type: Object,
    default: () => null
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: [String, Object],
    default: null
  },
  parentColors: {
    type: Array,
    required: true
  }
});

defineEmits(['close']);

// Get the color matcher service
const colorMatcherService = useColorMatcherService();

// ML model stats
const modelStats = ref({
  isModelTrained: false,
  trainingExamplesCount: 0,
  pendingExamplesCount: 0,
  lastTrainedDate: null
});

// Format date nicely
const formatDate = (dateString) => {
  if (!dateString) return 'Never';
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return 'Unknown';
  
  // Format date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

/**
 * Converts HSL values to a color for visualization
 * @param {number} hue - Hue value (0-360)
 * @param {number} saturation - Saturation value (0-1)
 * @param {number} lightness - Lightness value (0-1)
 * @returns {string} - CSS color string
 */
const getColorFromHSL = (hue, saturation, lightness) => {
  // Handle undefined values with defaults
  const h = hue || 0;
  const s = saturation || 0.5;
  const l = lightness || 0.5;
  
  return `hsl(${h}, ${s * 100}%, ${l * 100}%)`;
};

/**
 * Gets the hex color for a parent color name
 * @param {string} parentName - Name of the parent color
 * @returns {string} - Hex color value
 */
const getParentColorHex = (parentName) => {
  const parent = props.parentColors.find(color => color.name === parentName);
  return parent ? parent.hex : '#CCCCCC'; // Default gray if not found
};

/**
 * Checks if a hue value is within a given range
 * @param {number} hue - Hue value to check
 * @param {Array} range - Range to check against [min, max]
 * @returns {boolean} - Whether the hue is in range
 */
const isInHueRange = (hue, range) => {
  if (!range || range.length !== 2) return false;
  
  const [min, max] = range;
  return hue >= min && hue <= max;
};

/**
 * Load the model stats when the modal is displayed
 */
const loadModelStats = async () => {
  // Get stats from the service
  const stats = colorMatcherService.getModelStats();
  modelStats.value = stats;
};

// Watch for visibility changes
watch(() => props.isVisible, (isVisible) => {
  if (isVisible) {
    loadModelStats();
  }
});

// Load stats on mount if modal is visible
onMounted(() => {
  if (props.isVisible) {
    loadModelStats();
  }
});
</script>
