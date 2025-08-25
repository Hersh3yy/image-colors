<template>
  <div :class="containerClasses">
    <div :class="spinnerClasses"></div>
    <span v-if="text" :class="textClasses">{{ text }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  /**
   * Spinner size
   */
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  
  /**
   * Spinner color
   */
  color: {
    type: String,
    default: 'blue',
    validator: (value) => ['blue', 'green', 'red', 'yellow', 'purple', 'gray', 'white'].includes(value)
  },
  
  /**
   * Loading text (optional)
   */
  text: {
    type: String,
    default: null
  },
  
  /**
   * Whether to center the spinner
   */
  centered: {
    type: Boolean,
    default: false
  }
});

const containerClasses = computed(() => {
  const classes = ['flex', 'items-center'];
  
  if (props.centered) {
    classes.push('justify-center');
  }
  
  if (props.text) {
    classes.push('gap-2');
  }
  
  return classes;
});

const spinnerClasses = computed(() => {
  const classes = ['border-4', 'border-t-transparent', 'rounded-full', 'animate-spin'];
  
  // Size classes
  switch (props.size) {
    case 'xs':
      classes.push('w-4', 'h-4');
      break;
    case 'sm':
      classes.push('w-6', 'h-6');
      break;
    case 'md':
      classes.push('w-8', 'h-8');
      break;
    case 'lg':
      classes.push('w-10', 'h-10');
      break;
    case 'xl':
      classes.push('w-12', 'h-12');
      break;
  }
  
  // Color classes
  switch (props.color) {
    case 'blue':
      classes.push('border-blue-500');
      break;
    case 'green':
      classes.push('border-green-500');
      break;
    case 'red':
      classes.push('border-red-500');
      break;
    case 'yellow':
      classes.push('border-yellow-500');
      break;
    case 'purple':
      classes.push('border-purple-500');
      break;
    case 'gray':
      classes.push('border-gray-500');
      break;
    case 'white':
      classes.push('border-white');
      break;
  }
  
  return classes;
});

const textClasses = computed(() => {
  const classes = ['text-gray-600'];
  
  // Size-appropriate text
  switch (props.size) {
    case 'xs':
    case 'sm':
      classes.push('text-sm');
      break;
    case 'md':
      classes.push('text-base');
      break;
    case 'lg':
    case 'xl':
      classes.push('text-lg');
      break;
  }
  
  return classes;
});
</script>
