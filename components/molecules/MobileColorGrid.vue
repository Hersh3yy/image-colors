<template>
  <div class="block md:hidden mb-6">
    <div class="flex items-center justify-between mb-4">
      <h4 class="font-medium text-gray-700">Color Palette</h4>
      <AtomsViewModeToggle v-model="viewMode" />
    </div>
    
    <!-- Color Grid -->
    <div v-if="viewMode === 'grid'" class="grid grid-cols-2 gap-3">
      <MoleculesColorCard 
        v-for="color in sortedColors" 
        :key="color.color" 
        :color="color"
        @feedback="$emit('feedback', $event)"
        @copy="handleCopy"
      />
    </div>
    
    <!-- Color List (Simplified for mobile) -->
    <div v-if="viewMode === 'list'" class="space-y-3">
      <MoleculesColorListItem 
        v-for="color in sortedColors" 
        :key="color.color" 
        :color="color"
        @feedback="$emit('feedback', $event)"
        @copy="handleCopy"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  colors: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['feedback', 'copy']);

// State
const viewMode = ref('grid'); // 'grid' or 'list'

/**
 * Sort colors by percentage for display
 */
const sortedColors = computed(() => {
  return [...props.colors].sort((a, b) => b.percentage - a.percentage);
});

/**
 * Handle copy event from ColorSwatch
 */
const handleCopy = (colorCode) => {
  emit('copy', colorCode);
};
</script>
