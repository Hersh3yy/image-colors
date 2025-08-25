<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="buttonClasses"
    @click="$emit('click', $event)"
  >
    <BaseIcon v-if="icon && iconPosition === 'left'" :name="icon" :size="iconSize" />
    {{ text }}
    <BaseIcon v-if="icon && iconPosition === 'right'" :name="icon" :size="iconSize" />
  </button>
</template>

<script setup>
import { computed } from 'vue';
import BaseIcon from './BaseIcon.vue';

const props = defineProps({
  /**
   * Button variant/style
   */
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => [
      'primary', 'secondary', 'success', 'danger', 'warning', 'info', 
      'ghost', 'outline', 'text'
    ].includes(value)
  },
  
  /**
   * Button size
   */
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  
  /**
   * Button type attribute
   */
  type: {
    type: String,
    default: 'button',
    validator: (value) => ['button', 'submit', 'reset'].includes(value)
  },
  
  /**
   * Whether button is disabled
   */
  disabled: {
    type: Boolean,
    default: false
  },
  
  /**
   * Whether button takes full width
   */
  fullWidth: {
    type: Boolean,
    default: false
  },
  
  /**
   * Icon name (optional)
   */
  icon: {
    type: String,
    default: null
  },
  
  /**
   * Icon position
   */
  iconPosition: {
    type: String,
    default: 'left',
    validator: (value) => ['left', 'right'].includes(value)
  },
  
  /**
   * Icon size
   */
  iconSize: {
    type: String,
    default: 'sm'
  },
  
  /**
   * Loading state
   */
  loading: {
    type: Boolean,
    default: false
  },
  
  /**
   * Button text content
   */
  text: {
    type: String,
    required: true
  }
});

defineEmits(['click']);

const buttonClasses = computed(() => {
  const classes = [
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'rounded',
    'transition-colors',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed'
  ];
  
  // Size classes
  switch (props.size) {
    case 'xs':
      classes.push('px-2', 'py-1', 'text-xs', 'gap-1');
      break;
    case 'sm':
      classes.push('px-3', 'py-1', 'text-sm', 'gap-1');
      break;
    case 'md':
      classes.push('px-4', 'py-2', 'text-sm', 'gap-2');
      break;
    case 'lg':
      classes.push('px-6', 'py-3', 'text-base', 'gap-2');
      break;
    case 'xl':
      classes.push('px-8', 'py-4', 'text-lg', 'gap-3');
      break;
  }
  
  // Variant classes
  switch (props.variant) {
    case 'primary':
      classes.push(
        'bg-blue-500', 'text-white', 'hover:bg-blue-600', 
        'focus:ring-blue-500', 'active:bg-blue-700'
      );
      break;
    case 'secondary':
      classes.push(
        'bg-gray-500', 'text-white', 'hover:bg-gray-600', 
        'focus:ring-gray-500', 'active:bg-gray-700'
      );
      break;
    case 'success':
      classes.push(
        'bg-green-500', 'text-white', 'hover:bg-green-600', 
        'focus:ring-green-500', 'active:bg-green-700'
      );
      break;
    case 'danger':
      classes.push(
        'bg-red-500', 'text-white', 'hover:bg-red-600', 
        'focus:ring-red-500', 'active:bg-red-700'
      );
      break;
    case 'warning':
      classes.push(
        'bg-yellow-500', 'text-white', 'hover:bg-yellow-600', 
        'focus:ring-yellow-500', 'active:bg-yellow-700'
      );
      break;
    case 'info':
      classes.push(
        'bg-blue-600', 'text-white', 'hover:bg-blue-700', 
        'focus:ring-blue-600', 'active:bg-blue-800'
      );
      break;
    case 'ghost':
      classes.push(
        'bg-transparent', 'text-gray-600', 'hover:bg-gray-100', 
        'focus:ring-gray-500', 'active:bg-gray-200'
      );
      break;
    case 'outline':
      classes.push(
        'bg-transparent', 'border', 'border-gray-300', 'text-gray-700', 
        'hover:bg-gray-50', 'focus:ring-gray-500', 'active:bg-gray-100'
      );
      break;
    case 'text':
      classes.push(
        'bg-transparent', 'text-blue-600', 'hover:text-blue-700', 
        'focus:ring-blue-500', 'active:text-blue-800'
      );
      break;
  }
  
  // Full width
  if (props.fullWidth) {
    classes.push('w-full');
  }
  
  return classes;
});
</script>
