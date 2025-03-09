// services/colorMatcher.js
import chroma from "chroma-js";
import processedColors from "@/assets/processed_colors.json";

// Define distance calculation methods - keep this for future extensibility
export const DISTANCE_METHODS = {
  DELTA_E: 'deltaE',
  LAB: 'lab',
  // HSL removed as per requirements, but structure kept for future extensions
};

/**
 * Calculate color distance using specified method
 * @param {string} color1 - First color in hex format
 * @param {string} color2 - Second color in hex format
 * @param {string} method - Distance calculation method
 * @returns {number} - Distance between colors
 */
const getColorDistance = (color1, color2, method = DISTANCE_METHODS.DELTA_E) => {
  const c1 = chroma(color1);
  const c2 = chroma(color2);

  switch (method) {
    case DISTANCE_METHODS.DELTA_E:
      return chroma.deltaE(c1, c2);
    case DISTANCE_METHODS.LAB:
      return chroma.distance(color1, color2, 'lab');
    default:
      return chroma.deltaE(c1, c2); // Default to Delta E
  }
};

/**
 * Calculate confidence score based on distance
 * @param {number} distance - Color distance
 * @param {number} threshold - Confidence threshold
 * @returns {number} - Confidence score (0-100)
 */
const calculateConfidence = (distance, threshold = 20) => {
  // Lower distance = higher confidence
  const score = Math.max(0, 100 - (distance / threshold) * 100);
  return Math.round(score * 100) / 100; // Round to 2 decimal places
};

/**
 * Find closest Pantone color to given hex color
 * @param {string} hexColor - Source color in hex format
 * @param {string} distanceMethod - Method to calculate color distance
 * @returns {Object} - Matching result with color, distance and confidence
 */
export const findClosestPantoneColor = (hexColor, distanceMethod = DISTANCE_METHODS.DELTA_E) => {
  let minDistance = Infinity;
  let closestColor = null;

  // Iterate through all Pantone colors to find closest match
  processedColors.forEach((pantoneColor) => {
    const distance = getColorDistance(hexColor, `#${pantoneColor.hex}`, distanceMethod);
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
 * @param {string} distanceMethod - Method to calculate color distance
 * @returns {Object} - Matching result with color, distance and confidence
 */
export const findClosestParentColor = (hexColor, parentColors, distanceMethod = DISTANCE_METHODS.DELTA_E) => {
  if (!parentColors?.length) return null;

  let minDistance = Infinity;
  let closestColor = null;

  // Get color properties in LAB space for perceptual analysis
  const sourceColor = chroma(hexColor);
  const [l, a, b] = sourceColor.lab();

  parentColors.forEach((parentColor) => {
    // Calculate base color distance
    let distance = getColorDistance(hexColor, parentColor.hex, distanceMethod);

    // Get target color properties
    const targetColor = chroma(parentColor.hex);
    const [targetL, targetA, targetB] = targetColor.lab();

    // Apply perceptual weighting for better human perception matching
    let weightMultiplier = 1.0;

    // For very light or very dark colors, prioritize lightness matching
    if (l > 80 || l < 20) {
      weightMultiplier *= (1 - Math.min(0.5, Math.abs(l - targetL) / 100));
    }

    // Adjust distance - lower is better, so we divide by the weight
    if (weightMultiplier < 1.0) {
      distance = distance / weightMultiplier;
    }

    if (distance < minDistance) {
      minDistance = distance;
      closestColor = parentColor;
    }
  });

  return {
    color: closestColor,
    distance: minDistance,
    confidence: calculateConfidence(minDistance)
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
 * @param {Object} options - Matching options (distanceMethod, confidenceThreshold)
 * @returns {Object} - Matching results with colors, problematic matches and statistics
 */
export const matchColors = (
  analyzedColors,
  parentColors = [],
  options = {
    distanceMethod: DISTANCE_METHODS.DELTA_E,
    confidenceThreshold: 20
  }
) => {
  const { distanceMethod, confidenceThreshold } = options;

  // Process each color to find matches
  const matches = analyzedColors.map((color) => {
    const pantoneMatch = findClosestPantoneColor(color.color, distanceMethod);
    const parentMatch = findClosestParentColor(color.color, parentColors, distanceMethod);

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
