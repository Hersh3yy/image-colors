<template>
  <div class="block md:hidden mb-6">
    <div class="flex items-center justify-between mb-4">
      <h4 class="font-medium text-gray-700">Color Palette</h4>
      <div class="flex gap-2">
        <button 
          @click="viewMode = 'grid'" 
          class="text-xs px-2 py-1 rounded"
          :class="viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200'"
        >
          Grid
        </button>
        <button 
          @click="viewMode = 'list'" 
          class="text-xs px-2 py-1 rounded"
          :class="viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200'"
        >
          List
        </button>
      </div>
    </div>
    
    <!-- Color Grid -->
    <div v-if="viewMode === 'grid'" class="grid grid-cols-2 gap-3">
      <div v-for="color in sortedColors" :key="color.color" class="border rounded-lg p-3 shadow-sm hover:shadow transition">
        <!-- Color swatch -->
        <div class="relative">
          <div class="h-20 rounded mb-2" :style="{ backgroundColor: color.color }"></div>
          <span class="absolute top-1 right-1 text-xs bg-black bg-opacity-50 text-white px-1 rounded">
            {{ color.percentage.toFixed(1) }}%
          </span>
          <span class="absolute bottom-1 left-1 text-xs bg-black bg-opacity-50 text-white px-1 rounded max-w-[80%] truncate">
            {{ getColorDescription(color.color) }}
          </span>
        </div>
        
        <!-- Parent match - highlighted as PRIMARY match -->
        <div class="flex items-center gap-1 mt-2 pb-2 border-b border-gray-100">
          <ColorSwatch 
            :color="color.parent.hex" 
            size="sm"
            @copy="handleCopy"
          />
          <div class="flex flex-col flex-1">
            <span class="text-xs font-medium">{{ color.parent.name }}</span>
            <div class="flex items-center mt-1">
              <span class="text-xs" :class="getDistanceClass(color.parent.distance)">
                {{ color.parent.distance?.toFixed(1) || 'N/A' }} Δ
              </span>
            </div>
          </div>
        </div>
        
        <!-- Pantone match - secondary -->
        <div class="flex items-center gap-1 mt-2">
          <ColorSwatch 
            :color="color.pantone.hex" 
            size="sm"
            @copy="handleCopy"
          />
          <div class="flex flex-col">
            <span class="text-xs">{{ color.pantone.code || 'N/A' }}</span>
          </div>
        </div>
        
        <!-- Action button -->
        <button 
          @click="$emit('feedback', color)" 
          class="mt-2 w-full text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Improve Match
        </button>
      </div>
    </div>
    
    <!-- Color List (Simplified for mobile) -->
    <div v-if="viewMode === 'list'" class="space-y-3">
      <div v-for="color in sortedColors" :key="color.color" class="border rounded-lg p-3 flex items-center gap-3">
        <!-- Color swatch -->
        <ColorSwatch 
          :color="color.color" 
          size="lg"
          @copy="handleCopy"
        />
        
        <!-- Color info -->
        <div class="flex-1">
          <div class="flex items-center justify-between">
            <span class="text-xs">{{ getColorDescription(color.color) }}</span>
            <span class="text-xs">{{ color.percentage.toFixed(1) }}%</span>
          </div>
          
          <div class="flex items-center justify-between text-xs mt-1">
            <span class="font-medium">{{ color.parent.name }}</span>
            <span class="text-xs" :class="getDistanceClass(color.parent.distance)">
              {{ color.parent.distance?.toFixed(1) || 'N/A' }} Δ
            </span>
          </div>
        </div>
        
        <!-- Action button -->
        <button 
          @click="$emit('feedback', color)" 
          class="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Improve
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import ColorSwatch from './ColorSwatch.vue';
import { useColorUtils } from '@/composables/useColorUtils';

const props = defineProps({
  colors: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['feedback', 'copy']);

// State
const viewMode = ref('grid'); // 'grid' or 'list'

// Import color utilities
const colorUtils = useColorUtils();
const getColorDescription = colorUtils.getColorDescription;

/**
 * Sort colors by percentage for display
 */
const sortedColors = computed(() => {
  return [...props.colors].sort((a, b) => b.percentage - a.percentage);
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
 * Handle copy event from ColorSwatch
 */
const handleCopy = (colorCode) => {
  emit('copy', colorCode);
};
</script>
