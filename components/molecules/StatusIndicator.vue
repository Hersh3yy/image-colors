<template>
  <div :class="containerClasses">
    <!-- Icon or Loading Spinner -->
    <LoadingSpinner 
      v-if="status === 'loading'"
      :size="iconSize"
      :color="spinnerColor"
    />
    <BaseIcon 
      v-else-if="icon"
      :name="icon"
      :size="iconSize"
      :class="iconClasses"
    />
    
    <!-- Content -->
    <div class="flex-1">
      <!-- Title -->
      <div v-if="title" :class="titleClasses">{{ title }}</div>
      
      <!-- Message/Description -->
      <div v-if="message" :class="messageClasses">{{ message }}</div>
      
      <!-- Progress (if applicable) -->
      <div v-if="showProgress && progress !== null" class="mt-1">
        <div class="flex justify-between text-xs text-gray-500 mb-1">
          <span>{{ progressLabel }}</span>
          <span>{{ progress }}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            class="h-1.5 rounded-full transition-all duration-300"
            :class="progressBarClasses"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
      </div>
    </div>
    
    <!-- Action Button (optional) -->
    <BaseButton
      v-if="actionButton"
      :variant="actionButton.variant || 'outline'"
      :size="actionButton.size || 'sm'"
      :icon="actionButton.icon"
      @click="$emit('action', actionButton.id)"
    >
      {{ actionButton.label }}
    </BaseButton>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import BaseIcon from '../atoms/BaseIcon.vue';
import BaseButton from '../atoms/BaseButton.vue';
import LoadingSpinner from '../atoms/LoadingSpinner.vue';

const props = defineProps({
  /**
   * Status type
   */
  status: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'warning', 'info', 'loading'].includes(value)
  },
  
  /**
   * Status title
   */
  title: {
    type: String,
    default: null
  },
  
  /**
   * Status message
   */
  message: {
    type: String,
    default: null
  },
  
  /**
   * Custom icon name (overrides status icon)
   */
  icon: {
    type: String,
    default: null
  },
  
  /**
   * Progress percentage (0-100, null to hide)
   */
  progress: {
    type: Number,
    default: null,
    validator: (value) => value === null || (value >= 0 && value <= 100)
  },
  
  /**
   * Progress label
   */
  progressLabel: {
    type: String,
    default: 'Progress'
  },
  
  /**
   * Whether to show progress bar
   */
  showProgress: {
    type: Boolean,
    default: false
  },
  
  /**
   * Size variant
   */
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  
  /**
   * Action button configuration
   */
  actionButton: {
    type: Object,
    default: null
    // { id: string, label: string, variant?: string, size?: string, icon?: string }
  }
});

defineEmits(['action']);

const statusConfig = {
  success: { icon: 'check', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', progressColor: 'bg-green-500' },
  error: { icon: 'alert', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', progressColor: 'bg-red-500' },
  warning: { icon: 'alert', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', progressColor: 'bg-yellow-500' },
  info: { icon: 'info', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', progressColor: 'bg-blue-500' },
  loading: { icon: null, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', progressColor: 'bg-blue-500' }
};

const currentConfig = computed(() => statusConfig[props.status] || statusConfig.info);

const containerClasses = computed(() => {
  const classes = ['flex', 'items-start', 'border', 'rounded-lg'];
  
  // Size-based padding
  switch (props.size) {
    case 'sm':
      classes.push('p-3', 'gap-2');
      break;
    case 'md':
      classes.push('p-4', 'gap-3');
      break;
    case 'lg':
      classes.push('p-6', 'gap-4');
      break;
  }
  
  // Status colors
  classes.push(currentConfig.value.bgColor, currentConfig.value.borderColor);
  
  return classes;
});

const iconSize = computed(() => {
  return props.size === 'sm' ? 'md' : 'lg';
});

const iconClasses = computed(() => {
  return [currentConfig.value.color];
});

const spinnerColor = computed(() => {
  return props.status === 'loading' ? 'blue' : 'gray';
});

const titleClasses = computed(() => {
  const classes = ['font-medium'];
  
  switch (props.size) {
    case 'sm':
      classes.push('text-sm');
      break;
    case 'md':
      classes.push('text-base');
      break;
    case 'lg':
      classes.push('text-lg');
      break;
  }
  
  classes.push(currentConfig.value.color);
  
  return classes;
});

const messageClasses = computed(() => {
  const classes = ['text-gray-600'];
  
  switch (props.size) {
    case 'sm':
      classes.push('text-xs');
      break;
    case 'md':
      classes.push('text-sm');
      break;
    case 'lg':
      classes.push('text-base');
      break;
  }
  
  if (props.title) {
    classes.push('mt-1');
  }
  
  return classes;
});

const progressBarClasses = computed(() => {
  return [currentConfig.value.progressColor];
});

// Compute default icon
const computedIcon = computed(() => {
  return props.icon || currentConfig.value.icon;
});
</script>
