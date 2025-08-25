<template>
  <div class="border rounded-lg p-3 flex items-center gap-3">
    <!-- Color swatch -->
    <AtomsColorSwatch 
      :color="color.color" 
      size="lg"
      @copy="$emit('copy', $event)"
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
        <AtomsBaseButton 
          @click="$emit('feedback', color)" 
          variant="primary"
          size="sm"
          text="Improve"
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
