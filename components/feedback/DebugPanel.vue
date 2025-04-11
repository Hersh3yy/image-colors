<!--
  DebugPanel.vue - Component for debugging and monitoring the TensorFlow model
  
  This component provides a development interface to:
  1. View model training status and statistics
  2. Test color matching with and without ML
  3. Force model training and monitor results
  4. View debug information for troubleshooting
-->

<template>
  <div class="bg-gray-900 text-white p-4 rounded-lg">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">TensorFlow Model Debug Panel</h2>
      <button @click="refreshDebugInfo" class="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700">
        Refresh
      </button>
    </div>
    
    <!-- Model Status -->
    <div class="mb-6 p-3 bg-gray-800 rounded-lg">
      <h3 class="font-bold mb-2">Model Status</h3>
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div>Model Trained:</div>
        <div>
          <span 
            :class="modelStats.isModelTrained ? 'bg-green-600' : 'bg-red-600'" 
            class="px-2 py-0.5 rounded text-white"
          >
            {{ modelStats.isModelTrained ? 'YES' : 'NO' }}
          </span>
        </div>
        
        <div>Training Examples:</div>
        <div>{{ modelStats.trainingExamplesCount }}</div>
        
        <div>Pending Examples:</div>
        <div>{{ modelStats.pendingExamplesCount }}</div>
        
        <div>Last Trained:</div>
        <div>{{ formatDateTime(modelStats.lastTrainedDate) }}</div>
        
        <div>Training Status:</div>
        <div>
          <span 
            :class="modelStats.isTraining ? 'bg-yellow-600 animate-pulse' : 'bg-blue-600'" 
            class="px-2 py-0.5 rounded text-white"
          >
            {{ modelStats.isTraining ? 'TRAINING...' : 'IDLE' }}
          </span>
        </div>
      </div>
      
      <!-- Training Stats -->
      <div class="mt-4 text-sm" v-if="modelStats.trainingStats">
        <h4 class="font-medium">Training Statistics:</h4>
        <div class="grid grid-cols-2 gap-2 mt-2">
          <div>Total Training Runs:</div>
          <div>{{ modelStats.trainingStats.totalTrainingRuns }}</div>
          
          <div>Last Training Duration:</div>
          <div>{{ modelStats.trainingStats.lastTrainingDuration }}ms</div>
          
          <div>Total Examples Trained:</div>
          <div>{{ modelStats.trainingStats.totalExamplesTrained }}</div>
        </div>
      </div>
    </div>
    
    <!-- Color Test -->
    <div class="mb-6 p-3 bg-gray-800 rounded-lg">
      <h3 class="font-bold mb-2">Test Color Matching</h3>
      
      <div class="flex flex-col md:flex-row gap-4 items-start">
        <!-- Color Input -->
        <div class="flex-1">
          <label class="block text-sm mb-1">Enter Hex Color:</label>
          <div class="flex gap-2">
            <input 
              v-model="testColor" 
              type="text" 
              class="bg-gray-700 text-white px-3 py-2 rounded w-full"
              placeholder="#RRGGBB"
            />
            <button 
              @click="generateRandomColor" 
              class="px-3 py-2 bg-blue-600 rounded hover:bg-blue-700"
              title="Generate Random Color"
            >
              🎲
            </button>
          </div>
          
          <!-- Color Preview -->
          <div class="mt-2 flex items-center gap-2">
            <div 
              class="w-12 h-12 rounded border border-gray-600" 
              :style="{ backgroundColor: validColor ? testColor : '#888888' }"
            ></div>
            <div>
              <div class="text-sm">{{ validColor ? testColor : 'Invalid Color' }}</div>
              <button 
                @click="testColorMatch" 
                class="mt-1 px-3 py-1 text-sm bg-green-600 rounded hover:bg-green-700"
                :disabled="!validColor"
              >
                Test Match
              </button>
            </div>
          </div>
        </div>
        
        <!-- Match Results -->
        <div class="flex-1" v-if="matchResult">
          <div class="text-sm font-medium mb-2">Match Result:</div>
          
          <div class="flex gap-3 items-center mb-2">
            <div 
              class="w-10 h-10 rounded border border-gray-600" 
              :style="{ backgroundColor: matchResult.color?.hex }"
            ></div>
            <div>
              <div class="font-medium">{{ matchResult.color?.name }}</div>
              <div class="text-xs text-gray-400">{{ matchResult.color?.hex }}</div>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div>Confidence:</div>
            <div>
              <span 
                :class="getConfidenceClass(matchResult.confidence)" 
                class="px-2 py-0.5 rounded"
              >
                {{ matchResult.confidence.toFixed(1) }}%
              </span>
            </div>
            
            <div>Method:</div>
            <div>
              <span 
                :class="matchResult.method === 'ml_correction' ? 'bg-purple-600' : 'bg-blue-600'" 
                class="px-2 py-0.5 rounded text-white"
              >
                {{ matchResult.method === 'ml_correction' ? 'ML' : 'Mathematical' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Actions -->
    <div class="mb-6 p-3 bg-gray-800 rounded-lg">
      <h3 class="font-bold mb-2">Actions</h3>
      
      <div class="flex flex-wrap gap-3">
        <button 
          @click="forceTrainModel" 
          class="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700"
          :disabled="modelStats.isTraining || modelStats.trainingExamplesCount === 0"
        >
          Force Train Model
        </button>
        
        <button 
          @click="showDebugInfo = !showDebugInfo" 
          class="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
        >
          {{ showDebugInfo ? 'Hide' : 'Show' }} Debug Info
        </button>
        
        <button 
          @click="openTestPanel" 
          class="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
        >
          Open Feedback Collection
        </button>
      </div>
    </div>
    
    <!-- Debug Info -->
    <div class="mb-6 p-3 bg-gray-800 rounded-lg" v-if="showDebugInfo">
      <h3 class="font-bold mb-2">Debug Information</h3>
      
      <div v-if="debugInfo.testResults">
        <h4 class="text-sm font-medium mb-2">Standard Color Predictions:</h4>
        <div class="grid grid-cols-3 gap-3">
          <div 
            v-for="(result, index) in debugInfo.testResults" 
            :key="index"
            class="bg-gray-700 p-2 rounded text-sm"
          >
            <div class="flex items-center gap-2 mb-1">
              <div 
                class="w-6 h-6 rounded-full" 
                :style="{ backgroundColor: result.hex }"
              ></div>
              <div class="truncate">{{ result.hex }}</div>
            </div>
            <div class="text-xs">{{ result.match }}</div>
            <div class="text-xs">
              {{ result.confidence.toFixed(1) }}% 
              <span class="text-gray-400">({{ result.method }})</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Last Error -->
      <div v-if="modelStats.lastError" class="mt-4">
        <h4 class="text-sm font-medium mb-1">Last Error:</h4>
        <div class="bg-red-900/50 text-red-100 p-2 rounded text-xs">
          <div>{{ modelStats.lastError.message }}</div>
          <div class="mt-1 text-red-300">{{ modelStats.lastError.error }}</div>
          <div class="mt-1 text-gray-400">{{ formatDateTime(modelStats.lastError.time) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useColorMatcherService } from '@/composables/useColorMatcherService';
import chroma from 'chroma-js';

// Props
const props = defineProps({
  isVisible: {
    type: Boolean,
    default: true
  }
});

// Emits
const emit = defineEmits(['open-test-panel']);

// Get color matcher service
const colorMatcherService = useColorMatcherService();

// State
const modelStats = ref({
  isModelTrained: false,
  trainingExamplesCount: 0,
  pendingExamplesCount: 0,
  lastTrainedDate: null,
  isTraining: false
});

const showDebugInfo = ref(false);
const debugInfo = ref({});
const testColor = ref('#3366CC');
const matchResult = ref(null);

// Computed
const validColor = computed(() => {
  try {
    return chroma.valid(testColor.value);
  } catch (e) {
    return false;
  }
});

// Watch for visibility to refresh data
watch(() => props.isVisible, (newValue) => {
  if (newValue) {
    refreshDebugInfo();
  }
});

// Methods
function refreshDebugInfo() {
  // Update model stats
  modelStats.value = colorMatcherService.getModelStats();
  
  // Get detailed debug info
  if (showDebugInfo.value) {
    debugInfo.value = colorMatcherService.getDebugInfo();
  }
}

function generateRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  testColor.value = color;
}

function testColorMatch() {
  if (!validColor.value) return;
  
  try {
    // Find closest color
    matchResult.value = colorMatcherService.findClosestColor(testColor.value);
  } catch (error) {
    console.error('Error testing color match:', error);
    matchResult.value = null;
  }
}

async function forceTrainModel() {
  try {
    await colorMatcherService.forceTrainModel();
    // Refresh data after training
    setTimeout(refreshDebugInfo, 1000);
  } catch (error) {
    console.error('Error forcing model training:', error);
  }
}

function getConfidenceClass(confidence) {
  if (confidence >= 90) return 'bg-green-600 text-white';
  if (confidence >= 70) return 'bg-emerald-600 text-white';
  if (confidence >= 50) return 'bg-yellow-500 text-black';
  return 'bg-red-600 text-white';
}

function formatDateTime(dateString) {
  if (!dateString) return 'Never';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch (e) {
    return dateString;
  }
}

function openTestPanel() {
  emit('open-test-panel');
}

// Initialize
onMounted(() => {
  refreshDebugInfo();
  
  // Set up interval to refresh stats
  const refreshInterval = setInterval(() => {
    if (props.isVisible) {
      refreshDebugInfo();
    }
  }, 5000); // Refresh every 5 seconds
  
  // Clean up interval on unmount
  onUnmounted(() => {
    clearInterval(refreshInterval);
  });
});
</script> 