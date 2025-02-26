import { ref } from 'vue';
import { analyzeImage } from '@/services/imageAnalyzer';

export function useImageAnalysis() {
  const isProcessing = ref(false);
  const error = ref(null);
  const processedImages = ref([]);
  const analysisStatus = ref({
    total: 0,
    current: 0,
    failed: []
  });

  const handleAnalysis = async ({ files, parentColors, analysisSettings, activePreset, activePresetImages }) => {
    if (!files?.length) return;
    isProcessing.value = true;
    error.value = null;

    analysisStatus.value = {
      total: files.length,
      current: 0,
      failed: []
    };

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const sourceImage = URL.createObjectURL(file);

        try {
          const result = await analyzeImage(file, parentColors, {
            colorSpace: analysisSettings.colorSpace,
            distanceMethod: analysisSettings.distanceMethod
          });

          const newImage = {
            name: file.name,
            sourceImage,
            colors: result.colors,
            analysisSettings: result.analysisSettings,
            timestamp: Date.now(),
            index: processedImages.value.length + i + 1
          };

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
      setTimeout(() => {
        analysisStatus.value = {
          total: 0,
          current: 0,
          failed: []
        };
      }, 3000);
    }
  };

  const handleReanalysis = async (image, parentColors, analysisSettings, activePreset, activePresetImages) => {
    isProcessing.value = true;
    error.value = null;

    try {
      const response = await fetch(image.sourceImage);
      const blob = await response.blob();
      const file = new File([blob], image.name, { type: blob.type });

      const result = await analyzeImage(
        file,
        parentColors,
        {
          colorSpace: analysisSettings.colorSpace,
          distanceMethod: analysisSettings.distanceMethod
        }
      );

      const updatedImage = {
        ...image,
        colors: result.colors,
        analysisSettings: result.analysisSettings,
        timestamp: Date.now()
      };

      const targetArray = activePreset ? activePresetImages : processedImages.value;
      const index = targetArray.findIndex((img) => img.name === image.name);
      if (index !== -1) {
        targetArray[index] = updatedImage;
      }
      
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