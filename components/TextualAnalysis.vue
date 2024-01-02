<template>
    <div class="p-4 border rounded shadow">
      <p class="text-lg font-semibold">Color Analysis</p>
      <p><strong>Most Used Color:</strong> {{ mostUsedColor }}</p>
      <p><strong>Most Occurring Parent Color:</strong> {{ mostOccurringParentColor }}</p>
      <p><strong>Color Diversity:</strong> {{ colorDiversity }}</p>
      <!-- ... More insights as needed ... -->
    </div>
  </template>
  
  <script>
  export default {
    props: {
      colors: Object,
    },
    computed: {
      mostUsedColor() {
        if (!this.colors || !this.colors.image_colors) return 'N/A';
        return this.colors.image_colors.reduce((prev, current) => 
          (prev.percent > current.percent) ? prev : current).html_code;
      },
      mostOccurringParentColor() {
        if (!this.colors || !this.colors.image_colors) return 'N/A';
        const parentColorFrequency = this.colors.image_colors.reduce((acc, color) => {
          acc[color.closest_palette_color_parent] = (acc[color.closest_palette_color_parent] || 0) + 1;
          return acc;
        }, {});
        return Object.keys(parentColorFrequency).reduce((a, b) => parentColorFrequency[a] > parentColorFrequency[b] ? a : b);
      },
      colorDiversity() {
        if (!this.colors || !this.colors.image_colors) return 0;
        const uniqueColors = new Set(this.colors.image_colors.map(color => color.html_code));
        return uniqueColors.size;
      },
      // ... other computed properties for additional insights ...
    },
  };
  </script>
  