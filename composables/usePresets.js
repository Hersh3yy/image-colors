import { useRoute } from "#app";
import axios from "axios";

const NETLIFY_FUNCTIONS_BASE = "/.netlify/functions";

// Composable to handle access token
export const usePresets = () => {
  const route = useRoute();

  const getAccessToken = () => route.query.access;

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
    await axios.post(`${NETLIFY_FUNCTIONS_BASE}/presets`, presetData, {
      headers: {
        "Content-Type": "application/json",
      },
      params: {
        access: accessToken,
      },
    });
  };

  return {
    fetchPresets,
    deletePreset,
    createPreset,
  };
};
