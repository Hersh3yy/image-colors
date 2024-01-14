// services/presetService.js
import axios from 'axios';

const PRESET_API_BASE = 'https://hiren-devs-strapi-j5h2f.ondigitalocean.app/api';
const NETLIFY_FUNCTIONS_BASE = '/.netlify/functions';

export const fetchPresets = async () => {
    const response = await axios.get(`${PRESET_API_BASE}/color-presets`);
    return response.data;
};

export const deletePreset = async (presetId, password) => {
    await axios.delete(`${NETLIFY_FUNCTIONS_BASE}/presets?presetId=${presetId}&password=${password}`);
};

export const createPreset = async (presetData, password) => {
    // Assuming the preset creation endpoint and data structure are similar to this
    const response = await axios.post(`${NETLIFY_FUNCTIONS_BASE}/presets`, presetData, {
        headers: {
            'Content-Type': 'application/json'
        },
        params: { password }
    });
    return response.data;
};
