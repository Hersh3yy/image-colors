// services/imageAnalyzerSupport.js
import { kmeans } from "ml-kmeans";
import chroma from "chroma-js";

// Constants
const MAX_IMAGE_SIZE = 800; // Maximum image dimension for processing
export const SAMPLE_SIZE = 80000; // Default number of pixels to sample
export const CHUNK_SIZE = 100000; // Chunk size for asynchronous processing

/**
 * Available color spaces for analysis
 * Keeping structure for future extensibility but focusing on LAB
 */
export const COLOR_SPACES = {
  RGB: "rgb",
  LAB: "lab", // Primary color space as per requirements
  LCH: "lch", // May be useful for future perceptual analysis
};

/**
 * Sample pixels from an image at regular intervals
 * @param {Array} pixels - Array of pixel RGB values
 * @param {Number} sampleSize - Number of pixels to sample
 * @returns {Array} - Sampled pixels
 */
export const samplePixels = (pixels, sampleSize) => {
  const sampledPixels = [];
  const step = Math.max(1, Math.floor(pixels.length / sampleSize));
  
  for (let i = 0; i < pixels.length; i += step) {
    sampledPixels.push(pixels[i]);
  }
  
  return sampledPixels;
};

/**
 * Convert pixels from RGB to specified color space
 * @param {Array} pixels - Array of RGB pixel values
 * @param {String} colorSpace - Target color space
 * @returns {Array} - Converted pixels
 */
export const convertPixelsToColorSpace = (pixels, colorSpace) => {
  return pixels.map(pixel => {
    const color = chroma(pixel[0], pixel[1], pixel[2]);
    
    switch (colorSpace) {
      case COLOR_SPACES.LAB:
        return color.lab();
      case COLOR_SPACES.LCH:
        return color.lch();
      default:
        return pixel; // RGB
    }
  });
};

/**
 * Convert centroid from specified color space back to RGB
 * @param {Array} centroid - Centroid coordinates in specified color space
 * @param {String} colorSpace - Source color space
 * @returns {Array} - RGB values
 */
export const convertCentroidToRGB = (centroid, colorSpace) => {
  try {
    switch (colorSpace) {
      case COLOR_SPACES.LAB:
        return chroma.lab(...centroid).rgb();
      case COLOR_SPACES.LCH:
        return chroma.lch(...centroid).rgb();
      default:
        return centroid; // Already RGB
    }
  } catch (error) {
    console.error('Error converting centroid:', error);
    return centroid; // Return original on error
  }
};

/**
 * Perform k-means clustering on pixels to find representative colors
 * @param {Array} pixels - Array of pixel values
 * @param {Object} options - Clustering options
 * @returns {Object} - K-means result with centroids
 */
export const performKMeans = (pixels, options = {}) => {
  const {
    k = 13,
    colorSpace = COLOR_SPACES.LAB, // Default to LAB as per requirements
    maxIterations = 30,
    tolerance = 1e-6
  } = options;

  console.time("kmeans");
  
  // Convert pixels to desired color space (primarily LAB)
  const convertedPixels = convertPixelsToColorSpace(pixels, colorSpace);
  
  // Perform k-means clustering
  const kmeansResult = kmeans(convertedPixels, k, {
    maxIterations,
    tolerance,
    initialization: "kmeans++", // Better initial centroids
  });

  // Convert centroids back to RGB for visualization
  kmeansResult.centroids = kmeansResult.centroids.map(
    centroid => convertCentroidToRGB(centroid, colorSpace)
  );

  console.timeEnd("kmeans");
  console.log("K-means clustering completed:", {
    iterations: kmeansResult.iterations,
    centroids: kmeansResult.centroids.length,
    colorSpace
  });
  
  return kmeansResult;
};

/**
 * Calculate color percentages in the image
 * @param {Array} pixels - All image pixels
 * @param {Array} centroids - Color centroids from k-means
 * @param {Function} findClosestCentroidIndex - Function to find closest centroid
 * @returns {Array} - Colors with percentages
 */
export const calculateColorPercentages = async (
  pixels,
  centroids,
  findClosestCentroidIndex
) => {
  console.log("Calculating color percentages");
  console.log("Processing pixels:", pixels.length);
  console.log("Using centroids:", centroids.length);

  const totalPoints = pixels.length;
  const labelCounts = new Array(centroids.length).fill(0);

  // Process pixels in chunks to avoid blocking the UI
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

  console.log("Pixel classification complete");

  // Convert centroids to hex colors and calculate percentages
  const colors = centroids.map((centroid, i) => {
    const [r, g, b] = centroid.map(Math.round);
    const colorHex = chroma(r, g, b).hex().toUpperCase();
    return {
      color: colorHex,
      percentage: (labelCounts[i] / totalPoints) * 100,
    };
  });

  console.log("Color percentages calculated");
  return colors;
};

/**
 * Calculate Euclidean distance between two points in RGB space
 * @param {Array} a - First point
 * @param {Array} b - Second point
 * @returns {Number} - Euclidean distance
 */
export const euclideanDistance = (a, b) => {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
  );
};

/**
 * Load image data from blob (legacy method, kept for compatibility)
 * @param {Blob} imageBlob - Image blob to process
 * @returns {Object} - Image data with pixels
 */
export const loadImageData = async (imageBlob) => {
  console.log("Legacy loadImageData called");
  console.log("Input imageBlob:", imageBlob);

  try {
    console.time("createImageBitmap");
    const image = await createImageBitmap(imageBlob);
    console.timeEnd("createImageBitmap");
    console.log("Created ImageBitmap:", {
      width: image.width,
      height: image.height,
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Resize the image if it's too large
    const { width, height } = calculateAspectRatioFit(
      image.width,
      image.height,
      MAX_IMAGE_SIZE,
      MAX_IMAGE_SIZE
    );
    canvas.width = width;
    canvas.height = height;

    console.log("Resized canvas dimensions:", {
      width: canvas.width,
      height: canvas.height,
    });

    // Draw image on canvas
    ctx.drawImage(image, 0, 0, width, height);
    
    // Get pixel data
    const imageData = ctx.getImageData(0, 0, width, height);
    console.log("Raw imageData dimensions:", {
      width: imageData.width,
      height: imageData.height,
      dataLength: imageData.data.length,
    });

    // Process pixels
    const pixels = [];
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      pixels.push([r, g, b]);
    }
    
    console.log("Processed pixels array length:", pixels.length);
    
    const result = { pixels, width, height };
    return result;
  } catch (error) {
    console.error("Error in loadImageData:", error);
    throw error;
  }
};

/**
 * Calculate dimensions that maintain aspect ratio within max bounds
 * @param {Number} srcWidth - Source width
 * @param {Number} srcHeight - Source height
 * @param {Number} maxWidth - Maximum width
 * @param {Number} maxHeight - Maximum height
 * @returns {Object} - New dimensions
 */
const calculateAspectRatioFit = (srcWidth, srcHeight, maxWidth, maxHeight) => {
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
  return { width: srcWidth * ratio, height: srcHeight * ratio };
};
