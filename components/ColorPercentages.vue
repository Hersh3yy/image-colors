<template>
  <div class="text-lg italic pb-4">Top colors</div>
  <div class="flex w-96 h-5 relative">
    <div v-for="color in sortedColors"
      :style="`background-color: ${color.color}; width: ${color.percentage}%`"
      class="h-full transition-all duration-300 hover:bg-opacity-75 relative"
      @mouseover="hoverColor = color"
      @mouseout="hoverColor = ''"
    >
      <ColorPercentageTooltip v-if="hoverColor === color" :color="color" />
    </div>
  </div>
</template>
<script>
export default {
  props: {
    colors: Array,
  },
  data() {
    return {
      hoverColor: "",
    };
  },
  computed: {
    sortedColors() {
      return [...this.colors].sort((a, b) => b.percentage - a.percentage); // Sort in descending order
    },
  },
};
</script>
