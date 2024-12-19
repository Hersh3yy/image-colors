// services/colorAnalysis.js
import {
  loadImageData,
  samplePixels,
  performKMeans,
  calculateColorPercentages,
  euclideanDistance,
  SAMPLE_SIZE,
} from './imageAnalyzerSupport'
import { COLOR_SPACES } from './imageAnalyzerSupport'
import chroma from 'chroma-js'

// Modified loadImageData to include alpha channel
export const loadImageDataWithAlpha = async (imageBlob) => {
  console.log("loadImageDataWithAlpha started")

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
    console.log("Got image data, length:", imageData.data.length)

    // Process pixels including alpha
    const pixels = []
    let transparentPixels = 0
    let opaquePixels = 0

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
      opaque: opaquePixels,
      pixelsLength: pixels.length
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

export const getImageColors = async (imageBlob, options = {}) => {
  const {
    sampleSize = SAMPLE_SIZE,
    k = 13,
    colorSpace = COLOR_SPACES.RGB
  } = options

  console.log("Starting getImageColors with options:", { sampleSize, k, colorSpace })

  try {
    // Use modified image loader that handles transparency
    const imageData = await loadImageDataWithAlpha(imageBlob)
    console.log("Loaded image data:", {
      pixelCount: imageData.pixels.length,
      transparent: imageData.stats.transparentPixels,
      opaque: imageData.stats.opaquePixels
    })

    // Check if we have enough opaque pixels
    if (imageData.pixels.length === 0) {
      console.log("No opaque pixels found in image")
      return []
    }

    // Sample the opaque pixels
    const effectiveSampleSize = Math.min(sampleSize, imageData.pixels.length)
    console.log("Using sample size:", effectiveSampleSize)

    const sampledPixels = samplePixels(imageData.pixels, effectiveSampleSize)
    console.log("Sampled pixels count:", sampledPixels.length)

    // Perform k-means clustering
    const kmeansResult = performKMeans(sampledPixels, {
      k,
      colorSpace,
    })
    console.log("K-means complete, centroids:", kmeansResult.centroids.length)

    // Calculate color percentages
    const colors = await calculateColorPercentages(
      imageData.pixels,
      kmeansResult.centroids,
      (pixel, centroids) => {
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

    console.log("Final colors:", result)
    return result

  } catch (error) {
    console.error("Error in getImageColors:", error)
    throw error
  }
}

export const utils = {
  loadImageDataWithAlpha
}