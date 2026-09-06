<!--
  FeedbackManager.vue - Component to manage the feedback modal

  This component encapsulates:
  - Feedback submission modal
  - Handling feedback submissions

  Play mode is rendered by app.vue as <FeedbackPlayModal>; it used to be
  duplicated here under an unregistered <PlayModal> tag that never rendered.
-->

<template>
  <FeedbackModal
    :is-visible="isFeedbackModalVisible"
    :match="selectedColorMatch"
    :parent-colors="parentColors"
    @close="closeFeedbackModal"
    @feedback-submitted="onFeedbackSubmitted"
    @save-match-preference="$emit('save-match-preference', $event)"
  />
</template>

<script setup>
import { ref } from 'vue';
import { useFeedback } from '@/composables/useFeedback';

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
  showFeedbackModal,         // Show feedback modal function
  closeFeedbackModal,        // Close feedback modal function
  handleFeedbackSubmitted    // Handle feedback submission
} = useFeedback();

// Track the current color match being given feedback on
const selectedColorMatch = ref(null);

/**
 * Show feedback modal for a specific color match
 * @param {Object} colorMatch - The color match to provide feedback for
 */
const showFeedbackForColor = (colorMatch) => {
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
  showFeedbackForColor
});
</script> 