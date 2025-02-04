<!-- Image analysis Result -->
<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex flex-col md:flex-row gap-6">
      <!-- Image and Chart Section -->
      <div class="w-full md:w-1/3">
        <img :src="image.sourceImage" :alt="image.name" class="w-full h-64 object-contain rounded-lg mb-4" />
        <div class="h-[29rem] mb-4">
          <GroupedColorsDoughnut v-if="chartData" :chartDataProp="chartData" />
        </div>
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold">{{ image.name }}</h3>
            <div class="flex gap-2">
              <button @click="$emit('delete')" class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                Delete
              </button>
              <button @click="$emit('reanalyze', image)"
                class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                Reanalyze
              </button>
              <button @click="checkWithAI" :disabled="isCheckingWithAI"
                class="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                :class="{ 'bg-green-500 hover:bg-green-600': hasBeenChecked }">
                <span v-if="isCheckingWithAI"
                  class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <svg v-else-if="hasBeenChecked" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                {{ isCheckingWithAI ? 'Checking...' : hasBeenChecked ? 'Verified' : 'Check with AI' }}
              </button>
            </div>
          </div>

          <!-- Preset Controls -->
          <div v-if="isPreset" class="flex justify-between items-center bg-gray-50 p-2 rounded">
            <span class="text-sm text-gray-600">Preset: {{ presetName }}</span>
            <div class="flex gap-2">
              <button @click="$emit('updatePreset', { image, presetName })"
                class="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600">
                Save Changes
              </button>
              <button @click="$emit('duplicatePreset', { image, presetName })"
                class="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600">
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

          <!-- Problematic Matches Section -->
          <div v-if="problematicMatches.length" class="mt-4">
            <h4 class="font-medium text-gray-700 mb-2">Problematic Matches</h4>
            <ul class="list-disc pl-5">
              <li v-for="match in problematicMatches" :key="match.color">
                <span class="font-medium">{{ match.color }}</span> - 
                Pantone: {{ match.pantone.name || 'N/A' }} ({{ match.pantone.hex || 'N/A' }}), 
                Parent: {{ match.parent.name || 'N/A' }} ({{ match.parent.hex || 'N/A' }}), 
                Distances - Pantone: {{ match.pantone.distance || 'N/A' }}, Parent: {{ match.parent.distance || 'N/A' }}
              </li>
            </ul>
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
  parentColors: {
    type: Array,
    required: true
  },
  problematicMatches: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(["reanalyze", "updatePreset", "duplicatePreset", "aiVerificationResult"]);

const hoveredColor = ref(null);
const isCheckingWithAI = ref(false);
const hasBeenChecked = ref(false);

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

const checkWithAI = async () => {
  try {
    isCheckingWithAI.value = true;

    // Debugging log to check parentColors
    console.log("Parent Colors:", props.parentColors);

    const response = await fetch('/.netlify/functions/verify-colors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        colors: props.image.colors.map(color => ({
          originalColor: color.color,
          matchedPantone: {
            name: color.pantone?.name || 'Unknown',
            hex: color.pantone?.hex || '',
            distance: color.pantone?.distance || 0
          },
          matchedParent: {
            name: color.parent?.name || 'Unknown',
            hex: color.parent?.hex || '',
            distance: color.parent?.distance || 0
          },
          percentage: color.percentage
        })),
        parentColors: props.parentColors // Ensure this is correctly populated
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to verify colors');
    }

    hasBeenChecked.value = true;
    emit('aiVerificationResult', data);
  } catch (error) {
    console.error('Error verifying colors:', error);
    emit('error', { message: error.message });
  } finally {
    isCheckingWithAI.value = false;
  }
};
</script>

<style scoped>
/* Add any custom tooltip positioning overrides */
:deep(.color-tooltip) {
  z-index: 50;
}
</style>
