// services/imageAnalyzerSupport.js
import { kmeans } from "ml-kmeans";
import chroma from "chroma-js";

/**
 * =========================================
 * CONFIGURATION CONSTANTS
 * =========================================
 */
// Default maximum image dimension for processing (800px)
// This can be overridden by passing maxImageSize in analysis options
export const DEFAULT_MAX_IMAGE_SIZE = 800;

// Default number of pixels to sample from the image
// Higher values increase accuracy but decrease performance
export const SAMPLE_SIZE = 80000;

// Chunk size for asynchronous processing to prevent UI blocking
export const CHUNK_SIZE = 100000;

/**
 * Available color spaces
 * NOTE: Only LAB is fully supported for accurate perceptual analysis
 */
export const COLOR_SPACES = {
  RGB: "rgb", // Used for internal operations
  LAB: "lab", // Primary color space for analysis
};

/**
 * =========================================
 * PIXEL SAMPLING AND CONVERSION FUNCTIONS
 * =========================================
 */

/**
 * Sample pixels from an image at regular intervals to reduce processing load
 * This creates a representative subset of pixels for efficient analysis
 * 
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
 * Convert pixels from RGB to LAB color space for perceptual analysis
 * LAB is used because it's more perceptually uniform than RGB
 * 
 * @param {Array} pixels - Array of RGB pixel values
 * @param {String} colorSpace - Target color space (only LAB supported)
 * @returns {Array} - Converted pixels
 */
export const convertPixelsToColorSpace = (pixels, colorSpace) => {
  // Always convert to LAB regardless of colorSpace parameter
  return pixels.map(pixel => {
    const color = chroma(pixel[0], pixel[1], pixel[2]);
    return color.lab(); // Always use LAB
  });
};

/**
 * Convert centroid from LAB back to RGB for visualization
 * 
 * @param {Array} centroid - Centroid coordinates in LAB
 * @returns {Array} - RGB values
 */
export const convertCentroidToRGB = (centroid) => {
  try {
    return chroma.lab(...centroid).rgb();
  } catch (error) {
    console.error('Error converting centroid from LAB to RGB:', error);
    return centroid; // Return original on error
  }
};

/**
 * =========================================
 * CLUSTERING AND ANALYSIS FUNCTIONS
 * =========================================
 */

/**
 * Perform k-means clustering on pixels in LAB space
 * This identifies the most representative colors in the image
 * 
 * @param {Array} pixels - Array of pixel values
 * @param {Object} options - Clustering options
 * @returns {Object} - K-means result with centroids
 */
export const performKMeans = (pixels, options = {}) => {
  const {
    k = 13,
    colorSpace = COLOR_SPACES.LAB, // Only LAB is supported
    maxIterations = 30,
    tolerance = 1e-6
  } = options;

  console.time("kmeans");
  
  // Convert pixels to LAB color space
  const convertedPixels = convertPixelsToColorSpace(pixels, COLOR_SPACES.LAB);
  
  // Perform k-means clustering
  const kmeansResult = kmeans(convertedPixels, k, {
    maxIterations,
    tolerance,
    initialization: "kmeans++", // Better initial centroids
  });

  // Convert centroids back to RGB for visualization
  kmeansResult.centroids = kmeansResult.centroids.map(centroid => convertCentroidToRGB(centroid));

  console.timeEnd("kmeans");
  console.log("K-means clustering completed:", {
    iterations: kmeansResult.iterations,
    centroids: kmeansResult.centroids.length
  });
  
  return kmeansResult;
};

/**
 * Calculate color percentages in the image
 * This determines how prevalent each identified color is
 * 
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
  console.log(`Calculating percentages for ${centroids.length} colors from ${pixels.length} pixels`);

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

  // Convert centroids to hex colors and calculate percentages
  const colors = centroids.map((centroid, i) => {
    const [r, g, b] = centroid.map(Math.round);
    const colorHex = chroma(r, g, b).hex().toUpperCase();
    return {
      color: colorHex,
      percentage: (labelCounts[i] / totalPoints) * 100,
    };
  });

  return colors;
};

/**
 * Calculate Euclidean distance between two points in RGB space
 * Used for finding the closest centroid to each pixel
 * 
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
 * =========================================
 * IMAGE PROCESSING FUNCTIONS
 * =========================================
 */

/**
 * Load image data from blob (legacy method, kept for compatibility)
 * New code should use loadImageDataWithAlpha from colorAnalysis.js instead
 * 
 * @param {Blob} imageBlob - Image blob to process
 * @param {Object} options - Processing options
 * @returns {Object} - Image data with pixels
 */
export const loadImageData = async (imageBlob, options = {}) => {
  console.log("Legacy loadImageData called");
  console.log("Input imageBlob:", imageBlob);

  // Get maximum image size from options or use default
  const maxImageSize = options.maxImageSize || DEFAULT_MAX_IMAGE_SIZE;

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
      maxImageSize,
      maxImageSize
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
 * Used to resize images while preserving proportions
 * 
 * @param {Number} srcWidth - Source width
 * @param {Number} srcHeight - Source height
 * @param {Number} maxWidth - Maximum width
 * @param {Number} maxHeight - Maximum height
 * @returns {Object} - New dimensions
 */
export const calculateAspectRatioFit = (srcWidth, srcHeight, maxWidth, maxHeight) => {
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
  return { width: srcWidth * ratio, height: srcHeight * ratio };
};
