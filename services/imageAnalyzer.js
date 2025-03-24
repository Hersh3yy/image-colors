// services/imageAnalyzer.js
import { getImageColors } from "./colorAnalysis";
import { matchColors } from "./colorMatcher";
import { COLOR_SPACES, DEFAULT_MAX_IMAGE_SIZE } from "./imageAnalyzerSupport";

/**
 * Supported distance methods for color comparison
 */
export const DISTANCE_METHODS = {
  DELTA_E: 'deltaE',
  LAB: 'lab'
};

/**
 * =========================================
 * IMAGE ANALYSIS PIPELINE
 * =========================================
 */

/**
 * Analyze an image to extract and match colors
 * This is the main entry point for the image analysis process
 * 
 * @param {File|Blob} imageBlob - The image file or blob to analyze
 * @param {Array} parentColors - Array of parent colors to match extracted colors against
 * @param {Object} options - Analysis options
 * @returns {Object} - Analysis result including matched colors and metadata
 */
export const analyzeImage = async (
  imageBlob, 
  parentColors = [], 
  options = {}
) => {
  try {
    // Default options with detailed documentation
    const defaultOptions = {
      sampleSize: 10000,         // Number of pixels to sample (1,000-100,000)
      k: 13,                     // Number of color clusters (3-20)
      maxImageSize: DEFAULT_MAX_IMAGE_SIZE, // Maximum image dimension (200-1600px)
      maxIterations: 30,         // K-means clustering iterations (10-100)
      colorSpace: COLOR_SPACES.LAB, // LAB color space only
      distanceMethod: DISTANCE_METHODS.DELTA_E, // Delta E only
      confidenceThreshold: 20    // Threshold for problematic matches (10-50%)
    };

    // Merge options, but ensure we're always using LAB and DELTA_E
    const analysisOptions = { 
      ...defaultOptions, 
      ...options,
      colorSpace: COLOR_SPACES.LAB, // Force LAB color space
      distanceMethod: options.distanceMethod || DISTANCE_METHODS.DELTA_E // Default to Delta E
    };
    
    console.log("Starting image analysis with options:", {
      sampleSize: analysisOptions.sampleSize,
      k: analysisOptions.k,
      maxImageSize: analysisOptions.maxImageSize,
      maxIterations: analysisOptions.maxIterations,
      colorSpace: analysisOptions.colorSpace,
      distanceMethod: analysisOptions.distanceMethod,
      confidenceThreshold: analysisOptions.confidenceThreshold
    });

    // Step 1: Extract colors from image using LAB color space
    const analyzedColors = await getImageColors(imageBlob, analysisOptions);
    console.log(`Extracted ${analyzedColors.length} colors from image`);

    // Step 2: Match colors with parent colors and Pantone
    const matchedColors = matchColors(
      analyzedColors,
      parentColors,
      { 
        distanceMethod: analysisOptions.distanceMethod,
        confidenceThreshold: analysisOptions.confidenceThreshold
      }
    );

    // Step 3: Prepare final result with metadata
    const result = {
      colors: matchedColors.colors,
      analysisSettings: {
        colorSpace: analysisOptions.colorSpace,
        distanceMethod: analysisOptions.distanceMethod,
        sampleSize: analysisOptions.sampleSize,
        k: analysisOptions.k,
        maxImageSize: analysisOptions.maxImageSize,
        maxIterations: analysisOptions.maxIterations,
        confidenceThreshold: analysisOptions.confidenceThreshold
      },
      metadata: {
        problematicMatches: matchedColors.problematicMatches,
        averageConfidence: matchedColors.averageConfidence,
        timestamp: new Date().toISOString()
      }
    };

    // Log analysis results
    console.log("Image analysis complete:", {
      totalColors: result.colors.length,
      problematicMatches: result.metadata.problematicMatches.length,
      averageConfidence: result.metadata.averageConfidence
    });

    return result;
  } catch (error) {
    console.error("Error in analyzeImage:", error);
    throw error;
  }
};

export { COLOR_SPACES };
