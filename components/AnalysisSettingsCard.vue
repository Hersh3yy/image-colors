<template>
  <div class="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
    <div class="flex justify-between items-center mb-2">
      <h4 class="font-medium text-gray-700">Analysis Settings</h4>
      <InfoTooltip width="lg">
        These settings determine how colors are analyzed and matched. Different settings may produce different results.
      </InfoTooltip>
    </div>
    <div class="space-y-1 text-gray-600">
      <div class="flex justify-between">
        <span>Color Space:</span>
        <span class="font-medium">{{ analysisSettings?.colorSpace || 'LAB' }}</span>
      </div>
      <div class="flex justify-between">
        <span>Distance Method:</span>
        <span class="font-medium">{{ analysisSettings?.distanceMethod || 'DELTA_E' }}</span>
      </div>
      <div class="flex justify-between">
        <span>Sample Size:</span>
        <span class="font-medium">{{ analysisSettings?.sampleSize?.toLocaleString() || '10000' }} pixels</span>
      </div>
      <div class="flex justify-between">
        <span>Color Clusters:</span>
        <span class="font-medium">{{ analysisSettings?.k || '13' }}</span>
      </div>
      <div class="flex justify-between">
        <span>Confidence Threshold:</span>
        <span class="font-medium">{{ analysisSettings?.confidenceThreshold || '20' }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import InfoTooltip from './InfoTooltip.vue';

const props = defineProps({
  analysisSettings: {
    type: Object,
    default: () => ({})
  }
});
</script>
