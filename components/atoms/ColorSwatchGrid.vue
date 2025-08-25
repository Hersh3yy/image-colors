<template>
  <div class="grid grid-cols-4 gap-4 mt-4">
    <div 
      v-for="(color, index) in colors" 
      :key="index"
      :style="{ backgroundColor: color?.hex || '#000000' }"
      class="w-16 h-16 border border-gray-300 rounded shadow-sm relative group hover:border-white-300"
    >
      <span
        class="absolute bottom-16 left-0 w-[150%] text-center text-white bg-black bg-opacity-50 px-2 py-1 text-xs hidden group-hover:block"
      >
        {{ color.name }}
      </span>
              <AtomsBaseButton 
          @click="$emit('delete', index)"
          variant="danger"
          size="xs"
          text="X"
          class="absolute top-0 right-0 rounded-bl"
        />
    </div>
    <div 
      class="w-16 h-16 bg-gray-200 rounded shadow-sm flex justify-center items-center cursor-pointer hover:bg-gray-300 transition-colors"
      @click="$emit('add')"
    >
      <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
      </svg>
    </div>
  </div>
</template>

<script setup>
defineProps({
  colors: {
    type: Array,
    required: true
  }
});

defineEmits(['delete', 'add']);
</script>
