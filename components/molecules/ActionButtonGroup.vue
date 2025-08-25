<template>
  <div :class="containerClasses">
    <AtomsBaseButton
      v-for="action in actions"
      :key="action.id"
      :variant="action.variant || 'primary'"
      :size="action.size || size"
      :disabled="action.disabled"
      :loading="action.loading"
      :icon="action.icon"
      :icon-position="action.iconPosition"
      @click="$emit('action', action.id, action)"
    >
      {{ action.label }}
    </AtomsBaseButton>
  </div>
</template>

<script setup>
import { computed } from 'vue';
// Components auto-imported by Nuxt

const props = defineProps({
  /**
   * Array of action objects
   * Each action should have: id, label, variant?, size?, disabled?, loading?, icon?, iconPosition?
   */
  actions: {
    type: Array,
    required: true,
    validator: (actions) => {
      return actions.every(action => 
        action.id && action.label && typeof action.id === 'string'
      );
    }
  },
  
  /**
   * Default size for all buttons
   */
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  
  /**
   * Layout direction
   */
  direction: {
    type: String,
    default: 'horizontal',
    validator: (value) => ['horizontal', 'vertical'].includes(value)
  },
  
  /**
   * Gap between buttons
   */
  gap: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  
  /**
   * Whether buttons should take full width
   */
  fullWidth: {
    type: Boolean,
    default: false
  },
  
  /**
   * Justify content (for horizontal layout)
   */
  justify: {
    type: String,
    default: 'start',
    validator: (value) => ['start', 'center', 'end', 'between', 'around', 'evenly'].includes(value)
  }
});

defineEmits(['action']);

const containerClasses = computed(() => {
  const classes = ['flex'];
  
  // Direction
  if (props.direction === 'vertical') {
    classes.push('flex-col');
  } else {
    classes.push('flex-row');
  }
  
  // Gap
  const gapMap = {
    xs: props.direction === 'vertical' ? 'space-y-1' : 'space-x-1',
    sm: props.direction === 'vertical' ? 'space-y-2' : 'space-x-2',
    md: props.direction === 'vertical' ? 'space-y-3' : 'space-x-3',
    lg: props.direction === 'vertical' ? 'space-y-4' : 'space-x-4',
    xl: props.direction === 'vertical' ? 'space-y-6' : 'space-x-6'
  };
  classes.push(gapMap[props.gap]);
  
  // Justify content (horizontal only)
  if (props.direction === 'horizontal') {
    const justifyMap = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly'
    };
    classes.push(justifyMap[props.justify]);
  }
  
  // Full width
  if (props.fullWidth) {
    classes.push('w-full');
  }
  
  // Responsive wrapper for mobile
  if (props.direction === 'horizontal') {
    classes.push('flex-wrap');
  }
  
  return classes;
});
</script>
