// services/colorAnalysis.js
import {
  loadImageData,
  samplePixels,
  performKMeans,
  calculateColorPercentages,
  euclideanDistance,
  SAMPLE_SIZE,
} from "./imageAnalyzerSupport";

const findClosestCentroidIndex = (pixel, centroids) => {
  let minDistance = Infinity;
  let closestIndex = 0;

  centroids.forEach((centroid, index) => {
    const distance = euclideanDistance(pixel, centroid);
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
};

export const getImageColors = async (imageBlob) => {
  try {
    const imageData = await loadImageData(imageBlob);
    const sampledPixels = samplePixels(imageData.pixels, SAMPLE_SIZE);
    const kmeansResult = performKMeans(sampledPixels);

    const colors = await calculateColorPercentages(
      imageData.pixels,
      kmeansResult.centroids,
      findClosestCentroidIndex
    );

    // Return raw color data
    return colors.map((color) => ({
      color: color.color,
      percentage: color.percentage,
    }));
  } catch (error) {
    console.error("Error in color analysis:", error);
    throw error;
  }
};

// Export other helper functions if needed externally
export const utils = {
  findClosestCentroidIndex,
};
