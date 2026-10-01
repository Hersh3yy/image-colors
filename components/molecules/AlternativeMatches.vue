<!-- AlternativeMatches.vue - Reusable component to display alternative color matches across different methods -->
<template>
  <div class="bg-gray-700 p-4 rounded-lg">
    <div class="flex justify-between items-center mb-2">
      <h3 class="font-medium">{{ title }}</h3>
      <button 
        @click="toggleVisible" 
        class="text-sm text-blue-300 hover:underline"
      >
        {{ isVisible ? 'Hide Alternatives' : 'Show Alternatives' }}
      </button>
    </div>
    
    <div v-if="isVisible" class="space-y-4">
      <div v-for="(matches, method) in alternativeMatches" :key="method" class="bg-gray-800 p-3 rounded">
        <h4 class="text-sm font-medium mb-2">{{ getMethodName(method) }}</h4>
        <div class="grid grid-cols-4 gap-2">
          <div 
            v-for="(match, index) in matches.slice(0, 4)" 
            :key="index"
            class="flex flex-col items-center cursor-pointer" 
            @click="selectMatch(match)"
          >
            <div 
              class="w-12 h-12 rounded border border-gray-700 mb-1"
              :style="{ backgroundColor: match.hex }"
              :class="{'ring-2 ring-blue-500': isSelected(match)}"
            ></div>
            <p class="text-xs truncate w-full text-center">{{ match.name }}</p>
            <p class="text-xs opacity-75">{{ (match.distance || 0).toFixed(1) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  alternativeMatches: {
    type: Object,
    required: true
  },
  title: {
    type: String,
    default: 'Alternative Matches'
  },
  selectedMatch: {
    type: Object,
    default: null
  },
  defaultVisible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['select-match']);

// State
const isVisible = ref(props.defaultVisible);

// Toggle visibility
const toggleVisible = () => {
  isVisible.value = !isVisible.value;
};

// Get display name for method
const getMethodName = (method) => {
  const names = {
    'deltaE': 'DeltaE (Standard)',
    'lab': 'LAB Distance',
    'rgb': 'RGB Distance',
    'hsl': 'HSL Distance'
  };
  return names[method] || method;
};

// Check if a match is selected
const isSelected = (match) => {
  if (!props.selectedMatch) return false;
  return props.selectedMatch.hex === match.hex;
};

// Select a match
const selectMatch = (match) => {
  emit('select-match', match);
};
</script> 