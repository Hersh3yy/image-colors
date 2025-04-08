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

    <div v-if="isOpen" ref="tooltipContent"
      :style="tooltipStyle"
      class="fixed z-50 w-96 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto"
      @click.stop>
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-100">
        <h3 class="text-lg font-semibold text-gray-900">Color Discovery Tool</h3>
        <p class="text-sm text-gray-500 mt-1">Analyze, identify, and explore colors in your artwork</p>
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
              <span class="text-sm text-blue-900">Upload your image</span>
            </div>
            <div class="flex items-center gap-3">
              <div
                class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm">
                2</div>
              <span class="text-sm text-blue-900">Explore the colors and their relationships</span>
            </div>
            <div class="flex items-center gap-3">
              <div
                class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm">
                3</div>
              <span class="text-sm text-blue-900">Rate the color matches to help improve results</span>
            </div>
          </div>
        </div>

        <!-- Image for color analysis concept -->
        <div class="rounded-lg border border-gray-200 p-2 text-center">
          <img src="@/assets/rainbow-to-pixels.png" alt="Rainbow to Pixels" class="w-full h-auto" />
          <p class="text-xs text-gray-500 mt-2">Discover the spectrum of colors in your artwork</p>
        </div>

        <!-- How It Works -->
        <div>
          <h4 class="font-medium text-gray-900 mb-4">How It Works</h4>
          <div class="space-y-4">
            <div class="rounded-lg border border-gray-100 p-4">
              <span class="font-medium text-gray-900">1. Color Identification</span>
              <p class="mt-2 text-sm text-gray-600">The tool analyzes your image and identifies the key colors that make up your artwork, showing you the proportion of each color.</p>
            </div>
            <div class="rounded-lg border border-gray-100 p-4">
              <span class="font-medium text-gray-900">2. Color Matching</span>
              <p class="mt-2 text-sm text-gray-600">Each color is matched to standard color systems (like Pantone) and custom palettes, helping you find exact names and codes for your colors.</p>
            </div>
            <div class="rounded-lg border border-gray-100 p-4">
              <span class="font-medium text-gray-900">3. Learning & Improving</span>
              <p class="mt-2 text-sm text-gray-600">The more you use it and provide feedback, the better it gets at understanding your color preferences and matching styles.</p>
            </div>
          </div>
        </div>

        <!-- Key System Features -->
        <div>
          <h4 class="font-medium text-gray-900 mb-4">Creative Tools</h4>
          <div class="space-y-3">
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                🎨
              </div>
              <div>
                <h5 class="font-medium text-gray-900">Play Mode</h5>
                <p class="text-sm text-gray-600">Test your color knowledge with random colors. Perfect for developing your eye for color matching!</p>
              </div>
            </div>
            
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                ✨
              </div>
              <div>
                <h5 class="font-medium text-gray-900">Feedback System</h5>
                <p class="text-sm text-gray-600">Suggest better matches when you feel the results could be improved. Your artistic judgment helps train the system.</p>
              </div>
            </div>
            
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                📊
              </div>
              <div>
                <h5 class="font-medium text-gray-900">Color Analysis</h5>
                <p class="text-sm text-gray-600">Discover color harmonies and relationships in your work with visual breakdowns and charts.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Using the Tool -->
        <div>
          <h4 class="font-medium text-gray-900 mb-4">Using the Tool</h4>
          <div class="space-y-4">
            <div>
              <h5 class="font-medium text-gray-800 mb-2">Providing Feedback</h5>
              <div class="rounded-lg border bo§1rder-gray-100 p-3">
                <ol class="list-decimal list-inside text-sm text-gray-600 space-y-1">
                  <li>After analyzing your image, check the color matches</li>
                  <li>Click "Provide Feedback" if you see a match that could be better</li>
                  <li>Select what you think is a more accurate match</li>
                  <li>Your artistic eye will help improve results for everyone</li>
                </ol>
              </div>
            </div>
            
            <div>
              <h5 class="font-medium text-gray-800 mb-2">Play Mode</h5>
              <div class="rounded-lg border border-gray-100 p-3">
                <ol class="list-decimal list-inside text-sm text-gray-600 space-y-1">
                  <li>Click "Play Mode" in the top right corner</li>
                  <li>You'll see a color and its closest match</li>
                  <li>Rate how accurate you think the match is</li>
                  <li>It's a fun way to train your color perception while helping the tool improve</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="px-6 py-3 bg-gray-50 text-xs text-gray-500 rounded-b-xl">
        Your artistic feedback helps make this tool better for everyone
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue';
import rainbowImage from '@/assets/rainbow-to-pixels.png';

const isOpen = ref(false);
const tooltipContent = ref(null);
const tooltipStyle = ref({});
const showTechnicalDetails = ref(false);

const updatePosition = () => {
  if (!isOpen.value || !tooltipContent.value) return;
  
  const button = tooltipContent.value.previousElementSibling;
  const buttonRect = button.getBoundingClientRect();
  const tooltipRect = tooltipContent.value.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Calculate initial position (right-aligned with button)
  let left = buttonRect.right - tooltipRect.width;
  let top = buttonRect.bottom + 8; // 8px gap

  // Adjust horizontal position if it would go off-screen
  if (left < 16) { // Minimum 16px from left edge
    left = 16;
  } else if (left + tooltipRect.width > viewportWidth - 16) {
    left = viewportWidth - tooltipRect.width - 16;
  }

  // Adjust vertical position if it would go off-screen
  if (top + tooltipRect.height > viewportHeight - 16) {
    top = buttonRect.top - tooltipRect.height - 8;
  }

  tooltipStyle.value = {
    left: `${left}px`,
    top: `${top}px`
  };
};

const closeOnBlur = () => {
  setTimeout(() => {
    isOpen.value = false;
  }, 200);
};

watch(isOpen, () => {
  if (isOpen.value) {
    nextTick(() => {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);
    });
  } else {
    window.removeEventListener('resize', updatePosition);
    window.removeEventListener('scroll', updatePosition);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updatePosition);
  window.removeEventListener('scroll', updatePosition);
});
</script>