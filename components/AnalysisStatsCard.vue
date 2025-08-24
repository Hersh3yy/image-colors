<template>
  <div class="bg-gray-50 rounded-lg p-4 mt-4">
    <h4 class="font-medium text-gray-700 mb-3">Analysis Overview</h4>
    <div class="space-y-2 text-sm">
      <!-- Average Confidence -->
      <div class="flex justify-between items-center">
        <div class="flex items-center">
          <span class="text-gray-600">Average Delta (Δ):</span>
          <InfoTooltip width="lg">
            Average color distance (Delta) for all matches. Lower values indicate better matches.
          </InfoTooltip>
        </div>
        <span class="font-medium">{{ averageDistance }}</span>
      </div>
      
      <!-- Problematic Matches -->
      <div class="flex justify-between items-center">
        <div class="flex items-center">
          <span class="text-gray-600">Problematic Matches:</span>
          <InfoTooltip width="lg">
            Colors with high distance values (>20). These colors may need manual feedback.
          </InfoTooltip>
        </div>
        <span 
          class="font-medium" 
          :class="{ 'text-yellow-600': problematicMatchesCount > 0 }"
        >
          {{ problematicMatchesCount }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import InfoTooltip from './InfoTooltip.vue';

const props = defineProps({
  averageDistance: {
    type: String,
    required: true
  },
  problematicMatchesCount: {
    type: Number,
    default: 0
  }
});
</script>
