import { analyzeImageChroma } from "./imageAnalyzerServiceChroma";
import { analyzeImageColorConvert } from "./imageAnalyzerServiceColorConvert";
import { analyzeImageAPI } from "./imageAnalyzerServiceAPI";
import { loadImageData, getClosestParentColor } from "./imageAnalyzerSupport";

export const ALGORITHMS = {
  CHROMA: "chroma",
  COLOR_CONVERT: "colorConvert",
  // API: "api",
};

export const analyzeImage = async (
  imageBlob,
  algorithm = ALGORITHMS.CHROMA,
  parentColors = []
) => {
  try {
    console.log(`analyzeImage started with algorithm: ${algorithm}`);
    console.log("Input imageBlob:", imageBlob);
    console.log("Parent colors:", parentColors);

    console.time("loadImageData");
    const imageData = await loadImageData(imageBlob);
    console.timeEnd("loadImageData");

    let result;
    console.time(`${algorithm}Analysis`);
    switch (algorithm) {
      case ALGORITHMS.CHROMA:
        console.log("Starting Chroma analysis");
        result = await analyzeImageChroma(imageData, parentColors);
        break;
      case ALGORITHMS.COLOR_CONVERT:
        console.log("Starting Color Convert analysis");
        result = await analyzeImageColorConvert(imageData);
        // Note: Color Convert doesn't support parent colors yet
        break;
      case ALGORITHMS.API:
        console.log("Starting API analysis");
        result = await analyzeImageAPI(imageData);
        // Note: API doesn't support parent colors
        break;
      default:
        throw new Error(`Unknown algorithm: ${algorithm}`);
    }
    console.timeEnd(`${algorithm}Analysis`);

    console.log(`Analysis result for ${algorithm}:`, result);
    return result;
  } catch (error) {
    console.error("Error in analyzeImage:", error);
    throw error;
  }
};
