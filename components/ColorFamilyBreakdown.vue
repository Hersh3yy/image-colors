<template>
  <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
    <div class="flex items-center justify-between mb-3">
      <h4 class="font-medium text-gray-700">Color Family Breakdown</h4>
      <div class="relative group">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 cursor-help" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
        </svg>
        <div class="absolute bottom-full right-0 transform -translate-y-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 w-64 z-10">
          <p>This shows colors grouped by artistic color families based on HSL values:</p>
          <ul class="list-disc pl-4 mt-1 space-y-1">
            <li>Colors with low saturation (&lt;8%) are categorized as grayscale</li>
            <li>Hue ranges determine color families (e.g., reds: 350°-10°)</li>
            <li>Both saturation and lightness affect categories (e.g., browns vs. reds)</li>
            <li>Click on any color to provide feedback for matching</li>
          </ul>
        </div>
      </div>
    </div>
    
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      <div v-for="(colors, family) in colorFamilies" :key="family" class="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
        <h5 class="font-medium text-sm mb-2">{{ family }}</h5>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="color in colors"
            :key="color.color"
            class="w-6 h-6 rounded-full border shadow-sm cursor-pointer transition-transform hover:scale-125"
            :style="{ backgroundColor: color.color }"
            :title="getColorDescription(color.color)"
            @click="$emit('feedback', color)"
          ></div>
        </div>
        <p class="text-xs mt-2 text-gray-500">
          {{ Math.round(colors.reduce((sum, c) => sum + c.percentage, 0)) }}% of image
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import chroma from "chroma-js";

const props = defineProps({
  colors: {
    type: Array,
    required: true
  }
});

defineEmits(['feedback']);

/**
 * Group colors by color family
 * Uses hue ranges to categorize colors into familiar groups for artists
 */
const colorFamilies = computed(() => {
  if (!props.colors || !props.colors.length) {
    return {};
  }

  try {
    const families = {
      'Reds': [],
      'Oranges': [],
      'Yellows': [],
      'Greens': [],
      'Blues': [],
      'Purples': [],
      'Pinks': [],
      'Browns': [],
      'Grays': [],
      'Blacks & Whites': []
    };

    props.colors.forEach(color => {
      try {
        const c = chroma(color.color);
        const [h, s, l] = c.hsl();
        
        // Handle NaN values in HSL
        const hue = isNaN(h) ? 0 : h;
        const saturation = isNaN(s) ? 0 : s;
        const lightness = isNaN(l) ? 0 : l;
        
        // Categorize by color family
        if (saturation < 0.08) {
          if (lightness < 0.15) {
            families['Blacks & Whites'].push(color);
          } else if (lightness > 0.85) {
            families['Blacks & Whites'].push(color);
          } else {
            families['Grays'].push(color);
          }
        } else if (saturation < 0.2 && lightness < 0.4) {
          families['Browns'].push(color);
        } else if ((hue >= 350 || hue < 10) && lightness > 0.4) {
          families['Reds'].push(color);
        } else if ((hue >= 350 || hue < 10) && lightness <= 0.4) {
          families['Browns'].push(color);
        } else if (hue >= 10 && hue < 45 && lightness > 0.4) {
          families['Oranges'].push(color);
        } else if (hue >= 10 && hue < 45 && lightness <= 0.4) {
          families['Browns'].push(color);
        } else if (hue >= 45 && hue < 70) {
          families['Yellows'].push(color);
        } else if (hue >= 70 && hue < 160) {
          families['Greens'].push(color);
        } else if (hue >= 160 && hue < 250) {
          families['Blues'].push(color);
        } else if (hue >= 250 && hue < 320) {
          families['Purples'].push(color);
        } else if (hue >= 320 && hue < 350) {
          families['Pinks'].push(color);
        } else {
          // Fallback for any colors that don't fit into the above categories
          families['Grays'].push(color);
        }
      } catch (e) {
        console.error('Error categorizing color:', e);
      }
    });

    // Filter out empty families
    return Object.fromEntries(
      Object.entries(families).filter(([_, colors]) => colors.length > 0)
    );
  } catch (error) {
    console.error('Error calculating color families:', error);
    return {};
  }
});

/**
 * Get user-friendly color description
 * @param {string} hexColor - Hex color to describe
 * @returns {string} - Artist-friendly description
 */
const getColorDescription = (hexColor) => {
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
    return 'color';
  }
};
</script> 