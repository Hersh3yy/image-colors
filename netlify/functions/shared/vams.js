// Reads Image Colors presets from VAMS and returns them in the Strapi shape the
// app was written against ({ data: [ { id, attributes } ] }), so usePresets and
// every component stay unchanged. The switch is env-driven (CMS_SOURCE=vams);
// with it unset the app keeps talking to Strapi.
//
// VAMS stores a preset as one `preset` entry plus one `processed-image` entry
// per analysed image (normalized, to dodge Strapi's 413 on the embedded blob).
// Here we fetch both types and stitch them back into the embedded shape the
// front end expects. Read-only: creating/updating presets needs the VAMS write
// API, which does not exist yet.

const axios = require("axios");

const VAMS_BASE_URL = process.env.VAMS_BASE_URL || "https://app.use-vams.me";

const vamsGet = async (type) => {
  const response = await axios.get(`${VAMS_BASE_URL}/api/entries/by-type/${type}`, {
    headers: { "X-API-Key": process.env.VAMS_API_KEY, Accept: "application/json" },
    timeout: 30000,
  });
  // VAMS wraps the payload: { success, data: { entries: [...] } }
  return response.data?.data?.entries || [];
};

// Rebuild the Strapi color-preset shape from VAMS entries.
const fetchPresetsFromVams = async () => {
  const [presetEntries, imageEntries] = await Promise.all([
    vamsGet("preset"),
    vamsGet("processed-image"),
  ]);

  // Group processed-image entries by the preset they reference.
  // content.preset is an entry_relation: an array of preset entry ids.
  const imagesByPreset = new Map();
  for (const img of imageEntries) {
    const presetId = (img.content?.preset || [])[0];
    if (!presetId) continue;
    if (!imagesByPreset.has(presetId)) imagesByPreset.set(presetId, []);
    imagesByPreset.get(presetId).push(img);
  }

  const data = presetEntries.map((preset) => {
    const images = (imagesByPreset.get(preset.id) || [])
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((img) => ({
        name: img.title,
        colors: img.content?.colors || [],
        sourceImage: img.content?.source_image_url || null,
        analysisSettings: img.content?.analysis_settings || {},
      }));

    return {
      // Keep the Strapi id the app knew, when present, so deep links survive.
      id: preset.content?.strapi_id || preset.id,
      attributes: {
        Name: preset.title,
        sourceImage: images[0]?.sourceImage || null,
        processed_images: images,
      },
    };
  });

  return { data };
};

module.exports = { fetchPresetsFromVams };
