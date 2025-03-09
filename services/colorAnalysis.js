// services/colorAnalysis.js
import {
  samplePixels,
  performKMeans,
  calculateColorPercentages,
  euclideanDistance,
  SAMPLE_SIZE,
  COLOR_SPACES
} from './imageAnalyzerSupport'

/**
 * Load image data including alpha channel information
 * @param {Blob} imageBlob - Image blob to process
 * @returns {Object} - Object with pixels array and image metadata
 */
export const loadImageDataWithAlpha = async (imageBlob) => {
  console.log("Loading image data with alpha channel")

  try {
    const image = await createImageBitmap(imageBlob)
    console.log("Image dimensions:", { width: image.width, height: image.height })

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    // Set canvas size
    canvas.width = image.width
    canvas.height = image.height

    // Draw image
    ctx.drawImage(image, 0, 0)

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
        opaquePixels
      }
    }
  } catch (error) {
    console.error("Error in loadImageDataWithAlpha:", error)
    throw error
  }
}

/**
 * Extract representative colors from image using k-means clustering in LAB space
 * @param {Blob} imageBlob - Image blob to analyze
 * @param {Object} options - Analysis options
 * @returns {Array} - Array of representative colors with percentages
 */
export const getImageColors = async (imageBlob, options = {}) => {
  // Always use LAB color space regardless of what's passed
  const {
    sampleSize = SAMPLE_SIZE,
    k = 13,
    colorSpace = COLOR_SPACES.LAB // Force LAB color space
  } = options

  console.log("Extracting colors from image using LAB color space")

  try {
    // Load image data with alpha channel handling
    const imageData = await loadImageDataWithAlpha(imageBlob)
    
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
    const kmeansResult = performKMeans(sampledPixels, {
      k, 
      colorSpace: COLOR_SPACES.LAB, // Force LAB color space
    })
    console.log(`K-means clustering complete, found ${kmeansResult.centroids.length} color clusters`)

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

    console.log(`Found ${result.length} distinct colors in the image`)
    return result

  } catch (error) {
    console.error("Error in getImageColors:", error)
    throw error
  }
}

// Export utilities for testing and extensibility
export const utils = {
  loadImageDataWithAlpha
}