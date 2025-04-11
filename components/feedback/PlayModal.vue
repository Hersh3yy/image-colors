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
        <p class="mb-4">Help improve our color matching system by providing feedback on random color matches. The system generates a random color and shows you its best match - let us know if you agree!</p>
        
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
        <p class="ml-4">Finding the best match...</p>
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
          
          <!-- Best match color -->
          <div class="flex-1 text-center">
            <div class="w-full h-40 rounded-lg border-2 border-blue-500 mb-2" 
                 :style="{ backgroundColor: bestMatch.hex }"></div>
            <p class="font-medium text-blue-300">Best Match</p>
            <p class="text-sm opacity-75">{{ bestMatch.name || 'Loading...' }}</p>
            <p class="text-sm opacity-75">{{ bestMatch.hex }}</p>
            <div class="mt-1 w-full bg-gray-700 h-2 rounded-full overflow-hidden">
              <div class="h-full" :class="getConfidenceClass(bestMatch.confidence)" 
                   :style="{ width: `${bestMatch.confidence}%` }"></div>
            </div>
            <p class="text-xs mt-1">Confidence: {{ bestMatch.confidence }}% ({{ bestMatch.matchMethod }})</p>
          </div>
        </div>
        
        <!-- Alternative Matches Section -->
        <div class="mb-6 bg-gray-700 p-4 rounded-lg">
          <div class="flex justify-between items-center mb-2">
            <h3 class="font-medium">Alternative Matches</h3>
            <button 
              @click="showAltMatches = !showAltMatches" 
              class="text-sm text-blue-300 hover:underline"
            >
              {{ showAltMatches ? 'Hide Alternatives' : 'Show Alternatives' }}
            </button>
          </div>
          
          <div v-if="showAltMatches" class="space-y-4">
            <div v-for="(matches, method) in alternativeMatches" :key="method" class="bg-gray-800 p-3 rounded">
              <h4 class="text-sm font-medium mb-2">{{ getMethodName(method) }}</h4>
              <div class="grid grid-cols-4 gap-2">
                <div 
                  v-for="(match, index) in matches.slice(0, 4)" 
                  :key="index"
                  class="flex flex-col items-center cursor-pointer" 
                  @click="useAlternativeMatch(match)"
                >
                  <div 
                    class="w-12 h-12 rounded border border-gray-700 mb-1"
                    :style="{ backgroundColor: match.hex }"
                    :class="{'ring-2 ring-blue-500': match.hex === bestMatch.hex}"
                  ></div>
                  <p class="text-xs truncate w-full text-center">{{ match.name }}</p>
                  <p class="text-xs opacity-75">{{ match.distance.toFixed(1) }}</p>
                </div>
              </div>
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
          
          <!-- Multi-method Color Suggestions Section -->
          <div class="mb-6 bg-gray-700 p-4 rounded-lg">
            <div class="flex justify-between items-center mb-2">
              <h3 class="font-medium">Match Suggestions by Method</h3>
              <div class="flex gap-2">
                <select v-model="selectedMatchMethod" class="bg-gray-800 text-sm rounded px-2 py-1 border border-gray-600">
                  <option value="deltaE">DeltaE (Standard)</option>
                  <option value="lab">LAB Distance</option>
                  <option value="rgb">RGB Distance</option>
                  <option value="hsl">HSL Distance</option>
                </select>
                <button 
                  @click="showSuggestionsPanel = !showSuggestionsPanel" 
                  class="text-sm text-blue-300 hover:underline"
                >
                  {{ showSuggestionsPanel ? 'Hide' : 'Show' }}
                </button>
              </div>
            </div>
            
            <div v-if="showSuggestionsPanel" class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div 
                v-for="color in getMatchesByMethod(selectedMatchMethod)" 
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
                <p class="text-xs opacity-75" v-if="color.distance">
                  {{ color.distance.toFixed(1) }}
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
          @click="generateNewColor" 
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
import chroma from 'chroma-js';
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

const emit = defineEmits(['close', 'feedback-submitted', 'save-match-preference']);

// State
const loading = ref(false);
const currentStage = ref('color');
const showColorInfo = ref(false);
const showAltMatches = ref(false);
const showSuggestionsPanel = ref(true);
const selectedMatchMethod = ref('deltaE');
const quickFeedback = ref('');
const randomColor = ref('');
const bestMatch = ref({ 
  hex: '#FFFFFF', 
  name: '', 
  confidence: 0,
  matchMethod: 'deltaE'
});
const alternativeMatches = ref({});
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

// Track saved user match preferences
const savedMatchPreferences = ref({});

// Color utilities
const { 
  getConfidenceClass,
  calculateColorInfo
} = useColorUtils();

// Load stored match preferences
const loadSavedPreferences = () => {
  // No longer using localStorage
  savedMatchPreferences.value = {};
};

// Save a match preference - now only emits an event for the preset to handle
const saveMatchPreference = (originalColor, matchedColor) => {
  // Instead of saving to localStorage, emit an event for the parent to handle
  // This will allow the parent component to update presets if needed
  emit('save-match-preference', {
    originalColor,
    matchedColor
  });
};

// Computed
const colorInfo = computed(() => {
  if (!randomColor.value || !bestMatch.value.hex) return {
    original: { rgb: [0,0,0], hsl: [0,0,0], lab: [0,0,0], hex: '#000000' },
    system: { rgb: [0,0,0], hsl: [0,0,0], lab: [0,0,0], hex: '#000000' },
    distances: { deltaE: 0, rgb: 0, lab: 0, hsl: 0 },
    diffs: { rgb: [0,0,0], lab: [0,0,0], hsl: [0,0,0] }
  };
  
  try {
    // Calculate color info
    const originalColor = chroma(randomColor.value);
    const systemColor = chroma(bestMatch.value.hex);
    
    return {
      original: {
        rgb: originalColor.rgb(),
        hsl: originalColor.hsl(),
        lab: originalColor.lab(),
        hex: randomColor.value
      },
      system: {
        rgb: systemColor.rgb(),
        hsl: systemColor.hsl(),
        lab: systemColor.lab(),
        hex: bestMatch.value.hex
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
    return {
      original: { rgb: [0,0,0], hsl: [0,0,0], lab: [0,0,0], hex: '#000000' },
      system: { rgb: [0,0,0], hsl: [0,0,0], lab: [0,0,0], hex: '#000000' },
      distances: { deltaE: 0, rgb: 0, lab: 0, hsl: 0 },
      diffs: { rgb: [0,0,0], lab: [0,0,0], hsl: [0,0,0] }
    };
  }
});

const suggestedMatches = computed(() => {
  if (!props.parentColors || props.parentColors.length === 0 || !randomColor.value) {
    return [];
  }
  
  try {
    const targetColor = chroma(randomColor.value);
    
    // Calculate distances and sort by closest first
    return props.parentColors
      .map(color => {
        try {
          const distance = chroma.deltaE(targetColor, chroma(color.hex));
          return { ...color, distance };
        } catch (e) {
          return { ...color, distance: 100 }; // Fallback large distance
        }
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 16); // Get top 16 matches
  } catch (error) {
    console.error('Error calculating suggested matches:', error);
    return [];
  }
});

const isValid = computed(() => {
  return quickFeedback.value || (userCorrection.value.parentHex && userCorrection.value.parentName);
});

// Helper methods
const getMethodName = (method) => {
  const names = {
    'deltaE': 'DeltaE (Standard)',
    'lab': 'LAB Distance',
    'rgb': 'RGB Distance',
    'hsl': 'HSL Distance'
  };
  return names[method] || method;
};

const getMatchesByMethod = (method) => {
  return alternativeMatches.value[method] || [];
};

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

// Use an alternative match as the main match
const useAlternativeMatch = (match) => {
  if (match) {
    bestMatch.value = {
      ...match,
      confidence: Math.round(Math.max(0, Math.min(100, 100 - match.distance)))
    };
  }
};

// Calculate closest matches across different color spaces
const findMatches = (color) => {
  if (!props.parentColors || props.parentColors.length === 0) {
    return {
      deltaE: [],
      lab: [],
      rgb: [],
      hsl: []
    };
  }
  
  try {
    const targetColor = chroma(color);
    
    // Calculate distances for each method
    const matches = {
      deltaE: [],
      lab: [],
      rgb: [],
      hsl: []
    };
    
    // For each parent color, calculate distances using different methods
    props.parentColors.forEach(parentColor => {
      try {
        const parentChroma = chroma(parentColor.hex);
        
        // Calculate different distance types
        const deltaE = chroma.deltaE(targetColor, parentChroma);
        const rgbDistance = chroma.distance(targetColor, parentChroma, 'rgb');
        const labDistance = chroma.distance(targetColor, parentChroma, 'lab');
        const hslDistance = chroma.distance(targetColor, parentChroma, 'hsl');
        
        // Add to each method array with the proper distance
        matches.deltaE.push({ ...parentColor, distance: deltaE, matchMethod: 'deltaE' });
        matches.lab.push({ ...parentColor, distance: labDistance, matchMethod: 'lab' });
        matches.rgb.push({ ...parentColor, distance: rgbDistance, matchMethod: 'rgb' });
        matches.hsl.push({ ...parentColor, distance: hslDistance, matchMethod: 'hsl' });
      } catch (e) {
        // Skip colors that can't be processed
      }
    });
    
    // Sort each array by its distance
    Object.keys(matches).forEach(method => {
      matches[method].sort((a, b) => a.distance - b.distance);
    });
    
    return matches;
  } catch (error) {
    console.error('Error finding matches:', error);
    return {
      deltaE: [],
      lab: [],
      rgb: [],
      hsl: []
    };
  }
};

// Find the best match based on a weighting of multiple methods
const findBestMatch = (color) => {
  // First check if there's a saved preference for this color
  const normalizedColor = color.toLowerCase();
  if (savedMatchPreferences.value[normalizedColor]) {
    const savedMatch = props.parentColors.find(
      c => c.hex.toLowerCase() === savedMatchPreferences.value[normalizedColor].toLowerCase()
    );
    if (savedMatch) {
      return {
        ...savedMatch,
        confidence: 100,
        matchMethod: 'saved-preference'
      };
    }
  }
  
  // Find matches using multiple methods
  const matches = findMatches(color);
  
  // Store all matches for UI display
  alternativeMatches.value = matches;
  
  // If no matches found, return an empty result
  if (!matches.deltaE.length) {
    return { 
      hex: '#FFFFFF', 
      name: 'No matches available', 
      confidence: 0,
      matchMethod: 'none'
    };
  }
  
  // Get top results from each method
  const topDeltaE = matches.deltaE[0];
  const topLab = matches.lab[0];
  const topRgb = matches.rgb[0];
  const topHsl = matches.hsl[0];
  
  // Count how many methods agree on the same top color
  const topColors = [topDeltaE.hex, topLab.hex, topRgb.hex, topHsl.hex];
  const colorCounts = {};
  topColors.forEach(hex => {
    colorCounts[hex] = (colorCounts[hex] || 0) + 1;
  });
  
  // Find the color with the most agreement
  let mostAgreedHex = topDeltaE.hex; // Default to deltaE
  let mostAgreedCount = 0;
  
  Object.entries(colorCounts).forEach(([hex, count]) => {
    if (count > mostAgreedCount) {
      mostAgreedHex = hex;
      mostAgreedCount = count;
    }
  });
  
  // Find which method this belongs to (for display purposes)
  let mainMethod = 'deltaE';
  if (mostAgreedHex === topDeltaE.hex) mainMethod = 'deltaE';
  else if (mostAgreedHex === topLab.hex) mainMethod = 'lab';
  else if (mostAgreedHex === topRgb.hex) mainMethod = 'rgb';
  else if (mostAgreedHex === topHsl.hex) mainMethod = 'hsl';
  
  // Get the complete match object
  const bestMatchFromMethod = matches[mainMethod].find(m => m.hex === mostAgreedHex);
  
  // Calculate confidence based on agreement and distance
  // Higher agreement = higher base confidence
  let confidence = 70 + (mostAgreedCount * 7);
  
  // Adjust by distance - closer = higher confidence
  if (bestMatchFromMethod) {
    const distancePenalty = Math.min(35, bestMatchFromMethod.distance / 2);
    confidence = Math.max(0, Math.min(100, confidence - distancePenalty));
  }
  
  return {
    ...(bestMatchFromMethod || topDeltaE),
    confidence: Math.round(confidence),
    matchMethod: mainMethod
  };
};

// Generate a new random color
const generateRandomHexColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// Generate a new color and find its match
const generateNewColor = () => {
  loading.value = true;
  currentStage.value = 'color';
  statusMessage.value = '';
  
  try {
    // Generate a random color client-side
    randomColor.value = generateRandomHexColor();
    
    // Find the best match and alternatives
    bestMatch.value = findBestMatch(randomColor.value);
    
    console.log('Generated new random color:', randomColor.value);
    console.log('Best match:', bestMatch.value);
  } catch (error) {
    console.error('Error generating new color:', error);
    statusMessage.value = `Error: ${error.message}`;
    statusMessageClass.value = 'bg-red-900 text-red-100';
  } finally {
    loading.value = false;
  }
};

// User accepts the match as good
const acceptMatch = async () => {
  try {
    console.log('👍 User accepted the match:', {
      color: randomColor.value,
      match: bestMatch.value.name
    });
    
    // Save the user preference for this color
    saveMatchPreference(randomColor.value, bestMatch.value.hex);
    
    // Try to submit feedback to API if available
    try {
      const feedbackData = {
        originalColor: randomColor.value,
        match: bestMatch.value,
        feedback: 'good',
        colorInfo: colorInfo.value
      };
      
      // Try to submit to API but don't block on failure
      fetch('/.netlify/functions/feedback/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData)
      }).catch(e => console.log('API feedback submission failed, but continuing:', e));
      
      // Emit the feedback event regardless
      emit('feedback-submitted', feedbackData);
    } catch (e) {
      // Silently handle API errors
      console.log('API feedback error handled:', e);
    }
    
    // Add as a positive training example for ML
    if (bestMatch.value.name) {
      // Find parent color index
      const parentIndex = props.parentColors.findIndex(
        c => c.hex === bestMatch.value.hex
      );
      
      if (parentIndex >= 0) {
        console.log('Adding training example:', {
          color: randomColor.value,
          matchIndex: parentIndex,
          matchName: props.parentColors[parentIndex].name
        });
        
        try {
          // Create color object
          const targetColor = createColorObject(randomColor.value);
          
          // Add training example if color service is available
          if (colorMatcherService && targetColor) {
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
        } catch (e) {
          console.log('Training example addition error handled:', e);
        }
      }
    }
    
    // Update score and streak
    score.value += 10;
    streak.value++;
    trainingCount.value++;
    
    // Show success stage
    currentStage.value = 'success';
  } catch (error) {
    console.error('Error accepting match:', error);
    statusMessage.value = `Error: ${error.message}`;
    statusMessageClass.value = 'bg-red-900 text-red-100';
  }
};

// User rejects the match
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

// Set quick feedback reason
const setQuickFeedback = (reason) => {
  quickFeedback.value = reason;
  userCorrection.value.reason = reason;
};

// Select a parent color as the correction
const selectParentColor = (color) => {
  userCorrection.value = {
    hex: randomColor.value,
    parentHex: color.hex,
    parentName: color.name,
    reason: quickFeedback.value || 'wrong-match'
  };
};

// Submit user feedback
const submitFeedback = async () => {
  if (!isValid.value) return;
  
  try {
    console.log('📝 User provided feedback correction:', {
      originalColor: randomColor.value, 
      originalMatch: bestMatch.value.name,
      correction: userCorrection.value.parentName
    });
    
    // Save the user preference for this color
    saveMatchPreference(randomColor.value, userCorrection.value.parentHex);
    
    // Create feedback data
    const feedbackData = {
      originalColor: randomColor.value,
      originalMatch: bestMatch.value,
      correction: userCorrection.value,
      quickFeedback: quickFeedback.value,
      colorInfo: colorInfo.value
    };
    
    // Try to submit to API but don't block on failure
    try {
      fetch('/.netlify/functions/feedback/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData)
      }).catch(e => console.log('API feedback submission failed, but continuing:', e));
      
      // Emit the feedback event regardless
      emit('feedback-submitted', feedbackData);
    } catch (e) {
      console.log('API feedback error handled:', e);
    }
    
    // Add as a training example for ML
    if (userCorrection.value.parentHex) {
      // Find parent color index
      const correctParentIndex = props.parentColors.findIndex(
        c => c.hex === userCorrection.value.parentHex
      );
      
      if (correctParentIndex >= 0) {
        console.log('Adding correction training example:', {
          color: randomColor.value,
          originalMatch: bestMatch.value.name,
          correctParentName: props.parentColors[correctParentIndex].name
        });
        
        try {
          // Create color object
          const targetColor = createColorObject(randomColor.value);
          
          // Add training example if color service is available
          if (colorMatcherService && targetColor) {
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
        } catch (e) {
          console.log('Training example addition error handled:', e);
        }
      }
    }
    
    // Update score and streak
    score.value += 5;
    streak.value = 0; // Reset streak on correction
    trainingCount.value++;
    
    // Show success stage
    currentStage.value = 'success';
  } catch (error) {
    console.error('Error submitting feedback:', error);
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
    // Load saved preferences
    loadSavedPreferences();
    currentStage.value = 'color';
    generateNewColor();
  }
});

// Initialize if visible on mount
onMounted(() => {
  // Load saved preferences
  loadSavedPreferences();
  
  if (props.isVisible) {
    generateNewColor();
  }
});
</script> 