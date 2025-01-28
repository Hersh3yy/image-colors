<template>
  <div class="relative inline-block">
    <button @click="isOpen = !isOpen" @blur="closeOnBlur"
      class="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    </button>

    <div v-if="isOpen"
      class="absolute right-0 z-50 mt-2 w-96 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto"
      @click.stop>
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-100">
        <h3 class="text-lg font-semibold text-gray-900">Color Analysis Tool</h3>
        <p class="text-sm text-gray-500 mt-1">Instant color analysis in your browser</p>
      </div>

      <div class="p-6 space-y-6">
        <!-- Quick Start Guide -->
        <div class="rounded-lg bg-blue-50 p-4">
          <h4 class="font-medium text-blue-900 mb-3">Quick Start</h4>
          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <div
                class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm">
                1</div>
              <span class="text-sm text-blue-900">Drop or upload your image</span>
            </div>
            <div class="flex items-center gap-3">
              <div
                class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm">
                2</div>
              <span class="text-sm text-blue-900">Adjust analysis settings if needed</span>
            </div>
            <div class="flex items-center gap-3">
              <div
                class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm">
                3</div>
              <span class="text-sm text-blue-900">View detailed color breakdown</span>
            </div>
          </div>
        </div>

        <!-- Technical Process -->
        <div>
          <h4 class="font-medium text-gray-900 mb-4">How It Works</h4>
          <div class="space-y-4">
            <div class="rounded-lg border border-gray-100 p-4">
              <span class="font-medium text-gray-900">1. Image Upload & Processing</span>
              <p class="mt-2 text-sm text-gray-600">When you upload an image, we process it to identify all the colors present. Think of it like creating a digital paint palette from your image.</p>
            </div>
            <div class="rounded-lg border border-gray-100 p-4">
              <span class="font-medium text-gray-900">2. Color Analysis</span>
              <p class="mt-2 text-sm text-gray-600">We group similar colors together (like sorting a box of crayons) and calculate how much of each color appears in your image. This helps identify the main colors and their proportions.</p>
            </div>
            <div class="rounded-lg border border-gray-100 p-4">
              <span class="font-medium text-gray-900">3. Color Matching</span>
              <p class="mt-2 text-sm text-gray-600">Each color is then matched to standard color references and your custom color palette (if any). We use advanced color science to find the closest matches, though sometimes this might need a human eye to verify.</p>
            </div>
            <div class="rounded-lg border border-gray-100 p-4">
              <span class="font-medium text-gray-900">4. Results & Verification</span>
              <p class="mt-2 text-sm text-gray-600">The final results show you the color breakdown, matched colors, and their percentages. You can verify these matches and even use AI to double-check if the matches seem accurate.</p>
            </div>
          </div>
        </div>

        <!-- Color Spaces -->
        <div>
          <h4 class="font-medium text-gray-900 mb-4">Color Spaces</h4>
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-lg border border-gray-100 p-3">
              <span class="font-medium text-gray-900">LAB</span>
              <p class="mt-1 text-xs text-gray-600">Best matches human perception</p>
            </div>
            <div class="rounded-lg border border-gray-100 p-3">
              <span class="font-medium text-gray-900">RGB</span>
              <p class="mt-1 text-xs text-gray-600">Digital display colors</p>
            </div>
            <div class="rounded-lg border border-gray-100 p-3">
              <span class="font-medium text-gray-900">HSL</span>
              <p class="mt-1 text-xs text-gray-600">Intuitive color organization</p>
            </div>
            <div class="rounded-lg border border-gray-100 p-3">
              <span class="font-medium text-gray-900">LCH</span>
              <p class="mt-1 text-xs text-gray-600">Perceptual uniformity</p>
            </div>
          </div>
        </div>
      </div>

      <div class="px-6 py-3 bg-gray-50 text-xs text-gray-500 rounded-b-xl">
        Results accuracy depends on display calibration
      </div>
    </div>
  </div>
</template>

<script setup>
const isOpen = ref(false);

const closeOnBlur = () => {
  setTimeout(() => {
    isOpen.value = false;
  }, 200);
};
</script>