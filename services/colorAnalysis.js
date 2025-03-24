// services/colorAnalysis.js
import {
  samplePixels,
  performKMeans,
  calculateColorPercentages,
  euclideanDistance,
  SAMPLE_SIZE,
  COLOR_SPACES,
  DEFAULT_MAX_IMAGE_SIZE,
  calculateAspectRatioFit
} from './imageAnalyzerSupport'

/**
 * =========================================
 * IMAGE LOADING AND PREPROCESSING
 * =========================================
 */

/**
 * Load image data including alpha channel information
 * This improved method properly handles transparent pixels
 * 
 * @param {Blob} imageBlob - Image blob to process
 * @param {Object} options - Image processing options 
 * @returns {Object} - Object with pixels array and image metadata
 */
export const loadImageDataWithAlpha = async (imageBlob, options = {}) => {
  console.log("Loading image data with alpha channel")

  // Get maximum image size from options or use default
  const maxImageSize = options.maxImageSize || DEFAULT_MAX_IMAGE_SIZE;
  console.log(`Using max image size: ${maxImageSize}px`);

  try {
    // Create ImageBitmap from blob
    const image = await createImageBitmap(imageBlob)
    console.log("Original image dimensions:", { width: image.width, height: image.height })

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    // Resize the image if it's too large while maintaining aspect ratio
    const { width, height } = calculateAspectRatioFit(
      image.width,
      image.height,
      maxImageSize,
      maxImageSize
    );
    
    // Set canvas size to the calculated dimensions
    canvas.width = width;
    canvas.height = height;
    console.log("Resized image dimensions:", { width, height })

    // Draw image on canvas with the new dimensions
    ctx.drawImage(image, 0, 0, width, height)

    // Get image data including alpha channel
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // Process pixels including alpha
    const pixels = []
    let transparentPixels = 0
    let opaquePixels = 0

    // Extract RGB values for non-transparent pixels
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i]
      const g = imageData.data[i + 1]
      const b = imageData.data[i + 2]
      const a = imageData.data[i + 3]  // Alpha channel

      // Only include pixels with sufficient opacity
      if (a > 25) {  // Threshold for considering a pixel opaque
        pixels.push([r, g, b])
        opaquePixels++
      } else {
        transparentPixels++
      }
    }

    console.log("Pixel processing complete:", {
      total: imageData.data.length / 4,
      transparent: transparentPixels,
      opaque: opaquePixels
    })

    return {
      pixels,
      width: canvas.width,
      height: canvas.height,
      stats: {
        transparentPixels,
        opaquePixels,
        originalWidth: image.width,
        originalHeight: image.height,
        resizedWidth: width,
        resizedHeight: height,
        compressionRatio: (width * height) / (image.width * image.height)
      }
    }
  } catch (error) {
    console.error("Error in loadImageDataWithAlpha:", error)
    throw error
  }
}

/**
 * =========================================
 * COLOR EXTRACTION AND ANALYSIS
 * =========================================
 */

/**
 * Extract representative colors from image using k-means clustering in LAB space
 * This is the main function for analyzing image colors
 * 
 * @param {Blob} imageBlob - Image blob to analyze
 * @param {Object} options - Analysis options
 * @returns {Array} - Array of representative colors with percentages
 */
export const getImageColors = async (imageBlob, options = {}) => {
  // Extract and normalize options
  const {
    sampleSize = SAMPLE_SIZE,
    k = 13,
    maxImageSize = DEFAULT_MAX_IMAGE_SIZE,
    maxIterations = 30,
    colorSpace = COLOR_SPACES.LAB // Force LAB color space
  } = options;

  console.log("Extracting colors from image using LAB color space with options:", {
    sampleSize,
    k, // This is the number of colors to extract
    maxImageSize,
    maxIterations
  });

  try {
    // Load image data with alpha channel handling and resizing
    const imageData = await loadImageDataWithAlpha(imageBlob, { maxImageSize });
    
    // Check if we have enough opaque pixels
    if (imageData.pixels.length === 0) {
      console.warn("No opaque pixels found in image")
      return []
    }

    // Sample the opaque pixels to reduce processing time
    const effectiveSampleSize = Math.min(sampleSize, imageData.pixels.length)
    console.log(`Sampling ${effectiveSampleSize} pixels from ${imageData.pixels.length} total opaque pixels`)
    
    const sampledPixels = samplePixels(imageData.pixels, effectiveSampleSize)

    // Perform k-means clustering in LAB color space
    // Use the user-specified k value (number of colors)
    console.log(`Using k=${k} for color clustering (user-specified number of colors)`)
    const kmeansResult = performKMeans(sampledPixels, {
      k, 
      colorSpace: COLOR_SPACES.LAB, // Force LAB color space
      maxIterations
    });
    
    console.log(`K-means clustering complete: found ${kmeansResult.centroids.length} color clusters in ${kmeansResult.iterations} iterations`);

    // Calculate the percentage of each color in the image
    const colors = await calculateColorPercentages(
      imageData.pixels,
      kmeansResult.centroids,
      (pixel, centroids) => {
        // Find the closest centroid to this pixel
        let minDistance = Infinity
        let closestIndex = 0

        centroids.forEach((centroid, index) => {
          const distance = euclideanDistance(pixel, centroid)
          if (distance < minDistance) {
            minDistance = distance
            closestIndex = index
          }
        })

        return closestIndex
      }
    )

    // Sort colors by percentage and format result
    const result = colors
      .map((color) => ({
        color: color.color,
        percentage: Number(color.percentage.toFixed(2))
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .filter(color => color.percentage > 0)

    console.log(`Found ${result.length} distinct colors in the image`);
    return result;

  } catch (error) {
    console.error("Error in getImageColors:", error)
    throw error
  }
}

// Export utilities for testing and extensibility
export const utils = {
  loadImageDataWithAlpha
}