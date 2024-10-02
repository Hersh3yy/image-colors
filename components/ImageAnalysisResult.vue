<!-- ImageAnalysisResult.vue -->
<template>
  <div class="image-analysis-result">
    <div class="flex flex-wrap">
      <div class="w-full md:w-1/3 pr-4 mb-4">
        <img
          :src="image.sourceImage"
          alt="Analyzed image"
          class="max-w-full h-auto"
        />
      </div>
      <div class="w-full md:w-2/3">
        <div
          v-for="(result, algorithm) in image.results"
          :key="algorithm"
          class="mb-6"
        >
          <h3 class="text-lg font-medium mb-2">{{ algorithm }} Analysis</h3>
          <div v-if="algorithm === 'chroma'">
            <div class="mb-4">
              <ColorSpectrum :colors="getSpectrumColors(result)" />
            </div>
          </div>
          <div class="flex flex-wrap">
            <div class="w-full md:w-1/2 pr-4 mb-4">
              <h4 class="text-md font-medium mb-2">Color Distribution</h4>
              <ColorPieChart :colors="getSortedChartData(result)" />
            </div>
            <div class="w-full md:w-1/2 pr-4 mb-4">
              <h4 class="text-md font-medium mb-2">
                Parent Color Distribution
              </h4>
              <ParentColorPieChart :colors="getSortedChartData(result)" />
            </div>
          </div>
          <div class="w-full">
            <ColorTable :colors="result" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>

const props = defineProps({
  image: {
    type: Object,
    required: true,
  },
});

const getSortedChartData = (result) => {
  return result
    .map((color) => ({
      color: color.color,
      percentage: color.percentage,
      closestParentColor: color.closestParentColor,
    }))
    .sort((a, b) => b.percentage - a.percentage);
};

const getSpectrumColors = (result) => {
  return result.map((color) => ({
    html_code: color.color,
    percent: color.percentage,
  }));
};
</script>
