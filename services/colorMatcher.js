// services/colorMatcher.js
import chroma from "chroma-js";
import processedColors from "@/assets/processed_colors.json";

// Define distance calculation methods
export const DISTANCE_METHODS = {
  LAB: 'lab',
  HSL: 'hsl',
  DELTA_E: 'deltaE'
};

// Helper function to calculate color distance based on chosen method
const getColorDistance = (color1, color2, method = DISTANCE_METHODS.LAB) => {
  const c1 = chroma(color1);
  const c2 = chroma(color2);

  switch (method) {
    case DISTANCE_METHODS.DELTA_E:
      return c1.deltaE(c2);
    case DISTANCE_METHODS.HSL: {
      const [h1, s1, l1] = c1.hsl();
      const [h2, s2, l2] = c2.hsl();
      // Custom HSL distance calculation
      const dh = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2)) / 180.0;
      const ds = Math.abs(s1 - s2);
      const dl = Math.abs(l1 - l2);
      return Math.sqrt(dh * dh + ds * ds + dl * dl);
    }
    case DISTANCE_METHODS.LAB:
    default:
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

export const matchColors = (
  analyzedColors, 
  parentColors = [], 
  options = { distanceMethod: DISTANCE_METHODS.LAB }
) => {
  const { distanceMethod } = options;

  return analyzedColors.map((color) => {
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
};
