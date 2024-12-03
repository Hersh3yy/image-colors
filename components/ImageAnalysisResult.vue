<!-- Image analysis Result -->-->
<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex flex-col md:flex-row gap-6">
      <!-- Image and Chart Section -->
      <div class="w-full md:w-1/3">
        <img
          :src="image.sourceImage"
          :alt="image.name"
          class="w-full h-64 object-cover rounded-lg mb-4"
        />
        <div class="h-48 mb-4">
          <GroupedColorsDoughnut v-if="chartData" :chartDataProp="chartData" />
        </div>
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold">{{ image.name }}</h3>
            <button
              @click="$emit('reanalyze', image)"
              class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reanalyze
            </button>
          </div>

          <!-- Preset Controls -->
          <div
            v-if="isPreset"
            class="flex justify-between items-center bg-gray-50 p-2 rounded"
          >
            <span class="text-sm text-gray-600">Preset: {{ presetName }}</span>
            <div class="flex gap-2">
              <button
                @click="$emit('updatePreset', { image, presetName })"
                class="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
              >
                Save Changes
              </button>
              <button
                @click="$emit('duplicatePreset', { image, presetName })"
                class="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600"
              >
                Save As New
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Results Section -->
      <div class="flex-1">
        <div class="mb-6">
          <h4 class="font-medium text-gray-700 mb-4">Color Distribution</h4>

          <!-- Color Percentages Bar -->
          <div class="mb-6">
            <ColorPercentages :colors="image.colors" />
          </div>

          <!-- Color Grid with Tooltips -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="color in image.colors"
              :key="color.color"
              class="flex items-center space-x-3 p-2 rounded-lg relative group"
              :style="{
                backgroundColor:
                  color.percentage > 20 ? `${color.color}15` : 'transparent',
              }"
              @mouseover="hoveredColor = color"
              @mouseleave="hoveredColor = null"
            >
              <div
                class="w-8 h-8 rounded-md shadow-sm cursor-help"
                :style="{ backgroundColor: color.color }"
              />
              <div class="flex flex-col">
                <span class="font-medium"
                  >{{ color.percentage.toFixed(1) }}%</span
                >
                <span v-if="color.parent.name" class="text-sm text-gray-500">
                  {{ color.parent.name }}
                </span>
              </div>

              <!-- Tooltip -->
              <ColorPercentageTooltip
                v-if="hoveredColor === color"
                :color="color"
                class="!-top-32 !left-0 !translate-x-0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import ColorPercentages from "./ColorPercentages.vue";
import ColorPercentageTooltip from "./ColorPercentageTooltip.vue";
import GroupedColorsDoughnut from "./GroupedColorsDoughnut.vue";

const props = defineProps({
  image: {
    type: Object,
    required: true,
    validator: (obj) => {
      return obj.sourceImage && obj.name && obj.colors;
    },
  },
  isPreset: Boolean,
  presetName: String,
});

const emit = defineEmits(["reanalyze", "updatePreset", "duplicatePreset"]);

const hoveredColor = ref(null);

const groupColors = (image) => {
  let colorGroups = [];

  for (let color of image.colors) {
    let parent = color.parent.name || "Undefined Colors";

    let group = colorGroups.find((g) => g.colorGroup === parent);
    if (group) {
      group.colors.push(color);
      group.totalPercentage += color.percentage;
    } else {
      colorGroups.push({
        colorGroup: parent,
        colors: [color],
        totalPercentage: color.percentage,
        hexColor: color.parent.hex || color.color,
      });
    }
  }

  return colorGroups.sort((a, b) => b.totalPercentage - a.totalPercentage);
};

const chartData = computed(() => {
  const groupedColors = groupColors(props.image);
  if (!groupedColors.length) return null;

  let datasets = [
    {
      data: [],
      backgroundColor: [],
    },
    {
      data: [],
      backgroundColor: [],
    },
  ];
  let labels = [];

  groupedColors.forEach((group) => {
    datasets[0].data.push(group.totalPercentage);
    datasets[0].backgroundColor.push(group.hexColor);
    labels.push(`${group.colorGroup} ${group.totalPercentage.toFixed(1)}%`);

    group.colors.forEach((color) => {
      datasets[1].data.push(color.percentage);
      datasets[1].backgroundColor.push(color.color);
    });
  });

  return {
    labels,
    datasets,
  };
});
</script>

<style scoped>
/* Add any custom tooltip positioning overrides */
:deep(.color-tooltip) {
  z-index: 50;
}
</style>
