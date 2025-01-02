<!-- Image analysis Result -->
<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex flex-col md:flex-row gap-6">
      <!-- Image and Chart Section -->
      <div class="w-full md:w-1/3">
        <img
          :src="image.sourceImage"
          :alt="image.name"
          class="w-full h-64 object-contain rounded-lg mb-4"
        />
        <div class="h-[29rem] mb-4">
          <GroupedColorsDoughnut v-if="chartData" :chartDataProp="chartData" />
        </div>
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold">{{ image.name }}</h3>
            <div class="flex gap-2">
              <button
                @click="$emit('delete')"
                class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
              <button
                @click="$emit('reanalyze', image)"
                class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Reanalyze
              </button>
            </div>
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

          <!-- Analysis Method Info -->
          <div class="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
            <h4 class="font-medium text-gray-700 mb-2">Analysis Settings</h4>
            <div class="space-y-1 text-gray-600">
              <div class="flex justify-between">
                <span>Color Space:</span>
                <span class="font-medium">{{ image.analysisSettings?.colorSpace || 'LAB' }}</span>
              </div>
              <div class="flex justify-between">
                <span>Distance Method:</span>
                <span class="font-medium">{{ image.analysisSettings?.distanceMethod || 'LAB' }}</span>
              </div>
              <div class="flex justify-between">
                <span>Sample Size:</span>
                <span class="font-medium">{{ image.analysisSettings?.sampleSize || '10000' }} pixels</span>
              </div>
              <div class="flex justify-between">
                <span>Color Clusters:</span>
                <span class="font-medium">{{ image.analysisSettings?.k || '13' }}</span>
              </div>
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
              v-for="color in sortedColors"
              :key="color.color"
              class="flex items-center space-x-3 p-2 rounded-lg relative group"
              :style="{
                backgroundColor:
                  color.percentage > 20 ? `${color.color}15` : 'transparent',
              }"
              @mouseover="hoveredColor = color"
              @mouseleave="hoveredColor = null"
            >
              <FlippableColorBlock
                :color="color.color"
                :percentage="color.percentage"
                :parentName="color.parent.name"
                :hex="color.color"
              />
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

const sortedColors = computed(() => {
  return [...props.image.colors].sort((a, b) => b.percentage - a.percentage);
});

const chartData = computed(() => {
  const groupedColors = groupColors(props.image);
  if (!groupedColors.length) return null;

  return {
    labels: groupedColors.map(
      group => `${group.colorGroup} ${group.totalPercentage.toFixed(1)}%`
    ),
    datasets: [
      {
        // Parent colors
        data: groupedColors.map(group => group.totalPercentage),
        backgroundColor: groupedColors.map(group => group.hexColor),
      },
      {
        // Child colors with enriched data
        data: groupedColors.flatMap(group => 
          group.colors.map(color => color.percentage)
        ),
        backgroundColor: groupedColors.flatMap(group => 
          group.colors.map(color => color.color)
        ),
        // Add additional metadata for each child color
        metadata: groupedColors.flatMap(group =>
          group.colors.map(color => ({
            parentName: group.colorGroup,
            parentHex: group.hexColor,
            pantone: color.pantone,
            name: color.pantone?.name || 'Unknown',
            hex: color.color,
            distance: color.pantone?.distance || 0
          }))
        )
      }
    ]
  };
});
</script>

<style scoped>
/* Add any custom tooltip positioning overrides */
:deep(.color-tooltip) {
  z-index: 50;
}
</style>
