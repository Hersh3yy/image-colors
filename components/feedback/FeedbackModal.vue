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
      <h2 class="text-2xl font-bold mb-6">Provide Feedback on Color Match</h2>
      
      <!-- Color comparison display -->
      <div class="flex flex-col md:flex-row gap-6 mb-8">
        <!-- Original color -->
        <div class="flex-1 text-center">
          <div class="w-full h-32 rounded-lg border border-gray-700 mb-2" :style="{ backgroundColor: match.color }"></div>
          <p class="font-medium">Original Color</p>
          <p class="text-sm opacity-75">{{ match.color }}</p>
        </div>
        
        <!-- Parent match -->
        <div class="flex-1 text-center" v-if="match.parent">
          <div class="w-full h-32 rounded-lg border border-gray-700 mb-2" :style="{ backgroundColor: match.parent.hex }"></div>
          <p class="font-medium">Parent Match</p>
          <p class="text-sm opacity-75">{{ match.parent.name || 'Unknown' }}</p>
          <p class="text-sm opacity-75">{{ match.parent.hex }}</p>
          <div class="mt-1 w-full bg-gray-700 h-2 rounded-full overflow-hidden">
            <div class="h-full" :class="getConfidenceClass(match.parent.confidence)" :style="{ width: `${match.parent.confidence}%` }"></div>
          </div>
          <p class="text-xs mt-1">Confidence: {{ match.parent.confidence }}%</p>
        </div>
        
        <!-- System match -->
        <div class="flex-1 text-center">
          <div class="w-full h-32 rounded-lg border border-gray-700 mb-2" :style="{ backgroundColor: match.pantone.hex }"></div>
          <p class="font-medium">Pantone Match</p>
          <p class="text-sm opacity-75">{{ match.pantone.name || 'Unknown' }}</p>
          <p class="text-sm opacity-75">{{ match.pantone.hex }}</p>
          <div class="mt-1 w-full bg-gray-700 h-2 rounded-full overflow-hidden">
            <div class="h-full" :class="getConfidenceClass(match.pantone.confidence)" :style="{ width: `${match.pantone.confidence}%` }"></div>
          </div>
          <p class="text-xs mt-1">Confidence: {{ match.pantone.confidence }}%</p>
        </div>
      </div>
      
      <!-- Parent Color Suggestions -->
      <div class="mb-6 bg-gray-700 p-4 rounded-lg">
        <div class="flex justify-between items-center mb-2">
          <h3 class="font-medium">Parent Color Suggestions</h3>
          <button 
            @click="showParentSuggestions = !showParentSuggestions" 
            class="text-sm text-blue-300 hover:underline"
          >
            {{ showParentSuggestions ? 'Hide Suggestions' : 'Show Suggestions' }}
          </button>
        </div>
        
        <div v-if="showParentSuggestions" class="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div 
            v-for="color in parentSuggestions" 
            :key="color.hex" 
            class="flex flex-col items-center cursor-pointer hover:opacity-80"
            @click="selectParentColor(color)"
          >
            <div 
              class="w-16 h-16 rounded border border-gray-700" 
              :style="{ backgroundColor: color.hex }"
              :class="{'ring-2 ring-blue-500': userCorrection.parentHex === color.hex}"
            ></div>
            <p class="text-xs mt-1 truncate w-full text-center">{{ color.name }}</p>
            <p class="text-xs opacity-75">{{ (color.distance || 0).toFixed(1) }}</p>
          </div>
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
      
      <!-- Feedback form -->
      <div class="mb-6">
        <label class="block mb-2 font-medium">Select Your Correction:</label>
        
        <!-- Parent color selection -->
        <div class="mb-4">
          <label class="block text-sm mb-1">Parent Color:</label>
          <div class="bg-gray-700 p-3 rounded-lg">
            <div class="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
              <div 
                v-for="color in parentSuggestions" 
                :key="color.name" 
                @click="selectParentColor(color)"
                class="cursor-pointer"
              >
                <div 
                  class="w-full pb-[100%] relative rounded-md"
                  :style="{ backgroundColor: color.hex }"
                  :class="{'ring-2 ring-blue-500': userCorrection.parentName === color.name}"
                >
                  <span 
                    class="absolute inset-0 flex items-center justify-center text-xs text-white bg-black/50 opacity-0 hover:opacity-100 rounded-md transition-opacity"
                  >
                    {{ color.name }}
                  </span>
                </div>
              </div>
            </div>
            <p v-if="userCorrection.parentName" class="mt-2 text-sm">
              Selected: <span class="font-medium">{{ userCorrection.parentName }}</span>
            </p>
          </div>
        </div>
        
        <!-- Color picker and pantone select -->
        <div class="flex flex-col md:flex-row gap-4">
          <!-- Color picker -->
          <div class="flex-1">
            <label class="block text-sm mb-1">Choose a Color:</label>
            <input 
              type="color" 
              v-model="userCorrection.hex" 
              class="w-full h-12 rounded-lg border border-gray-700 cursor-pointer"
            />
          </div>
          
          <!-- Pantone select -->
          <div class="flex-1">
            <label class="block text-sm mb-1">Pantone Code:</label>
            <select 
              v-model="userCorrection.pantone" 
              class="w-full h-12 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="" disabled>Select Pantone</option>
              <option 
                v-for="pantone in pantoneSuggestions" 
                :key="pantone.pantone" 
                :value="pantone.pantone"
              >
                {{ pantone.pantone }} - {{ pantone.name }}
              </option>
            </select>
          </div>
        </div>
        
        <!-- Feedback reason -->
        <div class="mt-4">
          <label class="block text-sm mb-1">Reason for Correction:</label>
          <select 
            v-model="userCorrection.reason" 
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="" disabled>Select Reason</option>
            <option value="Too dark">Too dark</option>
            <option value="Too light">Too light</option>
            <option value="Wrong hue">Wrong hue</option>
            <option value="Too saturated">Too saturated</option>
            <option value="Not saturated enough">Not saturated enough</option>
            <option value="Not close enough">Not close enough</option>
            <option value="Wrong parent color">Wrong parent color</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <!-- Additional comments -->
        <div class="mt-4" v-if="userCorrection.reason === 'Other'">
          <label class="block text-sm mb-1">Additional Comments:</label>
          <textarea 
            v-model="userCorrection.comments" 
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 h-24"
            placeholder="Please provide more details about your correction..."
          ></textarea>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <button 
          @click="close" 
          class="px-4 py-2 border border-gray-500 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button 
          @click="submitFeedback" 
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          :disabled="!isValid || isSubmitting"
        >
          Submit Feedback
        </button>
      </div>
      
      <!-- Status message -->
      <div v-if="statusMessage" class="mt-4 p-3 rounded-lg" :class="statusMessageClass">
        {{ statusMessage }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import chroma from 'chroma-js';
import { getConfidenceClass } from '../../services/colorUtils';

/**
 * ===================================
 * COMPONENT PROPS
 * ===================================
 */
const props = defineProps({
  /**
   * Controls modal visibility
   */
  isVisible: {
    type: Boolean,
    default: false
  },
  /**
   * The color match data to display for feedback
   * Contains original color and system's matched color
   */
  match: {
    type: Object,
    required: true
  },
  /**
   * List of Pantone colors for matching
   */
  pantoneColors: {
    type: Array,
    default: () => []
  },
  /**
   * List of parent colors for suggestions
   */
  parentColors: {
    type: Array,
    default: () => []
  }
});

/**
 * ===================================
 * COMPONENT EVENTS
 * ===================================
 */
const emit = defineEmits(['close', 'feedback-submitted']);

/**
 * ===================================
 * UI STATE REFS
 * ===================================
 */
// Toggles for detailed information panels
const showColorInfo = ref(false);
const showParentSuggestions = ref(false);

/**
 * ===================================
 * FEEDBACK STATE
 * ===================================
 */
// User's correction data
const userCorrection = ref({
  hex: '',
  pantone: '',
  reason: '',
  comments: '',
  parentName: '',
  parentHex: ''
});

// Feedback submission status
const statusMessage = ref('');
const statusMessageClass = ref('');
const isSubmitting = ref(false);

/**
 * ===================================
 * WATCHERS
 * ===================================
 */

/**
 * Watch for modal visibility changes to reset form
 */
watch(() => props.isVisible, (newVal) => {
  if (newVal) {
    // Initialize with system match
    userCorrection.value = {
      hex: props.match.pantone.hex,
      pantone: props.match.pantone.code || '',
      reason: '',
      comments: '',
      parentName: props.match.parent?.name || '',
      parentHex: props.match.parent?.hex || ''
    };
    statusMessage.value = '';
  }
});

/**
 * ===================================
 * COMPUTED PROPERTIES
 * ===================================
 */

/**
 * Color information computed property
 * Calculates detailed color information for both the original and system match colors:
 * - RGB, HSL, LAB values
 * - Distance metrics (deltaE, RGB, LAB, HSL)
 * - Component differences for visualization
 */
const colorInfo = computed(() => {
  try {
    const originalColor = chroma(props.match.color);
    const systemColor = chroma(props.match.pantone.hex);
    
    // Calculate all values
    return {
      original: {
        rgb: originalColor.rgb(),
        hsl: originalColor.hsl(),
        lab: originalColor.lab(),
        hex: originalColor.hex()
      },
      system: {
        rgb: systemColor.rgb(),
        hsl: systemColor.hsl(),
        lab: systemColor.lab(),
        hex: systemColor.hex()
      },
      distances: {
        deltaE: chroma.deltaE(originalColor, systemColor),
        rgb: chroma.distance(originalColor, systemColor, 'rgb'),
        lab: chroma.distance(originalColor, systemColor, 'lab'),
        hsl: chroma.distance(originalColor, systemColor, 'hsl')
      },
      diffs: {
        rgb: originalColor.rgb().map((v, i) => v - systemColor.rgb()[i]),
        lab: originalColor.lab().map((v, i) => v - systemColor.lab()[i]),
        hsl: originalColor.hsl().map((v, i) => v - systemColor.hsl()[i])
      }
    };
  } catch (error) {
    console.error('Error calculating color info:', error);
    
    // Return default empty values if there's an error
    return {
      original: { rgb: [0,0,0], hsl: [0,0,0], lab: [0,0,0], hex: '#000000' },
      system: { rgb: [0,0,0], hsl: [0,0,0], lab: [0,0,0], hex: '#000000' },
      distances: { deltaE: 0, rgb: 0, lab: 0, hsl: 0 },
      diffs: { rgb: [0,0,0], lab: [0,0,0], hsl: [0,0,0] }
    };
  }
});

/**
 * Form validation status
 * Checks if all required fields are filled
 */
const isValid = computed(() => {
  return userCorrection.value.hex && 
         userCorrection.value.pantone && 
         userCorrection.value.reason &&
         userCorrection.value.parentName;
});

/**
 * Pantone color suggestions
 * Calculates the closest Pantone colors to the user's selected correction
 */
const pantoneSuggestions = computed(() => {
  // If no pantone colors, return empty array
  if (!props.pantoneColors || !props.pantoneColors.length) {
    return [];
  }
  
  try {
    // Get top 10 closest pantone colors by color distance
    const userColor = chroma(userCorrection.value.hex);
    
    return props.pantoneColors
      .map(pantone => {
        const pantoneColor = chroma(`#${pantone.hex}`);
        const distance = chroma.deltaE(userColor, pantoneColor);
        return { ...pantone, distance };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);
  } catch (error) {
    console.error('Error calculating pantone suggestions:', error);
    return [];
  }
});

/**
 * Parent color suggestions
 * Calculates the closest parent colors to the original color
 */
const parentSuggestions = computed(() => {
  if (!props.parentColors || !props.parentColors.length) {
    return [];
  }
  
  try {
    const originalColor = chroma(props.match.color);
    
    return props.parentColors
      .map(color => {
        const parentColor = chroma(color.hex);
        const distance = chroma.deltaE(originalColor, parentColor);
        return { ...color, distance };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 12);
  } catch (error) {
    console.error('Error calculating parent suggestions:', error);
    return [];
  }
});

/**
 * ===================================
 * METHODS
 * ===================================
 */

/**
 * Close the feedback modal
 */
const close = () => {
  emit('close');
};

/**
 * Select a parent color as the correction
 * @param {Object} color - Parent color object
 */
const selectParentColor = (color) => {
  userCorrection.value.parentName = color.name;
  userCorrection.value.parentHex = color.hex;
  
  // Try to find a matching pantone as well
  const closestPantone = findClosestPantoneToColor(color.hex);
  if (closestPantone) {
    userCorrection.value.pantone = closestPantone.pantone;
  }
};

/**
 * Find the closest Pantone color to a given hex color
 * @param {string} hexColor - Hex color to match
 * @returns {Object|null} - The closest Pantone color or null if not found
 */
const findClosestPantoneToColor = (hexColor) => {
  if (!props.pantoneColors || !props.pantoneColors.length) {
    return null;
  }
  
  try {
    const color = chroma(hexColor);
    
    return props.pantoneColors
      .map(pantone => {
        const pantoneColor = chroma(`#${pantone.hex}`);
        const distance = chroma.deltaE(color, pantoneColor);
        return { ...pantone, distance };
      })
      .sort((a, b) => a.distance - b.distance)[0];
  } catch (error) {
    return null;
  }
};

/**
 * Submit feedback to the system
 * Creates a feedback object with the original match and user correction
 */
const submitFeedback = async () => {
  try {
    isSubmitting.value = true;
    statusMessage.value = 'Submitting feedback...';
    statusMessageClass.value = 'bg-blue-900 text-blue-100';
    
    // Prepare feedback data
    const feedbackData = {
      originalColor: props.match.color,
      systemMatch: {
        hex: props.match.pantone.hex,
        pantone: props.match.pantone.code,
        name: props.match.pantone.name,
        distance: props.match.pantone.distance,
        confidence: props.match.pantone.confidence
      },
      userCorrection: {
        hex: userCorrection.value.hex,
        pantone: userCorrection.value.pantone,
        reason: userCorrection.value.reason,
        comments: userCorrection.value.comments
      },
      parentCorrection: {
        name: userCorrection.value.parentName,
        hex: userCorrection.value.parentHex
      },
      context: {
        parentColors: props.match.parent ? [props.match.parent.hex] : [],
        timestamp: new Date().toISOString(),
        colorMetrics: colorInfo.value.distances
      }
    };
    
    // Send feedback to server
    const response = await fetch('/.netlify/functions/feedback/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(feedbackData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      statusMessage.value = 'Thank you for your feedback!';
      statusMessageClass.value = 'bg-green-900 text-green-100';
      
      // Emit event that feedback was submitted
      emit('feedback-submitted', {
        originalMatch: props.match,
        userCorrection: userCorrection.value,
        parentCorrection: {
          name: userCorrection.value.parentName,
          hex: userCorrection.value.parentHex
        },
        feedbackId: result.id
      });
      
      // Close modal after 2 seconds
      setTimeout(() => {
        close();
      }, 2000);
    } else {
      throw new Error(result.error || 'Failed to submit feedback');
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
    statusMessage.value = `Error: ${error.message}`;
    statusMessageClass.value = 'bg-red-900 text-red-100';
  } finally {
    isSubmitting.value = false;
  }
};
</script> 