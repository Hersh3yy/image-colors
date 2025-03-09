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

          <!-- Analysis Stats -->
          <div class="bg-gray-50 rounded-lg p-4 mt-4">
            <h4 class="font-medium text-gray-700 mb-3">Analysis Overview</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Average Confidence:</span>
                <div class="flex items-center gap-2">
                  <div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full"
                      :class="confidenceBarColor"
                      :style="{ width: `${image.metadata?.averageConfidence || 0}%` }"
                    ></div>
                  </div>
                  <span class="font-medium">{{ image.metadata?.averageConfidence || 0 }}%</span>
                </div>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Problematic Matches:</span>
                <span class="font-medium" :class="{ 'text-yellow-600': image.metadata?.problematicMatches?.length > 0 }">
                  {{ image.metadata?.problematicMatches?.length || 0 }}
                </span>
              </div>
            </div>
          </div>

          <!-- Analysis Method Info -->
          <div class="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
            <h4 class="font-medium text-gray-700 mb-2">Analysis Settings</h4>
            <div class="space-y-1 text-gray-600">
              <div class="flex justify-between">
                <span>Color Space:</span>
                <span class="font-medium">{{ image.analysisSettings?.colorSpace || 'LAB' }}</span>
              </div>
              <div class="flex justify-between">
                <span>Distance Method:</span>
                <span class="font-medium">{{ image.analysisSettings?.distanceMethod || 'DELTA_E' }}</span>
              </div>
              <div class="flex justify-between">
                <span>Sample Size:</span>
                <span class="font-medium">{{ image.analysisSettings?.sampleSize?.toLocaleString() || '10000' }} pixels</span>
              </div>
              <div class="flex justify-between">
                <span>Color Clusters:</span>
                <span class="font-medium">{{ image.analysisSettings?.k || '13' }}</span>
              </div>
              <div class="flex justify-between">
                <span>Confidence Threshold:</span>
                <span class="font-medium">{{ image.analysisSettings?.confidenceThreshold || '20' }}</span>
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

          <!-- Color Details Table -->
          <div class="mt-6">
            <h4 class="font-medium text-gray-700 mb-2">Color Details</h4>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">%</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Parent Match</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pantone Match</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="color in sortedColors" :key="color.color" class="hover:bg-gray-50">
                    <td class="px-3 py-2">
                      <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded border" :style="{ backgroundColor: color.color }"></div>
                        <span class="text-sm">{{ color.color }}</span>
                      </div>
                    </td>
                    <td class="px-3 py-2 text-sm">{{ color.percentage.toFixed(1) }}%</td>
                    <td class="px-3 py-2">
                      <div class="flex items-center gap-2">
                        <div class="w-4 h-4 rounded border" :style="{ backgroundColor: color.parent.hex }"></div>
                        <span class="text-sm">{{ color.parent.name || 'N/A' }}</span>
                      </div>
                    </td>
                    <td class="px-3 py-2">
                      <div class="flex items-center gap-2">
                        <div class="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            class="h-full rounded-full"
                            :class="getConfidenceClass(color.parent.confidence)"
                            :style="{ width: `${color.parent.confidence}%` }"
                          ></div>
                        </div>
                        <span class="text-xs">{{ color.parent.confidence?.toFixed(1) }}%</span>
                      </div>
                    </td>
                    <td class="px-3 py-2">
                      <div class="flex items-center gap-2">
                        <div class="w-4 h-4 rounded border" :style="{ backgroundColor: color.pantone.hex }"></div>
                        <span class="text-sm">{{ color.pantone.name || 'N/A' }}</span>
                      </div>
                    </td>
                    <td class="px-3 py-2">
                      <div class="flex items-center gap-2">
                        <div class="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            class="h-full rounded-full"
                            :class="getConfidenceClass(color.pantone.confidence)"
                            :style="{ width: `${color.pantone.confidence}%` }"
                          ></div>
                        </div>
                        <span class="text-xs">{{ color.pantone.confidence?.toFixed(1) }}%</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Problematic Matches Section -->
          <div v-if="image.metadata?.problematicMatches?.length" class="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h4 class="font-medium text-yellow-800 mb-2">Problematic Matches</h4>
            <ul class="space-y-2">
              <li v-for="match in image.metadata.problematicMatches" :key="match.color" class="text-sm text-yellow-700">
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 rounded border" :style="{ backgroundColor: match.color }"></div>
                  <span>{{ match.color }}</span>
                  <span class="text-yellow-600">
                    (Parent: {{ match.parent.confidence?.toFixed(1) }}%, Pantone: {{ match.pantone.confidence?.toFixed(1) }}%)
                  </span>
                </div>
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
import { getConfidenceClass, groupColors, createGroupedChartData } from "@/services/colorUtils";
import ColorPercentages from "./ColorPercentages.vue";
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
  }
});

const emit = defineEmits(["reanalyze", "delete", "aiVerificationResult", "error"]);

const isCheckingWithAI = ref(false);
const hasBeenChecked = ref(false);

const confidenceBarColor = computed(() => {
  return getConfidenceClass(props.image.metadata?.averageConfidence || 0);
});

const sortedColors = computed(() => {
  return [...props.image.colors].sort((a, b) => b.percentage - a.percentage);
});

const chartData = computed(() => {
  const groupedColorsData = groupColors(props.image);
  return createGroupedChartData(groupedColorsData);
});

const checkWithAI = async () => {
  try {
    isCheckingWithAI.value = true;

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
            distance: color.pantone?.distance || 0,
            confidence: color.pantone?.confidence || 0
          },
          matchedParent: {
            name: color.parent?.name || 'Unknown',
            hex: color.parent?.hex || '',
            distance: color.parent?.distance || 0,
            confidence: color.parent?.confidence || 0
          },
          percentage: color.percentage
        })),
        parentColors: props.parentColors
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
/* Add any custom styles here */
</style>
