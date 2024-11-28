<template>
  <div class="text-lg italic pb-4">Top colors</div>
  <div class="flex w-96 h-5 relative">
    <div v-for="color in sortedColors" :style="`background-color: ${color.html_code}; width: ${color.percent}%`"
      class="h-full transition-all duration-300 hover:bg-opacity-75 relative" @mouseover="hoverColor = color"
      @mouseout="hoverColor = ''">
      <ColorPercentageTooltip v-if="hoverColor === color" :color="color" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import ColorPercentageTooltip from './ColorPercentageTooltip.vue'

const props = defineProps({
  colors: {
    type: Array,
    required: true
  }
})

const hoverColor = ref('')

const sortedColors = computed(() => {
  return [...props.colors].sort((a, b) => b.percent - a.percent)
})
</script>