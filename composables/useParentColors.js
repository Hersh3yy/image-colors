/**
 * useParentColors.js - Composable for managing parent colors
 * 
 * This composable provides functionality for:
 * - Default parent colors definition
 * - Parent color management
 * - Parent color storage and retrieval
 */

import { ref, onMounted } from 'vue';

export function useParentColors() {
  // Default set of parent colors
  const defaultParentColors = [
    { name: "Red", hex: "#FF0000" },
    { name: "Dark Red", hex: "#8B0000" },
    { name: "Salmon", hex: "#FA8072" },
    { name: "Pink", hex: "#FFC0CB" },
    { name: "Hot Pink", hex: "#FF69B4" },
    { name: "Orange", hex: "#FFA500" },
    { name: "Dark Orange", hex: "#FF8C00" },
    { name: "Coral", hex: "#FF7F50" },
    { name: "Gold", hex: "#FFD700" },
    { name: "Yellow", hex: "#FFFF00" },
    { name: "Lime", hex: "#00FF00" },
    { name: "Green", hex: "#008000" },
    { name: "Forest Green", hex: "#228B22" },
    { name: "Olive", hex: "#808000" },
    { name: "Mint", hex: "#98FB98" },
    { name: "Teal", hex: "#008080" },
    { name: "Cyan", hex: "#00FFFF" },
    { name: "Sky Blue", hex: "#87CEEB" },
    { name: "Light Blue", hex: "#ADD8E6" },
    { name: "Blue", hex: "#0000FF" },
    { name: "Navy", hex: "#000080" },
    { name: "Purple", hex: "#800080" },
    { name: "Violet", hex: "#EE82EE" },
    { name: "Magenta", hex: "#FF00FF" },
    { name: "Brown", hex: "#A52A2A" },
    { name: "Chocolate", hex: "#D2691E" },
    { name: "Tan", hex: "#D2B48C" },
    { name: "White", hex: "#FFFFFF" },
    { name: "Silver", hex: "#C0C0C0" },
    { name: "Gray", hex: "#808080" },
    { name: "Dark Gray", hex: "#404040" },
    { name: "Black", hex: "#000000" }
  ];

  // Reference to current parent colors
  const parentColors = ref([...defaultParentColors]);

  // Check if we're in a browser environment
  const isBrowser = () => typeof window !== 'undefined' && window.localStorage;

  /**
   * Load saved parent colors from local storage or use defaults
   */
  const loadParentColors = () => {
    if (!isBrowser()) {
      return; // Skip localStorage operations if not in browser
    }
    
    try {
      const savedColors = localStorage.getItem('parentColors');
      if (savedColors) {
        parentColors.value = JSON.parse(savedColors);
      }
    } catch (error) {
      console.error('Error loading parent colors:', error);
      // If there's an error, fall back to defaults
      parentColors.value = [...defaultParentColors];
    }
  };

  /**
   * Save current parent colors to local storage
   */
  const saveParentColors = () => {
    if (!isBrowser()) {
      return; // Skip localStorage operations if not in browser
    }
    
    try {
      localStorage.setItem('parentColors', JSON.stringify(parentColors.value));
    } catch (error) {
      console.error('Error saving parent colors:', error);
    }
  };

  /**
   * Update parent colors
   * @param {Array} newColors - New parent colors
   */
  const updateParentColors = (newColors) => {
    parentColors.value = newColors;
    saveParentColors();
  };

  /**
   * Reset parent colors to defaults
   */
  const resetParentColors = () => {
    parentColors.value = [...defaultParentColors];
    saveParentColors();
  };

  /**
   * Get the hex value for a named parent color
   * @param {string} name - Name of the parent color
   * @returns {string} - Hex color value or default if not found
   */
  const getParentColorByName = (name) => {
    const color = parentColors.value.find(c => c.name === name);
    return color ? color.hex : '#CCCCCC'; // Default gray if not found
  };

  // Only load colors from localStorage in the browser environment
  // During SSR, we'll use the default colors
  if (isBrowser()) {
    loadParentColors();
  } else {
    // In SSR context, just use the defaults
    parentColors.value = [...defaultParentColors];
  }

  // For client-side hydration, load colors once mounted
  onMounted(() => {
    loadParentColors();
  });

  return {
    parentColors,
    updateParentColors,
    resetParentColors,
    getParentColorByName
  };
} 