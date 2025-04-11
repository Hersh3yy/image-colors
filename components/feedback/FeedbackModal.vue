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
      
      <!-- Alternative Matches Section using the new component -->
      <AlternativeMatches 
        :alternative-matches="alternativeMatches" 
        :selected-match="bestSelectedMatch"
        :title="'Alternative Matches'"
        :default-visible="true"
        @select-match="useAlternativeMatch"
      />
      
      <!-- Multi-method Parent Color Suggestions -->
      <div class="mb-6 bg-gray-700 p-4 rounded-lg">
        <div class="flex justify-between items-center mb-2">
          <h3 class="font-medium">Select a Better Match</h3>
          <div class="flex gap-2">
            <select v-model="selectedMatchMethod" class="bg-gray-800 text-sm rounded px-2 py-1 border border-gray-600">
              <option value="deltaE">DeltaE (Standard)</option>
              <option value="lab">LAB Distance</option>
              <option value="rgb">RGB Distance</option>
              <option value="hsl">HSL Distance</option>
            </select>
            <button 
              @click="showParentSuggestions = !showParentSuggestions" 
              class="text-sm text-blue-300 hover:underline"
            >
              {{ showParentSuggestions ? 'Hide Suggestions' : 'Show Suggestions' }}
            </button>
          </div>
        </div>
        
        <p class="text-sm mb-3 text-gray-300">Alternative matches using {{ getMethodName(selectedMatchMethod) }}</p>
        
        <div v-if="showParentSuggestions">
          <!-- Color suggestions by selected method -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div 
              v-for="color in currentMethodMatches.slice(0, 12)" 
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

        <!-- Method comparison display -->
        <div class="mt-4">
          <div class="flex justify-between items-center mb-2">
            <h4 class="text-sm font-medium text-gray-300">Matches by Method</h4>
            <button 
              @click="showMethodComparison = !showMethodComparison" 
              class="text-xs text-blue-300 hover:underline"
            >
              {{ showMethodComparison ? 'Hide Comparison' : 'Show Comparison' }}
            </button>
          </div>
          
          <div v-if="showMethodComparison" class="mt-2 border border-gray-600 rounded-lg overflow-hidden">
            <div class="grid grid-cols-4 text-center">
              <div class="bg-gray-800 p-2 text-xs font-medium">DeltaE</div>
              <div class="bg-gray-800 p-2 text-xs font-medium">RGB</div>
              <div class="bg-gray-800 p-2 text-xs font-medium">HSL</div>
              <div class="bg-gray-800 p-2 text-xs font-medium">LAB</div>
            </div>
            
            <div class="grid grid-cols-4 text-center">
              <div class="p-2 flex flex-col items-center">
                <div class="w-10 h-10 rounded" :style="{ backgroundColor: getTopMatch('deltaE').hex }"></div>
                <p class="text-xs mt-1 truncate w-full">{{ getTopMatch('deltaE').name }}</p>
              </div>
              <div class="p-2 flex flex-col items-center">
                <div class="w-10 h-10 rounded" :style="{ backgroundColor: getTopMatch('rgb').hex }"></div>
                <p class="text-xs mt-1 truncate w-full">{{ getTopMatch('rgb').name }}</p>
              </div>
              <div class="p-2 flex flex-col items-center">
                <div class="w-10 h-10 rounded" :style="{ backgroundColor: getTopMatch('hsl').hex }"></div>
                <p class="text-xs mt-1 truncate w-full">{{ getTopMatch('hsl').name }}</p>
              </div>
              <div class="p-2 flex flex-col items-center">
                <div class="w-10 h-10 rounded" :style="{ backgroundColor: getTopMatch('lab').hex }"></div>
                <p class="text-xs mt-1 truncate w-full">{{ getTopMatch('lab').name }}</p>
              </div>
            </div>

            <!-- Consensus Match -->
            <div class="bg-gray-700 p-2">
              <div class="text-xs text-center mb-1 text-gray-300">Consensus Match (Used by most color spaces)</div>
              <div class="flex justify-center items-center gap-2">
                <div class="w-10 h-10 rounded" :style="{ backgroundColor: getConsensusMatch().hex }"></div>
                <p class="text-sm font-medium">{{ getConsensusMatch().name }}</p>
              </div>
            </div>
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
import { ref, computed, onMounted } from 'vue';
import chroma from 'chroma-js';
import { useColorUtils } from '../../composables/useColorUtils';
import { useColorMatcherService } from '@/composables/useColorMatcherService';
import AlternativeMatches from '@/components/AlternativeMatches.vue';
import { parentColors } from '../../data/colors';

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  match: {
    type: Object,
    default: () => null
  },
  parentColors: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['close', 'feedback-submitted', 'save-match-preference']);

// State
const showParentSuggestions = ref(true);
const showColorInfo = ref(false);
const quickFeedback = ref('');
const selectedMatchMethod = ref('deltaE'); // Track which color space is selected
const userCorrection = ref({
  parentHex: '',
  parentName: '',
  reason: '',
  notes: ''
});
const showMethodComparison = ref(false);
const bestSelectedMatch = ref(null); // Track currently selected alternative match

// Track saved user match preferences
const savedMatchPreferences = ref({});

// Color utilities
const { 
  getColorDescription,
  getConfidenceClass,
  getConfidenceDescription,
} = useColorUtils();

// Get color matcher service
const colorMatcherService = useColorMatcherService();

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
  if (!props.match || !props.match.parent) return null;
  
  try {
    // Calculate color info for both original and matched colors
    const originalColor = chroma(props.match.color);
    const systemColor = chroma(props.match.parent.hex);
    
    // Create structured color info
    return {
      original: {
        rgb: originalColor.rgb(),
        hsl: originalColor.hsl(),
        lab: originalColor.lab(),
        hex: props.match.color
      },
      system: {
        rgb: systemColor.rgb(),
        hsl: systemColor.hsl(),
        lab: systemColor.lab(),
        hex: props.match.parent.hex
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

// Calculate closest matches across different color spaces
const alternativeMatches = computed(() => {
  if (!props.match || !props.match.color || !props.parentColors) {
    return {
      deltaE: [],
      lab: [],
      rgb: [],
      hsl: []
    };
  }
  
  try {
    const targetColor = chroma(props.match.color);
    
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
        matches.deltaE.push({ ...parentColor, distance: deltaE });
        matches.lab.push({ ...parentColor, distance: labDistance });
        matches.rgb.push({ ...parentColor, distance: rgbDistance });
        matches.hsl.push({ ...parentColor, distance: hslDistance });
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
    console.error('Error finding alternative matches:', error);
    return {
      deltaE: [],
      lab: [],
      rgb: [],
      hsl: []
    };
  }
});

// Expose matches from the selected method
const currentMethodMatches = computed(() => {
  return alternativeMatches.value[selectedMatchMethod.value] || [];
});

const colorGroups = computed(() => {
  if (!props.parentColors || !props.match) return {};
  
  const groups = {
    'Reds & Pinks': [],
    'Oranges & Browns': [],
    'Yellows & Golds': [],
    'Greens': [],
    'Blues & Teals': [],
    'Purples & Violets': [],
    'Grayscale': []
  };
  
  try {
    // Calculate target color for distance sorting
    const targetChroma = chroma(props.match.color);
    
    // Process each color
    parentColors.forEach(color => {
      try {
        // Add distance to each color for sorting
        const distance = chroma.deltaE(targetChroma, chroma(color.hex));
        const colorWithDistance = { ...color, distance };
        
        // Get HSL components
        const [h, s, l] = chroma(color.hex).hsl();
        const hue = isNaN(h) ? 0 : h;
        const saturation = isNaN(s) ? 0 : s;
        
        // Categorize by family
        if (saturation < 0.15) {
          groups['Grayscale'].push(colorWithDistance);
        } else if (hue >= 330 || hue < 30) {
          groups['Reds & Pinks'].push(colorWithDistance);
        } else if (hue >= 30 && hue < 60) {
          groups['Oranges & Browns'].push(colorWithDistance);
        } else if (hue >= 60 && hue < 90) {
          groups['Yellows & Golds'].push(colorWithDistance);
        } else if (hue >= 90 && hue < 180) {
          groups['Greens'].push(colorWithDistance);
        } else if (hue >= 180 && hue < 270) {
          groups['Blues & Teals'].push(colorWithDistance);
        } else {
          groups['Purples & Violets'].push(colorWithDistance);
        }
      } catch (e) {
        console.error('Error processing color for grouping:', color, e);
      }
    });
    
    // Sort each group by distance to target color
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.distance - b.distance);
    });
    
    // Filter out empty groups
    const result = {};
    Object.entries(groups).forEach(([key, value]) => {
      if (value.length > 0) {
        result[key] = value;
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error grouping colors:', error);
    return {};
  }
});

const isValid = computed(() => {
  return quickFeedback.value || (userCorrection.value.parentHex && userCorrection.value.parentName);
});

// Get display name for the method
const getMethodName = (method) => {
  const names = {
    'deltaE': 'DeltaE (Standard)',
    'lab': 'LAB Distance',
    'rgb': 'RGB Distance',
    'hsl': 'HSL Distance'
  };
  return names[method] || method;
};

// Methods
const close = () => {
  emit('close');
  
  // Reset state
  setTimeout(() => {
    userCorrection.value = {
      parentName: '',
      parentHex: '',
      reason: '',
      notes: ''
    };
    quickFeedback.value = '';
    showColorInfo.value = false;
    showParentSuggestions.value = true;
  }, 300);
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

// Methods to get top matches for method comparison
const getTopMatch = (method) => {
  const matches = alternativeMatches.value[method] || [];
  if (matches.length > 0) {
    return matches[0];
  }
  return { name: 'None', hex: '#cccccc' };
};

// Get a consensus match (the color that appears most as top match across methods)
const getConsensusMatch = () => {
  // Get top matches from each method
  const topMatches = {
    deltaE: getTopMatch('deltaE'),
    rgb: getTopMatch('rgb'),
    hsl: getTopMatch('hsl'),
    lab: getTopMatch('lab')
  };
  
  // Count occurrences of each color hex
  const counts = {};
  Object.values(topMatches).forEach(match => {
    counts[match.hex] = (counts[match.hex] || 0) + 1;
  });
  
  // Find the most common match
  let mostCommonHex = '';
  let maxCount = 0;
  Object.entries(counts).forEach(([hex, count]) => {
    if (count > maxCount) {
      mostCommonHex = hex;
      maxCount = count;
    }
  });
  
  // Return the match with this hex
  const matchingColor = Object.values(topMatches).find(match => match.hex === mostCommonHex);
  return matchingColor || topMatches.deltaE; // Default to deltaE if no consensus
};

// Use an alternative match when selected from the AlternativeMatches component
const useAlternativeMatch = (match) => {
  if (match) {
    // Set as best selected match
    bestSelectedMatch.value = match;
    
    // Also update the userCorrection to use this match
    selectParentColor(match);
  }
};

const submitFeedback = async () => {
  if (!isValid.value) return;
  
  console.log('FeedbackModal submitting feedback for color:', props.match.color);
  console.log('Original parent:', props.match.parent);
  console.log('Correction:', userCorrection.value);
  
  const feedback = {
    originalColor: props.match.color,
    originalParent: props.match.parent,
    correction: userCorrection.value,
    quickFeedback: quickFeedback.value,
    colorInfo: colorInfo.value,
    // Add additional fields to help with UI updates
    updateUI: true,
    colorMatch: props.match, // Include the entire original match for updating
    timestamp: Date.now()
  };
  
  // Save the user preference for this color
  saveMatchPreference(props.match.color, userCorrection.value.parentHex);
  
  // Emit the feedback event with complete feedback data
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
      
      // Try to train and save the model - handle the case if trainModel doesn't exist
      try {
        setTimeout(async () => {
          // Check if trainModel exists before calling it
          if (typeof colorMatcherService.trainModel === 'function') {
            await colorMatcherService.trainModel();
            
            // Check if saveModelToServer exists before calling it
            if (typeof colorMatcherService.saveModelToServer === 'function') {
              await colorMatcherService.saveModelToServer();
            }
          } else {
            console.log('Training model skipped - trainModel function not available');
          }
        }, 100);
      } catch (error) {
        console.error('Error during model training:', error);
      }
    }
  }
  
  close();
};

// Initialize
onMounted(() => {
  // Load saved preferences
  loadSavedPreferences();
});
</script>

<style scoped>
/* Optional animations for smoother transitions */
.transition-all {
  transition: all 0.2s ease-in-out;
}
</style> 