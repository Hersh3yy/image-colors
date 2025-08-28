/**
 * useColorFeedback - Composable for handling color feedback and updates
 * 
 * This composable encapsulates the complex logic for:
 * - Processing user feedback on color matches
 * - Updating color matches in real-time
 * - Managing feedback state and notifications
 */

import { ref } from 'vue';

export function useColorFeedback() {
  const selectedImage = ref(null);

  /**
   * Handle image selection for feedback
   * @param {Object} image - Selected image
   */
  const handleSelectImage = (image) => {
    selectedImage.value = image;
  };

  /**
   * Handle feedback request for a specific color
   * @param {Object} colorMatch - The color match object
   * @param {Function} feedbackManagerRef - Reference to feedback manager
   */
  const handleColorFeedback = (colorMatch, feedbackManagerRef) => {
    if (!colorMatch) {
      return;
    }
    
    // Use the FeedbackManager component to handle the feedback
    feedbackManagerRef?.showFeedbackForColor(colorMatch);
  };

  /**
   * Update a color match immediately based on user feedback
   * @param {Object} feedback - Feedback data containing originalColor and correction
   * @param {Object} activePreset - Current active preset
   * @param {Array} activePresetImages - Active preset images
   * @param {Array} processedImages - Processed images array
   * @param {Function} showNotification - Notification function
   */
  const updateCurrentColorMatch = (
    feedback, 
    activePreset, 
    activePresetImages, 
    processedImages, 
    showNotification
  ) => {
    if (!feedback || !feedback.originalColor || !feedback.correction) {
      console.warn('Invalid feedback data:', feedback);
      return;
    }
    
    console.log('Updating color match based on feedback:', feedback);
    
    // Find the image and color to update - check active preset first, then processed images
    let targetImage = null;
    let isPresetImage = false;
    
    if (activePreset?.value) {
      // Search in active preset images
      targetImage = activePresetImages?.value?.find(img => {
        return img.colors.some(color => color.color === feedback.originalColor);
      });
      isPresetImage = !!targetImage;
    }
    
    if (!targetImage && feedback.colorMatch?.image) {
      // If feedback contains a direct reference to the image
      targetImage = feedback.colorMatch.image;
    }
    
    if (!targetImage) {
      // If not found in preset, search in processed images
      targetImage = processedImages?.value?.find(img => {
        return img.colors.some(color => color.color === feedback.originalColor);
      });
    }
    
    if (!targetImage) {
      console.warn('Could not find the image containing the original color:', feedback.originalColor);
      return;
    }
    
    // Find the specific color to update
    const colorToUpdate = targetImage.colors.find(color => color.color === feedback.originalColor);
    
    if (!colorToUpdate) {
      console.warn('Could not find the color to update:', feedback.originalColor);
      return;
    }
    
    console.log('Found color to update:', colorToUpdate);
    console.log('Updating with correction:', feedback.correction);
    
    // Create a backup of the original parent before updating
    if (!colorToUpdate.originalParent) {
      colorToUpdate.originalParent = { ...colorToUpdate.parent };
    }
    
    // Update the parent color match with the user's correction
    colorToUpdate.parent = {
      name: feedback.correction.parentName,
      hex: feedback.correction.parentHex,
      distance: feedback.colorInfo?.distances?.deltaE || 0,
      confidence: calculateConfidence(feedback.colorInfo?.distances?.deltaE || 0)
    };
    
    console.log('Updated color data:', colorToUpdate);
    
    // Update metadata if needed
    if (targetImage.metadata?.problematicMatches) {
      // Remove this color from problematic matches if it was there
      targetImage.metadata.problematicMatches = targetImage.metadata.problematicMatches.filter(
        match => match.color !== feedback.originalColor
      );
    }
    
    // Force DOM updates for any currently rendered components
    updateDOMColorMatch(feedback, targetImage);
    
    console.log('Color match updated successfully');
    
    // Show appropriate notification
    if (isPresetImage) {
      showNotification(
        "Match updated! Click 'Save Changes' to update this preset permanently.", 
        "info"
      );
    } else {
      showNotification(
        "Color match updated successfully!", 
        "success"
      );
    }
  };

  /**
   * Calculate confidence score based on color distance
   * @param {number} distance - Color distance
   * @returns {number} - Confidence score 0-100
   */
  const calculateConfidence = (distance) => {
    // 0 distance = 100% confidence
    // Large distances = low confidence
    const max = 50; // Maximum reasonable distance
    const confidence = Math.max(0, 100 - (distance * 2));
    return Math.round(confidence);
  };

  /**
   * Update DOM elements to reflect color match changes
   * @param {Object} feedback - Feedback data
   * @param {Object} targetImage - Target image object
   */
  const updateDOMColorMatch = (feedback, targetImage) => {
    if (typeof document === 'undefined') return;
    
    setTimeout(() => {
      // Get access to all ImageAnalysisResult components rendered in the DOM
      const resultComponents = document.querySelectorAll('.image-analysis-result');
      console.log(`Found ${resultComponents.length} ImageAnalysisResult components in DOM`);
      
      // Try to update any components that need updating
      resultComponents.forEach(component => {
        const imageNameEl = component.querySelector('.image-name');
        if (imageNameEl && imageNameEl.textContent === targetImage.name) {
          console.log('Found matching ImageAnalysisResult component to update');
          
          // Force DOM update for table cells with this color
          const colorCells = component.querySelectorAll(`[data-color="${feedback.originalColor}"]`);
          colorCells.forEach(cell => {
            const parentNameCell = cell.parentElement.querySelector('.parent-name');
            if (parentNameCell) {
              parentNameCell.textContent = feedback.correction.parentName;
              console.log('Updated parent name cell content');
            }
            
            const parentColorCell = cell.parentElement.querySelector('.parent-color');
            if (parentColorCell) {
              parentColorCell.style.backgroundColor = feedback.correction.parentHex;
              console.log('Updated parent color cell background');
            }
          });
        }
      });
    }, 100); // Small delay to ensure Vue has updated the DOM
  };

  /**
   * Handle saving match preferences
   * @param {Object} preference - The match preference to save
   */
  const handleSaveMatchPreference = (preference) => {
    // Check if we have valid data
    if (!preference || !preference.originalColor || !preference.matchedColor) {
      console.warn('Invalid match preference data:', preference);
      return;
    }
    
    // For now we're just logging this, but we could save to a user-specific preferences store
    console.log('Match preference saved:', preference);
  };

  return {
    selectedImage,
    handleSelectImage,
    handleColorFeedback,
    updateCurrentColorMatch,
    handleSaveMatchPreference
  };
}
