<!--
  DEPRECATED: Please use components/feedback/FeedbackModal.vue instead.
  This file will be removed in a future update to resolve component naming conflicts.
-->

<script setup>
import { ref, computed, watch } from 'vue';
import { useColorUtils } from '@/composables/useColorUtils';

const props = defineProps({
  show: Boolean,
  colorData: Object,
  pantoneColors: Array,
});

const emit = defineEmits(['close', 'update']);

// Color utilities
const { 
  getColorDescription,
  getConfidenceClass,
  getConfidenceDescription,
  calculateColorInfo,
  groupColorsByFamily,
  calculateConfidence
} = useColorUtils();

// UI state
const activeTab = ref('parent');
const searchQuery = ref('');
const selectedParent = ref(null);
const loading = ref(false);
const error = ref(null);
const note = ref('');

// This will store the parent and pantone colors organized by family
const colorFamilies = ref([]);
const pantoneMatches = ref([]);

// Initialize with props data
watch(() => props.colorData, (newVal) => {
  if (newVal) {
    selectedParent.value = newVal.parent;
    note.value = '';
  }
}, { immediate: true });

// Watch for show to load color families
watch(() => props.show, async (isShown) => {
  if (isShown && props.colorData) {
    try {
      loading.value = true;
      
      // Group parent colors by family
      colorFamilies.value = groupColorsByFamily();
      
      // Find Pantone matches
      if (props.pantoneColors?.length) {
        await findPantoneMatches();
      }
      
      error.value = null;
    } catch (err) {
      console.error('Error loading color data:', err);
      error.value = 'Failed to load color data. Please try again.';
    } finally {
      loading.value = false;
    }
  }
}, { immediate: true });

// Filter parent colors based on search query
const filteredParentColors = computed(() => {
  if (!searchQuery.value) return colorFamilies.value;
  
  const query = searchQuery.value.toLowerCase();
  return colorFamilies.value.map(family => {
    return {
      name: family.name,
      colors: family.colors.filter(color => 
        color.name.toLowerCase().includes(query) || 
        color.hex.toLowerCase().includes(query)
      )
    };
  }).filter(family => family.colors.length > 0);
});

// Find closest Pantone matches for the selected color
async function findPantoneMatches() {
  if (!props.colorData || !props.pantoneColors?.length) return;
  
  // Calculate the color info for comparison
  const colorInfo = calculateColorInfo(props.colorData.color);
  
  // Calculate distances and sort
  const matches = props.pantoneColors
    .map(pantone => {
      // Use function from useColorUtils to calculate distance
      const distance = calculateConfidence(colorInfo, pantone);
      return { 
        ...pantone,
        distance, 
        confidence: 100 - Math.min(distance * 10, 100)
      };
    })
    .sort((a, b) => a.distance - b.distance);
  
  // Take top 12 matches
  pantoneMatches.value = matches.slice(0, 12);
}

// Handle selecting a parent color
function selectParent(color) {
  selectedParent.value = color;
}

// Submit feedback
function submitFeedback() {
  if (!selectedParent.value) return;
  
  emit('update', {
    originalColor: props.colorData,
    newParent: selectedParent.value,
    note: note.value.trim()
  });
  
  emit('close');
}

// Close modal
function closeModal() {
  emit('close');
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="closeModal"></div>
    
    <!-- Modal -->
    <div class="flex items-center justify-center min-h-screen p-4">
      <div class="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-auto">
        <!-- Header -->
        <div class="px-6 py-4 border-b flex justify-between items-center">
          <h3 class="text-lg font-semibold text-gray-800">Improve Color Match</h3>
          <button @click="closeModal" class="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
        
        <!-- Error State -->
        <div v-if="error" class="p-6 text-center">
          <div class="text-red-500 mb-4">{{ error }}</div>
          <button @click="closeModal" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Close
          </button>
        </div>
        
        <!-- Loading State -->
        <div v-else-if="loading" class="p-6 text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p class="mt-4 text-gray-600">Loading color data...</p>
        </div>
        
        <!-- Content -->
        <div v-else class="p-6">
          <!-- Original Color Display -->
          <div class="mb-6 p-4 bg-gray-50 rounded-lg">
            <div class="flex flex-col md:flex-row items-start md:items-center gap-4">
              <!-- Color Swatch -->
              <div class="flex-shrink-0">
                <div 
                  class="w-14 h-14 rounded border shadow-sm" 
                  :style="{ backgroundColor: colorData?.color }"
                ></div>
              </div>
              
              <!-- Color Info -->
              <div class="flex-grow">
                <h4 class="font-medium text-gray-800">Original Color</h4>
                <p class="text-xs mt-1">{{ getColorDescription(colorData?.color) }}</p>
                <div class="flex gap-2 mt-2">
                  <span class="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{{ colorData?.color }}</span>
                  <span class="text-xs bg-gray-100 px-2 py-1 rounded">{{ colorData?.percentage?.toFixed(1) }}% of image</span>
                </div>
              </div>
            </div>
            
            <!-- Current Match Display -->
            <div class="mt-4 border-t pt-4">
              <div class="flex flex-col md:flex-row items-start md:items-center gap-4">
                <!-- Parent Match -->
                <div class="flex-1">
                  <h5 class="text-sm text-gray-500">Current Parent Match:</h5>
                  <div class="flex items-center gap-2 mt-1">
                    <div 
                      class="w-6 h-6 rounded border" 
                      :style="{ backgroundColor: colorData?.parent?.hex }"
                    ></div>
                    <span class="text-sm font-medium">{{ colorData?.parent?.name }}</span>
                  </div>
                  <div class="text-xs mt-1">Distance: <span :class="getConfidenceClass(colorData?.parent?.distance)">{{ colorData?.parent?.distance?.toFixed(1) }} Δ</span></div>
                </div>
                
                <!-- Pantone Match -->
                <div class="flex-1">
                  <h5 class="text-sm text-gray-500">Current Pantone Match:</h5>
                  <div class="flex items-center gap-2 mt-1">
                    <div 
                      class="w-6 h-6 rounded border" 
                      :style="{ backgroundColor: colorData?.pantone?.hex }"
                    ></div>
                    <div>
                      <span class="text-sm font-medium">{{ colorData?.pantone?.name }}</span>
                      <div class="text-xs font-mono">{{ colorData?.pantone?.code }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Tabs -->
          <div class="border-b mb-4">
            <div class="flex">
              <button 
                @click="activeTab = 'parent'" 
                class="px-4 py-2 border-b-2 text-sm font-medium"
                :class="activeTab === 'parent' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              >
                Select Parent Color
              </button>
              <button 
                @click="activeTab = 'pantone'" 
                class="px-4 py-2 border-b-2 text-sm font-medium"
                :class="activeTab === 'pantone' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              >
                View Pantone Matches
              </button>
            </div>
          </div>
          
          <!-- Parent Color Selection -->
          <div v-if="activeTab === 'parent'" class="mb-6">
            <div class="mb-4">
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="Search colors..." 
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div class="max-h-60 overflow-y-auto pr-2 -mr-2">
              <div v-for="family in filteredParentColors" :key="family.name" class="mb-4">
                <h4 class="text-sm font-medium text-gray-600 mb-2">{{ family.name }}</h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button 
                    v-for="color in family.colors" 
                    :key="color.name"
                    @click="selectParent(color)"
                    class="flex flex-col items-center border rounded p-2 hover:bg-gray-50 transition"
                    :class="selectedParent?.name === color.name ? 'ring-2 ring-blue-500' : ''"
                  >
                    <div 
                      class="w-8 h-8 rounded-full border shadow-sm mb-1" 
                      :style="{ backgroundColor: color.hex }"
                    ></div>
                    <span class="text-xs text-center truncate w-full">{{ color.name }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Pantone Matches -->
          <div v-else-if="activeTab === 'pantone'" class="mb-6">
            <div class="mb-2 text-sm text-gray-500">Top Pantone Matches</div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div 
                v-for="match in pantoneMatches" 
                :key="match.code"
                class="flex flex-col border rounded-lg overflow-hidden"
              >
                <div class="h-12" :style="{ backgroundColor: match.hex }"></div>
                <div class="p-2">
                  <div class="text-xs font-medium truncate">{{ match.name }}</div>
                  <div class="text-xs font-mono text-gray-500">{{ match.code }}</div>
                  <div class="text-xs mt-1">
                    <span :class="getConfidenceClass(match.distance)">
                      {{ match.confidence.toFixed(0) }}% match
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div class="mt-3 text-xs text-gray-500">
              <p>Note: Pantone matches are calculated automatically. Select a parent color to improve the match.</p>
            </div>
          </div>
          
          <!-- Additional Notes -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
            <textarea 
              v-model="note" 
              rows="2"
              placeholder="Optional: Add any additional information about this color match..."
              class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>
          
          <!-- Actions -->
          <div class="flex justify-end gap-3">
            <button @click="closeModal" class="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button 
              @click="submitFeedback" 
              :disabled="!selectedParent"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Feedback
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 