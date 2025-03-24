<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div @click="isCollapsed = !isCollapsed" class="flex justify-between items-center cursor-pointer">
      <div class="flex items-center gap-3">
        <h2 class="text-lg font-semibold">Color Analysis</h2>
        <span class="text-sm text-gray-500">
          ({{ images.length }} {{ images.length === 1 ? "image" : "images" }})
        </span>
      </div>
      <div class="transform transition-transform duration-200" :class="{ 'rotate-180': isCollapsed }">
        <Icon name="heroicons:chevron-down" />
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

          <div class="text-lg italic">Top colors by group</div>
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
