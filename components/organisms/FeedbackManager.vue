<!-- 
  FeedbackManager.vue - Component to manage feedback modals
  
  This component encapsulates:
  - Feedback submission modal
  - Play mode modal
  - Handling feedback submissions
-->

<template>
  <!-- Feedback Modals -->
  <FeedbackModal 
    :is-visible="isFeedbackModalVisible" 
    :match="selectedColorMatch" 
    :parent-colors="parentColors"
    @close="closeFeedbackModal" 
    @feedback-submitted="onFeedbackSubmitted" 
    @save-match-preference="$emit('save-match-preference', $event)"
  />
  
  <PlayModal 
    :is-visible="isPlayModalVisible" 
    :parent-colors="parentColors"
    @close="closePlayModal" 
    @feedback-submitted="onFeedbackSubmitted"
    @save-match-preference="$emit('save-match-preference', $event)"
  />
</template>

<script setup>
import { ref } from 'vue';
import { useFeedback } from '@/composables/useFeedback';
import FeedbackModal from '@/components/feedback/FeedbackModal.vue';
import PlayModal from '@/components/feedback/PlayModal.vue';

const props = defineProps({
  parentColors: {
    type: Array,
    required: true
  }
});

const emit = defineEmits([
  'notification',
  'feedback-submitted',
  'save-match-preference'
]);

/**
 * Feedback System Hook
 * Manages user feedback collection for improving color matching
 */
const { 
  isFeedbackModalVisible,    // Whether feedback modal is visible
  isPlayModalVisible,        // Whether play mode modal is visible
  showFeedbackModal,         // Show feedback modal function
  closeFeedbackModal,        // Close feedback modal function
  showPlayModal,             // Show play mode modal function
  closePlayModal,            // Close play mode modal function
  handleFeedbackSubmitted    // Handle feedback submission
} = useFeedback();

// Track the current color match being given feedback on
const selectedColorMatch = ref(null);

/**
 * Show feedback modal for a specific color match
 * @param {Object} colorMatch - The color match to provide feedback for
 */
const showFeedbackForColor = (colorMatch) => {
  console.log('FeedbackManager: Showing feedback modal for color:', colorMatch.color);
  selectedColorMatch.value = colorMatch;
  showFeedbackModal(colorMatch);
};

/**
 * Forward feedback submission to parent component
 * to ensure proper UI updates
 */
const onFeedbackSubmitted = (feedback) => {
  console.log('FeedbackManager: Forwarding feedback to parent:', feedback);
  
  // Add updateUI flag to let parent know this should update the UI
  feedback.updateUI = true;
  
  // Forward to parent
  emit('feedback-submitted', feedback);
  
  // Also pass to the default handler from the hook
  handleFeedbackSubmitted(feedback);
};

// Public API
defineExpose({
  showFeedbackForColor,
  showPlayMode: showPlayModal
});
</script> 