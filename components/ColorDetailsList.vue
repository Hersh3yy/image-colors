<template>
  <div>
    <h4 class="text-md font-semibold">Color Details</h4>
    <ul class="list-disc pl-5">
      <li v-for="(color, index) in colors" :key="index">
        <span :style="{ color: color.color }">
          <strong>{{ color.name || "Unnamed Color" }}</strong>
        </span>
        : {{ color.percentage.toFixed(2) }}%, RGB: {{ rgbString(color.color) }},
        Closest Color: {{ color.closestHex || "N/A" }}
      </li>
    </ul>
  </div>
</template>

<script>
import { hexToRgb } from "@/services/colorUtils";

export default {
  props: {
    colors: {
      type: Array,
      default: () => [],
    },
  },
  methods: {
    rgbString(hex) {
      const rgb = hexToRgb(hex);
      return rgb ? `(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` : "Invalid color";
    },
  },
};
</script>

<style scoped>
h4 {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}
</style>
