<template>
  <div 
    class="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition"
    :class="{ 'scale-[0.97] opacity-80': isPaletteEmpty }"
  >
    <!-- Color Preview Header -->
    <div class="h-20 relative" :style="{ backgroundColor: color.color }">
      <!-- Percentage Indicator -->
      <div 
        class="absolute top-2 right-2 text-xs bg-white bg-opacity-80 px-2 py-1 rounded-full font-medium"
        :class="isPaletteEmpty ? 'bg-gray-200' : ''"
      >
        {{ color.percentage.toFixed(1) }}% of image
      </div>
      
      <!-- Selection Controls -->
      <div class="absolute bottom-2 left-2 right-2 flex justify-between items-center">
        <button 
          v-if="!readonly"
          @click="$emit('toggle', color)"
          class="w-7 h-7 flex items-center justify-center rounded-full shadow-sm"
          :class="isPaletteEmpty ? 'bg-white text-gray-400 border' : 'bg-blue-500 text-white'"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            class="h-4 w-4" 
            :class="isPaletteEmpty ? '' : 'text-white'"
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path v-if="!isPaletteEmpty" fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            <path v-else fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
        </button>
        
        <div 
          class="text-xs bg-black bg-opacity-40 backdrop-blur-sm text-white px-2 py-1 rounded-full"
          v-html="getColorDescription(color.color)"
        ></div>
      </div>
    </div>
    
    <!-- Color Details -->
    <div class="p-3">
      <!-- Original Color -->
      <div class="flex items-center justify-between mb-3">
        <div class="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded cursor-pointer" @click="copyToClipboard(color.color)">
          {{ color.color }}
          <span class="text-gray-400 text-xs ml-1">(click to copy)</span>
        </div>
      </div>
      
      <!-- Parent Match -->
      <div class="mb-3 p-2 rounded-md bg-blue-50">
        <div class="text-xs font-medium text-blue-700 mb-1">Parent Color Match:</div>
        <div class="flex items-center gap-2">
          <div 
            class="w-5 h-5 rounded-full border shadow-sm cursor-pointer" 
            :style="{ backgroundColor: color.parent.hex }" 
            @click="copyToClipboard(color.parent.hex)"
          ></div>
          <div class="flex-grow">
            <div class="text-sm font-medium truncate">{{ color.parent.name || 'N/A' }}</div>
            <div class="flex items-center mt-0.5">
              <span class="text-xs" :class="getDistanceClass(color.parent.distance)">
                {{ color.parent.distance.toFixed(1) }} Δ
              </span>
              <span class="ml-1 text-xs text-gray-500">({{ getMatchDescription(color.parent.distance) }})</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Pantone Match -->
      <div class="mb-3 p-2 rounded-md bg-gray-50">
        <div class="text-xs font-medium text-gray-700 mb-1">Pantone Match:</div>
        <div class="flex items-center gap-2">
          <div 
            class="w-5 h-5 rounded-full border shadow-sm cursor-pointer" 
            :style="{ backgroundColor: color.pantone.hex }" 
            @click="copyToClipboard(color.pantone.hex)"
          ></div>
          <div class="flex-grow">
            <div class="text-sm font-medium truncate">{{ color.pantone.name || 'N/A' }}</div>
            <div class="text-xs text-gray-600 font-mono">{{ color.pantone.code || 'N/A' }}</div>
          </div>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-1">
          <svg v-if="isGrayscale(color.color)" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" />
          </svg>
          <span v-if="isGrayscale(color.color)" class="text-xs text-gray-500">Grayscale</span>
        </div>
        
        <button 
          v-if="!readonly"
          @click="$emit('feedback', color)"
          class="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Improve Match
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import chroma from 'chroma-js';
import { useColorUtils } from '@/composables/useColorUtils';

const props = defineProps({
  color: {
    type: Object,
    required: true
  },
  selectedColors: {
    type: Array,
    default: () => []
  },
  readonly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['toggle', 'feedback', 'copy']);

// Import color utilities
const { getColorDescription } = useColorUtils();

// Check if color is in palette
const isPaletteEmpty = computed(() => {
  if (!props.selectedColors) return true;
  return !props.selectedColors.some(c => c.color === props.color.color);
});

/**
 * Get styling class based on distance value
 * Lower is better
 */
const getDistanceClass = (distance) => {
  if (!distance && distance !== 0) return 'text-gray-400';
  if (distance < 2) return 'text-green-600 font-medium';
  if (distance < 5) return 'text-green-500';
  if (distance < 10) return 'text-yellow-600';
  if (distance < 20) return 'text-orange-500';
  return 'text-red-500';
};

/**
 * Get human-readable description of match quality
 */
const getMatchDescription = (distance) => {
  if (!distance && distance !== 0) return 'Unknown';
  if (distance < 2) return 'Excellent';
  if (distance < 5) return 'Good';
  if (distance < 10) return 'Fair';
  if (distance < 20) return 'Poor';
  return 'Very poor';
};

/**
 * Check if a color is grayscale (very low saturation)
 */
const isGrayscale = (hexColor) => {
  try {
    const color = chroma(hexColor);
    const [h, s, l] = color.hsl();
    // If saturation is very low, it's effectively grayscale
    return isNaN(s) || s < 0.08;
  } catch (e) {
    return false;
  }
};

/**
 * Copy a color code to clipboard
 */
const copyToClipboard = (colorCode) => {
  navigator.clipboard.writeText(colorCode)
    .then(() => {
      emit('copy', colorCode);
    })
    .catch(err => {
      console.error('Failed to copy: ', err);
    });
};
</script> 