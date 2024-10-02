<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Image Color Analyzer</h1>

    <form @submit.prevent="analyzeImages" class="mb-4">
      <input
        type="file"
        ref="imageFiles"
        multiple
        required
        accept="image/*"
        class="mb-2"
        @change="handleFileChange"
      />
      <button
        type="button"
        class="bg-blue-500 text-white px-4 py-2 rounded"
        :disabled="processing"
        @click="analyzeImages"
      >
        Analyze Images
      </button>
    </form>

    <ParentColors
      :parentColors="parentColors"
      @update:parentColors="updateParentColors"
    />

    <div v-if="processing" class="mb-4">
      <p>Processing image {{ currentImageIndex + 1 }} of {{ totalFiles }}...</p>
      <p>{{ processingStatus }}</p>
    </div>

    <div
      v-if="error"
      class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
      role="alert"
    >
      <strong class="font-bold">Error:</strong>
      <span class="block sm:inline">{{ error }}</span>
    </div>

    <div
      v-for="(image, index) in processedImages"
      :key="index"
      class="mb-8 border-b pb-4"
    >
      <ImageAnalysisResult :image="image" />
    </div>
  </div>
</template>

<script>
import { ref } from "vue";
import { analyzeImage, ALGORITHMS } from "@/services/imageAnalyzer";

export default {
  setup() {
    const imageFiles = ref(null);
    const processedImages = ref([]);
    const processing = ref(false);
    const currentImageIndex = ref(-1);
    const totalFiles = ref(0);
    const error = ref(null);
    const processingStatus = ref("");
    const parentColors = ref([
      { id: 1, name: "Red", hex: "#FF0000" },
      { id: 2, name: "Cyan", hex: "#00FFFF" },
      { id: 3, name: "Blue", hex: "#0000FF" },
      { id: 4, name: "DarkBlue", hex: "#00008B" },
      { id: 5, name: "LightBlue", hex: "#ADD8E6" },
      { id: 6, name: "Purple", hex: "#800080" },
      { id: 7, name: "Gold", hex: "#FFD700" },
      { id: 8, name: "Lime", hex: "#00FF00" },
      { id: 9, name: "Magenta", hex: "#FF00FF" },
      { id: 10, name: "Apricot", hex: "#FFD8B1" },
      { id: 11, name: "Lavender", hex: "#DCBEFF" },
      { id: 12, name: "Silver", hex: "#C0C0C0" },
      { id: 13, name: "Orange", hex: "#FFA500" },
      { id: 14, name: "Brown", hex: "#A52A2A" },
      { id: 15, name: "Maroon", hex: "#800000" },
      { id: 16, name: "Green", hex: "#008000" },
      { id: 17, name: "Mint", hex: "#AAFFC3" },
      { id: 18, name: "Olive", hex: "#808000" },
      { id: 19, name: "Aquamarine", hex: "#7FFFD4" },
      { id: 20, name: "Grey", hex: "#808080" },
      { id: 21, name: "Cream", hex: "#FFFDD0" },
      { id: 22, name: "White", hex: "#FFFFFF" },
      { id: 23, name: "Black", hex: "#000000" },
      { id: 24, name: "Burlywood", hex: "#DEB887" },
      { id: 25, name: "Saddle Brown", hex: "#8B4513" },
      { id: 26, name: "Orange Red", hex: "#FF4500" },
      { id: 27, name: "Slate Blue", hex: "#6A5ACD" },
      { id: 28, name: "Cadet Blue", hex: "#5F9EA0" },
      { id: 29, name: "Pale Green", hex: "#98FB98" },
      { id: 30, name: "Pale Violet Red", hex: "#DB7093" },
      { id: 31, name: "Steel Blue", hex: "#4682B4" },
      { id: 32, name: "Goldenrod", hex: "#DAA520" },
      { id: 33, name: "Turquoise", hex: "#40E0D0" },
      { id: 34, name: "Blue Violet", hex: "#8A2BE2" },
      { id: 35, name: "Salmon", hex: "#FA8072" },
    ]);

    const handleFileChange = (event) => {
      imageFiles.value = event.target.files;
    };

    const updateParentColors = (newParentColors) => {
      parentColors.value = newParentColors;
    };

    const analyzeImages = async () => {
      console.log("analyzeImages started");
      const files = imageFiles.value;
      if (!files || files.length === 0) {
        console.log("No files selected");
        return;
      }

      processing.value = true;
      totalFiles.value = files.length;
      currentImageIndex.value = -1;
      error.value = null;

      try {
        for (let i = 0; i < files.length; i++) {
          console.log(`Processing file ${i + 1} of ${files.length}`);
          const file = files[i];
          currentImageIndex.value = i;
          const sourceImage = URL.createObjectURL(file);
          const imageResult = {
            name: file.name,
            sourceImage,
            results: {},
          };

          for (const algorithm of Object.values(ALGORITHMS)) {
            processingStatus.value = `Analyzing image with ${algorithm}...`;
            console.log(`Starting ${algorithm} analysis`);
            let result = await analyzeImage(
              file,
              algorithm,
              parentColors.value
            );
            console.log(`${algorithm} analysis complete`, result);
            imageResult.results[algorithm] = result;
          }

          processedImages.value.unshift(imageResult);
          processingStatus.value = "Analysis complete";
        }
      } catch (err) {
        console.error("Error during image analysis:", err);
        error.value = err.message || "An error occurred during image analysis";
      } finally {
        console.log("Analysis process completed");
        processing.value = false;
        currentImageIndex.value = -1;
        processingStatus.value = "";
      }

      console.log("analyzeImages finished");
    };

    return {
      imageFiles,
      processedImages,
      processing,
      currentImageIndex,
      totalFiles,
      error,
      processingStatus,
      parentColors,
      handleFileChange,
      analyzeImages,
      updateParentColors,
    };
  },
};
</script>
