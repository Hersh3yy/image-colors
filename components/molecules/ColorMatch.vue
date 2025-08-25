<template>
  <div class="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
    <!-- Original Color -->
    <div class="flex items-center gap-2">
      <ColorSwatch 
        :color="originalColor" 
        :size="swatchSize"
        @copy="$emit('copy', originalColor)"
      />
      <div class="text-sm text-gray-600">{{ originalColorLabel }}</div>
    </div>
    
    <!-- Arrow -->
    <BaseIcon name="chevron-right" size="sm" class="text-gray-400" />
    
    <!-- Matched Color -->
    <div class="flex items-center gap-2">
      <AtomsColorSwatch 
        :color="matchedColor" 
        :size="swatchSize"
        @copy="$emit('copy', matchedColor)"
      />
      <div class="text-sm font-medium">{{ matchedColorLabel }}</div>
    </div>
    
    <!-- Confidence Badge -->
    <AtomsStatusBadge 
      :variant="confidenceVariant" 
      size="sm"
      :text="`${confidence}%`"
      class="ml-auto"
    />
    
    <!-- Action Button -->
    <AtomsBaseButton
      v-if="showFeedbackButton"
      variant="outline"
      size="sm"
      icon="edit"
      text="Feedback"
      @click="$emit('feedback', colorData)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import ColorSwatch from '../atoms/ColorSwatch.vue';
import BaseIcon from '../atoms/BaseIcon.vue';
import StatusBadge from '../atoms/StatusBadge.vue';
import BaseButton from '../atoms/BaseButton.vue';

const props = defineProps({
  /**
   * Original color hex value
   */
  originalColor: {
    type: String,
    required: true
  },
  
  /**
   * Matched color hex value
   */
  matchedColor: {
    type: String,
    required: true
  },
  
  /**
   * Confidence percentage (0-100)
   */
  confidence: {
    type: Number,
    required: true,
    validator: (value) => value >= 0 && value <= 100
  },
  
  /**
   * Label for the original color
   */
  originalColorLabel: {
    type: String,
    default: 'Original'
  },
  
  /**
   * Label for the matched color
   */
  matchedColorLabel: {
    type: String,
    default: 'Match'
  },
  
  /**
   * Size of color swatches
   */
  swatchSize: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg', 'xl'].includes(value)
  },
  
  /**
   * Whether to show feedback button
   */
  showFeedbackButton: {
    type: Boolean,
    default: true
  },
  
  /**
   * Complete color data object for feedback
   */
  colorData: {
    type: Object,
    default: () => ({})
  }
});

defineEmits(['copy', 'feedback']);

/**
 * Get confidence badge variant based on confidence level
 */
const confidenceVariant = computed(() => {
  if (props.confidence >= 80) return 'success';
  if (props.confidence >= 60) return 'warning';
  return 'danger';
});
</script>
