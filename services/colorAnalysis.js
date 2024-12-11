// services/colorAnalysis.js
import {
  loadImageData,
  samplePixels,
  performKMeans,
  calculateColorPercentages,
  euclideanDistance,
  SAMPLE_SIZE,
} from "./imageAnalyzerSupport";
import { COLOR_SPACES } from "./imageAnalyzerSupport";

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

export const getImageColors = async (imageBlob, options = {}) => {
  const {
    sampleSize = SAMPLE_SIZE,
    k = 13,
    colorSpace = COLOR_SPACES.RGB
  } = options;

  try {
    const imageData = await loadImageData(imageBlob);
    const sampledPixels = samplePixels(imageData.pixels, sampleSize);
    const kmeansResult = performKMeans(sampledPixels, {
      k,
      colorSpace,
    });

    const colors = await calculateColorPercentages(
      imageData.pixels,
      kmeansResult.centroids,
      findClosestCentroidIndex
    );

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
