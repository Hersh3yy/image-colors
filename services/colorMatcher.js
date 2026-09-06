// services/colorMatcher.js
import chroma from "chroma-js";
import processedColors from "@/assets/processed_colors.json";
import { calculateConfidence } from "./colorUtils";
import { useColorMatcherService } from '@/composables/useColorMatcherService';

/**
 * Perceptual colour distance: CIEDE2000 (ΔE₀₀). The one metric the app uses.
 * @param {string} color1 - First color in hex format
 * @param {string} color2 - Second color in hex format
 * @returns {number} - Distance between colors
 */
export const getColorDistance = (color1, color2) => chroma.deltaE(color1, color2);

/**
 * Find closest Pantone color to given hex color
 * @param {string} hexColor - Source color in hex format
 * @returns {Object} - Matching result with color, distance and confidence
 */
export const findClosestPantoneColor = (hexColor) => {
  let minDistance = Infinity;
  let closestColor = null;

  // Iterate through all Pantone colors to find closest match
  processedColors.forEach((pantoneColor) => {
    const distance = getColorDistance(hexColor, `#${pantoneColor.hex}`);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = pantoneColor;
    }
  });

  return {
    color: closestColor,
    distance: minDistance,
    confidence: calculateConfidence(minDistance)
  };
};

/**
 * Find closest parent color to given hex color with perceptual weighting
 * @param {string} hexColor - Source color in hex format
 * @param {Array} parentColors - Array of parent colors to match against
 * @returns {Object} - Matching result with color, distance and confidence
 */
export const findClosestParentColor = (hexColor, parentColors) => {
  if (!parentColors?.length) return null;

  // First, try to use the ML-enhanced matcher if it's available
  try {
    const colorMatcherService = useColorMatcherService();
    
    // Only use if initialized and trained
    if (colorMatcherService.isInitialized && colorMatcherService.matcher.modelTrained) {
      console.log('Using ML-enhanced color matcher');
      
      // Prepare the color from hex
      const targetColor = colorMatcherService.prepareColorFromHex(hexColor);
      
      // Get ML match
      const mlMatch = colorMatcherService.findClosestColor(hexColor);
      
      if (mlMatch && mlMatch.color) {
        // Return in the expected format
        return {
          color: mlMatch.color,
          distance: mlMatch.method === "ml_correction" ? 0 : mlMatch.distance,
          confidence: mlMatch.confidence,
          method: mlMatch.method
        };
      }
    }
  } catch (error) {
    console.warn('Error using ML color matcher, falling back to mathematical approach:', error);
    // Continue with traditional approach on error
  }

  // If ML approach fails or is not available, use traditional matching.
  // CIEDE2000 already weights lightness (its S_L term); the extra "perceptual
  // weighting" that used to sit here divided the distance by an ad-hoc factor
  // for very light/dark colours and double-counted it. Plain ΔE₀₀ only.

  let minDistance = Infinity;
  let closestColor = null;

  parentColors.forEach((parentColor) => {
    const distance = getColorDistance(hexColor, parentColor.hex);

    if (distance < minDistance) {
      minDistance = distance;
      closestColor = parentColor;
    }
  });

  return {
    color: closestColor,
    distance: minDistance,
    confidence: calculateConfidence(minDistance),
    method: "mathematical"
  };
};

/**
 * Analyze results to find problematic color matches
 * @param {Array} matches - Array of color matches
 * @param {number} threshold - Confidence threshold for problematic matches
 * @returns {Array} - Array of problematic matches
 */
const analyzeProblematicMatches = (matches, threshold = 20) => {
  return matches.filter(color => {
    const pantoneConfidence = color.pantone.confidence || 0;
    const parentConfidence = color.parent.confidence || 0;
    return pantoneConfidence < threshold || parentConfidence < threshold;
  });
};

/**
 * Main color matching function 
 * @param {Array} analyzedColors - Array of analyzed colors from image
 * @param {Array} parentColors - Array of parent colors to match against
 * @param {Object} options - Matching options ({ confidenceThreshold })
 * @returns {Object} - Matching results with colors, problematic matches and statistics
 */
export const matchColors = (
  analyzedColors,
  parentColors = [],
  options = {}
) => {
  const { confidenceThreshold = 20 } = options;

  // Process each color to find matches
  const matches = analyzedColors.map((color) => {
    const pantoneMatch = findClosestPantoneColor(color.color);
    const parentMatch = findClosestParentColor(color.color, parentColors);

    return {
      color: color.color,
      percentage: color.percentage,
      pantone: {
        name: pantoneMatch.color?.name || null,
        code: pantoneMatch.color?.pantone || null,
        hex: pantoneMatch.color ? `#${pantoneMatch.color.hex}` : color.color,
        distance: pantoneMatch.distance,
        confidence: pantoneMatch.confidence
      },
      parent: {
        name: parentMatch?.color?.name || null,
        hex: parentMatch?.color?.hex || color.color,
        distance: parentMatch?.distance || null,
        confidence: parentMatch?.confidence || 0
      }
    };
  });

  // Analyze matches and calculate statistics
  const problematicMatches = analyzeProblematicMatches(matches, confidenceThreshold);
  const averageConfidence = matches.reduce((acc, match) => {
    return acc + (match.pantone.confidence + match.parent.confidence) / 2;
  }, 0) / (matches.length || 1); // Avoid division by zero

  return {
    colors: matches,
    problematicMatches,
    averageConfidence: Math.round(averageConfidence * 100) / 100
  };
};
