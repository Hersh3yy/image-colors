<!-- 
  KnowledgeBaseModal.vue - Component for displaying the color learning system
  
  This component shows:
  - System version and learning progress
  - Parent Color Learning patterns
  - Hue Range Learning patterns
  - Visualizations for color patterns
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
const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  knowledgeBase: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  parentColors: {
    type: Array,
    required: true
  }
});

defineEmits(['close']);

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
</script>
