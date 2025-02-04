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

export const findClosestPantoneColor = (hexColor, distanceMethod = DISTANCE_METHODS.LAB) => {
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
  };
};

export const findClosestParentColor = (hexColor, parentColors, distanceMethod = DISTANCE_METHODS.LAB) => {
  if (!parentColors?.length) return null;

  let minDistance = Infinity;
  let closestColor = null;

  parentColors.forEach((parentColor) => {
    const distance = getColorDistance(hexColor, parentColor.hex, distanceMethod);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = parentColor;
    }
  });

  return {
    color: closestColor,
    distance: minDistance,
  };
};

// New function to filter problematic matches
const filterProblematicMatches = (analyzedColors, threshold = 20) => {
  return analyzedColors.filter(color => {
    const pantoneDistance = color.pantone.distance || Infinity;
    const parentDistance = color.parent.distance || Infinity;
    return pantoneDistance > threshold || parentDistance > threshold;
  });
};

export const matchColors = (
  analyzedColors, 
  parentColors = [], 
  options = { distanceMethod: DISTANCE_METHODS.LAB }
) => {
  const { distanceMethod } = options;

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
      },
      parent: {
        name: parentMatch?.color?.name || null,
        hex: parentMatch?.color?.hex || color.color,
        distance: parentMatch?.distance || null,
      },
    };
  });

  // Filter problematic matches for AI analysis
  const problematicMatches = filterProblematicMatches(matches);

  // Here you can send problematicMatches to the AI for further analysis
  // ...

  return matches;
};
