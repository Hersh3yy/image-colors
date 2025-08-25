<template>
  <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
    <h4 class="font-medium text-gray-700 mb-2 text-sm">Color Groups</h4>
    <div class="space-y-2">
      <div v-for="(colors, family) in colorFamilies" :key="family" class="bg-white p-2 rounded shadow-sm border border-gray-100">
        <h5 class="font-medium text-xs mb-1">{{ family }}</h5>
        <div class="flex flex-wrap gap-1">
          <AtomsColorSwatch
            v-for="color in colors.slice(0, 3)"
            :key="color.color"
            :color="color.color"
            size="sm"
            :title="getColorDescription(color.color)"
          />
          <span v-if="colors.length > 3" class="text-xs text-gray-500 self-center">+{{ colors.length - 3 }}</span>
        </div>
        <p class="text-xs mt-1 text-gray-500">
          {{ Math.round(colors.reduce((sum, c) => sum + c.percentage, 0)) }}%
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import chroma from "chroma-js";
// Components auto-imported by Nuxt

const props = defineProps({
  /**
   * Array of color objects with color, percentage, etc.
   */
  colors: {
    type: Array,
    required: true
  }
});

/**
 * Group colors by color family for compact display
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
        
        // Categorize by color family (simplified logic)
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
 */
const getColorDescription = (hexColor) => {
  try {
    const color = chroma(hexColor);
    const [h, s, l] = color.hsl();
    
    // Handle NaN values
    const hue = isNaN(h) ? 0 : h;
    const saturation = isNaN(s) ? 0 : s;
    const lightness = isNaN(l) ? 0 : l;
    
    // Simple description logic
    let description = '';
    
    if (saturation < 0.1) {
      if (lightness < 0.15) description = 'black';
      else if (lightness > 0.85) description = 'white';
      else description = 'gray';
    } else {
      // Basic hue names
      if (hue >= 350 || hue < 10) description = 'red';
      else if (hue >= 10 && hue < 45) description = 'orange';
      else if (hue >= 45 && hue < 70) description = 'yellow';
      else if (hue >= 70 && hue < 160) description = 'green';
      else if (hue >= 160 && hue < 250) description = 'blue';
      else if (hue >= 250 && hue < 320) description = 'purple';
      else if (hue >= 320 && hue < 350) description = 'pink';
    }
    
    return description;
  } catch (error) {
    return 'color';
  }
};
</script>
