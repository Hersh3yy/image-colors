import { useRoute } from "#app";
import axios from "axios";
import { uploadImage } from "~/services/imageService";
import { ref } from 'vue';

const NETLIFY_FUNCTIONS_BASE = "/.netlify/functions";

export const usePresets = () => {
  const route = useRoute();
  const uploadStatus = ref({ total: 0, current: 0, failed: [] });

  const getAccessToken = () => route.query.access;

  // Data validation helper
  const validatePresetData = (data) => {
    console.log("Validating preset data:", data);

    if (!data?.Name || typeof data.Name !== "string") {
      console.error("Invalid Name:", data?.Name);
      throw new Error("Preset name is required and must be a string");
    }

    if (!Array.isArray(data.processed_images)) {
      console.error("Invalid processed_images:", data.processed_images);
      throw new Error("processed_images must be an array");
    }

    data.processed_images.forEach((image, index) => {
      console.log(`Validating image at index ${index}:`, image);
      if (!image.name || !image.sourceImage || !image.colors) {
        const missing = [];
        if (!image.name) missing.push("name");
        if (!image.sourceImage) missing.push("sourceImage");
        if (!image.colors) missing.push("colors");
        throw new Error(
          `Invalid image data at index ${index}. Missing: ${missing.join(", ")}`
        );
      }
    });

    return true;
  };

  const fetchPresets = async () => {
    const accessToken = getAccessToken();
    const response = await axios.get(`${NETLIFY_FUNCTIONS_BASE}/presets`, {
      params: { access: accessToken },
    });
    return response.data.data;
  };

  const deletePreset = async (presetId) => {
    const accessToken = getAccessToken();
    await axios.delete(`${NETLIFY_FUNCTIONS_BASE}/presets`, {
      params: {
        presetId,
        access: accessToken,
      },
    });
  };

  // Helper to check if image already exists in DO Spaces
  const imageExistsInStorage = async (url) => {
    if (!url) return false;
    return url.includes('digitaloceanspaces.com');
  };

  // Helper to chunk array into smaller pieces
  const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const createPreset = async (presetData) => {
    const accessToken = getAccessToken();
    uploadStatus.value = { 
      total: presetData.images.length, 
      current: 0, 
      failed: [] 
    };

    try {
      console.log(`Starting preset creation with ${presetData.images.length} images`);

      // Process images in chunks of 5
      const imageChunks = chunkArray(presetData.images, 5);
      const processedImages = [];

      for (const chunk of imageChunks) {
        const chunkPromises = chunk.map(async (image) => {
          try {
            let imageUrl = image.sourceImage;
            
            // Only upload if image isn't already in DO Spaces
            if (!(await imageExistsInStorage(image.sourceImage))) {
              console.log(`Uploading image: ${image.name}`);
              imageUrl = await uploadImage(image, presetData.name, accessToken);
            } else {
              console.log(`Image already exists in storage: ${image.name}`);
            }

            uploadStatus.value.current++;
            return {
              ...image,
              sourceImage: imageUrl,
            };
          } catch (error) {
            console.error(`Failed to process image ${image.name}:`, error);
            uploadStatus.value.failed.push({
              name: image.name,
              error: error.message
            });
            return null;
          }
        });

        const chunkResults = await Promise.all(chunkPromises);
        processedImages.push(...chunkResults.filter(Boolean));
      }

      if (uploadStatus.value.failed.length > 0) {
        console.warn(`Failed to process ${uploadStatus.value.failed.length} images:`, 
          uploadStatus.value.failed);
      }

      const formattedData = {
        data: {
          Name: presetData.name,
          processed_images: processedImages,
          sourceImage: processedImages[0]?.sourceImage || null,
        },
      };

      validatePresetData(formattedData.data);

      const response = await axios.post(
        `${NETLIFY_FUNCTIONS_BASE}/presets`,
        formattedData,
        {
          headers: { "Content-Type": "application/json" },
          params: { access: accessToken },
          timeout: 30000, // 30 second timeout
        }
      );

      return {
        success: true,
        data: response.data,
        failedUploads: uploadStatus.value.failed
      };
    } catch (error) {
      console.error("Preset creation failed:", error);
      throw new Error(`Failed to create preset: ${error.message}`);
    }
  };

  const updatePreset = async (presetId, presetData) => {
    const accessToken = getAccessToken();
    uploadStatus.value = { 
      total: presetData.images.length, 
      current: 0, 
      failed: [] 
    };

    try {
      console.log(`Starting preset update with ${presetData.images.length} images`);

      // Process images in chunks of 5
      const imageChunks = chunkArray(presetData.images, 5);
      const processedImages = [];

      for (const chunk of imageChunks) {
        const chunkPromises = chunk.map(async (image) => {
          try {
            let imageUrl = image.sourceImage;
            
            // Only upload if image isn't already in DO Spaces
            if (!(await imageExistsInStorage(image.sourceImage))) {
              console.log(`Uploading image: ${image.name}`);
              imageUrl = await uploadImage(image, presetData.name, accessToken);
            } else {
              console.log(`Image already exists in storage: ${image.name}`);
            }

            uploadStatus.value.current++;
            return {
              ...image,
              sourceImage: imageUrl,
            };
          } catch (error) {
            console.error(`Failed to process image ${image.name}:`, error);
            uploadStatus.value.failed.push({
              name: image.name,
              error: error.message
            });
            return null;
          }
        });

        const chunkResults = await Promise.all(chunkPromises);
        processedImages.push(...chunkResults.filter(Boolean));
      }

      if (uploadStatus.value.failed.length > 0) {
        console.warn(`Failed to process ${uploadStatus.value.failed.length} images:`, 
          uploadStatus.value.failed);
      }

      const formattedData = {
        data: {
          Name: presetData.name,
          processed_images: processedImages,
          sourceImage: processedImages[0]?.sourceImage || null,
        },
      };

      validatePresetData(formattedData.data);

      const response = await axios.put(
        `${NETLIFY_FUNCTIONS_BASE}/presets/${presetId}`,
        formattedData,
        {
          headers: { "Content-Type": "application/json" },
          params: { access: accessToken },
          timeout: 30000, // 30 second timeout
        }
      );

      return {
        success: true,
        data: response.data,
        failedUploads: uploadStatus.value.failed
      };
    } catch (error) {
      console.error("Preset update failed:", error);
      throw new Error(`Failed to update preset: ${error.message}`);
    }
  };

  // Add this helper function
  const convertToBase64 = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();

      // Create an image to get dimensions
      const img = await createImageBitmap(blob);

      // Max dimensions
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 800;

      // Calculate new dimensions
      let width = img.width;
      let height = img.height;
      if (width > MAX_WIDTH) {
        height = (MAX_WIDTH / width) * height;
        width = MAX_WIDTH;
      }
      if (height > MAX_HEIGHT) {
        width = (MAX_HEIGHT / height) * width;
        height = MAX_HEIGHT;
      }

      // Create canvas and resize
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Get base64
      return canvas.toDataURL('image/jpeg', 0.8); // Use JPEG with 80% quality
    } catch (error) {
      console.error("Error converting to base64:", error);
      throw error;
    }
  };

  return {
    fetchPresets,
    deletePreset,
    createPreset,
    updatePreset,
    uploadStatus, // Expose upload status for UI feedback
  };
};
