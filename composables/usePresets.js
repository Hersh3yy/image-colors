import { useRoute } from "#app";
import axios from "axios";
import { uploadImage } from "~/services/imageService";
import { ref } from 'vue';

const NETLIFY_FUNCTIONS_BASE = "/.netlify/functions";

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const retryOperation = async (operation, maxRetries = 3, delayMs = 1000) => {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await delay(delayMs * attempt);
      }
    }
  }
  throw lastError;
};

export const usePresets = () => {
  const route = useRoute();
  const uploadStatus = ref({ total: 0, current: 0, failed: [] });
  const presets = ref([]);
  const activePreset = ref(null);
  const activePresetImages = ref([]);
  const presetStatus = ref({
    isCreating: false,
    isUpdating: false,
    total: 0,
    current: 0,
    failed: []
  });

  const getAccessToken = () => route.query.access || 'banana';

  const validatePresetData = (data) => {
    if (!data?.Name || typeof data.Name !== "string") {
      throw new Error("Preset name is required and must be a string");
    }
    if (!Array.isArray(data.processed_images)) {
      throw new Error("processed_images must be an array");
    }
    data.processed_images.forEach((image, index) => {
      if (!image.name || !image.colors) {
        throw new Error(`Invalid image data at index ${index}. Missing: ${!image.name ? 'name' : ''} ${!image.colors ? 'colors' : ''}`);
      }
    });
    return true;
  };

  const loadPresets = async () => {
    try {
      const response = await fetchPresets();
      presets.value = Array.isArray(response)
        ? response
        : response?.data
          ? response.data
          : [];
    } catch (err) {
      console.error("Failed to load presets:", err);
    }
  };

  const handleLoadPreset = (preset) => {
    if (!preset) return;

    activePreset.value = preset;
    const images = preset.attributes?.processed_images || preset.processed_images || [];
    activePresetImages.value = Array.isArray(images)
      ? images
      : typeof images === "string"
        ? JSON.parse(images)
        : [];
  };

  const handleSaveAsPreset = async (presetData, onSuccess, onError) => {
    presetStatus.value = {
      isCreating: true,
      isUpdating: false,
      total: presetData.images.length,
      current: 0,
      failed: []
    };

    try {
      const result = await createPreset({
        name: presetData.name,
        images: presetData.images
      });

      if (result.failedUploads?.length) {
        onError(`Preset created but ${result.failedUploads.length} images failed to upload`);
      } else {
        onSuccess("Preset created successfully");
      }

      await loadPresets();
    } catch (error) {
      console.error("Failed to create preset:", error);
      onError(`Failed to create preset: ${error.message}`);
    } finally {
      setTimeout(() => {
        presetStatus.value = {
          isCreating: false,
          isUpdating: false,
          total: 0,
          current: 0,
          failed: []
        };
      }, 3000);
    }
  };

  const handleSavePreset = async (images, onSuccess, onError) => {
    presetStatus.value = {
      isCreating: false,
      isUpdating: true,
      total: images.length,
      current: 0,
      failed: []
    };

    try {
      const presetId = activePreset.value?.id;
      if (!presetId) throw new Error("Missing preset ID");

      const result = await updatePreset(presetId, {
        name: activePreset.value.attributes.Name,
        images,
        sourceImage: images[0]?.sourceImage || null,
      });

      if (result.failedUploads?.length) {
        onError(`Preset updated but ${result.failedUploads.length} images failed to upload`);
        presetStatus.value.failed = result.failedUploads;
      } else {
        onSuccess("Preset saved successfully");
      }

      await loadPresets();
    } catch (err) {
      console.error("Preset save error:", err);
      onError(`Failed to save preset: ${err.message || 'Unknown error'}`);
    } finally {
      setTimeout(() => {
        presetStatus.value = {
          isCreating: false,
          isUpdating: false,
          total: 0,
          current: 0,
          failed: []
        };
      }, 3000);
    }
  };

  const handleDeletePreset = async (onSuccess, onError) => {
    try {
      await deletePreset(activePreset.value.id);
      activePreset.value = null;
      activePresetImages.value = [];
      await loadPresets();
      onSuccess("Preset deleted successfully");
    } catch (err) {
      onError("Failed to delete preset");
      console.error("Preset deletion error:", err);
    }
  };

  const fetchPresets = async () => {
    const accessToken = getAccessToken();
    const response = await axios.get(`${NETLIFY_FUNCTIONS_BASE}/presets`, { params: { access: accessToken } });
    return response.data.data;
  };

  const deletePreset = async (presetId) => {
    const accessToken = getAccessToken();
    await axios.delete(`${NETLIFY_FUNCTIONS_BASE}/presets`, { params: { presetId, access: accessToken } });
  };

  const imageExistsInStorage = async (url) => {
    if (!url) return false;
    if (url.startsWith('blob:')) {
      console.log(`Blob URL detected for image: ${url}. It needs to be uploaded.`);
      return false;
    }
    return url.includes('http://') || url.includes('https://');
  };

  const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const validateImageData = (image) => {
    if (!image.name || !Array.isArray(image.colors) || !image.analysisSettings) {
      throw new Error(`Image ${image.name} is missing required data`);
    }
    return true;
  };

  const processImageUpload = async (image, presetName, accessToken, retryCount = 3) => {
    console.log(`Processing image upload for: ${image.name}`);
    if (await imageExistsInStorage(image.sourceImage)) {
      console.log(`Image ${image.name} already exists in storage. Skipping upload.`);
      uploadStatus.value.current++;
      return { ...image };
    }
    try {
      const result = await retryOperation(() => uploadImage(image, presetName, accessToken), retryCount);
      uploadStatus.value.current++;
      console.log(`Successfully uploaded image: ${image.name}`);
      return result;
    } catch (error) {
      uploadStatus.value.failed.push(image.name);
      console.error(`Failed to upload image ${image.name}:`, error);
      throw error;
    }
  };

  const resetUploadStatus = () => {
    uploadStatus.value = { total: 0, current: 0, failed: [] };
  };

  const createPreset = async (presetData) => {
    const accessToken = getAccessToken();
    resetUploadStatus();
    uploadStatus.value.total = presetData.images.length;

    try {
      presetData.images.forEach(validateImageData);
      const processedImages = [];

      for (const chunk of chunkArray(presetData.images, 5)) {
        const chunkResults = await Promise.allSettled(chunk.map(image => processImageUpload(image, presetData.name, accessToken)));
        chunkResults.forEach(result => {
          if (result.status === 'fulfilled') {
            processedImages.push(result.value);
          } else {
            uploadStatus.value.failed.push(result.reason.message || 'Unknown error');
          }
        });
        await delay(1000);
      }

      if (processedImages.length === 0) throw new Error("No images were successfully processed");

      const formattedData = {
        data: {
          Name: presetData.name,
          processed_images: processedImages,
          sourceImage: processedImages[0]?.sourceImage || null,
        },
      };

      const response = await axios.post(`${NETLIFY_FUNCTIONS_BASE}/presets`, formattedData, {
        headers: { "Content-Type": "application/json" },
        params: { access: accessToken },
        timeout: 60000,
      });

      console.log(`Preset created successfully: ${response.data}`);
      return { success: true, data: response.data, failedUploads: uploadStatus.value.failed, processedCount: processedImages.length };
    } catch (error) {
      console.error(`Failed to create preset: ${error.message}`);
      throw new Error(`Failed to create preset: ${error.message}`);
    }
  };

  const updatePreset = async (presetId, presetData) => {
    const accessToken = getAccessToken();
    resetUploadStatus();

    const imagesToUpload = await Promise.all(presetData.images.map(image => imageExistsInStorage(image.sourceImage)));
    uploadStatus.value.total = imagesToUpload.filter(Boolean).length;

    try {
      presetData.images.forEach(validateImageData);
      const processedImages = await Promise.all(presetData.images.map(async (image) => {
        if (await imageExistsInStorage(image.sourceImage)) {
          console.log(`Image ${image.name} already exists. Skipping upload.`);
          return { ...image };
        }
        return await processImageUpload(image, presetData.name, accessToken);
      }));

      const formattedData = {
        data: {
          Name: presetData.name,
          processed_images: processedImages,
          sourceImage: processedImages[0]?.sourceImage || null,
        },
      };

      const response = await axios.put(`${NETLIFY_FUNCTIONS_BASE}/presets/${presetId}`, formattedData, {
        headers: { "Content-Type": "application/json" },
        params: { access: accessToken },
        timeout: 30000,
      });

      console.log(`Preset updated successfully: ${response.data}`);
      return { success: true, data: response.data, failedUploads: uploadStatus.value.failed };
    } catch (error) {
      console.error(`Failed to update preset: ${error.message}`);
      throw new Error(`Failed to update preset: ${error.message}`);
    }
  };

  return {
    presets,
    activePreset,
    activePresetImages,
    presetStatus,
    uploadStatus,
    loadPresets,
    handleLoadPreset,
    handleSaveAsPreset,
    handleSavePreset,
    handleDeletePreset
  };
};
