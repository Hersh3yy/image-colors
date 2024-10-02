<template>
  <table class="w-full border-collapse border">
    <thead>
      <tr>
        <th class="border p-2">Color</th>
        <th class="border p-2">Hex</th>
        <th class="border p-2">Percentage</th>
        <th class="border p-2">Closest Parent</th>
        <th class="border p-2">Color</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(color, colorIndex) in sortedColors" :key="colorIndex">
        <td class="border p-2">
          <div
            class="w-6 h-6 rounded-full"
            :style="{ backgroundColor: color.color }"
          ></div>
        </td>
        <td class="border p-2">{{ color.color }}</td>
        <td class="border p-2">{{ color.percentage.toFixed(2) }}%</td>
        <td class="border p-2">
          {{ color.closestParentColor }}
          <span v-if="color.closestParentHex">
            ({{ color.closestParentHex }})
          </span>
        </td>
        <td class="border p-2">
          <div
            class="w-6 h-6 rounded-full"
            :style="{ backgroundColor: color.closestParentHex }"
          ></div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  colors: {
    type: Array,
    required: true,
  },
});

const sortedColors = computed(() =>
  [...props.colors].sort((a, b) => b.percentage - a.percentage)
);
</script>
