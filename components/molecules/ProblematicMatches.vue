<template>
  <div v-if="problematicMatches?.length" class="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
    <div class="flex items-center justify-between mb-2">
      <h4 class="font-medium text-yellow-800">Colors Needing Attention</h4>
      <MoleculesInfoTooltip 
        width="lg"
        content="These colors have high distance values. Your feedback would be especially valuable for improving the matching system."
      />
    </div>
    
    <ul class="space-y-2">
      <li v-for="match in problematicMatches" :key="match.color" class="text-sm text-yellow-700 bg-yellow-100 rounded-lg p-2">
        <div class="flex flex-wrap items-center gap-2">
                  <AtomsColorSwatch 
          :color="match.color" 
          size="md"
          @copy="handleCopy"
        />
          <div>
            <span class="font-medium">{{ getColorDescription(match.color) }}</span>
            <span class="ml-2 text-yellow-600 text-xs">
              Distance: {{ match.parent.distance?.toFixed(1) }} Δ
            </span>
          </div>
          <AtomsBaseButton 
            @click="$emit('feedback', match)"
            variant="primary"
            size="sm"
            text="Improve Match"
            title="Provide feedback to improve this match"
          />
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
// Components auto-imported by Nuxt
// Components auto-imported by Nuxt
import { useColorUtils } from '@/composables/useColorUtils';

const props = defineProps({
  problematicMatches: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['feedback', 'copy']);

// Import color utilities
const colorUtils = useColorUtils();
const getColorDescription = colorUtils.getColorDescription;

/**
 * Handle copy event from ColorSwatch
 */
const handleCopy = (colorCode) => {
  emit('copy', colorCode);
};
</script>
