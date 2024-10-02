<template>
  <div class="flex flex-row">
    <div v-if="name" class="flex flex-col w-72 pl-16">
      <button
        type="submit"
        class="analyze-button bg-red-200 mr-10"
        @click="$emit('deleteImage')"
      >
        DELETE
      </button>
      <div class="pt-10">
        {{ name }}
      </div>
      <div v-if="sourceImage" class="pr-9">
        <img :src="sourceImage" class="sm:w-64 min-w-32 h-auto" />
      </div>
      <button
        @click="toggleView"
        class="my-4 px-4 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-700"
      >
        {{
          viewMode === "visual"
            ? "Show Textual Analysis"
            : "Show Visual Analysis"
        }}
      </button>
    </div>
    <div v-if="viewMode === 'visual'" class="flex flex-col md:flex-row">
      <!-- Display Chroma Results -->
      <div v-if="normalizedColors.chroma.length" class="flex flex-col">
        <h3 class="text-lg font-bold">Chroma Analysis</h3>
        <ColorPercentages :colors="normalizedColors.chroma" />
        <ColorDetailsList :colors="normalizedColors.chroma" />
      </div>
      <!-- Display Color Convert Results -->
      <div v-if="normalizedColors.colorConvert.length" class="flex flex-col">
        <h3 class="text-lg font-bold">Color Convert Analysis</h3>
        <ColorPercentages :colors="normalizedColors.colorConvert" />
        <ColorDetailsList :colors="normalizedColors.colorConvert" />
      </div>
      <!-- Display API Results -->
      <div v-if="normalizedColors.api.length" class="flex flex-col">
        <h3 class="text-lg font-bold">API Analysis</h3>
        <ColorPercentages :colors="normalizedColors.api" />
        <ColorDetailsList :colors="normalizedColors.api" />
      </div>
    </div>
    <TextualAnalysis v-if="viewMode === 'textual'" :colors="colors" />
  </div>
</template>

<script>
import { hexToRgb } from "@/services/colorUtils"; // Ensure you have this in colorUtils
import ColorDetailsList from "./ColorDetailsList.vue";

export default {
  components: {
    ColorDetailsList,
  },
  data() {
    return {
      viewMode: "visual",
    };
  },
  props: {
    sourceImage: String,
    colors: {
      type: Object,
      default: () => ({
        chroma: [],
        colorConvert: [],
        api: [],
      }),
    },
    name: String,
  },
  methods: {
    toggleView() {
      this.viewMode = this.viewMode === "visual" ? "textual" : "visual";
    },
    normalizeColors() {
      const normalizeAPI = this.colors.api.map((color) => ({
        color:
          color.html_code ||
          `#${color.r.toString(16).padStart(2, "0")}${color.g
            .toString(16)
            .padStart(2, "0")}${color.b.toString(16).padStart(2, "0")}`,
        percentage: color.percent,
        name: color.name || null,
        closestHex: color.html_code || null,
      }));

      const normalizeChroma = this.colors.chroma.map((color) => ({
        color: color.color,
        percentage: color.percentage,
        name: color.name || null,
        closestHex: color.closestHex || null,
      }));

      const normalizeColorConvert = this.colors.colorConvert.map((color) => ({
        color: color.color,
        percentage: color.percentage,
        name: color.name || null,
        closestHex: color.closestHex || null,
      }));

      return {
        chroma: normalizeChroma,
        colorConvert: normalizeColorConvert,
        api: normalizeAPI,
      };
    },
  },
  mounted() {
    console.log("Initial colors for processed image: ", this.colors);
  },
  computed: {
    normalizedColors() {
      return this.normalizeColors();
    },
  },
};
</script>
