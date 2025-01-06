import { useRoute } from "#app";
import axios from "axios";
import { uploadImage } from "~/services/imageService";
import { ref } from 'vue';

const NETLIFY_FUNCTIONS_BASE = "/.netlify/functions";

// Add these utility functions at the top
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const retryOperation = async (operation, maxRetries = 3, delayMs = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await delay(delayMs * attempt); // Exponential backoff
      }
    }
  }
  
  throw lastError;
};

export const usePresets = () => {
  const route = useRoute();
  const uploadStatus = ref({ total: 0, current: 0, failed: [] });

  const getAccessToken = () => route.query.access;

  // Data validation helper
  const validatePresetData = (data) => {
    console.log("Starting validatePresetData with:", JSON.stringify(data, null, 2));

    if (!data?.Name || typeof data.Name !== "string") {
      console.error("Invalid Name:", data?.Name);
      throw new Error("Preset name is required and must be a string");
    }

    if (!Array.isArray(data.processed_images)) {
      console.error("Invalid processed_images:", data.processed_images);
      throw new Error("processed_images must be an array");
    }

    data.processed_images.forEach((image, index) => {
      console.log(`Validating image ${index}:`, JSON.stringify(image, null, 2));
      const missing = [];
      if (!image.name) missing.push("name");
      if (!image.colors) missing.push("colors");
      if (missing.length > 0) {
        console.error(`Invalid image data at index ${index}:`, image);
        throw new Error(`Invalid image data at index ${index}. Missing: ${missing.join(", ")}`);
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

  const validateImageData = (image) => {
    console.log("Validating image data:", {
      name: image.name,
      hasColors: !!image.colors,
      colorCount: image.colors ? image.colors.length : 0,
      hasSettings: !!image.analysisSettings,
      image
    });

    if (!image.name) throw new Error(`Image missing name`);
    if (!image.colors || !Array.isArray(image.colors)) {
      throw new Error(`Image ${image.name} missing colors array`);
    }
    if (!image.analysisSettings) {
      throw new Error(`Image ${image.name} missing analysis settings`);
    }
    return true;
  };

  const processImageUpload = async (image, presetName, accessToken, retryCount = 3) => {
    console.log(`Processing image: ${image.name}`);
    
    let imageUrl = image.sourceImage;

    if (!(await imageExistsInStorage(image.sourceImage))) {
      try {
        const uploadResult = await retryOperation(
          () => uploadImage(image, presetName, accessToken),
          retryCount
        );
        imageUrl = uploadResult.url;
        console.log(`Upload complete for ${image.name}:`, { url: imageUrl });
      } catch (error) {
        console.error(`Failed to upload ${image.name} after ${retryCount} attempts:`, error);
        throw error;
      }
    }

    return {
      name: image.name,
      sourceImage: imageUrl,
      colors: image.colors,
      analysisSettings: image.analysisSettings
    };
  };

  const resetUploadStatus = () => {
    uploadStatus.value = { total: 0, current: 0, failed: [] };
  };

  const createPreset = async (presetData) => {
    console.log("Starting createPreset with:", {
      name: presetData.name,
      imageCount: presetData.images.length,
    });

    const accessToken = getAccessToken();
    resetUploadStatus();
    uploadStatus.value.total = presetData.images.length;

    try {
      // Validate all images first
      presetData.images.forEach(validateImageData);

      // Process images in chunks
      const CHUNK_SIZE = 5; // Process 5 images at a time
      const chunks = chunkArray(presetData.images, CHUNK_SIZE);
      const processedImages = [];
      
      for (const [chunkIndex, chunk] of chunks.entries()) {
        console.log(`Processing chunk ${chunkIndex + 1}/${chunks.length}`);
        
        const chunkResults = await Promise.allSettled(
          chunk.map(image => processImageUpload(image, presetData.name, accessToken))
        );
        
        // Handle results
        chunkResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            processedImages.push(result.value);
            uploadStatus.value.current++;
          } else {
            const failedImage = chunk[index];
            console.error(`Failed to process ${failedImage.name}:`, result.reason);
            uploadStatus.value.failed.push(failedImage.name);
          }
        });

        // Add a small delay between chunks to prevent overwhelming the server
        if (chunkIndex < chunks.length - 1) {
          await delay(1000);
        }
      }

      if (processedImages.length === 0) {
        throw new Error("No images were successfully processed");
      }

      const formattedData = {
        data: {
          Name: presetData.name,
          processed_images: processedImages,
          sourceImage: processedImages[0]?.sourceImage || null,
        },
      };

      // Create the preset with processed images
      const response = await axios.post(
        `${NETLIFY_FUNCTIONS_BASE}/presets`,
        formattedData,
        {
          headers: { "Content-Type": "application/json" },
          params: { access: accessToken },
          timeout: 60000, // Increased timeout
        }
      );

      return {
        success: true,
        data: response.data,
        failedUploads: uploadStatus.value.failed,
        processedCount: processedImages.length
      };
    } catch (error) {
      console.error("Preset creation failed:", error);
      throw new Error(`Failed to create preset: ${error.message}`);
    }
  };

  const updatePreset = async (presetId, presetData) => {
    console.log("Starting preset update with", {
      presetId,
      name: presetData.name,
      imageCount: presetData.images?.length
    });

    const accessToken = getAccessToken();
    resetUploadStatus();
    uploadStatus.value.total = presetData.images.length;

    try {
      // Validate all images have the required data
      presetData.images.forEach((image, index) => {
        validateImageData(image, index);
      });

      const processedImages = await Promise.all(
        presetData.images.map(async (image, index) => {
          try {
            const result = await processImageUpload(image, presetData.name, accessToken);
            uploadStatus.value.current++;
            return {
              name: image.name,
              sourceImage: result.url,
              colors: image.colors,
              analysisSettings: image.analysisSettings
            };
          } catch (error) {
            console.error(`Failed to upload image ${index}:`, error);
            uploadStatus.value.failed.push(image.name);
            throw error;
          }
        })
      );

      const formattedData = {
        data: {
          Name: presetData.name,
          processed_images: processedImages,
          sourceImage: processedImages[0]?.sourceImage || null,
        },
      };

      const response = await axios.put(
        `${NETLIFY_FUNCTIONS_BASE}/presets/${presetId}`,
        formattedData,
        {
          headers: { "Content-Type": "application/json" },
          params: { access: accessToken },
          timeout: 30000,
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
    uploadStatus, // Make sure this is exposed
  };
};
