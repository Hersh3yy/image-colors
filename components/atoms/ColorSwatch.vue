<template>
  <div 
    class="rounded border cursor-pointer hover:shadow-md transition relative group" 
    :class="sizeClasses"
    :style="{ backgroundColor: color }" 
    @click="copyToClipboard"
    :title="`Click to copy: ${color}`"
  >
    <!-- Copy icon on hover -->
    <div class="absolute z-20 -bottom-1 -right-1 transform scale-0 group-hover:scale-100 transition-transform">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
      </svg>
    </div>
    
    <!-- Optional label overlay -->
    <div v-if="showLabel" class="absolute inset-0 flex items-center justify-center">
      <span class="text-xs font-medium" :class="labelClass">{{ label }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  /**
   * The hex color value
   */
  color: {
    type: String,
    required: true
  },
  /**
   * Size variant: 'sm', 'md', 'lg', 'xl'
   */
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg', 'xl'].includes(value)
  },
  /**
   * Whether to show a label overlay
   */
  showLabel: {
    type: Boolean,
    default: false
  },
  /**
   * Label text to display
   */
  label: {
    type: String,
    default: ''
  },
  /**
   * CSS class for the label
   */
  labelClass: {
    type: String,
    default: 'text-white'
  }
});

const emit = defineEmits(['copy']);

/**
 * Size classes based on prop
 */
const sizeClasses = computed(() => {
  const classes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };
  return classes[props.size] || classes.md;
});

/**
 * Copy color to clipboard
 */
const copyToClipboard = () => {
  navigator.clipboard.writeText(props.color)
    .then(() => {
      emit('copy', props.color);
    })
    .catch(err => {
      console.error('Failed to copy: ', err);
    });
};
</script>
