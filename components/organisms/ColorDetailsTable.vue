<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <h4 class="font-medium text-gray-700">Color Details</h4>
      <MoleculesInfoTooltip 
        width="xl"
        content="Detailed breakdown of each detected color with its closest matches. Analysis uses LAB color space and DELTA_E distance calculation. Delta (Δ) values represent color distance - lower values mean closer/better matches. Grayscale colors (low saturation) are detected automatically and categorized as blacks, whites, or grays based on lightness values."
      />
    </div>
    <div class="overflow-x-auto rounded-lg border">
      <table class="min-w-full divide-y divide-gray-200">
        <!-- Section Headers -->
        <thead>
          <tr class="bg-gray-100">
            
            <!-- PANTONE SECTION FIRST (as requested) -->
            <th colspan="2" class="px-3 py-1 text-left text-xs font-semibold text-gray-700 uppercase bg-gray-50">
              Pantone Match
            </th>
            <th colspan="3" class="px-3 py-1 text-left text-xs font-semibold text-gray-700 uppercase">
              Extracted Color
            </th>
            <!-- PARENT SECTION SECOND -->
            <th colspan="2" class="px-3 py-1 text-left text-xs font-semibold text-gray-700 uppercase bg-blue-50">
              Parent Match
            </th>
            <th class="px-3 py-1 text-left text-xs font-semibold text-gray-700 uppercase">
              Feedback
            </th>
          </tr>
        </thead>
        
        <!-- Column Headers -->
        <thead class="bg-gray-50">
          <tr>
            <!-- PANTONE COLUMNS FIRST (as requested) -->
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Pantone Color
            </th>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Pantone Name
            </th>
            <!-- EXTRACTED COLOR COLUMNS -->
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" @click="handleSort('color')">
              Color
              <span v-if="sortBy === 'color'" class="ml-1">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
            </th>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" @click="handleSort('description')">
              Description
              <span v-if="sortBy === 'description'" class="ml-1">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
            </th>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" @click="handleSort('percentage')">
              %
              <span v-if="sortBy === 'percentage'" class="ml-1">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
            </th>
            
            <!-- PARENT COLUMNS SECOND -->
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-blue-50 cursor-pointer" @click="handleSort('parentName')">
              Parent Color
              <span v-if="sortBy === 'parentName'" class="ml-1">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
            </th>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-blue-50 cursor-pointer" @click="handleSort('parentDistance')">
              Delta (Δ)
              <span v-if="sortBy === 'parentDistance'" class="ml-1">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
            </th>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="color in sortedData" :key="color.color + updateCounter" class="hover:bg-gray-50" :data-row-color="color.color">
                        <!-- PANTONE COLUMNS FIRST (as requested) -->
            <!-- Pantone Color -->
            <td class="px-3 py-2">
              <div class="flex items-center gap-2">
                <AtomsColorSwatch 
                  :color="color.pantone.hex" 
                  size="md"
                  @copy="copyToClipboard"
                />
                <span class="text-sm font-mono">{{ color.pantone.code || 'N/A' }}</span>
              </div>
            </td>
            
            <!-- Pantone Name -->
            <td class="px-3 py-2 text-sm">{{ color.pantone.name || 'N/A' }}</td>
            <!-- Original Color -->
            <td class="px-3 py-2">
              <div class="flex items-center gap-2">
                <AtomsColorSwatch 
                  :color="color.color" 
                  size="lg"
                  @copy="copyToClipboard"
                  :data-color="color.color"
                />
                <span class="text-sm font-mono original-color-hex">{{ color.color }}</span>
              </div>
            </td>
            
            <!-- Color Description -->
            <td class="px-3 py-2 text-sm">{{ getColorDescription(color.color) }}</td>
            
            <!-- Percentage -->
            <td class="px-3 py-2 text-sm">{{ color.percentage.toFixed(1) }}%</td>
            
            
            <!-- PARENT COLUMNS SECOND -->
            <!-- Parent Match -->
            <td class="px-3 py-2 bg-blue-50">
              <div class="flex items-center gap-2">
                <div 
                  class="w-6 h-6 rounded border cursor-pointer hover:shadow-md transition relative group parent-color" 
                  :style="{ backgroundColor: color.parent.hex }"
                  @click="copyToClipboard(color.parent.hex)"
                  :title="`Click to copy: ${color.parent.hex}`"
                  :data-parent-hex="color.parent.hex"
                >
                  <div class="absolute z-20 -bottom-1 -right-1 transform scale-0 group-hover:scale-100 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3a1 1 0 011-1h2a1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                  </div>
                </div>
                <span class="text-sm font-medium parent-name">{{ color.parent.name || 'N/A' }}</span>
              </div>
            </td>
            
            <!-- Parent Distance -->
            <td class="px-3 py-2 bg-blue-50 relative group">
              <div class="flex items-center gap-2">
                <span class="text-sm parent-distance" :class="getDistanceClass(color.parent.distance)">
                  {{ color.parent.distance?.toFixed(1) || 'N/A' }} Δ
                </span>
              </div>
              <div v-if="isGrayscale(color.color)" class="text-xs text-gray-500 mt-1">
                Detected as grayscale
              </div>
            </td>
            
            <!-- Actions -->
            <td class="px-3 py-2">
              <AtomsBaseButton 
                @click="emit('feedback', color)"
                variant="primary"
                size="sm"
                text="Improve Match"
                title="Provide feedback for this color match"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="debugInfo" class="mt-2 text-xs text-gray-500">
      Last refresh: {{ debugInfo }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from "vue";
import chroma from "chroma-js";
import { useColorUtils } from '@/composables/useColorUtils';
// Components auto-imported by Nuxt
// Components auto-imported by Nuxt

const props = defineProps({
  colors: {
    type: Array,
    required: true
  },
  analysisSettings: {
    type: Object,
    default: () => ({
      colorSpace: 'LAB',
      distanceMethod: 'DELTA_E'
    })
  }
});

const emit = defineEmits(['feedback', 'copy']);

// State
const updateCounter = ref(0);
const debugInfo = ref('');

// Import color utilities
const colorUtils = useColorUtils();
const getColorDescription = colorUtils.getColorDescription;

// Sorting state
const sortBy = ref('percentage'); // Default sort by percentage
const sortDirection = ref('desc'); // Default descending order

// Update debug timestamp when colors change
watch(() => props.colors, (newColors, oldColors) => {
  console.log('ColorDetailsTable colors prop changed:', {
    newLength: newColors?.length,
    oldLength: oldColors?.length,
    sample: newColors?.[0]?.color
  });
  debugInfo.value = new Date().toLocaleTimeString();
  updateCounter.value++;
}, { deep: true });

/**
 * Handle column sort
 */
const handleSort = (column) => {
  // If clicking the same column, toggle direction
  if (sortBy.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    // New column, set as active sort with default direction
    sortBy.value = column;
    
    // Set default direction based on column type
    if (column === 'percentage') {
      sortDirection.value = 'desc'; // Higher percentages first
    } else if (column === 'parentDistance') {
      sortDirection.value = 'asc'; // Lower distances (better matches) first
    } else {
      sortDirection.value = 'asc'; // Alphabetical for text columns
    }
  }
};

/**
 * Sort colors based on current sort criteria
 */
const sortedData = computed(() => {
  if (!props.colors || !props.colors.length) return [];
  
  // Create a copy of the array to avoid modifying the original
  const colorsCopy = [...props.colors];
  
  // Sort based on active criteria
  return colorsCopy.sort((a, b) => {
    const multiplier = sortDirection.value === 'asc' ? 1 : -1;
    
    switch (sortBy.value) {
      case 'color':
        return multiplier * a.color.localeCompare(b.color);
        
      case 'description':
        return multiplier * getColorDescription(a.color).localeCompare(getColorDescription(b.color));
        
      case 'percentage':
        return multiplier * (a.percentage - b.percentage);
        
      case 'parentName':
        const nameA = a.parent?.name || '';
        const nameB = b.parent?.name || '';
        return multiplier * nameA.localeCompare(nameB);
        
      case 'parentDistance':
        const distA = a.parent?.distance || 0;
        const distB = b.parent?.distance || 0;
        return multiplier * (distA - distB);
        
      default:
        return multiplier * (a.percentage - b.percentage);
    }
  });
});

/**
 * Get styling class based on distance value
 * Lower is better
 */
const getDistanceClass = (distance) => {
  if (!distance && distance !== 0) return 'text-gray-400';
  if (distance < 2) return 'text-green-600 font-medium';
  if (distance < 5) return 'text-green-500';
  if (distance < 10) return 'text-yellow-600';
  if (distance < 20) return 'text-orange-500';
  return 'text-red-500';
};

/**
 * Check if a color is grayscale (very low saturation)
 */
const isGrayscale = (hexColor) => {
  try {
    const color = chroma(hexColor);
    const [h, s, l] = color.hsl();
    // If saturation is very low, it's effectively grayscale
    return isNaN(s) || s < 0.08;
  } catch (e) {
    return false;
  }
};

/**
 * Copy a color code to clipboard
 */
const copyToClipboard = (colorCode) => {
  navigator.clipboard.writeText(colorCode)
    .then(() => {
      // Emit copy event for parent component to show toast
      emit('copy', colorCode);
    })
    .catch(err => {
      console.error('Failed to copy: ', err);
    });
};

/**
 * Force a refresh of the table data
 * This can be called by parent components when data has changed
 */
const refreshTable = () => {
  console.log('ColorDetailsTable refreshTable() called with colors:', props.colors.length);
  debugInfo.value = new Date().toLocaleTimeString() + ' (manual refresh)';
  
  // Force re-render by incrementing the update counter
  updateCounter.value++;
  console.log('Incremented update counter to:', updateCounter.value);
  
  // Apply any updates to the DOM directly in case the reactivity system isn't triggering
  nextTick(() => {
    // Find all color cells and update their corresponding parent cells
    document.querySelectorAll('[data-color]').forEach(colorCell => {
      const colorHex = colorCell.getAttribute('data-color');
      console.log(`Looking for updates for color: ${colorHex}`);
      
      const matchingColor = props.colors.find(c => c.color === colorHex);
      
      if (matchingColor) {
        console.log(`Found color in data:`, {
          color: matchingColor.color,
          parentName: matchingColor.parent.name,
          parentHex: matchingColor.parent.hex
        });
        
        // Get the row that contains this cell
        const row = colorCell.closest('tr');
        if (row) {
          // Update parent color cell
          const parentColorCell = row.querySelector('.parent-color');
          if (parentColorCell) {
            parentColorCell.style.backgroundColor = matchingColor.parent.hex;
            parentColorCell.setAttribute('data-parent-hex', matchingColor.parent.hex);
            parentColorCell.title = `Click to copy: ${matchingColor.parent.hex}`;
            console.log(`Updated parent color cell to ${matchingColor.parent.hex}`);
          } else {
            console.warn('Parent color cell not found for', colorHex);
          }
          
          // Update parent name cell
          const parentNameCell = row.querySelector('.parent-name');
          if (parentNameCell) {
            parentNameCell.textContent = matchingColor.parent.name || 'N/A';
            console.log(`Updated parent name cell to ${matchingColor.parent.name}`);
          } else {
            console.warn('Parent name cell not found for', colorHex);
          }
          
          // Update distance value
          const distanceCell = row.querySelector('.parent-distance');
          if (distanceCell) {
            distanceCell.textContent = `${matchingColor.parent.distance?.toFixed(1) || 'N/A'} Δ`;
            
            // Update the distance class based on the new value
            const distanceClasses = ['text-green-600', 'text-green-500', 'text-yellow-600', 'text-orange-500', 'text-red-500', 'text-gray-400', 'font-medium'];
            distanceClasses.forEach(cls => distanceCell.classList.remove(cls));
            
            const newClass = getDistanceClass(matchingColor.parent.distance);
            distanceCell.classList.add(...newClass.split(' '));
            
            console.log(`Updated parent distance cell to ${matchingColor.parent.distance}`);
          } else {
            console.warn('Parent distance cell not found for', colorHex);
          }
        } else {
          console.warn('Could not find row for color cell', colorHex);
        }
      } else {
        console.warn('Could not find matching color in data for', colorHex);
      }
    });
    
    console.log('Table refresh complete');
  });
};

// Expose methods for parent components
defineExpose({
  refreshTable
});
</script> 