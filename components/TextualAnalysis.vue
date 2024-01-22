<template>
  <div class="ml-4 p-4 border rounded shadow">
    <p class="text-lg font-semibold">Color Analysis</p>

    <div class="flex">
      <!-- Column for Most Used Color and Pantone -->
      <div class="flex-1 mr-4">
        <p><strong>Most Used Color:</strong></p>
        <div class="flex items-center mb-3">
          <div class="w-12 h-12 border" :style="{ backgroundColor: mostUsedColor }"></div>
          <div class="ml-3">
            <p>Color: {{ mostUsedColor }}</p>
            <p>Pantone: {{ closestPantone }}</p>
            <p>Distance to Pantone: <span :class="{
                'text-green-500': closestPantoneDistance <= 5,
                'text-yellow-500': closestPantoneDistance > 5 && closestPantoneDistance <= 10,
                'text-orange-500': closestPantoneDistance > 10 && closestPantoneDistance < 15, // Corrected this line
                'text-red-500': closestPantoneDistance >= 15,
              }">{{ closestPantoneDistance.toFixed(2) }}</span></p>
          </div>
        </div>

        <p><strong>Most Occurring Parent Color:</strong> {{ mostOccurringParentColor }}</p>
        <p><strong>Average Pantone Distance:</strong> <span :class="{
                'text-green-500': averagePantoneDistance <= 5,
                'text-yellow-500': averagePantoneDistance > 5 && averagePantoneDistance <= 10,
                'text-orange-500': averagePantoneDistance > 10 && averagePantoneDistance < 15, // Corrected this line
                'text-red-500': averagePantoneDistance >= 15,
              }">{{ averagePantoneDistance.toFixed(2) }}</span>
        </p>
      </div>

      <div class="flex-1">
        <p><strong>Top 3 Colors:</strong></p>
        <div class="flex flex-col space-y-2">
          <div v-for="(color, index) in topThreeColors" :key="index" class="flex items-center space-x-3">
            <div class="w-12 h-12 border" :style="{ backgroundColor: color.html_code }"></div>
            <div class="text-xs">
              <p>Closest Pantone: {{ color.closest_palette_color_pantone }}</p>
              <p>Distance to Pantone: <span :class="{
                'text-green-500': color.closest_palette_color_distance <= 5,
                'text-yellow-500': color.closest_palette_color_distance > 5 && color.closest_palette_color_distance <= 10,
                'text-orange-500': color.closest_palette_color_distance > 10 && color.closest_palette_color_distance < 15, // Corrected this line
                'text-red-500': color.closest_palette_color_distance >= 15,
              }">{{ color.closest_palette_color_distance.toFixed(2) }}</span></p>
              <p>Percentage: {{ color.percent.toFixed(2) }}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script>
export default {
  props: {
    colors: Object,
  },
  computed: {
    mostUsedColorData() {
      if (!this.colors || !this.colors.image_colors) return null;
      return this.colors.image_colors.reduce((prev, current) =>
        (prev.percent > current.percent) ? prev : current);
    },
    topThreeColors() {
      if (!this.colors || !this.colors.image_colors) return [];
      const topThree = [...this.colors.image_colors]
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 3);
      console.log('topThree', topThree)
      return topThree
    },
    mostUsedColor() {
      // This should return the display value of the most used color
      return this.mostUsedColorData ? this.mostUsedColorData.html_code : 'N/A';
    },
    closestPantoneColor() {
      // Assuming you have a way to convert Pantone to a displayable color
      return this.getPantoneColor(this.closestPantone);
    },
    averagePantoneDistance() {
      if (!this.colors || !this.colors.image_colors) return 0;
      const totalDistance = this.colors.image_colors.reduce((acc, color) => acc + color.closest_palette_color_distance, 0);
      return totalDistance / this.colors.image_colors.length;
    },
    closestPantone() {
      return this.mostUsedColorData ? this.mostUsedColorData.closest_palette_color_pantone : 'N/A';
    },
    closestPantoneDistance() {
      return this.mostUsedColorData ? this.mostUsedColorData.closest_palette_color_distance : 0;
    },
    mostOccurringParentColor() {
      if (!this.colors || !this.colors.image_colors) return 'N/A';
      const parentColorFrequency = this.colors.image_colors.reduce((acc, color) => {
        acc[color.closest_palette_color_parent] = (acc[color.closest_palette_color_parent] || 0) + 1;
        return acc;
      }, {});
      return Object.keys(parentColorFrequency).reduce((a, b) => parentColorFrequency[a] > parentColorFrequency[b] ? a : b);
    },
    // ... other computed properties for additional insights ...
  },
  methods: {
    pantoneDistanceInfo(distance) {
      if (typeof distance !== 'number') {
        // Handle the case where distance is not a number (e.g., log an error)
        console.error('Invalid distance:', distance);
        return null; // or handle it appropriately
      }

      console.log('distance', distance);

      if (distance <= 5) {
        return {
          class: 'text-green',
          text: 'Close Match'
        };
      }
      if (distance <= 10) {
        return {
          class: 'text-yellow',
          text: 'Moderate Variance'
        };
      }
      return {
        class: 'text-red',
        text: 'Highly Unique'
      };
    },
  }
};
</script>
  