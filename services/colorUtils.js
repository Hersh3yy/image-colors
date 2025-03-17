import chroma from "chroma-js";

/**
 * Calculates the confidence score based on color distance
 * @param {number} distance - The distance between two colors
 * @param {number} threshold - The confidence threshold
 * @returns {number} - A confidence score from 0-100
 */
export const calculateConfidence = (distance, threshold = 20) => {
  // Lower distance = higher confidence
  const score = Math.max(0, 100 - (distance / threshold) * 100);
  return Math.round(score * 100) / 100; // Round to 2 decimal places
};

/**
 * Gets the confidence level class for UI visualization
 * @param {number} confidence - The confidence score (0-100)
 * @returns {string} - CSS class name for the confidence level
 */
export const getConfidenceClass = (confidence) => {
  if (confidence >= 80) return 'bg-green-500';
  if (confidence >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
};

/**
 * Groups colors by their parent color
 * @param {Object} image - The image object with colors data
 * @returns {Array} - Array of color groups with their percentages
 */
export const groupColors = (image) => {
  if (!image?.colors) return [];
  
  let colorGroups = [];

  for (let color of image.colors) {
    let parent = color.parent.name || "Undefined Colors";

    let group = colorGroups.find((g) => g.colorGroup === parent);
    if (group) {
      group.colors.push(color);
      group.totalPercentage += color.percentage;
    } else {
      colorGroups.push({
        colorGroup: parent,
        colors: [color],
        totalPercentage: color.percentage,
        hexColor: color.parent.hex || color.color,
      });
    }
  }

  return colorGroups.sort((a, b) => b.totalPercentage - a.totalPercentage);
};

/**
 * Groups colors across multiple images
 * @param {Array} images - Array of image objects with colors
 * @returns {Array} - Array of color groups with their percentages
 */
export const groupColorsAcrossImages = (images) => {
  if (!images?.length) return [];
  
  const groups = new Map();

  images.forEach((image) => {
    if (!image.colors) return;
    
    image.colors.forEach((color) => {
      const parentName = color.parent.name;
      if (!parentName) return;

      if (!groups.has(parentName)) {
        groups.set(parentName, {
          colorGroup: parentName,
          colors: [],
          totalPercentage: 0,
          hexColor: color.parent.hex,
        });
      }

      const group = groups.get(parentName);
      group.colors.push(color);
      group.totalPercentage += color.percentage / images.length;
    });
  });

  return Array.from(groups.values()).sort(
    (a, b) => b.totalPercentage - a.totalPercentage
  );
};

/**
 * Calculates total color percentages across multiple images
 * @param {Array} images - Array of image objects
 * @returns {Array} - Array of colors with aggregated percentages
 */
export const calculateTotalColorPercentages = (images) => {
  if (!images?.length) return [];

  const colorMap = new Map();
  
  images.forEach((image) => {
    if (!image.colors) return;

    image.colors.forEach(color => {
      const key = color.color;

      if (!colorMap.has(key)) {
        colorMap.set(key, {
          color: color.color,
          percentage: color.percentage / images.length,
          pantone: color.pantone,
          parent: color.parent
        });
      } else {
        const existing = colorMap.get(key);
        existing.percentage += color.percentage / images.length;
      }
    });
  });

  return Array.from(colorMap.values())
    .sort((a, b) => b.percentage - a.percentage);
};

/**
 * Creates chart data for the grouped colors doughnut chart
 * @param {Array} groupedColorsData - The grouped colors data
 * @returns {Object|null} - Chart data object or null if no data
 */
export const createGroupedChartData = (groupedColorsData) => {
  if (!groupedColorsData?.length) return null;

  return {
    labels: groupedColorsData.map(
      group => `${group.colorGroup} (${group.totalPercentage.toFixed(1)}%)`
    ),
    datasets: [
      {
        // Parent colors
        data: groupedColorsData.map(group => group.totalPercentage),
        backgroundColor: groupedColorsData.map(group => group.hexColor),
      },
      {
        // Child colors with enriched data
        data: groupedColorsData.flatMap(group => 
          group.colors.map(color => color.percentage)
        ),
        backgroundColor: groupedColorsData.flatMap(group => 
          group.colors.map(color => color.color)
        ),
        metadata: groupedColorsData.flatMap(group => 
          group.colors.map(color => ({
            parentName: group.colorGroup,
            parentHex: group.hexColor,
            pantone: color.pantone,
            name: color.pantone?.name || 'Unknown',
            hex: color.color,
            distance: color.pantone?.distance || 0,
            confidence: color.pantone?.confidence || 0
          }))
        )
      }
    ]
  };
}; 