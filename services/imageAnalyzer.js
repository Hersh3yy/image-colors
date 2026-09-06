// services/imageAnalyzer.js
import { getImageColors } from "./colorAnalysis";
import { matchColors } from "./colorMatcher";
import { DEFAULT_MAX_IMAGE_SIZE } from "./imageAnalyzerSupport";

/**
 * Fixed facts of the pipeline, reported with every result so older UI and
 * saved presets that display them keep working. They are not settings.
 */
export const COLOR_SPACE = 'lab';
export const DISTANCE_METRIC = 'deltaE'; // CIEDE2000

/** Seed used when Analysis Settings ask for reproducible runs. */
export const REPRODUCIBLE_SEED = 20260906;

/**
 * Turn Analysis Settings (what the UI edits) into the options the pipeline
 * consumes. Pure, so it can be tested without an image: every slider the UI
 * shows must appear in the output, and `reproducibleRuns` becomes a seed.
 *
 * @param {Object} settings - Analysis Settings (see useAnalysisSettings)
 * @returns {Object} - options for getImageColors / matchColors
 */
export const settingsToAnalysisOptions = (settings = {}) => {
  const options = {
    sampleSize: settings.sampleSize ?? 10000,       // 1,000-100,000
    k: settings.k ?? 13,                            // 3-20
    maxImageSize: settings.maxImageSize ?? DEFAULT_MAX_IMAGE_SIZE, // 200-1600px
    maxIterations: settings.maxIterations ?? 30,    // 10-100
    confidenceThreshold: settings.confidenceThreshold ?? 20, // 10-50
  };
  if (settings.reproducibleRuns) options.seed = REPRODUCIBLE_SEED;
  return options;
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
 * @param {Object} settings - Analysis Settings (or already-built options)
 * @returns {Object} - Analysis result including matched colors and metadata
 */
export const analyzeImage = async (
  imageBlob,
  parentColors = [],
  settings = {}
) => {
  try {
    const options = settingsToAnalysisOptions(settings);

    console.log("Starting image analysis with options:", options);

    // Step 1: Extract colors from image (k-means in LAB)
    const analyzedColors = await getImageColors(imageBlob, options);
    console.log(`Extracted ${analyzedColors.length} colors from image`);

    // Step 2: Match colors with parent colors and Pantone (CIEDE2000)
    const matchedColors = matchColors(analyzedColors, parentColors, {
      confidenceThreshold: options.confidenceThreshold
    });

    // Step 3: Prepare final result with metadata
    const result = {
      colors: matchedColors.colors,
      analysisSettings: {
        colorSpace: COLOR_SPACE,
        distanceMethod: DISTANCE_METRIC,
        sampleSize: options.sampleSize,
        k: options.k,
        maxImageSize: options.maxImageSize,
        maxIterations: options.maxIterations,
        confidenceThreshold: options.confidenceThreshold,
        reproducibleRuns: options.seed !== undefined,
        seed: options.seed
      },
      metadata: {
        problematicMatches: matchedColors.problematicMatches,
        averageConfidence: matchedColors.averageConfidence,
        timestamp: new Date().toISOString()
      }
    };

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
