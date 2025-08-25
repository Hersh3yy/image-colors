<template>
  <div class="fixed inset-0 z-50">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-gray-500/75" @click="$emit('close')"></div>

    <!-- Modal content -->
    <div class="absolute inset-4 rounded-lg bg-white p-6 shadow-xl overflow-auto">
      <!-- Action buttons -->
      <div class="absolute right-6 top-6 flex gap-2 z-10">
        <AtomsBaseButton
          variant="success"
          size="sm"
          icon="download"
          @click="downloadScreenshot"
        >
          Download
        </AtomsBaseButton>
        <AtomsBaseButton
          variant="ghost"
          size="sm"
          icon="close"
          @click="$emit('close')"
        />
      </div>

      <!-- Screenshot content -->
      <div class="max-w-7xl mx-auto screenshot-modal-content">
        <!-- Header -->
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-800">{{ image.name }}</h2>
          <p class="text-gray-600 text-lg">Color Analysis Screenshot</p>
        </div>

        <!-- Content grid -->
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <!-- Left: Stacked Thumbnail and Color Groups -->
          <div class="lg:col-span-1 space-y-4">
            <!-- Original Image (Smaller) -->
            <img 
              :src="image.sourceImage" 
              :alt="image.name" 
              class="w-full h-32 object-contain rounded-lg border border-gray-100 shadow-sm" 
            />
            
            <!-- Analysis Stats (Compact) -->
            <div class="bg-gray-50 rounded-lg p-3 text-xs">
              <h4 class="font-medium text-gray-700 mb-2">Overview</h4>
              <div class="space-y-1">
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Avg Δ:</span>
                  <span class="font-medium">{{ averageDistance }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Issues:</span>
                  <span class="font-medium">{{ problematicMatchesCount }}</span>
                </div>
              </div>
            </div>

            <!-- Color Family Breakdown (Compact) -->
            <MoleculesColorFamilyCompact :colors="image.colors" />
          </div>

          <!-- Center: Dominant Chart (Now takes 4 columns) -->
          <div class="lg:col-span-4">
            <!-- Color Distribution Chart (Much Larger) -->
            <div class="h-[1000px] relative">
              <MoleculesGroupedColorsDoughnut v-if="chartData" :chartDataProp="chartData" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import html2canvas from "html2canvas";
import { groupColors, createGroupedChartData } from "@/services/colorUtils";
// Components auto-imported by Nuxt

const props = defineProps({
  /**
   * Image data object
   */
  image: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close', 'download']);

/**
 * Chart data for color distribution
 */
const chartData = computed(() => {
  const groupedColorsData = groupColors(props.image);
  return createGroupedChartData(groupedColorsData);
});

/**
 * Calculate average distance
 */
const averageDistance = computed(() => {
  if (!props.image.colors || !props.image.colors.length) return 'N/A';
  
  const totalDistance = props.image.colors.reduce((sum, color) => {
    return sum + (color.parent.distance || 0);
  }, 0);
  
  return (totalDistance / props.image.colors.length).toFixed(1) + ' Δ';
});

/**
 * Count problematic matches
 */
const problematicMatchesCount = computed(() => {
  return props.image.metadata?.problematicMatches?.length || 0;
});

/**
 * Download screenshot as PNG
 */
const downloadScreenshot = () => {
  const modalContent = document.querySelector('.screenshot-modal-content');
  if (modalContent) {
    html2canvas(modalContent, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: true,
      logging: false
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = `${props.image.name}-color-analysis.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      emit('download');
    }).catch(error => {
      console.error('Screenshot error:', error);
    });
  }
};
</script>
