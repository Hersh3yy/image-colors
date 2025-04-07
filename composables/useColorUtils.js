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

export function useColorUtils() {
  /**
   * Get confidence class for styling
   * @param {number} confidence - Confidence value between 0 and 100
   * @returns {string} - CSS class name
   */
  const getConfidenceClass = (confidence) => {
    if (confidence >= 90) return 'bg-green-500';
    if (confidence >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  /**
   * Calculate color information between two colors
   * @param {string} color1 - First color in hex format
   * @param {string} color2 - Second color in hex format
   * @returns {Object} - Color information object
   */
  const calculateColorInfo = (color1, color2) => {
    try {
      const c1 = chroma(color1);
      const c2 = chroma(color2);
      
      return {
        original: {
          rgb: c1.rgb(),
          hsl: c1.hsl(),
          lab: c1.lab(),
          hex: c1.hex()
        },
        system: {
          rgb: c2.rgb(),
          hsl: c2.hsl(),
          lab: c2.lab(),
          hex: c2.hex()
        },
        distances: {
          deltaE: chroma.deltaE(c1, c2),
          rgb: chroma.distance(c1, c2, 'rgb'),
          lab: chroma.distance(c1, c2, 'lab'),
          hsl: chroma.distance(c1, c2, 'hsl')
        },
        diffs: {
          rgb: c1.rgb().map((v, i) => v - c2.rgb()[i]),
          lab: c1.lab().map((v, i) => v - c2.lab()[i]),
          hsl: c1.hsl().map((v, i) => v - c2.hsl()[i])
        }
      };
    } catch (error) {
      console.error('Error calculating color info:', error);
      return null;
    }
  };

  /**
   * Calculate distance between a color and a parent color
   * @param {Object} parentColor - Parent color object with hex property
   * @returns {number|null} - Distance value or null if error
   */
  const getParentColorDistance = (parentColor) => {
    if (!parentColor || !parentColor.hex) return null;
    try {
      return chroma.deltaE(chroma(parentColor.hex), chroma(parentColor.hex));
    } catch (error) {
      console.error('Error calculating parent color distance:', error);
      return null;
    }
  };

  /**
   * Normalize a color to hex format
   * @param {string|Object} color - Color to normalize
   * @returns {string} - Normalized hex color
   */
  const normalizeColor = (color) => {
    try {
      if (typeof color === 'string' && color.startsWith('#')) {
        return color;
      }
      
      if (typeof color === 'object' && 'r' in color && 'g' in color && 'b' in color) {
        return chroma(color.r, color.g, color.b).hex();
      }
      
      return null;
    } catch (error) {
      console.error('Error normalizing color:', error);
      return null;
    }
  };

  /**
   * Calculate confidence score for a color match
   * @param {number} deltaE - Delta E color difference
   * @returns {number} - Confidence score between 0 and 100
   */
  const calculateConfidence = (deltaE) => {
    // Convert deltaE to confidence score (inverse relationship)
    // deltaE of 0 = 100% confidence
    // deltaE of 100 = 0% confidence
    return Math.max(0, Math.min(100, 100 - deltaE));
  };

  return {
    getConfidenceClass,
    calculateColorInfo,
    getParentColorDistance,
    normalizeColor,
    calculateConfidence
  };
} 