// services/imageAnalyzer.js
import { getImageColors } from "./colorAnalysis";
import { matchColors, DISTANCE_METHODS } from "./colorMatcher";
import { COLOR_SPACES } from "./imageAnalyzerSupport";

export const analyzeImage = async (
  imageBlob, 
  parentColors = [], 
  options = {}
) => {
  try {
    const defaultOptions = {
      sampleSize: 10000,
      k: 13,
      colorSpace: COLOR_SPACES.LAB,
      distanceMethod: DISTANCE_METHODS.DELTA_E,
      confidenceThreshold: 20
    };

    const analysisOptions = { ...defaultOptions, ...options };

    // Step 1: Analyze image to get raw colors
    const analyzedColors = await getImageColors(imageBlob, analysisOptions);

    // Step 2: Match colors with parent colors and calculate confidence scores
    const matchedColors = matchColors(
      analyzedColors,
      parentColors,
      { 
        distanceMethod: analysisOptions.distanceMethod,
        confidenceThreshold: analysisOptions.confidenceThreshold
      }
    );

    // Step 3: Add analysis metadata
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

    // Log analysis results for debugging
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

export { COLOR_SPACES, DISTANCE_METHODS };
