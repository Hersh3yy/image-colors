// services/colorMatcher.js
import chroma from "chroma-js";
import processedColors from "@/assets/processed_colors.json";

// Define distance calculation methods
export const DISTANCE_METHODS = {
  DELTA_E: 'deltaE',
  LAB: 'lab',
  HSL: 'hsl',
};

// Helper function to calculate color distance based on chosen method
const getColorDistance = (color1, color2, method = DISTANCE_METHODS.DELTA_E) => {
  const c1 = chroma(color1);
  const c2 = chroma(color2);

  switch (method) {
    case DISTANCE_METHODS.DELTA_E:
      return chroma.deltaE(c1, c2);
    case DISTANCE_METHODS.HSL:
      return chroma.distance(c1, c2, 'hsl')
    case DISTANCE_METHODS.LAB:
      return chroma.distance(color1, color2, 'lab');
  }
};

// Calculate confidence score based on distance
const calculateConfidence = (distance, threshold = 20) => {
  // Convert distance to a 0-100 confidence score
  // Lower distance = higher confidence
  const score = Math.max(0, 100 - (distance / threshold) * 100);
  return Math.round(score * 100) / 100; // Round to 2 decimal places
};

// Enhanced Pantone color matching with confidence scores
export const findClosestPantoneColor = (hexColor, distanceMethod = DISTANCE_METHODS.DELTA_E) => {
  let minDistance = Infinity;
  let closestColor = null;

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

// Enhanced parent color matching with weights
export const findClosestParentColor = (hexColor, parentColors, distanceMethod = DISTANCE_METHODS.DELTA_E) => {
  if (!parentColors?.length) return null;

  let minDistance = Infinity;
  let closestColor = null;

  // Get color properties
  const sourceColor = chroma(hexColor);
  const [l, c, h] = sourceColor.lch();

  parentColors.forEach((parentColor) => {
    // Calculate base distance
    let distance = getColorDistance(hexColor, parentColor.hex, distanceMethod);

    // Get target color properties
    const targetColor = chroma(parentColor.hex);
    const [targetL, targetC, targetH] = targetColor.lch();

    // Apply weighting adjustments
    let weightMultiplier = 1.0;

    // For very light or very dark colors, prioritize lightness matching
    if (l > 80 || l < 20) {
      // Increase weight for colors with similar lightness
      weightMultiplier *= (1 - Math.min(0.5, Math.abs(l - targetL) / 100));
    }

    // For saturated colors, prioritize chroma matching
    if (c > 50) {
      // Increase weight for colors with similar chroma
      weightMultiplier *= (1 - Math.min(0.5, Math.abs(c - targetC) / 100));
    }

    // Adjust distance - lower is better, so we divide by the weight
    // This means similar colors in our priority dimensions get smaller distances
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

// Filter and analyze problematic matches
const analyzeProblematicMatches = (matches, threshold = 20) => {
  return matches.filter(color => {
    const pantoneConfidence = color.pantone.confidence || 0;
    const parentConfidence = color.parent.confidence || 0;
    return pantoneConfidence < threshold || parentConfidence < threshold;
  });
};

// Main color matching function with enhanced analysis
export const matchColors = (
  analyzedColors,
  parentColors = [],
  options = {
    distanceMethod: DISTANCE_METHODS.DELTA_E,
    confidenceThreshold: 20
  }
) => {
  const { distanceMethod, confidenceThreshold } = options;

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
  }, 0) / matches.length;

  return {
    colors: matches,
    problematicMatches,
    averageConfidence: Math.round(averageConfidence * 100) / 100
  };
};
