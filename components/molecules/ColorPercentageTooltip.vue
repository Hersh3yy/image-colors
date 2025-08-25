// ColorPercentageTooltip.vue
<template>
  <div
    class="absolute -top-48 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded w-64 flex flex-col"
  >
    <div class="flex items-center space-x-2 font-bold">
      <span>Actual color:</span>
      <div
        class="w-3 h-3 border-2 border-white"
        :style="{ backgroundColor: color.color }"
      ></div>
      <div>| Percent: {{ parseFloat(color.percentage).toFixed(2) }}%</div>
    </div>
    <hr />
    <div class="flex items-center space-x-2 font-bold">
      <span>Closest Color:</span>
      <div
        class="w-3 h-3 border-2 border-white"
        :style="{ backgroundColor: color.pantone.hex }"
      ></div>
    </div>
    <div>Distance: {{ parseFloat(color.pantone.distance).toFixed(2) }}</div>
    <div v-if="color.pantone.code">Pantone: {{ color.pantone.code }}</div>
    <div>Name: {{ color.pantone.name || "no name" }}</div>
    <hr />
    <div class="font-bold">
      <div class="flex items-center space-x-2 font-bold">
        <span>Closest Parent Color:</span>
        <div
          class="w-3 h-3 border-2 border-white"
          :style="{ backgroundColor: color.parent.hex || color.color }"
        />
      </div>
      <div>Distance: {{ parseFloat(color.parent.distance).toFixed(2) }}</div>
      <div>Name: {{ color.parent.name }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  color: {
    type: Object,
    required: true,
  },
});
</script>