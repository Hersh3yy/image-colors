<template>
  <div class="border rounded-lg p-3 shadow-sm hover:shadow transition">
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
      <AtomsColorSwatch 
        :color="color.parent.hex" 
        size="sm"
        @copy="$emit('copy', $event)"
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
      <AtomsColorSwatch 
        :color="color.pantone.hex" 
        size="sm"
        @copy="$emit('copy', $event)"
      />
      <div class="flex flex-col">
        <span class="text-xs">{{ color.pantone.code || 'N/A' }}</span>
      </div>
    </div>
    
            <!-- Action button -->
        <AtomsBaseButton 
          @click="$emit('feedback', color)" 
          variant="primary"
          size="sm"
          text="Improve Match"
          fullWidth
        />
  </div>
</template>

<script setup>
import { useColorUtils } from '@/composables/useColorUtils';

const props = defineProps({
  color: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['feedback', 'copy']);

// Import color utilities
const colorUtils = useColorUtils();
const getColorDescription = colorUtils.getColorDescription;

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
</script>
