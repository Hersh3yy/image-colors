// colorService.js
import {
  rgbToLabChroma,
  rgbToLabColorConvert,
  euclideanDistanceLab,
  rgbToHex,
  hexToRgb,
} from "./colorUtils";

let processedColors = [];

export const loadProcessedColors = async (colors) => {
  processedColors = colors.map((color) => ({
    ...color,
    rgb: hexToRgb(color.hex),
    labChroma: rgbToLabChroma(hexToRgb(color.hex)),
    labColorConvert: rgbToLabColorConvert(hexToRgb(color.hex)),
  }));
};

export const getClosestColorInfo = (color, method = "chroma") => {
  const rgb =
    color.r !== undefined ? [color.r, color.g, color.b] : hexToRgb(color.hex);
  const lab =
    method === "chroma" ? rgbToLabChroma(rgb) : rgbToLabColorConvert(rgb);

  let closestColor = null;
  let minDistance = Infinity;

  for (const processedColor of processedColors) {
    const distance = euclideanDistanceLab(
      lab,
      processedColor[method === "chroma" ? "labChroma" : "labColorConvert"]
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = processedColor;
    }
  }

  return closestColor;
};

export const updateParentColors = (newParentColors) => {
  loadProcessedColors(newParentColors);
};
