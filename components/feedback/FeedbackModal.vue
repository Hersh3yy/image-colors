<!--
  FeedbackModal.vue - Color Matching Feedback Component
  
  This component enables users to provide direct feedback on color matches:
  - Displays the original color alongside the system's match
  - Shows detailed color information across multiple color spaces (RGB, HSL, LAB)
  - Visualizes color differences using distance metrics
  - Allows users to select a better matching color
  - Provides suggested parent colors based on proximity to the original color
  
  Flow:
  1. User clicks "Provide Feedback" → showFeedbackModal() → FeedbackModal displays original and matched colors
  2. User reviews color information and selects their correction
  3. User selects reason for the correction
  4. User submits feedback → submitFeedback() → Feedback stored in system
  
  This feedback is essential for:
  - Training the color matching enhancement system
  - Building a knowledge base of human color perception
  - Improving matching accuracy for similar colors in the future
-->

<template>
  <div v-if="isVisible" class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black opacity-50" @click="close"></div>
    
    <!-- Modal content -->
    <div class="relative bg-gray-800 text-white rounded-lg shadow-xl w-full max-w-2xl p-6 m-4 overflow-auto max-h-[90vh]">
      <h2 class="text-2xl font-bold mb-2">Provide Feedback on Color Match</h2>
      <p class="text-gray-300 mb-6">Your feedback helps improve our color matching system for artists like you.</p>
      
      <!-- Color comparison display with improved labels -->
      <div class="flex flex-col md:flex-row gap-6 mb-8">
        <!-- Original color -->
        <div class="flex-1 text-center">
          <div class="w-full h-32 rounded-lg border border-gray-700 mb-2" :style="{ backgroundColor: match.color }"></div>
          <p class="font-medium">Original Color</p>
          <p class="text-sm opacity-75">{{ match.color }}</p>
          <p class="text-xs mt-1">{{ getColorDescription(match.color) }}</p>
        </div>
        
        <!-- Parent match (highlighted as primary match) -->
        <div class="flex-1 text-center" v-if="match.parent">
          <div class="relative">
            <div class="w-full h-32 rounded-lg border-2 border-blue-500 mb-2" :style="{ backgroundColor: match.parent.hex }"></div>
            <div class="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">Primary Match</div>
          </div>
          <p class="font-medium text-blue-300">Parent Color Match</p>
          <p class="text-sm font-medium">{{ match.parent.name || 'Unknown' }}</p>
          <p class="text-sm opacity-75">{{ match.parent.hex }}</p>
          <div class="mt-1 w-full bg-gray-700 h-2 rounded-full overflow-hidden">
            <div class="h-full" :class="getConfidenceClass(match.parent.confidence)" :style="{ width: `${match.parent.confidence}%` }"></div>
          </div>
          <p class="text-xs mt-1">Match Quality: {{ getConfidenceDescription(match.parent.confidence) }}</p>
        </div>
      </div>
      
      <!-- Artist-friendly color description and relationship -->
      <div class="mb-6 bg-gray-700 p-4 rounded-lg">
        <h3 class="font-medium mb-2">Color Relationship</h3>
        <div class="text-sm">
          <p>The system matched your color to <span class="font-medium">{{ match.parent.name }}</span>.</p>
          <p class="mt-2">How would you describe this match?</p>
          <div class="mt-2 grid grid-cols-2 gap-2">
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
      
      <!-- Parent Color Suggestions with visual grouping -->
      <div class="mb-6 bg-gray-700 p-4 rounded-lg">
        <div class="flex justify-between items-center mb-2">
          <h3 class="font-medium">Select a Better Parent Color Match</h3>
          <button 
            @click="showParentSuggestions = !showParentSuggestions" 
            class="text-sm text-blue-300 hover:underline"
          >
            {{ showParentSuggestions ? 'Hide Suggestions' : 'Show Suggestions' }}
          </button>
        </div>
        
        <p class="text-sm mb-3 text-gray-300">These are alternative color matches that may better represent the original color.</p>
        
        <div v-if="showParentSuggestions">
          <!-- Color family groups -->
          <div class="space-y-4">
            <div v-for="(group, groupName) in colorGroups" :key="groupName" class="bg-gray-800 p-3 rounded">
              <h4 class="text-sm font-medium mb-2">{{ groupName }}</h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div 
                  v-for="color in group" 
                  :key="color.hex" 
                  class="flex flex-col items-center cursor-pointer hover:opacity-80 transition-all"
                  @click="selectParentColor(color)"
                  :class="{'transform scale-110': userCorrection.parentHex === color.hex}"
                >
                  <div 
                    class="w-16 h-16 rounded border border-gray-700 transition-all" 
                    :style="{ backgroundColor: color.hex }"
                    :class="{'ring-2 ring-blue-500 shadow-lg': userCorrection.parentHex === color.hex}"
                  ></div>
                  <p class="text-xs mt-1 truncate w-full text-center font-medium">{{ color.name }}</p>
                  <p class="text-xs opacity-75">{{ (color.distance || 0).toFixed(1) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Selected parent color preview -->
        <div v-if="userCorrection.parentName" class="mt-4 p-3 bg-gray-800 rounded flex items-center">
          <div 
            class="w-12 h-12 rounded border border-gray-700 mr-3" 
            :style="{ backgroundColor: userCorrection.parentHex }"
          ></div>
          <div>
            <p class="font-medium">Selected: {{ userCorrection.parentName }}</p>
            <p class="text-sm opacity-75">{{ userCorrection.parentHex }}</p>
          </div>
        </div>
      </div>
      
      <!-- Color Information Section -->
      <div class="mb-6 bg-gray-700 p-4 rounded-lg">
        <div class="flex justify-between items-center mb-2">
          <h3 class="font-medium">Technical Color Information</h3>
          <button 
            @click="showColorInfo = !showColorInfo" 
            class="text-sm text-blue-300 hover:underline"
          >
            {{ showColorInfo ? 'Hide Details' : 'Show Details' }}
          </button>
        </div>
        
        <div v-if="showColorInfo" class="space-y-4">
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
      
      <!-- Action buttons -->
      <div class="flex justify-end gap-4">
        <button 
          @click="close" 
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
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useColorUtils } from '@/composables/useColorUtils';
import { useColorMatcherService } from '@/composables/useColorMatcherService';

const props = defineProps({
  isVisible: {
    type: Boolean,
    required: true
  },
  match: {
    type: Object,
    required: true
  },
  parentColors: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['close', 'feedback-submitted']);

// State
const showParentSuggestions = ref(false);
const showColorInfo = ref(false);
const quickFeedback = ref('');
const userCorrection = ref({
  parentHex: '',
  parentName: '',
  reason: ''
});

// Color utilities
const { 
  getColorDescription,
  getConfidenceClass,
  getConfidenceDescription,
  calculateColorInfo,
  groupColorsByFamily
} = useColorUtils();

// Get color matcher service
const colorMatcherService = useColorMatcherService();

// Computed
const colorInfo = computed(() => {
  if (!props.match || !props.match.parent) return null;
  return calculateColorInfo(props.match.color, props.match.parent.hex);
});

const colorGroups = computed(() => {
  if (!props.parentColors || !props.match) return {};
  return groupColorsByFamily(props.parentColors, props.match.color);
});

const isValid = computed(() => {
  return quickFeedback.value || (userCorrection.value.parentHex && userCorrection.value.parentName);
});

// Methods
const close = () => {
  emit('close');
};

const setQuickFeedback = (reason) => {
  quickFeedback.value = reason;
  userCorrection.value.reason = reason;
};

const selectParentColor = (color) => {
  userCorrection.value = {
    parentHex: color.hex,
    parentName: color.name,
    reason: quickFeedback.value || 'wrong-match'
  };
};

const submitFeedback = async () => {
  if (!isValid.value) return;
  
  const feedback = {
    originalColor: props.match.color,
    originalParent: props.match.parent,
    correction: userCorrection.value,
    quickFeedback: quickFeedback.value,
    colorInfo: colorInfo.value
  };
  
  // Emit the feedback event
  emit('feedback-submitted', feedback);
  
  // Also add to ML training data if we have a correction
  if (userCorrection.value.parentHex) {
    // Find the index of the corrected parent color
    const correctParentIndex = props.parentColors.findIndex(
      c => c.hex === userCorrection.value.parentHex
    );
    
    if (correctParentIndex >= 0) {
      // Create a properly formatted color object
      const targetColor = {
        rgb: { 
          r: colorInfo.value.original.rgb[0],
          g: colorInfo.value.original.rgb[1],
          b: colorInfo.value.original.rgb[2]
        },
        hsl: { 
          h: colorInfo.value.original.hsl[0],
          s: colorInfo.value.original.hsl[1],
          l: colorInfo.value.original.hsl[2]
        },
        lab: { 
          L: colorInfo.value.original.lab[0],
          a: colorInfo.value.original.lab[1],
          b: colorInfo.value.original.lab[2]
        }
      };
      
      // Add the training example
      colorMatcherService.addTrainingExample({
        targetColor,
        correctParentColorIndex: correctParentIndex
      });
      
      // If we have enough new examples, retrain and save
      if (colorMatcherService.shouldRetrain()) {
        try {
          await colorMatcherService.trainModel();
          await colorMatcherService.saveModelToServer();
        } catch (error) {
          console.error('Error training model:', error);
        }
      }
    }
  }
  
  close();
};
</script>

<style scoped>
/* Optional animations for smoother transitions */
.transition-all {
  transition: all 0.2s ease-in-out;
}
</style> 