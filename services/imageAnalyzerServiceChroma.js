import {
  samplePixels,
  performKMeans,
  calculateColorPercentages,
  euclideanDistance,
  SAMPLE_SIZE,
} from "./imageAnalyzerSupport.js";
import chroma from "chroma-js";

export const analyzeImageChroma = async (imageData) => {
  console.log("analyzeImageChroma started");
  console.log("Input imageData:", imageData);

  if (!imageData) {
    throw new Error("imageData is undefined");
  }

  if (!imageData.pixels || !Array.isArray(imageData.pixels)) {
    throw new Error("imageData.pixels is not an array");
  }

  console.log("Input imageData:", {
    ...imageData,
    pixels: imageData.pixels.length + " pixels",
  });

  const sampledPixels = samplePixels(imageData.pixels, SAMPLE_SIZE);
  const kmeansResult = performKMeans(sampledPixels);

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

  const analyzedColors = await calculateColorPercentages(
    imageData.pixels,
    kmeansResult.centroids,
    findClosestCentroidIndex
  );

  return analyzedColors;
};

export const getClosestParentColorChroma = (color, parentColors) => {
  let minDistance = Infinity;
  let closestParentColor = null;
  parentColors.forEach((parentColor) => {
    const distance = chroma.distance(color, parentColor.hex, "lab");
    if (distance < minDistance) {
      minDistance = distance;
      closestParentColor = parentColor;
    }
  });
  return closestParentColor ? closestParentColor.name : null;
};
