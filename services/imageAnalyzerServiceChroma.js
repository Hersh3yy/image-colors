import { kmeans } from "ml-kmeans";
import chroma from "chroma-js";

const SAMPLE_SIZE = 10000;
const CHUNK_SIZE = 100000;

/**
 * Analyzes an image using the Chroma color analysis method
 * @param {Object} imageData - Object containing pixel data and dimensions
 * @param {Array} parentColors - Array of parent color objects with name and hex properties
 * @returns {Promise<Array>} Array of analyzed colors with percentages and closest parent colors
 */
export const analyzeImageChroma = async (imageData, parentColors) => {
  console.log("analyzeImageChroma started");
  console.log("Input imageData:", {
    ...imageData,
    pixels: imageData.pixels.length + " pixels",
  });
  console.log("Parent colors:", parentColors);

  // Sample the pixels to reduce processing time
  const sampledPixels = samplePixels(imageData.pixels, SAMPLE_SIZE);

  console.time("kmeans");
  const kmeansResult = kmeans(sampledPixels, 13, {
    maxIterations: 30,
    tolerance: 1e-6,
    initialization: "kmeans++",
  });
  console.timeEnd("kmeans");

  console.log("kmeans result:", {
    ...kmeansResult,
    centroids: kmeansResult.centroids.length + " centroids",
  });

  console.time("calculateColorPercentagesChroma");
  const analyzedColors = await calculateColorPercentagesChroma(
    imageData.pixels,
    kmeansResult.centroids,
    parentColors
  );
  console.timeEnd("calculateColorPercentagesChroma");

  console.log("analyzedColors result:", analyzedColors);
  return analyzedColors;
};

/**
 * Samples pixels from the input array to reduce processing time
 * @param {Array} pixels - Array of pixel color values
 * @param {number} sampleSize - Number of pixels to sample
 * @returns {Array} Array of sampled pixels
 */
const samplePixels = (pixels, sampleSize) => {
  const sampledPixels = [];
  const step = Math.max(1, Math.floor(pixels.length / sampleSize));
  for (let i = 0; i < pixels.length; i += step) {
    sampledPixels.push(pixels[i]);
  }
  return sampledPixels;
};

/**
 * Calculates color percentages and finds closest parent colors
 * @param {Array} pixels - Array of pixel color values
 * @param {Array} centroids - Array of centroid color values from k-means clustering
 * @param {Array} parentColors - Array of parent color objects
 * @returns {Promise<Array>} Array of analyzed colors with percentages and closest parent colors
 */
const calculateColorPercentagesChroma = async (
  pixels,
  centroids,
  parentColors
) => {
  console.log("calculateColorPercentagesChroma started");
  console.log("Number of pixels:", pixels.length);
  console.log("Number of centroids:", centroids.length);
  console.log("Parent colors:", parentColors);

  const totalPoints = pixels.length;
  const labelCounts = new Array(centroids.length).fill(0);

  for (let i = 0; i < pixels.length; i += CHUNK_SIZE) {
    const chunk = pixels.slice(i, i + CHUNK_SIZE);
    await new Promise((resolve) => {
      setTimeout(() => {
        chunk.forEach((pixel) => {
          const closestCentroidIndex = findClosestCentroidIndex(
            pixel,
            centroids
          );
          labelCounts[closestCentroidIndex]++;
        });
        resolve();
      }, 0);
    });
  }

  console.log("Label counts:", labelCounts);

  const results = centroids.map((centroid, i) => {
    const [r, g, b] = centroid.map(Math.round);
    const colorHex = chroma(r, g, b).hex().toUpperCase();
    console.log(`Finding closest parent color for: ${colorHex}`);
    const closestParent = findClosestParentColor(colorHex, parentColors);

    return {
      color: colorHex,
      percentage: (labelCounts[i] / totalPoints) * 100,
      closestParentColor: closestParent.name,
      closestParentHex: closestParent.hex,
    };
  });

  console.log("Analyzed colors with parent colors:", results);
  return results;
};


/**
 * Finds the index of the closest centroid to a given pixel
 * @param {Array} pixel - RGB values of a pixel
 * @param {Array} centroids - Array of centroid color values
 * @returns {number} Index of the closest centroid
 */
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


/**
 * Calculates the Euclidean distance between two points in 3D space (RGB values)
 * @param {Array} a - First point (RGB values)
 * @param {Array} b - Second point (RGB values)
 * @returns {number} Euclidean distance between the two points
 */
const euclideanDistance = (a, b) => {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
  );
};

/**
 * Finds the closest parent color to a given color
 * @param {string} color - Hex code of the color to match
 * @param {Array} parentColors - Array of parent color objects
 * @returns {Object} Object containing the name and hex of the closest parent color
 */
const findClosestParentColor = (color, parentColors) => {
  console.log(`Finding closest parent color for: ${color}`);
  console.log("Available parent colors:", parentColors);

  if (!parentColors || parentColors.length === 0) {
    console.warn("No parent colors provided");
    return { name: null, hex: null };
  }

  let minDistance = Infinity;
  let closestParentColor = null;

  parentColors.forEach((parentColor) => {
    const distance = chroma.distance(color, parentColor.hex, "lab");
    console.log(
      `Distance to ${parentColor.name} (${parentColor.hex}): ${distance}`
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestParentColor = parentColor;
    }
  });

  console.log(
    `Closest parent color: ${closestParentColor.name} (${closestParentColor.hex})`
  );
  return { name: closestParentColor.name, hex: closestParentColor.hex };
};
