/**
 * useColorUtils.js - Color Utility Functions
 * 
 * This composable provides utility functions for color manipulation and analysis:
 * - Color space conversions (RGB, HSL, LAB)
 * - Color distance calculations
 * - Confidence scoring
 * - Color normalization
 */

import { ref, computed } from 'vue';
import chroma from 'chroma-js';
import { parentColors } from '../data/colors';

export function useColorUtils() {
  /**
   * Get a confidence class based on a distance or confidence value
   * @param {number} value - The distance or confidence value
   * @param {boolean} isConfidence - Whether the value is a confidence (true) or distance (false)
   * @returns {string} CSS class
   */
  const getConfidenceClass = (value, isConfidence = false) => {
    if (value === undefined || value === null) return 'text-gray-400';
    
    // If value is a confidence percentage
    if (isConfidence) {
      if (value >= 95) return 'text-green-600 font-medium';
      if (value >= 85) return 'text-green-500';
      if (value >= 70) return 'text-yellow-600';
      if (value >= 50) return 'text-orange-500';
      return 'text-red-500';
    }
    
    // If value is a distance (lower is better)
    if (value < 2) return 'text-green-600 font-medium';
    if (value < 5) return 'text-green-500';
    if (value < 10) return 'text-yellow-600';
    if (value < 20) return 'text-orange-500';
    return 'text-red-500';
  };

  /**
   * Convert a hex color to LAB color space
   * @param {string} hexColor - Hex color code
   * @returns {Object} LAB color values
   */
  const hexToLab = (hexColor) => {
    try {
      const lab = chroma(hexColor).lab();
      return {
        l: lab[0],
        a: lab[1],
        b: lab[2]
      };
    } catch (e) {
      console.error('Error converting color to LAB:', e);
      return { l: 0, a: 0, b: 0 };
    }
  };

  /**
   * Calculate normalized color information in different color spaces
   * @param {string} hexColor - Hex color code
   * @returns {Object} Normalized color information
   */
  const calculateColorInfo = (hexColor) => {
    try {
      const color = chroma(hexColor);
      
      // Get color in various spaces
      const rgb = color.rgb();
      const lab = color.lab();
      const hsl = color.hsl();
      
      return {
        hex: hexColor,
        rgb: {
          r: rgb[0],
          g: rgb[1],
          b: rgb[2]
        },
        lab: {
          l: lab[0],
          a: lab[1],
          b: lab[2]
        },
        hsl: {
          h: isNaN(hsl[0]) ? 0 : hsl[0],
          s: isNaN(hsl[1]) ? 0 : hsl[1],
          l: isNaN(hsl[2]) ? 0 : hsl[2]
        }
      };
    } catch (e) {
      console.error('Error calculating color info:', e);
      return {
        hex: hexColor,
        rgb: { r: 0, g: 0, b: 0 },
        lab: { l: 0, a: 0, b: 0 },
        hsl: { h: 0, s: 0, l: 0 }
      };
    }
  };

  /**
   * Calculate the distance between two colors
   * @param {Object} color1 - First color in LAB space
   * @param {Object} color2 - Second color in LAB space
   * @returns {number} Color distance
   */
  const calculateColorDistance = (color1, color2) => {
    const lab1 = color1.lab || hexToLab(color1.hex);
    const lab2 = color2.lab || hexToLab(color2.hex);
    
    // Delta E calculation (CIE76)
    const deltaL = lab1.l - lab2.l;
    const deltaA = lab1.a - lab2.a;
    const deltaB = lab1.b - lab2.b;
    
    return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
  };

  /**
   * Calculate the distance between a color and all parent colors
   * @param {string} hexColor - Hex color code
   * @returns {Object} The closest parent color with distance
   */
  const getParentColorDistance = (hexColor) => {
    const colorInfo = calculateColorInfo(hexColor);
    
    // Calculate distance to each parent color
    const results = parentColors.map(parent => {
      const distance = calculateColorDistance(colorInfo, { hex: parent.hex });
      return {
        ...parent,
        distance
      };
    });
    
    // Sort by distance and return the closest
    return results.sort((a, b) => a.distance - b.distance)[0];
  };

  /**
   * Normalize a color to ensure proper format
   * @param {string} color - Color code
   * @returns {string} Normalized color code
   */
  const normalizeColor = (color) => {
    if (!color) return '#000000';
    
    try {
      return chroma(color).hex();
    } catch (e) {
      console.error('Error normalizing color:', e);
      return '#000000';
    }
  };
  
  /**
   * Calculate a confidence score for color matching
   * @param {Object} color1 - First color information
   * @param {Object} color2 - Second color or hex code
   * @returns {number} Distance score (lower is better)
   */
  const calculateConfidence = (color1, color2) => {
    const color2Info = typeof color2 === 'string' 
      ? calculateColorInfo(color2) 
      : (color2.hex ? calculateColorInfo(color2.hex) : color2);
    
    return calculateColorDistance(color1, color2Info);
  };

  /**
   * Get user-friendly color description based on HSL values
   * @param {string} hexColor - Hex color code
   * @returns {string} Human-readable color description
   */
  const getColorDescription = (hexColor) => {
    if (!hexColor) return 'color';
    
    try {
      const color = chroma(hexColor);
      const [h, s, l] = color.hsl();
      
      // Handle NaN values
      const hue = isNaN(h) ? 0 : h;
      const saturation = isNaN(s) ? 0 : s;
      const lightness = isNaN(l) ? 0 : l;
      
      // Lightness description
      let lightnessDesc = '';
      if (lightness < 0.15) lightnessDesc = 'very dark';
      else if (lightness < 0.35) lightnessDesc = 'dark';
      else if (lightness > 0.85) lightnessDesc = 'very light';
      else if (lightness > 0.65) lightnessDesc = 'light';
      else lightnessDesc = 'medium';
      
      // Saturation description
      let saturationDesc = '';
      if (saturation < 0.1) saturationDesc = 'neutral';
      else if (saturation < 0.3) saturationDesc = 'muted';
      else if (saturation > 0.8) saturationDesc = 'vibrant';
      else if (saturation > 0.5) saturationDesc = 'rich';
      else saturationDesc = '';
      
      // Hue description
      let hueDesc = '';
      if (saturation < 0.1) {
        if (lightness < 0.15) hueDesc = 'black';
        else if (lightness > 0.85) hueDesc = 'white';
        else hueDesc = 'gray';
      } else if (hue >= 350 || hue < 10) hueDesc = 'red';
      else if (hue >= 10 && hue < 45) {
        if (lightness < 0.4 && saturation < 0.6) hueDesc = 'brown';
        else hueDesc = 'orange';
      }
      else if (hue >= 45 && hue < 70) hueDesc = 'yellow';
      else if (hue >= 70 && hue < 160) hueDesc = 'green';
      else if (hue >= 160 && hue < 190) hueDesc = 'teal';
      else if (hue >= 190 && hue < 250) hueDesc = 'blue';
      else if (hue >= 250 && hue < 290) hueDesc = 'purple';
      else if (hue >= 290 && hue < 320) hueDesc = 'violet';
      else if (hue >= 320 && hue < 350) hueDesc = 'pink';
      
      // Combine descriptions
      const parts = [lightnessDesc, saturationDesc, hueDesc].filter(part => part);
      return parts.join(' ');
    } catch (error) {
      console.error('Error generating color description:', error);
      return 'color';
    }
  };
  
  /**
   * Get human-readable description of a confidence score
   * @param {number} score - Confidence score or distance
   * @returns {string} Human-readable confidence description
   */
  const getConfidenceDescription = (score) => {
    if (score === undefined || score === null) return 'Unknown';
    
    // For distance scores (lower is better)
    if (score < 2) return 'Excellent match';
    if (score < 5) return 'Good match';
    if (score < 10) return 'Acceptable match';
    if (score < 20) return 'Fair match';
    return 'Poor match';
  };
  
  /**
   * Group parent colors by color family for better organization
   * @returns {Array} Array of color families with their colors
   */
  const groupColorsByFamily = () => {
    // Add family information to colors if not present
    const colorsByFamily = parentColors.map(color => {
      const { hex } = color;
      let family = color.family;
      
      // If family is not defined, determine it from the color
      if (!family) {
        try {
          const [h, s, l] = chroma(hex).hsl();
          const hue = isNaN(h) ? 0 : h;
          const saturation = isNaN(s) ? 0 : s;
          
          // Assign family based on hue ranges
          if (saturation < 0.1) {
            family = 'Grayscale';
          } else if (hue >= 330 || hue < 30) {
            family = 'Reds & Pinks';
          } else if (hue >= 30 && hue < 60) {
            family = 'Oranges & Browns';
          } else if (hue >= 60 && hue < 90) {
            family = 'Yellows & Golds';
          } else if (hue >= 90 && hue < 180) {
            family = 'Greens';
          } else if (hue >= 180 && hue < 270) {
            family = 'Blues & Teals';
          } else {
            family = 'Purples & Violets';
          }
        } catch (e) {
          family = 'Other';
        }
      }
      
      return {
        ...color,
        family
      };
    });
    
    // Group by family
    const families = {};
    colorsByFamily.forEach(color => {
      const family = color.family;
      if (!families[family]) {
        families[family] = [];
      }
      families[family].push(color);
    });
    
    // Convert to array and sort
    return Object.entries(families)
      .map(([name, colors]) => ({ name, colors }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  return {
    getConfidenceClass,
    calculateColorInfo,
    getParentColorDistance,
    normalizeColor,
    calculateConfidence,
    getColorDescription,
    getConfidenceDescription,
    groupColorsByFamily
  };
} 