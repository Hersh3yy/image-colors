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

    const formattedData = {
      data: {
        Name: presetData.name,
        processed_images: presetData.images,
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

  return {
    fetchPresets,
    deletePreset,
    createPreset,
    updatePreset,
  };
};
