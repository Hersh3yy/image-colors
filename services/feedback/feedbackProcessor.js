import chroma from 'chroma-js';
import { addFeedbackEntry } from './feedbackStorage';

/**
 * Validates a color input
 * @param {string} color - Hex color to validate
 * @returns {boolean} - Whether the color is valid
 */
const isValidColor = (color) => {
  try {
    if (!color) return false;
    
    // Check if it's a valid hex color
    if (typeof color === 'string' && color.startsWith('#')) {
      return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
    }
    
    // If it's an RGB object
    if (typeof color === 'object' && 'r' in color && 'g' in color && 'b' in color) {
      return (
        Number.isInteger(color.r) && color.r >= 0 && color.r <= 255 &&
        Number.isInteger(color.g) && color.g >= 0 && color.g <= 255 &&
        Number.isInteger(color.b) && color.b >= 0 && color.b <= 255
      );
    }
    
    return false;
  } catch (error) {
    return false;
  }
};

/**
 * Normalizes a color to hex format
 * @param {string|object} color - Color to normalize
 * @returns {string} - Normalized hex color
 */
const normalizeColor = (color) => {
  try {
    if (typeof color === 'string' && color.startsWith('#')) {
      return color;
    }
    
    if (typeof color === 'object' && 'r' in color && 'g' in color && 'b' in color) {
      return chroma(color.r, color.g, color.b).hex();
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Validates feedback data
 * @param {Object} feedback - Feedback data
 * @returns {Object} - Validation result
 */
export const validateFeedback = (feedback) => {
  const errors = [];
  
  // Check if originalColor is present and valid
  if (!feedback.originalColor) {
    errors.push('Original color is required');
  } else if (!isValidColor(feedback.originalColor)) {
    errors.push('Original color is invalid');
  }
  
  // Check if systemMatch is present and valid
  if (!feedback.systemMatch) {
    errors.push('System match is required');
  } else {
    if (!feedback.systemMatch.hex || !isValidColor(feedback.systemMatch.hex)) {
      errors.push('System match hex is invalid');
    }
    
    if (!feedback.systemMatch.pantone) {
      errors.push('System match pantone code is required');
    }
  }
  
  // Check if userCorrection is present and valid
  if (!feedback.userCorrection) {
    errors.push('User correction is required');
  } else {
    if (!feedback.userCorrection.hex || !isValidColor(feedback.userCorrection.hex)) {
      errors.push('User correction hex is invalid');
    }
    
    if (!feedback.userCorrection.pantone) {
      errors.push('User correction pantone code is required');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Processes and stores feedback
 * @param {Object} feedbackData - Raw feedback data
 * @returns {Object} - Processing result
 */
export const processFeedback = (feedbackData) => {
  // Validate the feedback data
  const validation = validateFeedback(feedbackData);
  if (!validation.isValid) {
    return {
      success: false,
      errors: validation.errors
    };
  }
  
  // Normalize the colors
  const normalizedFeedback = {
    ...feedbackData,
    originalColor: normalizeColor(feedbackData.originalColor),
    systemMatch: {
      ...feedbackData.systemMatch,
      hex: normalizeColor(feedbackData.systemMatch.hex)
    },
    userCorrection: {
      ...feedbackData.userCorrection,
      hex: normalizeColor(feedbackData.userCorrection.hex)
    }
  };
  
  // Calculate additional metrics for learning
  const metrics = calculateFeedbackMetrics(normalizedFeedback);
  
  // Store the feedback
  const result = addFeedbackEntry({
    ...normalizedFeedback,
    metrics
  });
  
  return result;
};

/**
 * Calculates additional metrics for the feedback
 * @param {Object} feedback - Normalized feedback data
 * @returns {Object} - Feedback metrics
 */
const calculateFeedbackMetrics = (feedback) => {
  const originalColor = chroma(feedback.originalColor);
  const systemMatch = chroma(feedback.systemMatch.hex);
  const userCorrection = chroma(feedback.userCorrection.hex);
  
  // Calculate distance between original and system match
  const systemDistance = chroma.deltaE(originalColor, systemMatch);
  
  // Calculate distance between original and user correction
  const userDistance = chroma.deltaE(originalColor, userCorrection);
  
  // Calculate distance between system match and user correction
  const correctionDistance = chroma.deltaE(systemMatch, userCorrection);
  
  // Calculate LAB values for all colors
  const originalLab = originalColor.lab();
  const systemLab = systemMatch.lab();
  const userLab = userCorrection.lab();
  
  // Calculate difference in L, A, B components
  const labDiff = {
    l: userLab[0] - systemLab[0],
    a: userLab[1] - systemLab[1],
    b: userLab[2] - systemLab[2]
  };
  
  // Calculate HSL values for all colors
  const originalHsl = originalColor.hsl();
  const systemHsl = systemMatch.hsl();
  const userHsl = userCorrection.hsl();
  
  // Calculate difference in H, S, L components
  const hslDiff = {
    h: userHsl[0] - systemHsl[0],
    s: userHsl[1] - systemHsl[1],
    l: userHsl[2] - systemHsl[2]
  };
  
  return {
    distances: {
      systemDistance,
      userDistance,
      correctionDistance
    },
    lab: {
      original: originalLab,
      system: systemLab,
      user: userLab,
      diff: labDiff
    },
    hsl: {
      original: originalHsl,
      system: systemHsl,
      user: userHsl,
      diff: hslDiff
    },
    improvement: systemDistance - userDistance
  };
}; 