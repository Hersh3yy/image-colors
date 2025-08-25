<!-- 
  ImageAnalysisResult.vue - Simplified Organism Component
  
  This component now acts as a simple layout container that composes
  smaller, focused organisms for better maintainability and readability.
-->
<template>
  <div class="bg-white rounded-lg shadow p-4 sm:p-6">
    <div class="flex flex-col lg:flex-row gap-6">
      <!-- LEFT SECTION: Image Display -->
      <OrganismsImageDisplaySection 
        :image="image"
        @delete="$emit('delete')"
        @reanalyze="$emit('reanalyze', $event)"
        @screenshot="showScreenshotModal = true"
      />

      <!-- RIGHT SECTION: Color Analysis Results -->
      <OrganismsColorAnalysisResults
        :image="image"
        @feedback="$emit('feedback', $event)"
        @copy="handleCopy"
      />
    </div>
    
    <!-- Screenshot Modal -->
    <OrganismsScreenshotModal
      v-if="showScreenshotModal"
      :image="image"
      @close="showScreenshotModal = false"
      @download="handleScreenshotDownload"
    />

    <!-- Toast Notification -->
    <MoleculesToastNotification
      v-if="showToast"
      :message="toastMessage"
      :type="toastType"
      @close="hideToast"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
// Components auto-imported by Nuxt

const props = defineProps({
  /**
   * The analyzed image data object
   */
  image: {
    type: Object,
    required: true,
    validator: (obj) => {
      return obj.sourceImage && obj.name && obj.colors;
    },
  },
  /**
   * Whether this is a preset example
   */
  isPreset: Boolean,
  /**
   * Name of the preset if applicable
   */
  presetName: String,
  /**
   * Array of parent colors for matching
   */
  parentColors: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(["reanalyze", "delete", "error", "feedback"]);

// Local state
const showScreenshotModal = ref(false);
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

/**
 * Handle copy functionality with toast feedback
 */
const handleCopy = (colorCode) => {
  navigator.clipboard.writeText(colorCode)
    .then(() => {
      showToastMessage(`Copied ${colorCode} to clipboard`, 'success');
    })
    .catch(() => {
      showToastMessage('Failed to copy to clipboard', 'error');
    });
};

/**
 * Handle screenshot download
 */
const handleScreenshotDownload = () => {
  showToastMessage('Screenshot downloaded successfully!', 'success');
  showScreenshotModal.value = false;
};

/**
 * Show toast message
 */
const showToastMessage = (message, type = 'success') => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    hideToast();
  }, 3000);
};

/**
 * Hide toast
 */
const hideToast = () => {
  showToast.value = false;
};
</script>
