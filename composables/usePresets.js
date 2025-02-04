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

  const getAccessToken = () => route.query.access;

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

  const fetchPresets = async () => {
    const accessToken = getAccessToken();
    const response = await axios.get(`${NETLIFY_FUNCTIONS_BASE}/presets`, { params: { access: accessToken } });
    return response.data.data;
  };

  const deletePreset = async (presetId) => {
    const accessToken = getAccessToken();
    await axios.delete(`${NETLIFY_FUNCTIONS_BASE}/presets`, { params: { presetId, access: accessToken } });
  };

  const imageExistsInStorage = async (url) => url ? url.includes('digitaloceanspaces.com') : false;

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
    if (await imageExistsInStorage(image.sourceImage)) {
      uploadStatus.value.current++;
      return { ...image }; // Return existing image data
    }
    try {
      const result = await retryOperation(() => uploadImage(image, presetName, accessToken), retryCount);
      uploadStatus.value.current++;
      return result;
    } catch (error) {
      uploadStatus.value.failed.push(image.name);
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
        await delay(1000); // Delay between chunks
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

      return { success: true, data: response.data, failedUploads: uploadStatus.value.failed, processedCount: processedImages.length };
    } catch (error) {
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
          return { ...image }; // Return existing image data
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

      return { success: true, data: response.data, failedUploads: uploadStatus.value.failed };
    } catch (error) {
      throw new Error(`Failed to update preset: ${error.message}`);
    }
  };

  const convertToBase64 = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const img = await createImageBitmap(blob);
      const MAX_DIMENSION = 800;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const aspectRatio = img.width / img.height;

      if (img.width > img.height) {
        canvas.width = MAX_DIMENSION;
        canvas.height = MAX_DIMENSION / aspectRatio;
      } else {
        canvas.height = MAX_DIMENSION;
        canvas.width = MAX_DIMENSION * aspectRatio;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      throw new Error(`Error converting to base64: ${error.message}`);
    }
  };

  return {
    fetchPresets,
    deletePreset,
    createPreset,
    updatePreset,
    uploadStatus,
  };
};
