<template>
  <span :class="badgeClasses">
    <AtomsBaseIcon v-if="icon" :name="icon" size="xs" class="mr-1" />
    {{ text }}
  </span>
</template>

<script setup>
import { computed } from 'vue';
import BaseIcon from './BaseIcon.vue';

const props = defineProps({
  /**
   * Badge variant
   */
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => [
      'primary', 'secondary', 'success', 'danger', 'warning', 'info', 'dark', 'light'
    ].includes(value)
  },
  
  /**
   * Badge size
   */
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg'].includes(value)
  },
  
  /**
   * Icon name (optional)
   */
  icon: {
    type: String,
    default: null
  },
  
  /**
   * Whether to show rounded pill style
   */
  pill: {
    type: Boolean,
    default: false
  },
  
  /**
   * Badge text content
   */
  text: {
    type: String,
    required: true
  }
});

const badgeClasses = computed(() => {
  const classes = [
    'inline-flex',
    'items-center',
    'font-medium',
    'text-center',
    'whitespace-nowrap'
  ];
  
  // Size classes
  switch (props.size) {
    case 'xs':
      classes.push('px-1.5', 'py-0.5', 'text-xs');
      break;
    case 'sm':
      classes.push('px-2', 'py-0.5', 'text-xs');
      break;
    case 'md':
      classes.push('px-2.5', 'py-1', 'text-sm');
      break;
    case 'lg':
      classes.push('px-3', 'py-1.5', 'text-base');
      break;
  }
  
  // Shape
  classes.push(props.pill ? 'rounded-full' : 'rounded');
  
  // Variant classes
  switch (props.variant) {
    case 'primary':
      classes.push('bg-blue-100', 'text-blue-800');
      break;
    case 'secondary':
      classes.push('bg-gray-100', 'text-gray-800');
      break;
    case 'success':
      classes.push('bg-green-100', 'text-green-800');
      break;
    case 'danger':
      classes.push('bg-red-100', 'text-red-800');
      break;
    case 'warning':
      classes.push('bg-yellow-100', 'text-yellow-800');
      break;
    case 'info':
      classes.push('bg-blue-100', 'text-blue-800');
      break;
    case 'dark':
      classes.push('bg-gray-800', 'text-white');
      break;
    case 'light':
      classes.push('bg-gray-50', 'text-gray-600');
      break;
  }
  
  return classes;
});
</script>
