<template>
  <div 
    class="fixed bottom-4 right-4 z-50 transition-all duration-300 transform"
    :class="[
      'px-4 py-3 rounded-lg shadow-lg',
      toastClasses,
      { 'translate-y-0 opacity-100': visible, 'translate-y-2 opacity-0': !visible }
    ]"
  >
    <div class="flex items-center gap-2">
      <AtomsBaseIcon 
        v-if="icon"
        :name="icon" 
        size="sm"
        class="flex-shrink-0"
      />
      <span class="text-sm font-medium">{{ message }}</span>
      <AtomsBaseButton
        v-if="dismissible"
        variant="ghost"
        size="xs"
        icon="close"
        class="ml-2 p-1"
        @click="$emit('close')"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue';
// Components auto-imported by Nuxt

const props = defineProps({
  /**
   * Toast message text
   */
  message: {
    type: String,
    required: true
  },
  
  /**
   * Toast type/variant
   */
  type: {
    type: String,
    default: 'success',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  
  /**
   * Auto-dismiss duration in milliseconds (0 to disable)
   */
  duration: {
    type: Number,
    default: 3000
  },
  
  /**
   * Whether the toast can be manually dismissed
   */
  dismissible: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['close']);

// Local state
const visible = ref(false);

// Type configurations
const typeConfig = {
  success: {
    classes: 'bg-green-600 text-white',
    icon: 'check'
  },
  error: {
    classes: 'bg-red-600 text-white',
    icon: 'alert'
  },
  warning: {
    classes: 'bg-yellow-600 text-white',
    icon: 'alert'
  },
  info: {
    classes: 'bg-blue-600 text-white',
    icon: 'info'
  }
};

const toastClasses = computed(() => {
  return typeConfig[props.type]?.classes || typeConfig.success.classes;
});

const icon = computed(() => {
  return typeConfig[props.type]?.icon || typeConfig.success.icon;
});

// Auto-dismiss logic
let dismissTimer = null;

const startDismissTimer = () => {
  if (props.duration > 0) {
    dismissTimer = setTimeout(() => {
      emit('close');
    }, props.duration);
  }
};

const clearDismissTimer = () => {
  if (dismissTimer) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }
};

// Show toast with animation
onMounted(() => {
  // Small delay for enter animation
  setTimeout(() => {
    visible.value = true;
    startDismissTimer();
  }, 100);
});

// Restart timer when message changes
watch(() => props.message, () => {
  clearDismissTimer();
  startDismissTimer();
});

// Clean up timer
const cleanup = () => {
  clearDismissTimer();
};

// Cleanup on unmount
onUnmounted?.(() => {
  cleanup();
});
</script>
