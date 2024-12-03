// services/imageAnalyzer.js
import { getImageColors } from "./colorAnalysis";
import { matchColors } from "./colorMatcher";


export const analyzeImage = async (imageBlob, parentColors = []) => {
  try {
    // Step 1: Analyze image to get raw colors
    const analyzedColors = await getImageColors(imageBlob);

    // Step 2: Match colors with pantone and parent colors
    const matchedColors = matchColors(
      analyzedColors,
      parentColors
    );

    return matchedColors;
  } catch (error) {
    console.error("Error in analyzeImage:", error);
    throw error;
  }
};
