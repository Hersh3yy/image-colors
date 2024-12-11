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
      distanceMethod: DISTANCE_METHODS.LAB
    };

    const analysisOptions = { ...defaultOptions, ...options };

    // Step 1: Analyze image to get raw colors
    const analyzedColors = await getImageColors(imageBlob, analysisOptions);

    // Step 2: Match colors with parent colors
    const matchedColors = matchColors(
      analyzedColors,
      parentColors,
      { distanceMethod: analysisOptions.distanceMethod }
    );

    return matchedColors;
  } catch (error) {
    console.error("Error in analyzeImage:", error);
    throw error;
  }
};

export { COLOR_SPACES, DISTANCE_METHODS };
