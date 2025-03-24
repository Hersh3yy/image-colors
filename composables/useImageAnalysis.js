import { ref } from 'vue';
import { analyzeImage } from '@/services/imageAnalyzer';

/**
 * Composable for handling image analysis operations
 * @returns {Object} - Image analysis state and functions
 */
export function useImageAnalysis() {
  // State
  const isProcessing = ref(false);
  const error = ref(null);
  const processedImages = ref([]);
  const analysisStatus = ref({
    total: 0,
    current: 0,
    failed: []
  });

  /**
   * Analyze new images with the given settings
   * @param {Object} params - Analysis parameters
   * @param {Array} params.files - Image files to analyze
   * @param {Array} params.parentColors - Parent colors to match against
   * @param {Object} params.analysisSettings - Analysis settings
   * @param {Object} params.activePreset - Active preset if any
   * @param {Array} params.activePresetImages - Images in active preset
   */
  const handleAnalysis = async ({ files, parentColors, analysisSettings, activePreset, activePresetImages }) => {
    if (!files?.length) return;
    
    isProcessing.value = true;
    error.value = null;

    // Setup analysis status tracking
    analysisStatus.value = {
      total: files.length,
      current: 0,
      failed: []
    };

    try {
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const sourceImage = URL.createObjectURL(file);

        try {
          console.log(`Analyzing image ${i+1}/${files.length}: ${file.name}`);
          
          // Analyze the image using the image analyzer service
          const result = await analyzeImage(file, parentColors, {
            colorSpace: analysisSettings.colorSpace,
            distanceMethod: analysisSettings.distanceMethod,
            sampleSize: analysisSettings.sampleSize,
            k: analysisSettings.k,
            confidenceThreshold: analysisSettings.confidenceThreshold
          });

          // Create a new image object with analysis results
          const newImage = {
            name: file.name,
            sourceImage,
            colors: result.colors,
            analysisSettings: result.analysisSettings,
            metadata: result.metadata,
            timestamp: Date.now(),
            index: processedImages.value.length + i + 1
          };

          // Add to appropriate collection
          if (activePreset) {
            activePresetImages.push(newImage);
            activePresetImages.sort((a, b) => b.timestamp - a.timestamp);
          } else {
            processedImages.value.push(newImage);
            processedImages.value.sort((a, b) => b.timestamp - a.timestamp);
          }

          analysisStatus.value.current++;
        } catch (err) {
          analysisStatus.value.failed.push(file.name);
          console.error(`Failed to analyze ${file.name}:`, err);
        }
      }
    } finally {
      isProcessing.value = false;
      
      // Reset status after a delay
      setTimeout(() => {
        analysisStatus.value = {
          total: 0,
          current: 0,
          failed: []
        };
      }, 3000);
    }
  };

  /**
   * Reanalyze an existing image with new settings
   * @param {Object} image - Image to reanalyze
   * @param {Array} parentColors - Parent colors to match against
   * @param {Object} analysisSettings - Analysis settings
   * @param {Object} activePreset - Active preset if any
   * @param {Array} activePresetImages - Images in active preset
   */
  const handleReanalysis = async (image, parentColors, analysisSettings, activePreset, activePresetImages) => {
    isProcessing.value = true;
    error.value = null;

    try {
      console.log(`Reanalyzing image: ${image.name}`);
      
      // Fetch the image blob from the source URL
      const response = await fetch(image.sourceImage);
      const blob = await response.blob();
      const file = new File([blob], image.name, { type: blob.type });

      // Reanalyze with current settings
      const result = await analyzeImage(
        file,
        parentColors,
        {
          colorSpace: analysisSettings.colorSpace,
          distanceMethod: analysisSettings.distanceMethod,
          sampleSize: analysisSettings.sampleSize,
          k: analysisSettings.k,
          confidenceThreshold: analysisSettings.confidenceThreshold
        }
      );

      // Create updated image object
      const updatedImage = {
        ...image,
        colors: result.colors,
        analysisSettings: result.analysisSettings,
        metadata: result.metadata,
        timestamp: Date.now()
      };

      // Replace in appropriate collection
      const targetArray = activePreset ? activePresetImages : processedImages.value;
      const index = targetArray.findIndex((img) => img.name === image.name);
      
      if (index !== -1) {
        targetArray[index] = updatedImage;
      }
      
      // Sort by timestamp
      if (Array.isArray(targetArray)) {
        targetArray.sort((a, b) => b.timestamp - a.timestamp);
      }
    } catch (err) {
      error.value = err.message || "Failed to reanalyze image";
      console.error("Reanalysis error:", err);
    } finally {
      isProcessing.value = false;
    }
  };

  return {
    isProcessing,
    error,
    processedImages,
    analysisStatus,
    handleAnalysis,
    handleReanalysis
  };
} 