<template>
  <div class="w-full lg:w-1/3">
    <!-- Image with Zoom -->
    <div class="relative">
      <img 
        :src="image.sourceImage" 
        :alt="image.name" 
        class="w-full h-64 object-contain rounded-lg mb-4 border border-gray-100 shadow-sm cursor-zoom-in" 
        @click="showZoomed = true"
      />
      
      <!-- Zoomed Image Modal -->
      <div 
        v-if="showZoomed" 
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" 
        @click="showZoomed = false"
      >
        <img 
          :src="image.sourceImage" 
          :alt="`Zoomed view of ${image.name}`" 
          class="max-w-[90vw] max-h-[90vh] object-contain" 
        />
        <AtomsBaseButton
          variant="ghost"
          size="sm"
          icon="close"
          class="absolute top-4 right-4 bg-white rounded-full"
          @click.stop="showZoomed = false"
        />
      </div>
    </div>
    
    <!-- Color Distribution Chart -->
    <div class="h-[29rem] mb-4">
      <MoleculesGroupedColorsDoughnut 
        v-if="chartData" 
        :chartDataProp="chartData" 
      />
    </div>
    
    <!-- Image Info and Controls -->
    <div class="space-y-2">
      <!-- Image Title and Actions -->
      <div class="flex flex-wrap justify-between items-center gap-2">
        <h3 class="text-lg font-semibold">{{ image.name }}</h3>
        
        <MoleculesActionButtonGroup
          :actions="imageActions"
          direction="horizontal"
          gap="sm"
          @action="handleAction"
        />
      </div>

      <!-- Analysis Stats -->
      <MoleculesAnalysisStatsCard 
        :averageDistance="averageDistance"
        :problematicMatchesCount="problematicMatchesCount"
      />

      <!-- Analysis Settings -->
      <MoleculesAnalysisSettingsCard 
        :analysisSettings="image.analysisSettings"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { groupColors, createGroupedChartData } from "@/services/colorUtils";
// Components auto-imported by Nuxt

const props = defineProps({
  /**
   * Image data object
   */
  image: {
    type: Object,
    required: true,
    validator: (obj) => obj.sourceImage && obj.name && obj.colors
  }
});

const emit = defineEmits(['delete', 'reanalyze', 'screenshot']);

// Local state
const showZoomed = ref(false);

/**
 * Chart data for color distribution
 */
const chartData = computed(() => {
  const groupedColorsData = groupColors(props.image);
  return createGroupedChartData(groupedColorsData);
});

/**
 * Calculate average distance across all colors
 */
const averageDistance = computed(() => {
  if (!props.image.colors || !props.image.colors.length) return 'N/A';
  
  const totalDistance = props.image.colors.reduce((sum, color) => {
    return sum + (color.parent.distance || 0);
  }, 0);
  
  return (totalDistance / props.image.colors.length).toFixed(1) + ' Δ';
});

/**
 * Count of problematic matches
 */
const problematicMatchesCount = computed(() => {
  return props.image.metadata?.problematicMatches?.length || 0;
});

/**
 * Action buttons configuration
 */
const imageActions = computed(() => [
  {
    id: 'screenshot',
    label: 'Screenshot',
    variant: 'success',
    icon: 'camera'
  },
  {
    id: 'delete',
    label: 'Delete',
    variant: 'danger',
    icon: 'delete'
  },
  {
    id: 'reanalyze',
    label: 'Reanalyze',
    variant: 'primary',
    icon: 'refresh'
  }
]);

/**
 * Handle action button clicks
 */
const handleAction = (actionId) => {
  switch (actionId) {
    case 'screenshot':
      emit('screenshot');
      break;
    case 'delete':
      emit('delete');
      break;
    case 'reanalyze':
      emit('reanalyze', props.image);
      break;
  }
};
</script>
