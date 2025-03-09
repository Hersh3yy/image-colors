// services/imageAnalyzer.js
import { getImageColors } from "./colorAnalysis";
import { matchColors, DISTANCE_METHODS } from "./colorMatcher";
import { COLOR_SPACES } from "./imageAnalyzerSupport";

/**
 * Supported distance methods for color comparison
 */
export const DISTANCE_METHODS = {
  DELTA_E: 'deltaE',
  LAB: 'lab',
};

/**
 * Analyze an image to extract and match colors
 * @param {File|Blob} imageBlob - The image file or blob to analyze
 * @param {Array} parentColors - Array of parent colors to match extracted colors against
 * @param {Object} options - Analysis options (colorSpace, distanceMethod, etc.)
 * @returns {Object} - Analysis result including matched colors and metadata
 */
export const analyzeImage = async (
  imageBlob, 
  parentColors = [], 
  options = {}
) => {
  try {
    // Default options with LAB color space and Delta E as primary methods
    const defaultOptions = {
      sampleSize: 10000,         // Number of pixels to sample from image
      k: 13,                     // Number of color clusters to extract
      colorSpace: COLOR_SPACES.LAB, // Default to LAB color space
      distanceMethod: DISTANCE_METHODS.DELTA_E, // Default to Delta E
      confidenceThreshold: 20    // Threshold for problematic matches
    };

    const analysisOptions = { ...defaultOptions, ...options };
    
    console.log("Starting image analysis with options:", {
      sampleSize: analysisOptions.sampleSize,
      k: analysisOptions.k,
      colorSpace: analysisOptions.colorSpace,
      distanceMethod: analysisOptions.distanceMethod
    });

    // Step 1: Extract colors from image
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
      averageConfidence: result.metadata.averageConfidence,
      settings: result.analysisSettings
    });

    return result;
  } catch (error) {
    console.error("Error in analyzeImage:", error);
    throw error;
  }
};

export { COLOR_SPACES };
