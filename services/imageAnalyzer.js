import {
  analyzeImageChroma,
  getClosestParentColorChroma,
} from "./imageAnalyzerServiceChroma";
import {
  analyzeImageAPI,
  getClosestColorInfo,
} from "./imageAnalyzerServiceAPI";
import { loadImageData } from "./imageAnalyzerSupport";

export const ANALYSIS_ALGORITHMS = {
  CHROMA: "chroma",
  API: "api",
};

export const COLOR_MATCHING_ALGORITHMS = {
  CHROMA: "chroma",
  API: "api",
};

export const analyzeImage = async (
  imageBlob,
  analysisAlgorithm = ANALYSIS_ALGORITHMS.CHROMA,
  parentColors = []
) => {
  try {
    console.log(`analyzeImage started with algorithm: ${analysisAlgorithm}`);
    console.log("Input imageBlob:", imageBlob);
    console.log("Parent colors:", parentColors);

    const imageData = await loadImageData(imageBlob);
    console.log("Loaded imageData:", imageData);

    let analysisResult;
    const isAPI = analysisAlgorithm === ANALYSIS_ALGORITHMS.API;

    // Step 1: Image Analysis
    analysisResult = isAPI
      ? await analyzeImageAPI(imageData)
      : await analyzeImageChroma(imageData);

    // Step 2: Color Matching (if parent colors are provided)
    if (parentColors.length > 0) {
      const matchColor = isAPI
        ? getClosestColorInfo
        : getClosestParentColorChroma;

      analysisResult = await Promise.all(
        analysisResult.map(async (colorInfo) => ({
          ...colorInfo,
          closestParentColor: await matchColor(colorInfo.color, parentColors),
        }))
      );
    }

    console.log(`Analysis result:`, analysisResult);
    return analysisResult;
  } catch (error) {
    console.error("Error in analyzeImage:", error);
    throw error;
  }
};
