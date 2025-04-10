<!--
  PlayModal.vue - Color Matching Training Component
  
  This component implements a gamified approach to collecting user feedback:
  - Generates random colors and displays system matches
  - Allows users to accept good matches or provide corrections
  - Visualizes color information in multiple color spaces
  - Tracks user progress through score, streak, and total training count
  
  Flow:
  1. User opens play mode → generateRandomColor() → Random color + system match displayed
  2. User evaluates match:
     a. If good → acceptMatch() → Feedback submitted with positive rating
     b. If needs improvement → rejectMatch() → Feedback form displayed
  3. User provides correction → submitFeedback() → Feedback submitted with correction
  4. Success screen → User can try another color
  
  The play mode is essential for:
  - Collecting diverse feedback across the color spectrum
  - Training the matching system with real user preferences
  - Engaging users in improving the system
-->

<template>
  <div v-if="isVisible" class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black opacity-50" @click="close"></div>
    
    <!-- Modal content -->
    <div class="relative bg-gray-800 text-white rounded-lg shadow-xl w-full max-w-2xl p-6 m-4 overflow-auto max-h-[90vh]">
      <h2 class="text-2xl font-bold mb-6">Train the System - Play Mode</h2>
      
      <!-- Instruction and Score Section -->
      <div class="mb-8">
        <p class="mb-4">Help improve our color matching system by providing feedback on random color matches. The system will generate a random color and show you its best match - let us know if you agree!</p>
        
        <div class="flex flex-wrap items-center gap-2 mb-4">
          <div class="w-3 h-3 rounded-full bg-blue-500"></div>
          <p class="text-sm"><strong>Your score:</strong> {{ score }}</p>
          
          <div class="w-3 h-3 rounded-full bg-green-500 ml-4"></div>
          <p class="text-sm"><strong>Current streak:</strong> {{ streak }}</p>
          
          <div class="w-3 h-3 rounded-full bg-purple-500 ml-4"></div>
          <p class="text-sm"><strong>Colors trained:</strong> {{ trainingCount }}</p>
        </div>
      </div>
      
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="ml-4">Loading a random color...</p>
      </div>
      
      <!-- Color Comparison Stage -->
      <div v-else-if="currentStage === 'color'">
        <!-- Random color display -->
        <div class="flex flex-col md:flex-row gap-6 mb-8">
          <!-- Random color -->
          <div class="flex-1 text-center">
            <div class="w-full h-40 rounded-lg border border-gray-700 mb-2" :style="{ backgroundColor: randomColor }"></div>
            <p class="font-medium">Random Color</p>
            <p class="text-sm opacity-75">{{ randomColor }}</p>
          </div>
          
          <!-- System match - can handle both direct match or parent match -->
          <div class="flex-1 text-center">
            <div class="w-full h-40 rounded-lg border-2 border-blue-500 mb-2" 
                 :style="{ backgroundColor: getMatchedColor() }"></div>
            <p class="font-medium text-blue-300">Best Match</p>
            <p class="text-sm opacity-75">{{ getMatchedName() || 'Loading...' }}</p>
            <p class="text-sm opacity-75">{{ getMatchedColor() }}</p>
            <div v-if="hasMatch()" class="mt-1 w-full bg-gray-700 h-2 rounded-full overflow-hidden">
              <div class="h-full" :class="getConfidenceClass(getMatchedConfidence())" 
                   :style="{ width: `${getMatchedConfidence()}%` }"></div>
            </div>
            <p v-if="hasMatch()" class="text-xs mt-1">Confidence: {{ getMatchedConfidence() }}%</p>
          </div>
        </div>
        
        <!-- Color Information Section -->
        <div class="mb-6 bg-gray-700 p-4 rounded-lg">
          <div class="flex justify-between items-center mb-2">
            <h3 class="font-medium">Color Information</h3>
            <button 
              @click="showColorInfo = !showColorInfo" 
              class="text-sm text-blue-300 hover:underline"
            >
              {{ showColorInfo ? 'Hide Details' : 'Show Details' }}
            </button>
          </div>
          
          <div v-if="showColorInfo && hasMatch()" class="space-y-4">
            <!-- Color space representations -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="bg-gray-800 p-3 rounded">
                <h4 class="text-sm font-medium mb-1">RGB</h4>
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div>Original:</div>
                  <div>{{ colorInfo.original.rgb.join(', ') }}</div>
                  <div>System Match:</div>
                  <div>{{ colorInfo.system.rgb.join(', ') }}</div>
                </div>
              </div>
              
              <div class="bg-gray-800 p-3 rounded">
                <h4 class="text-sm font-medium mb-1">HSL</h4>
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div>Original:</div>
                  <div>{{ colorInfo.original.hsl.map(v => v.toFixed(2)).join(', ') }}</div>
                  <div>System Match:</div>
                  <div>{{ colorInfo.system.hsl.map(v => v.toFixed(2)).join(', ') }}</div>
                </div>
              </div>
              
              <div class="bg-gray-800 p-3 rounded">
                <h4 class="text-sm font-medium mb-1">LAB</h4>
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div>Original:</div>
                  <div>{{ colorInfo.original.lab.map(v => v.toFixed(2)).join(', ') }}</div>
                  <div>System Match:</div>
                  <div>{{ colorInfo.system.lab.map(v => v.toFixed(2)).join(', ') }}</div>
                </div>
              </div>
            </div>
            
            <!-- Distance metrics -->
            <div class="bg-gray-800 p-3 rounded">
              <h4 class="text-sm font-medium mb-1">Distance Metrics</h4>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div>Delta E (Default):</div>
                <div>{{ colorInfo.distances.deltaE.toFixed(2) }}</div>
                <div>RGB Distance:</div>
                <div>{{ colorInfo.distances.rgb.toFixed(2) }}</div>
                <div>LAB Distance:</div>
                <div>{{ colorInfo.distances.lab.toFixed(2) }}</div>
                <div>HSL Distance:</div>
                <div>{{ colorInfo.distances.hsl.toFixed(2) }}</div>
              </div>
            </div>
            
            <!-- Color difference visualization -->
            <div class="bg-gray-800 p-3 rounded">
              <h4 class="text-sm font-medium mb-1">Component Differences</h4>
              <div class="grid grid-cols-6 gap-1 text-xs">
                <div>L:</div>
                <div class="col-span-5">
                  <div class="h-2 bg-gray-600 rounded">
                    <div class="h-full bg-blue-500" :style="{ width: `${Math.abs(colorInfo.diffs.lab[0]) * 2}%` }"></div>
                  </div>
                </div>
                <div>a:</div>
                <div class="col-span-5">
                  <div class="h-2 bg-gray-600 rounded">
                    <div class="h-full bg-green-500" :style="{ width: `${Math.abs(colorInfo.diffs.lab[1]) * 2}%` }"></div>
                  </div>
                </div>
                <div>b:</div>
                <div class="col-span-5">
                  <div class="h-2 bg-gray-600 rounded">
                    <div class="h-full bg-yellow-500" :style="{ width: `${Math.abs(colorInfo.diffs.lab[2]) * 2}%` }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Match Feedback Section -->
        <div class="text-center mb-6">
          <p class="font-medium mb-3">Is the color a good match?</p>
          <div class="flex justify-center gap-4">
            <button 
              @click="acceptMatch" 
              class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Yes, it's good!
            </button>
            <button 
              @click="rejectMatch" 
              class="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              No, it needs improvement
            </button>
          </div>
        </div>

        <!-- Status message -->
        <div v-if="statusMessage" class="mt-4 p-3 rounded-lg" :class="statusMessageClass">
          {{ statusMessage }}
        </div>
      </div>
      
      <!-- Feedback Form Stage -->
      <div v-else-if="currentStage === 'feedback'">
        <!-- Color comparison section -->
        <div class="mb-6">
          <div class="flex flex-col md:flex-row gap-6 mb-6">
            <!-- Random color -->
            <div class="flex-1 text-center">
              <div class="w-full h-32 rounded-lg border border-gray-700 mb-2" :style="{ backgroundColor: randomColor }"></div>
              <p class="font-medium">Original Color</p>
              <p class="text-sm opacity-75">{{ randomColor }}</p>
            </div>
            
            <!-- User correction -->
            <div class="flex-1 text-center">
              <div class="w-full h-32 rounded-lg border border-gray-700 mb-2" :style="{ backgroundColor: userCorrection.hex }"></div>
              <p class="font-medium">Your Correction</p>
              <p class="text-sm opacity-75">{{ userCorrection.hex }}</p>
            </div>
          </div>
          
          <!-- Parent Color Suggestions Section -->
          <div class="mb-6 bg-gray-700 p-4 rounded-lg">
            <div class="flex justify-between items-center mb-2">
              <h3 class="font-medium">Parent Color Suggestions</h3>
              <button 
                @click="showParentSuggestionsPanel = !showParentSuggestionsPanel" 
                class="text-sm text-blue-300 hover:underline"
              >
                {{ showParentSuggestionsPanel ? 'Hide Suggestions' : 'Show Suggestions' }}
              </button>
            </div>
            
            <div v-if="showParentSuggestionsPanel" class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div 
                v-for="color in parentColors" 
                :key="color.name" 
                class="flex flex-col items-center cursor-pointer hover:opacity-80"
                @click="selectParentColor(color)"
              >
                <div 
                  class="w-16 h-16 rounded border border-gray-700" 
                  :style="{ backgroundColor: color.hex }"
                  :class="{'ring-2 ring-blue-500': userCorrection.parentHex === color.hex}"
                ></div>
                <p class="text-xs mt-1 truncate w-full text-center">{{ color.name }}</p>
                <p class="text-xs opacity-75" v-if="getParentColorDistance(color)">
                  {{ getParentColorDistance(color).toFixed(1) }}
                </p>
              </div>
            </div>
          </div>
          
          <!-- Feedback Form -->
          <div class="mb-6 bg-gray-700 p-4 rounded-lg">
            <h3 class="font-medium mb-3">Why wasn't this a good match?</h3>
            <div class="grid grid-cols-2 gap-2">
              <button 
                @click="setQuickFeedback('too-dark')" 
                class="px-3 py-2 text-left border rounded hover:bg-gray-600 transition"
                :class="{'bg-blue-800 border-blue-500': quickFeedback === 'too-dark'}"
              >
                Too dark
              </button>
              <button 
                @click="setQuickFeedback('too-light')" 
                class="px-3 py-2 text-left border rounded hover:bg-gray-600 transition"
                :class="{'bg-blue-800 border-blue-500': quickFeedback === 'too-light'}"
              >
                Too light
              </button>
              <button 
                @click="setQuickFeedback('wrong-hue')" 
                class="px-3 py-2 text-left border rounded hover:bg-gray-600 transition"
                :class="{'bg-blue-800 border-blue-500': quickFeedback === 'wrong-hue'}"
              >
                Wrong hue/tone
              </button>
              <button 
                @click="setQuickFeedback('too-saturated')" 
                class="px-3 py-2 text-left border rounded hover:bg-gray-600 transition"
                :class="{'bg-blue-800 border-blue-500': quickFeedback === 'too-saturated'}"
              >
                Too vibrant/saturated
              </button>
              <button 
                @click="setQuickFeedback('too-dull')" 
                class="px-3 py-2 text-left border rounded hover:bg-gray-600 transition"
                :class="{'bg-blue-800 border-blue-500': quickFeedback === 'too-dull'}"
              >
                Too dull/muted
              </button>
              <button 
                @click="setQuickFeedback('wrong-family')" 
                class="px-3 py-2 text-left border rounded hover:bg-gray-600 transition"
                :class="{'bg-blue-800 border-blue-500': quickFeedback === 'wrong-family'}"
              >
                Wrong color family
              </button>
            </div>
          </div>
        </div>
        
        <!-- Action buttons -->
        <div class="flex justify-end gap-4">
          <button 
            @click="currentStage = 'color'" 
            class="px-4 py-2 text-gray-300 hover:text-white transition"
          >
            Cancel
          </button>
          <button 
            @click="submitFeedback" 
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            :disabled="!isValid"
          >
            Submit Feedback
          </button>
        </div>
      </div>
      
      <!-- Success Stage -->
      <div v-else-if="currentStage === 'success'" class="text-center">
        <div class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h3 class="text-xl font-bold mb-2">Thank you!</h3>
        <p class="mb-6">Your feedback helps improve our color matching system.</p>
        <button 
          @click="generateRandomColor" 
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Another Color
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useColorUtils } from '@/composables/useColorUtils';
import { useColorMatcherService } from '@/composables/useColorMatcherService';

const props = defineProps({
  isVisible: {
    type: Boolean,
    required: true
  },
  parentColors: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['close', 'feedback-submitted']);

// State
const loading = ref(false);
const currentStage = ref('color');
const showColorInfo = ref(false);
const showParentSuggestionsPanel = ref(false);
const quickFeedback = ref('');
const randomColor = ref('');
const systemMatch = ref(null);
const userCorrection = ref({
  hex: '',
  parentHex: '',
  parentName: '',
  reason: ''
});
const statusMessage = ref('');
const statusMessageClass = ref('bg-blue-900 text-blue-100');

// Score tracking
const score = ref(0);
const streak = ref(0);
const trainingCount = ref(0);

// Get color matcher service
const colorMatcherService = useColorMatcherService();

// Track collected examples for this session
const sessionExamples = ref([]);

// Color utilities
const { 
  getConfidenceClass,
  calculateColorInfo,
  getParentColorDistance
} = useColorUtils();

// Helper function to create fully qualified API URLs
function getApiUrl(path) {
  // Fallback to netlify function path if we're deployed there
  if (window?.location?.hostname.includes('netlify.app')) {
    return `/.netlify/functions/${path}`;
  }
  
  // Start with origin + '/api' 
  let baseUrl = typeof window !== 'undefined' ? window.location.origin + '/api' : '/api';
  
  // Make sure path doesn't start with a slash if we're appending
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  return `${baseUrl}/${cleanPath}`;
}

// Helper methods to handle different API response formats
const hasMatch = () => {
  return systemMatch.value !== null;
};

const getMatchedColor = () => {
  if (!systemMatch.value) return '#FFFFFF';
  
  // Try to handle both API response formats
  if (systemMatch.value.parent && systemMatch.value.parent.hex) {
    return systemMatch.value.parent.hex;
  } else if (systemMatch.value.hex) {
    return systemMatch.value.hex;
  }
  
  return '#FFFFFF';
};

const getMatchedName = () => {
  if (!systemMatch.value) return '';
  
  // Try to handle both API response formats
  if (systemMatch.value.parent && systemMatch.value.parent.name) {
    return systemMatch.value.parent.name;
  } else if (systemMatch.value.name) {
    return systemMatch.value.name;
  }
  
  return '';
};

const getMatchedConfidence = () => {
  if (!systemMatch.value) return 0;
  
  // Try to handle both API response formats
  if (systemMatch.value.parent && systemMatch.value.parent.confidence) {
    return systemMatch.value.parent.confidence;
  } else if (systemMatch.value.confidence) {
    return systemMatch.value.confidence;
  }
  
  return 0;
};

// Computed
const colorInfo = computed(() => {
  if (!randomColor.value || !getMatchedColor()) return null;
  return calculateColorInfo(randomColor.value, getMatchedColor());
});

const isValid = computed(() => {
  return quickFeedback.value || (userCorrection.value.parentHex && userCorrection.value.parentName);
});

// Methods
const close = async () => {
  // Check if we collected any examples during this session
  if (sessionExamples.value.length > 0) {
    try {
      // Train the model and save
      await colorMatcherService.trainModel();
      await colorMatcherService.saveModelToServer();
      
      // Reset session examples
      sessionExamples.value = [];
    } catch (error) {
      console.error('Error training model after play session:', error);
    }
  }
  
  emit('close');
};

const generateRandomColor = async () => {
  loading.value = true;
  currentStage.value = 'color';
  statusMessage.value = '';
  
  try {
    // Generate a random color with a fully qualified URL
    console.log('Fetching match from:', getApiUrl('match/match'));
    const response = await fetch(getApiUrl('match/match'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        color: generateRandomHexColor(),
        parentColors: props.parentColors
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Match API response:', result);
    
    if (result.success) {
      randomColor.value = result.color;
      systemMatch.value = result.match;
    } else {
      throw new Error(result.error || 'Failed to generate random color');
    }
  } catch (error) {
    console.error('Error generating random color:', error);
    statusMessage.value = `Error: ${error.message}. Check console for details.`;
    statusMessageClass.value = 'bg-red-900 text-red-100';
  } finally {
    loading.value = false;
  }
};

const generateRandomHexColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const acceptMatch = async () => {
  try {
    console.log('👍 User accepted the match:', {
      color: randomColor.value,
      match: getMatchedName()
    });
    
    // Create feedback data
    const feedbackData = {
      originalColor: randomColor.value,
      originalParent: systemMatch.value.parent || systemMatch.value,
      correction: null,
      quickFeedback: 'good-match',
      colorInfo: colorInfo.value
    };
    
    // Send feedback to server with a fully qualified URL
    const response = await fetch(getApiUrl('feedback/feedback'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(feedbackData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Add as a positive training example for ML
      const parentMatch = systemMatch.value.parent || systemMatch.value;
      if (parentMatch) {
        // Find parent color index
        const parentIndex = props.parentColors.findIndex(
          c => c.hex === parentMatch.hex
        );
        
        if (parentIndex >= 0) {
          console.log('🧠 Adding training example for TensorFlow:', {
            color: randomColor.value,
            correctParentIndex: parentIndex,
            correctParentName: props.parentColors[parentIndex].name
          });
          
          // Create color object
          const targetColor = createColorObject(randomColor.value);
          
          // Add training example
          colorMatcherService.addTrainingExample({
            targetColor,
            correctParentColorIndex: parentIndex
          });
          
          // Track for this session
          sessionExamples.value.push({
            targetColor,
            correctParentColorIndex: parentIndex
          });
        }
      }
      
      // Update score and streak
      score.value += 10;
      streak.value++;
      trainingCount.value++;
      
      // Show success stage
      currentStage.value = 'success';
    } else {
      throw new Error(result.error || 'Failed to submit feedback');
    }
  } catch (error) {
    console.error('❌ Error submitting feedback:', error);
    statusMessage.value = `Error: ${error.message}`;
    statusMessageClass.value = 'bg-red-900 text-red-100';
  }
};

const rejectMatch = () => {
  currentStage.value = 'feedback';
  userCorrection.value = {
    hex: randomColor.value,
    parentHex: '',
    parentName: '',
    reason: ''
  };
  quickFeedback.value = '';
};

const setQuickFeedback = (reason) => {
  quickFeedback.value = reason;
  userCorrection.value.reason = reason;
};

const selectParentColor = (color) => {
  userCorrection.value = {
    hex: randomColor.value,
    parentHex: color.hex,
    parentName: color.name,
    reason: quickFeedback.value || 'wrong-match'
  };
};

const submitFeedback = async () => {
  if (!isValid.value) return;
  
  try {
    console.log('📝 User provided feedback correction:', {
      originalColor: randomColor.value, 
      correction: userCorrection.value.parentName
    });
    
    // Create feedback data
    const feedbackData = {
      originalColor: randomColor.value,
      originalParent: systemMatch.value.parent || systemMatch.value,
      correction: userCorrection.value,
      quickFeedback: quickFeedback.value,
      colorInfo: colorInfo.value
    };
    
    // Send feedback to server with a fully qualified URL
    const response = await fetch(getApiUrl('feedback/feedback'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(feedbackData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Add as a training example for ML
      if (userCorrection.value.parentHex) {
        // Find parent color index
        const correctParentIndex = props.parentColors.findIndex(
          c => c.hex === userCorrection.value.parentHex
        );
        
        if (correctParentIndex >= 0) {
          console.log('🧠 Adding correction training example for TensorFlow:', {
            color: randomColor.value,
            originalMatch: getMatchedName(),
            correctParentName: props.parentColors[correctParentIndex].name
          });
          
          // Create color object
          const targetColor = createColorObject(randomColor.value);
          
          // Add training example
          colorMatcherService.addTrainingExample({
            targetColor,
            correctParentColorIndex: correctParentIndex
          });
          
          // Track for this session
          sessionExamples.value.push({
            targetColor,
            correctParentColorIndex: correctParentIndex
          });
        }
      }
      
      // Update score and streak
      score.value += 5;
      streak.value = 0; // Reset streak on correction
      trainingCount.value++;
      
      // Show success stage
      currentStage.value = 'success';
      
      // Emit feedback submitted event
      emit('feedback-submitted', feedbackData);
    } else {
      throw new Error(result.error || 'Failed to submit feedback');
    }
  } catch (error) {
    console.error('❌ Error submitting feedback:', error);
    statusMessage.value = `Error: ${error.message}`;
    statusMessageClass.value = 'bg-red-900 text-red-100';
  }
};

/**
 * Helper to create a properly formatted color object
 */
const createColorObject = (hexColor) => {
  try {
    // Check if chroma is available
    const chroma = window.chroma;
    if (!chroma) {
      console.error('Chroma.js not available');
      return null;
    }
    
    // Use chroma to get values
    const color = chroma(hexColor);
    const [r, g, b] = color.rgb();
    const [h, s, l] = color.hsl();
    const [L, a, labB] = color.lab();
    
    return {
      rgb: { r, g, b },
      hsl: { h: isNaN(h) ? 0 : h, s: isNaN(s) ? 0 : s, l: isNaN(l) ? 0 : l },
      lab: { L, a, b: labB }
    };
  } catch (error) {
    console.error('Error creating color object:', error);
    return null;
  }
};

// Watch for changes to isVisible
watch(() => props.isVisible, (newVal) => {
  if (newVal) {
    currentStage.value = 'color';
    generateRandomColor();
  }
});

// Initialize if visible on mount
onMounted(() => {
  if (props.isVisible) {
    generateRandomColor();
  }
});
</script> 