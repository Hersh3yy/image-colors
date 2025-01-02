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
      class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl p-4 z-50 border border-gray-200 max-h-[80vh] overflow-y-auto"
      @click.stop>
      <div class="space-y-4">
        <!-- How to Use -->
        <div>
          <h4 class="font-medium text-gray-700">How to Use</h4>
          <div class="mt-2 space-y-2 text-sm text-gray-600">
            <div class="flex items-start gap-2">
              <span class="flex-shrink-0 font-medium">1.</span>
              <span>Upload images by dropping them or clicking to browse</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="flex-shrink-0 font-medium">2.</span>
              <span>Adjust image settings with the controls</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="flex-shrink-0 font-medium">3.</span>
              <span>Explore the detailed color analysis</span>
            </div>
          </div>
        </div>

        <!-- Color Analysis Process -->
        <div>
          <h4 class="font-medium text-gray-700">How It Works</h4>
          <div class="mt-2 space-y-3 text-sm text-gray-600">
            <div>
              <span class="font-medium">Initial Analysis:</span>
              <p class="mt-1">Groups similar colors using AI clustering. Different color spaces affect how colors are
                analyzed.</p>
            </div>
            <div>
              <span class="font-medium">Parent Color Matching:</span>
              <p class="mt-1">Identifies each color's parent color and then groups them by parent.</p>
            </div>
            <div>
              <span class="font-medium">Color Database:</span>
              <p class="mt-1">Matches colors with standard color libraries for accurate naming.</p>
            </div>
          </div>
        </div>

        <!-- Color Spaces -->
        <div>
          <h4 class="font-medium text-gray-700">Color Spaces</h4>
          <div class="mt-2 space-y-2 text-sm text-gray-600">
            <p><span class="font-medium">RGB:</span> Basic digital color model</p>
            <p><span class="font-medium">LAB:</span> Matches human color perception</p>
            <p><span class="font-medium">HSL:</span> Organizes by hue, saturation, lightness</p>
          </div>
        </div>

        <!-- Version Note -->
        <div class="pt-2 border-t text-xs text-gray-500">
          <p>Results may vary based on display settings</p>
        </div>
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