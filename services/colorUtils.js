// colorUtils.js
import chroma from "chroma-js";
import colorConvert from "color-convert";
import axios from 'axios';

export const rgbToLabChroma = (rgb) => {
  return chroma(rgb).lab();
};

export const rgbToLabColorConvert = (rgb) => {
  return colorConvert.rgb.lab(rgb);
};

export const deltaE = (labA, labB) => {
  const deltaL = labA[0] - labB[0];
  const deltaA = labA[1] - labB[1];
  const deltaB = labA[2] - labB[2];
  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
};

export const euclideanDistanceLab = (labA, labB) => {
  return deltaE(labA, labB);
};

export const rgbToHex = (r, g, b) => {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
};

export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : null;
};

export const getClosestColorInfo = async (color) => {
  let url = `${this.$config.public.apiBaseURL}/analyze}/closest_color_lab`;
  url += color.r ? `?r=${color.r}&g=${color.g}&b=${color.b}` : `?hex=${color.html_code.substring(1)}`;
  const response = await axios.get(url)
  return response.data
};

// Add more color-related functions as needed
export const euclideanDistanceOld = (lab1, lab2) => {
  return Math.sqrt(
      Math.pow(lab1.l - lab2.l, 2) +
      Math.pow(lab1.a - lab2.a, 2) +
      Math.pow(lab1.b - lab2.b, 2)
  )
}

export const hexToLab = (hex) => {
  const lab = chroma(hex).lab();
  return { l: lab[0], a: lab[1], b: lab[2] };
}

export const hexToHSL = (H) => {
  // Convert hex to RGB first
  let r = 0, g = 0, b = 0;
  if (H.length === 4) {
      r = "0x" + H[1] + H[1];
      g = "0x" + H[2] + H[2];
      b = "0x" + H[3] + H[3];
  } else if (H.length === 7) {
      r = "0x" + H[1] + H[2];
      g = "0x" + H[3] + H[4];
      b = "0x" + H[5] + H[6];
  }

  // Then to HSL
  r /= 255;
  g /= 255;
  b /= 255;
  let cmin = Math.min(r, g, b),
      cmax = Math.max(r, g, b),
      delta = cmax - cmin,
      h = 0,
      s = 0,
      l = 0;

  if (delta === 0)
      h = 0;
  else if (cmax === r)
      h = ((g - b) / delta) % 6;
  else if (cmax === g)
      h = (b - r) / delta + 2;
  else
      h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  if (h < 0)
      h += 360;

  l = (cmax + cmin) / 2;

  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return [h, s, l];
}

// Moved parentColors to colorUtils.js
export const initialParentColors = [
  { hex: "#FF0000", name: "Red" },
  { hex: "#00FFFF", name: "Cyan" },
  { hex: "#0000FF", name: "Blue" },
  { hex: "#00008B", name: "DarkBlue" },
  { hex: "#ADD8E6", name: "LightBlue" },
  { hex: "#800080", name: "Purple" },
  { hex: "#FFD700", name: "Gold" },
  { hex: "#00FF00", name: "Lime" },
  { hex: "#FF00FF", name: "Magenta" },
  { hex: "#FFD8B1", name: "Apricot" },
  { hex: "#DCBEFF", name: "Lavender" },
  { hex: "#C0C0C0", name: "Silver" },
  { hex: "#FFA500", name: "Orange" },
  { hex: "#A52A2A", name: "Brown" },
  { hex: "#800000", name: "Maroon" },
  { hex: "#008000", name: "Green" },
  { hex: "#AAFFC3", name: "Mint" },
  { hex: "#808000", name: "Olive" },
  { hex: "#7FFFD4", name: "Aquamarine" },
  { hex: "#808080", name: "Grey" },
  { hex: "#FFFDD0", name: "Cream" },
  { hex: "#FFFFFF", name: "White" },
  { hex: "#000000", name: "Black" },
  { hex: "#DEB887", name: "Burlywood" },
  { hex: "#8B4513", name: "Saddle Brown" },
  { hex: "#FF4500", name: "Orange Red" },
  { hex: "#6A5ACD", name: "Slate Blue" },
  { hex: "#5F9EA0", name: "Cadet Blue" },
  { hex: "#98FB98", name: "Pale Green" },
  { hex: "#DB7093", name: "Pale Violet Red" },
  { hex: "#4682B4", name: "Steel Blue" },
  { hex: "#DAA520", name: "Goldenrod" },
  { hex: "#40E0D0", name: "Turquoise" },
  { hex: "#8A2BE2", name: "Blue Violet" },
  { hex: "#FA8072", name: "Salmon" },
];
