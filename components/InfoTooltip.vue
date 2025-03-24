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
        <h3 class="text-lg font-semibold text-gray-900">Color Analysis System</h3>
        <p class="text-sm text-gray-500 mt-1">Precise color identification & matching</p>
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
              <span class="text-sm text-blue-900">View color breakdown and matches</span>
            </div>
            <div class="flex items-center gap-3">
              <div
                class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm">
                3</div>
              <span class="text-sm text-blue-900">Provide feedback to improve the system</span>
            </div>
          </div>
        </div>

        <!-- Image for color analysis concept -->
        <div class="rounded-lg border border-gray-200 p-2 text-center">
          <div class="bg-gray-100 aspect-video flex items-center justify-center">
            <span class="text-sm text-gray-500">Image: Color Extraction Process</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">How images are broken down into pixels and grouped by color</p>
        </div>

        <!-- How It Works -->
        <div>
          <h4 class="font-medium text-gray-900 mb-4">How It Works</h4>
          <div class="space-y-4">
            <div class="rounded-lg border border-gray-100 p-4">
              <span class="font-medium text-gray-900">1. Color Extraction</span>
              <p class="mt-2 text-sm text-gray-600">The system analyzes your image, extracts pixels, and groups them into distinct colors with their percentage distribution.</p>
            </div>
            <div class="rounded-lg border border-gray-100 p-4">
              <span class="font-medium text-gray-900">2. Color Matching</span>
              <p class="mt-2 text-sm text-gray-600">Each extracted color is matched to standard color references (like Pantone) and custom color palettes using precise color space calculations.</p>
            </div>
            <div class="rounded-lg border border-gray-100 p-4">
              <span class="font-medium text-gray-900">3. Machine Learning</span>
              <p class="mt-2 text-sm text-gray-600">The system learns from user feedback to continually improve matching accuracy with TensorFlow-based machine learning.</p>
            </div>
          </div>
        </div>

        <!-- Key System Features -->
        <div>
          <h4 class="font-medium text-gray-900 mb-4">Key Features</h4>
          <div class="space-y-3">
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                🎮
              </div>
              <div>
                <h5 class="font-medium text-gray-900">Play Mode</h5>
                <p class="text-sm text-gray-600">Train the system with random colors to improve its pattern recognition capabilities.</p>
              </div>
            </div>
            
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                📝
              </div>
              <div>
                <h5 class="font-medium text-gray-900">Feedback System</h5>
                <p class="text-sm text-gray-600">Provide corrections on color matches that need improvement. Data is used to train the matching algorithms.</p>
              </div>
            </div>
            
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                🧠
              </div>
              <div>
                <h5 class="font-medium text-gray-900">Machine Learning</h5>
                <p class="text-sm text-gray-600">TensorFlow implementation that improves match accuracy through pattern recognition and statistical analysis.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Technical Details -->
        <div class="relative">
          <div class="absolute inset-0 bg-gradient-to-b from-transparent to-white pointer-events-none h-28 bottom-0 hidden" :class="{'!block': !showTechnicalDetails}"></div>
          
          <h4 class="font-medium text-gray-900 mb-4 flex items-center justify-between">
            <span>Technical Details</span>
            <button 
              @click="showTechnicalDetails = !showTechnicalDetails" 
              class="text-sm text-blue-600 hover:underline focus:outline-none"
            >
              {{ showTechnicalDetails ? 'Show Less' : 'Show More' }}
            </button>
          </h4>
          
          <div :class="{'h-20 overflow-hidden': !showTechnicalDetails, 'mb-4': showTechnicalDetails}">
            <p class="text-sm text-gray-600 mb-3">
              The system uses advanced color science techniques for accurate matching:
            </p>
            
            <div class="space-y-3">
              <div class="rounded-lg border border-gray-100 p-3">
                <span class="font-medium text-gray-900">Color Spaces</span>
                <p class="mt-1 text-xs text-gray-600">Multiple color spaces (LAB, RGB, HSL) are used for precise matching. LAB space provides perceptual uniformity that corresponds to human vision.</p>
              </div>
              
              <div class="rounded-lg border border-gray-100 p-3">
                <span class="font-medium text-gray-900">Delta E Calculations</span>
                <p class="mt-1 text-xs text-gray-600">Delta E measurements quantify the difference between colors as perceived by humans. Lower values indicate closer matches.</p>
              </div>
              
              <div class="rounded-lg border border-gray-100 p-3">
                <span class="font-medium text-gray-900">TensorFlow Implementation</span>
                <p class="mt-1 text-xs text-gray-600">Neural network models analyze feedback data to identify patterns and continuously improve matching accuracy over time.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Usage Instructions -->
        <div>
          <h4 class="font-medium text-gray-900 mb-4">System Usage</h4>
          
          <div class="space-y-4">
            <div>
              <h5 class="font-medium text-gray-800 mb-2">Providing Feedback</h5>
              <div class="rounded-lg border border-gray-100 p-3">
                <ol class="list-decimal list-inside text-sm text-gray-600 space-y-1">
                  <li>Select an analyzed image</li>
                  <li>Click "Provide Feedback" button</li>
                  <li>Review the matched color information</li>
                  <li>Select a better match if needed</li>
                  <li>Indicate why the match needs correction</li>
                </ol>
              </div>
            </div>
            
            <div>
              <h5 class="font-medium text-gray-800 mb-2">Play Mode</h5>
              <div class="rounded-lg border border-gray-100 p-3">
                <ol class="list-decimal list-inside text-sm text-gray-600 space-y-1">
                  <li>Click "Play Mode" in the top right</li>
                  <li>Review the random color and its match</li>
                  <li>Accept if it's accurate, or correct if needed</li>
                  <li>Each interaction trains the system</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="px-6 py-3 bg-gray-50 text-xs text-gray-500 rounded-b-xl">
        System accuracy improves with each feedback interaction
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue';

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