<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div @click="isCollapsed = !isCollapsed" class="flex justify-between items-center cursor-pointer">
      <div class="flex items-center gap-3">
        <h2 class="text-lg font-semibold">Color Analysis</h2>
        <span class="text-sm text-gray-500">
          ({{ images.length }} {{ images.length === 1 ? "image" : "images" }})
        </span>
        
        <!-- Info tooltip -->
        <div class="relative group cursor-help" @click.stop>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
          </svg>
          <div class="absolute z-20 top-0 left-6 transform opacity-0 group-hover:opacity-100 bg-gray-800 text-white text-xs rounded p-2 w-64 transition-opacity">
            <p><b>Overall Color Analysis</b></p>
            <p class="mt-1">This section shows combined color data from all selected images:</p>
            <ul class="list-disc pl-4 mt-1">
              <li>The doughnut chart displays aggregated color distribution</li>
              <li>Bar charts show percentages of each color family</li>
              <li>Colors are grouped by parent color categories</li>
              <li>Percentages are calculated by weighting each image equally</li>
            </ul>
            <p class="mt-1">Use this to identify dominant color themes across multiple images.</p>
          </div>
        </div>
      </div>
      <div class="transform transition-transform duration-200" :class="{ 'rotate-180': isCollapsed }">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </div>
    </div>

    <div v-show="!isCollapsed" class="transition-all duration-300 overflow-hidden">
      <div class="mt-6">
        <div class="mb-6">
          <GroupedColorsDoughnut v-if="chartData" :chartDataProp="chartData" class="h-[900px] hover:h-[1440px]" />
        </div>

        <div class="space-y-4">
          <div class="text-lg italic">Total color distribution</div>
          <ColorPercentages :colors="totalColorPercentages" class="w-full" />

          <div class="text-lg italic">Top colors by parent</div>
          <div v-for="(group, index) in sortedGroupedColors" :key="index">
            <div class="flex justify-between text-sm mb-1">
              <span class="font-medium">{{ group.colorGroup }}</span>
              <span>{{ group.totalPercentage.toFixed(1) }}%</span>
            </div>
            <div class="relative">
              <ColorPercentages :colors="group.colors" class="w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { groupColorsAcrossImages, calculateTotalColorPercentages, createGroupedChartData } from "@/services/colorUtils";

const props = defineProps({
  images: {
    type: Array,
    required: true,
  },
});

const isCollapsed = ref(false);

// Use the utility function to group colors across images
const groupedColors = computed(() => {
  return groupColorsAcrossImages(props.images);
});

// Use the utility function to calculate total color percentages
const totalColorPercentages = computed(() => {
  return calculateTotalColorPercentages(props.images);
});

// Use the utility function to create chart data
const chartData = computed(() => {
  return createGroupedChartData(groupedColors.value);
});

// Sort grouped colors by percentage
const sortedGroupedColors = computed(() => {
  return groupedColors.value;
});
</script>
