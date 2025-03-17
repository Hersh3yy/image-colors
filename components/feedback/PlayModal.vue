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
          
          <!-- System match -->
          <div class="flex-1 text-center">
            <div class="w-full h-40 rounded-lg border border-gray-700 mb-2" :style="{ backgroundColor: systemMatch?.hex }"></div>
            <p class="font-medium">Pantone Match</p>
            <p class="text-sm opacity-75">{{ systemMatch?.name || 'Loading...' }}</p>
            <p class="text-sm opacity-75">{{ systemMatch?.hex }}</p>
            <div v-if="systemMatch" class="mt-1 w-full bg-gray-700 h-2 rounded-full overflow-hidden">
              <div class="h-full" :class="getConfidenceClass(systemMatch.confidence)" :style="{ width: `${systemMatch.confidence}%` }"></div>
            </div>
            <p v-if="systemMatch" class="text-xs mt-1">Confidence: {{ systemMatch.confidence }}%</p>
          </div>

          <!-- Parent color match -->
          <div class="flex-1 text-center">
            <div class="w-full h-40 rounded-lg border border-gray-700 mb-2" :style="{ backgroundColor: systemMatch?.parent?.hex }"></div>
            <p class="font-medium">Parent Match</p>
            <p class="text-sm opacity-75">{{ systemMatch?.parent?.name || 'Loading...' }}</p>
            <p class="text-sm opacity-75">{{ systemMatch?.parent?.hex }}</p>
            <div v-if="systemMatch?.parent" class="mt-1 w-full bg-gray-700 h-2 rounded-full overflow-hidden">
              <div class="h-full" :class="getConfidenceClass(systemMatch.parent.confidence)" :style="{ width: `${systemMatch.parent.confidence}%` }"></div>
            </div>
            <p v-if="systemMatch?.parent" class="text-xs mt-1">Confidence: {{ systemMatch.parent.confidence }}%</p>
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
          
          <div v-if="showColorInfo && systemMatch" class="space-y-4">
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
          <p class="font-medium mb-3">Is this a good match?</p>
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
          
          <!-- Pantone Suggestions Section -->
          <div class="mb-6 bg-gray-700 p-4 rounded-lg">
            <div class="flex justify-between items-center mb-2">
              <h3 class="font-medium">Pantone Suggestions</h3>
              <button 
                @click="showPantoneSuggestionsPanel = !showPantoneSuggestionsPanel" 
                class="text-sm text-blue-300 hover:underline"
              >
                {{ showPantoneSuggestionsPanel ? 'Hide Suggestions' : 'Show Suggestions' }}
              </button>
            </div>
            
            <div v-if="showPantoneSuggestionsPanel" class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div 
                v-for="pantone in pantoneSuggestions.slice(0, 8)" 
                :key="pantone.pantone" 
                class="flex flex-col items-center cursor-pointer hover:opacity-80"
                @click="selectPantone(pantone)"
              >
                <div 
                  class="w-16 h-16 rounded border border-gray-700" 
                  :style="{ backgroundColor: `#${pantone.hex}` }"
                  :class="{'ring-2 ring-blue-500': userCorrection.pantone === pantone.pantone}"
                ></div>
                <p class="text-xs mt-1 truncate w-full text-center">{{ pantone.pantone }}</p>
                <p class="text-xs opacity-75">{{ (pantone.distance || 0).toFixed(1) }}</p>
              </div>
            </div>
          </div>
          
          <!-- Correction Form -->
          <div>
            <label class="block mb-2 font-medium">Your Correction:</label>
            
            <!-- Color picker and pantone select -->
            <div class="flex flex-col md:flex-row gap-4">
              <!-- Color picker -->
              <div class="flex-1">
                <label class="block text-sm mb-1">Choose a Better Color:</label>
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
            
            <!-- Parent color select -->
            <div class="mt-4">
              <label class="block text-sm mb-1">Parent Color:</label>
              <div class="bg-gray-700 p-3 rounded-lg">
                <div class="grid grid-cols-4 md:grid-cols-8 gap-2 max-h-48 overflow-y-auto">
                  <div 
                    v-for="color in parentColors" 
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
          </div>
        </div>
        
        <!-- Form Actions -->
        <div class="flex justify-end gap-3">
          <button 
            @click="submitFeedback" 
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            :disabled="!isValid || isSubmitting"
          >
            Submit Feedback
          </button>
        </div>
      </div>
      
      <!-- Success Stage -->
      <div v-else-if="currentStage === 'success'">
        <div class="text-center py-8">
          <div class="inline-block p-4 bg-green-800 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 class="text-xl font-bold mb-3">Feedback Submitted!</h3>
          <p>Thank you for helping improve our color matching system.</p>
          
          <div class="mt-8">
            <button 
              @click="generateRandomColor" 
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Another Color
            </button>
          </div>
        </div>
      </div>
      
      <!-- Status message -->
      <div v-if="statusMessage" class="mt-4 p-3 rounded-lg" :class="statusMessageClass">
        {{ statusMessage }}
        <button 
          v-if="statusMessage.includes('Pantone colors')" 
          @click="retryLoadPantoneColors"
          class="ml-3 px-2 py-1 bg-blue-700 text-white text-xs rounded hover:bg-blue-800"
        >
          Retry Loading Colors
        </button>
      </div>
      
      <!-- Bottom actions -->
      <div class="mt-6 flex justify-between">
        <div class="flex space-x-2">
          <button 
            @click="close" 
            class="px-4 py-2 border border-gray-500 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
        
        <button 
          v-if="currentStage === 'color'" 
          @click="generateRandomColor" 
          class="px-4 py-2 border border-blue-500 text-blue-300 rounded-lg hover:bg-blue-900 transition-colors"
        >
          Generate Another Color
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
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
const emit = defineEmits(['close', 'feedback-submitted', 'request-pantone-colors']);

/**
 * ===================================
 * UI STATE REFS
 * ===================================
 */
// Toggles for displaying detailed information
const showColorInfo = ref(false);
const showCorrectionColorInfo = ref(false);
const showPantoneSuggestionsPanel = ref(false);
const showParentSuggestionsPanel = ref(false);

/**
 * ===================================
 * APPLICATION STATE
 * ===================================
 */
// Core play mode state
const randomColor = ref('');
const systemMatch = ref(null);
const loading = ref(false);
// Current view: 'color' (comparison), 'feedback' (correction), 'success'
const currentStage = ref('color');

/**
 * ===================================
 * GAMIFICATION STATE
 * ===================================
 */
// Scoring system for engagement
const score = ref(0);
const streak = ref(0);
const trainingCount = ref(0);

/**
 * ===================================
 * FEEDBACK STATE
 * ===================================
 */
// User correction data
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
 * COMPUTED PROPERTIES
 * ===================================
 */

/**
 * Color information for the comparison view
 * Calculates information about the random color and system match:
 * - RGB, HSL, LAB values for both colors
 * - Distance metrics between colors
 * - Component differences for visualization
 */
const colorInfo = computed(() => {
  if (!systemMatch.value) {
    return {
      original: { rgb: [0,0,0], hsl: [0,0,0], lab: [0,0,0], hex: '#000000' },
      system: { rgb: [0,0,0], hsl: [0,0,0], lab: [0,0,0], hex: '#000000' },
      distances: { deltaE: 0, rgb: 0, lab: 0, hsl: 0 },
      diffs: { rgb: [0,0,0], lab: [0,0,0], hsl: [0,0,0] }
    };
  }
  
  try {
    const originalColor = chroma(randomColor.value);
    const systemColor = chroma(systemMatch.value.hex);
    
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
 * Color information for the correction view
 * Similar to colorInfo but compares the random color to the user's correction
 */
const correctionColorInfo = computed(() => {
  if (!userCorrection.value.hex) {
    return {
      original: { rgb: [0,0,0], hsl: [0,0,0], lab: [0,0,0], hex: '#000000' },
      user: { rgb: [0,0,0], hsl: [0,0,0], lab: [0,0,0], hex: '#000000' },
      distances: { deltaE: 0, rgb: 0, lab: 0, hsl: 0 },
      diffs: { rgb: [0,0,0], lab: [0,0,0], hsl: [0,0,0] }
    };
  }
  
  try {
    const originalColor = chroma(randomColor.value);
    const userColor = chroma(userCorrection.value.hex);
    
    // Calculate all values
    return {
      original: {
        rgb: originalColor.rgb(),
        hsl: originalColor.hsl(),
        lab: originalColor.lab(),
        hex: originalColor.hex()
      },
      user: {
        rgb: userColor.rgb(),
        hsl: userColor.hsl(),
        lab: userColor.lab(),
        hex: userColor.hex()
      },
      distances: {
        deltaE: chroma.deltaE(originalColor, userColor),
        rgb: chroma.distance(originalColor, userColor, 'rgb'),
        lab: chroma.distance(originalColor, userColor, 'lab'),
        hsl: chroma.distance(originalColor, userColor, 'hsl')
      },
      diffs: {
        rgb: originalColor.rgb().map((v, i) => v - userColor.rgb()[i]),
        lab: originalColor.lab().map((v, i) => v - userColor.lab()[i]),
        hsl: originalColor.hsl().map((v, i) => v - userColor.hsl()[i])
      }
    };
  } catch (error) {
    console.error('Error calculating correction color info:', error);
    
    // Return default empty values if there's an error
    return {
      original: { rgb: [0,0,0], hsl: [0,0,0], lab: [0,0,0], hex: '#000000' },
      user: { rgb: [0,0,0], hsl: [0,0,0], lab: [0,0,0], hex: '#000000' },
      distances: { deltaE: 0, rgb: 0, lab: 0, hsl: 0 },
      diffs: { rgb: [0,0,0], lab: [0,0,0], hsl: [0,0,0] }
    };
  }
});

/**
 * Determines if the feedback form is valid for submission
 */
const isValid = computed(() => {
  return userCorrection.value.hex && 
         userCorrection.value.pantone && 
         userCorrection.value.reason;
});

/**
 * Calculated pantone color suggestions based on user's correction color
 * Returns the 10 closest pantone colors to the user's selected color
 */
const pantoneSuggestions = computed(() => {
  // If no pantone colors or no hex, return empty array
  if (!props.pantoneColors || !props.pantoneColors.length || !userCorrection.value.hex) {
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
 * Add parentMatch computed property
 * Finds the closest parent color match to the random color
 */
const parentMatch = computed(() => {
  if (!props.parentColors || !randomColor.value) return null;
  
  try {
    const randomChroma = chroma(randomColor.value);
    let closestParent = null;
    let minDistance = Infinity;
    
    props.parentColors.forEach(parent => {
      const parentChroma = chroma(parent.hex);
      const distance = chroma.deltaE(randomChroma, parentChroma);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestParent = {
          ...parent,
          distance,
          confidence: calculateConfidence(distance)
        };
      }
    });
    
    return closestParent;
  } catch (error) {
    console.error('Error finding parent match:', error);
    return null;
  }
});

/**
 * ===================================
 * WATCHERS
 * ===================================
 */

/**
 * Watch for modal visibility changes to initialize
 */
watch(() => props.isVisible, (newVal) => {
  if (newVal) {
    currentStage.value = 'color';
    generateRandomColor();
  }
});

/**
 * ===================================
 * METHODS
 * ===================================
 */

/**
 * Close the modal and reset state
 */
const close = () => {
  emit('close');
};

/**
 * Generate a random color and fetch its system match
 */
const generateRandomColor = async () => {
  try {
    // Check if we have pantone colors first
    if (!props.pantoneColors || props.pantoneColors.length === 0) {
      statusMessage.value = 'Error: Pantone colors file not found. Click retry to load colors.';
      statusMessageClass.value = 'bg-red-900 text-red-100';
      return;
    }

    loading.value = true;
    statusMessage.value = '';
    systemMatch.value = null;
    
    // Generate random RGB values
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    
    // Convert to hex
    randomColor.value = chroma(r, g, b).hex();
    
    // Get system match
    const response = await fetch('/.netlify/functions/match/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        color: randomColor.value
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      systemMatch.value = result.match;
      currentStage.value = 'color';
    } else {
      throw new Error(result.error || 'Failed to get color match');
    }
  } catch (error) {
    console.error('Error generating random color:', error);
    statusMessage.value = `Error: ${error.message}`;
    statusMessageClass.value = 'bg-red-900 text-red-100';
  } finally {
    loading.value = false;
  }
};

/**
 * User accepts the system match as good
 * Updates score, streak, and training count
 * Submits positive feedback
 */
const acceptMatch = () => {
  score.value += 10;
  streak.value += 1;
  trainingCount.value += 1;
  
  currentStage.value = 'success';
  
  // Submit positive feedback
  submitPositiveFeedback();
};

/**
 * User rejects the system match
 * Moves to feedback stage for user to provide correction
 */
const rejectMatch = () => {
  // Move to feedback stage
  currentStage.value = 'feedback';
  
  // Initialize with system match
  userCorrection.value = {
    hex: systemMatch.value.hex,
    pantone: systemMatch.value.code || '',
    reason: '',
    comments: '',
    parentName: '',
    parentHex: ''
  };
};

/**
 * User selects a pantone color from suggestions
 * @param {Object} pantone - Selected pantone color object
 */
const selectPantone = (pantone) => {
  userCorrection.value.pantone = pantone.pantone;
  userCorrection.value.hex = `#${pantone.hex}`;
};

/**
 * Submit feedback with user's correction
 */
const submitFeedback = async () => {
  try {
    isSubmitting.value = true;
    statusMessage.value = 'Submitting feedback...';
    statusMessageClass.value = 'bg-blue-900 text-blue-100';
    
    // Send feedback directly to match function
    const response = await fetch('/.netlify/functions/match/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        color: randomColor.value,
        feedback: 'bad',
        parentCorrection: {
          name: userCorrection.value.parentName,
          hex: userCorrection.value.parentHex
        },
        reason: userCorrection.value.reason
      })
    });

    const result = await response.json();
    console.log('Negative feedback response:', result);

    if (result.success) {
      // Update stats
      score.value += 20; // More points for providing corrections
      streak.value = 0; // Reset streak when providing corrections
      trainingCount.value += 1;
      
      // Move to success stage
      currentStage.value = 'success';
      statusMessage.value = '';
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

/**
 * Submit positive feedback when user accepts the match
 */
const submitPositiveFeedback = async () => {
  try {
    // Send feedback directly to match function
    const response = await fetch('/.netlify/functions/match/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        color: randomColor.value,
        feedback: 'good',
        parentFeedback: systemMatch.value?.parent ? 'good' : 'bad'
      })
    });

    const result = await response.json();
    console.log('Positive feedback response:', result);

  } catch (error) {
    console.error('Error submitting positive feedback:', error);
  }
};

/**
 * Retry loading pantone colors
 */
const retryLoadPantoneColors = async () => {
  statusMessage.value = 'Retrying to load Pantone colors...';
  statusMessageClass.value = 'bg-blue-900 text-blue-100';
  
  try {
    // Emit an event to parent to fetch pantone colors again
    emit('request-pantone-colors');
    
    // Wait a bit and check if pantone colors have been loaded
    setTimeout(() => {
      if (props.pantoneColors && props.pantoneColors.length > 0) {
        statusMessage.value = `Successfully loaded ${props.pantoneColors.length} Pantone colors`;
        statusMessageClass.value = 'bg-green-900 text-green-100';
        
        // Clear the message after a delay
        setTimeout(() => {
          statusMessage.value = '';
        }, 3000);
        
        // Try generating a random color again
        generateRandomColor();
      } else {
        statusMessage.value = 'Still unable to load Pantone colors. Check the console for errors.';
        statusMessageClass.value = 'bg-red-900 text-red-100';
      }
    }, 2000);
  } catch (error) {
    console.error('Error retrying to load pantone colors:', error);
    statusMessage.value = `Error: ${error.message}`;
    statusMessageClass.value = 'bg-red-900 text-red-100';
  }
};

/**
 * Add methods for parent color handling
 */

// Get distance between random color and a parent color
const getParentColorDistance = (parentColor) => {
  if (!randomColor.value || !parentColor || !parentColor.hex) return null;
  try {
    const colorA = chroma(randomColor.value);
    const colorB = chroma(parentColor.hex);
    return chroma.deltaE(colorA, colorB);
  } catch (error) {
    console.error('Error calculating parent color distance:', error);
    return null;
  }
};

// Select a parent color from suggestions
const selectParentColor = (color) => {
  userCorrection.value.parentName = color.name;
  userCorrection.value.parentHex = color.hex;
};
</script> 