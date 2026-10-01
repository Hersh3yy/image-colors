// VAMS gateway for Image Colors presets. Translates between the Strapi-shaped
// preset the app speaks ({ data: [ { id, attributes:{ Name, processed_images } } ] })
// and VAMS entries. Env-driven: used only when CMS_SOURCE=vams.
//
// In VAMS a preset is one `preset` entry plus one `processed-image` entry per
// analysed image (normalized, to dodge Strapi's 413 on the embedded blob). The
// preset's VAMS entry uuid is the id the app uses for load/update/delete.
// Images are NOT uploaded here: they already live in Spaces and arrive as URLs.

const axios = require("axios");

const VAMS_BASE_URL = process.env.VAMS_BASE_URL || "https://app.use-vams.me";

const client = () =>
  axios.create({
    baseURL: `${VAMS_BASE_URL}/api`,
    headers: { "X-API-Key": process.env.VAMS_API_KEY, Accept: "application/json" },
    timeout: 30000,
  });

// GET /entries/by-type/{type} -> { entries, entry_type }
const getByType = async (type) => {
  const { data } = await client().get(`/entries/by-type/${type}`);
  return { entries: data?.data?.entries || [], entryType: data?.data?.entry_type || null };
};

const typeId = async (slug) => {
  const { entryType } = await getByType(slug);
  if (!entryType) throw new Error(`VAMS entry type not found: ${slug}`);
  return entryType.id;
};

const imageToContent = (presetId, image) => ({
  preset: [presetId],
  source_image_url: image.sourceImage || "",
  colors: image.colors || [],
  analysis_settings: image.analysisSettings || {},
});

// --- Read: rebuild the Strapi preset shape the app expects ---
const fetchPresetsFromVams = async () => {
  const [{ entries: presets }, { entries: images }] = await Promise.all([
    getByType("preset"),
    getByType("processed-image"),
  ]);

  const imagesByPreset = new Map();
  for (const img of images) {
    const presetId = (img.content?.preset || [])[0];
    if (!presetId) continue;
    if (!imagesByPreset.has(presetId)) imagesByPreset.set(presetId, []);
    imagesByPreset.get(presetId).push(img);
  }

  const data = presets.map((preset) => {
    const processed = (imagesByPreset.get(preset.id) || [])
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((img) => ({
        name: img.title,
        colors: img.content?.colors || [],
        sourceImage: img.content?.source_image_url || null,
        analysisSettings: img.content?.analysis_settings || {},
      }));

    return {
      // The VAMS entry uuid: the app loads/updates/deletes a preset by this id.
      id: preset.id,
      attributes: {
        Name: preset.title,
        sourceImage: processed[0]?.sourceImage || null,
        processed_images: processed,
      },
    };
  });

  return { data };
};

// Delete every processed-image entry that points at a preset.
const deletePresetImages = async (presetId) => {
  const { entries: images } = await getByType("processed-image");
  const mine = images.filter((img) => (img.content?.preset || [])[0] === presetId);
  await Promise.all(mine.map((img) => client().delete(`/entries/${img.id}`)));
};

// --- Write: create a preset + its images ---
const createPresetInVams = async (payload) => {
  // payload = { Name, processed_images:[{name,colors,sourceImage,analysisSettings}], sourceImage }
  const [presetTypeId, imgTypeId] = await Promise.all([typeId("preset"), typeId("processed-image")]);

  const { data: created } = await client().post("/entries", {
    entry_type_id: presetTypeId,
    title: payload.Name,
    content: { description: "", strapi_id: "" },
  });
  const presetId = created?.data?.id;

  const images = payload.processed_images || [];
  for (const image of images) {
    await client().post("/entries", {
      entry_type_id: imgTypeId,
      title: image.name,
      content: imageToContent(presetId, image),
    });
  }

  return { data: { id: presetId, attributes: { Name: payload.Name } } };
};

// Replace a preset's images wholesale (simplest correct update).
const updatePresetInVams = async (presetId, payload) => {
  const imgTypeId = await typeId("processed-image");

  await client().put(`/entries/${presetId}`, { title: payload.Name });

  await deletePresetImages(presetId);
  for (const image of payload.processed_images || []) {
    await client().post("/entries", {
      entry_type_id: imgTypeId,
      title: image.name,
      content: imageToContent(presetId, image),
    });
  }

  return { data: { id: presetId, attributes: { Name: payload.Name } } };
};

const deletePresetInVams = async (presetId) => {
  await deletePresetImages(presetId);
  await client().delete(`/entries/${presetId}`);
  return { data: { id: presetId } };
};

module.exports = {
  fetchPresetsFromVams,
  createPresetInVams,
  updatePresetInVams,
  deletePresetInVams,
};
