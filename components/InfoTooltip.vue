<template>
  <div class="relative inline-block">
    <button
      @click="isOpen = !isOpen"
      @blur="closeOnBlur"
      class="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl p-4 z-50 border border-gray-200"
      @click.stop
    >
      <div class="space-y-4">
        <!-- Title Section -->
        <div>
          <h3
            class="text-lg font-semibold text-gray-900 flex items-center gap-2"
          >
            Color Analyzer 2.0
            <span
              class="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full"
              >Browser-Powered</span
            >
          </h3>
          <p class="text-sm text-gray-500 mt-1">
            Instant color analysis right in your browser
          </p>
        </div>

        <!-- Quick Start -->
        <div>
          <h4 class="font-medium text-gray-700">Quick Start</h4>
          <ol class="text-sm text-gray-600 mt-2 space-y-1.5">
            <li class="flex items-start gap-2">
              <span
                class="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium"
                >1</span
              >
              <span>Drop images or click to upload</span>
            </li>
            <li class="flex items-start gap-2">
              <span
                class="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium"
                >2</span
              >
              <span>Get instant color analysis</span>
            </li>
            <li class="flex items-start gap-2">
              <span
                class="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium"
                >3</span
              >
              <span>Save presets for future reference</span>
            </li>
          </ol>
        </div>

        <!-- Features -->
        <div>
          <h4 class="font-medium text-gray-700">Key Features</h4>
          <ul class="text-sm text-gray-600 mt-2 space-y-1">
            <li class="flex items-center gap-2">
              <svg
                class="w-4 h-4 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Real-time color clustering</span>
            </li>
            <li class="flex items-center gap-2">
              <svg
                class="w-4 h-4 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Color relationship visualization</span>
            </li>
            <li class="flex items-center gap-2">
              <svg
                class="w-4 h-4 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Batch processing support</span>
            </li>
          </ul>
        </div>

        <!-- How It Works -->
        <div>
          <h4 class="font-medium text-gray-700">How It Works</h4>
          <p class="text-sm text-gray-600 mt-1">
            Using advanced browser technologies, we analyze your images
            instantly through:
          </p>
          <ul class="text-sm text-gray-600 mt-2 list-disc pl-4 space-y-1">
            <li>Pixel color extraction</li>
            <li>Smart color clustering</li>
            <li>Percentage calculation</li>
            <li>Parent color matching</li>
          </ul>
        </div>

        <!-- Version Note -->
        <div class="text-xs text-gray-500 pt-2 border-t">
          <p>
            Version 2.0 - Now with faster processing and enhanced color accuracy
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const isOpen = ref(false);

const closeOnBlur = (e) => {
  // Small delay to allow clicking inside tooltip
  setTimeout(() => {
    isOpen.value = false;
  }, 200);
};
</script>
