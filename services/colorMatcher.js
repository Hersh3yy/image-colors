// services/colorMatcher.js
import chroma from "chroma-js";
import processedColors from "@/assets/processed_colors.json";

export const findClosestPantoneColor = (hexColor) => {
  let minDistance = Infinity;
  let closestColor = null;

  processedColors.forEach((pantoneColor) => {
    const distance = chroma.distance(hexColor, `#${pantoneColor.hex}`, "lab");
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

export const findClosestParentColor = (hexColor, parentColors) => {
  if (!parentColors?.length) return null;

  let minDistance = Infinity;
  let closestColor = null;

  parentColors.forEach((parentColor) => {
    const distance = chroma.distance(hexColor, parentColor.hex, "lab");
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

export const matchColors = (analyzedColors, parentColors = []) => {
  return analyzedColors.map((color) => {
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
      },
      parent: {
        name: parentMatch?.color?.name || null,
        hex: parentMatch?.color?.hex || color.color,
        distance: parentMatch?.distance || null,
      },
    };
  });
};
