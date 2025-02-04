<template>
  <div
    class="relative w-full h-full min-h-[80px] cursor-pointer perspective-1000"
    @click="isFlipped = !isFlipped"
  >
    <div
      class="relative w-full h-full transition-transform duration-500 transform-style-preserve-3d"
      :class="{ 'rotate-y-180': isFlipped }"
    >
      <!-- Front side -->
      <div class="absolute w-full h-full backface-hidden">
        <div class="flex items-center space-x-3">
          <div
            class="w-8 h-8 rounded-md shadow-sm"
            :style="{ backgroundColor: color }"
          />
          <div class="flex flex-col">
            <span class="font-medium">{{ percentage.toFixed(1) }}%</span>
            <span v-if="parentName" class="text-sm text-gray-500">
              {{ parentName }}
            </span>
            <span class="text-xs text-gray-400">{{ hex }}</span>
          </div>
        </div>
      </div>

      <!-- Back side -->
      <div
        class="absolute w-full h-full backface-hidden rotate-y-180 bg-white p-3 rounded-lg shadow"
      >
        <div class="flex flex-col space-y-2">
          <h4 class="font-medium">Color Details</h4>
          <div class="text-sm">
            <p>Hex: {{ hex }}</p>
            <p>Percentage: {{ percentage.toFixed(1) }}%</p>
            <p v-if="parentName">Group: {{ parentName }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  color: {
    type: String,
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
  },
  parentName: {
    type: String,
    default: "",
  },
  hex: {
    type: String,
    required: true,
  },
});

const isFlipped = ref(false);
</script>

<style scoped>
.perspective-1000 {
  perspective: 1000px;
}

.transform-style-preserve-3d {
  transform-style: preserve-3d;
}

.backface-hidden {
  backface-visibility: hidden;
}

.rotate-y-180 {
  transform: rotateY(180deg);
}
</style>
