import { useRoute } from "#app";
import axios from "axios";

const NETLIFY_FUNCTIONS_BASE = "/.netlify/functions";

export const usePresets = () => {
  const route = useRoute();

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

  const createPreset = async (presetData) => {
    const accessToken = getAccessToken();

    console.log("Creating preset with data:", presetData);

    // Convert all image URLs to base64
    const processedImages = await Promise.all(
      presetData.images.map(async (image) => ({
        ...image,
        sourceImage: await convertToBase64(image.sourceImage),
        name: image.name,
        colors: image.colors
      }))
    );

    const formattedData = {
      data: {
        Name: presetData.name,
        processed_images: processedImages,
        sourceImage: presetData.sourceImage,
      },
    };

    console.log("Formatted data:", formattedData);

    validatePresetData(formattedData.data);

    return await axios.post(
      `${NETLIFY_FUNCTIONS_BASE}/presets`,
      formattedData,
      {
        headers: {
          "Content-Type": "application/json",
        },
        params: {
          access: accessToken,
        },
      }
    );
  };

  const updatePreset = async (presetId, presetData) => {
    const accessToken = getAccessToken();

    // Format and validate the data
    const formattedData = {
      data: {
        Name: presetData.name,
        processed_images: presetData.images,
        sourceImage: presetData.sourceImage,
      },
    };

    validatePresetData(formattedData.data);

    await axios.put(
      `${NETLIFY_FUNCTIONS_BASE}/presets/${presetId}`,
      formattedData,
      {
        headers: {
          "Content-Type": "application/json",
        },
        params: {
          access: accessToken,
        },
      }
    );
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
  };
};
