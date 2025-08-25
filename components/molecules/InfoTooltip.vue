<template>
  <div class="relative group">
    <AtomsBaseIcon 
      name="question"
      size="sm"
      class="text-gray-400 cursor-help"
    />
    <div 
      class="absolute bottom-full right-0 transform -translate-y-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 z-10"
      :class="{
        'w-64': width === 'lg',
        'w-80': width === 'xl',
        'w-48': width === 'sm',
        'w-64': !width || width === 'md'
      }"
    >
      {{ content }}
    </div>
  </div>
</template>

<script setup>
// Components auto-imported by Nuxt

defineProps({
  /**
   * Tooltip content text
   */
  content: {
    type: String,
    required: true
  },
  /**
   * Tooltip width: 'sm', 'md', 'lg', 'xl'
   */
  width: {
    type: String,
    default: 'md'
  }
});
</script>
