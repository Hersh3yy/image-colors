<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Parent Colors</h2>
    <div
      class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4"
    >
      <div
        v-for="color in colors"
        :key="color.id"
        class="relative group"
        @click="openEditModal(color)"
      >
        <div
          class="w-12 h-12 rounded-full cursor-pointer border border-gray-200"
          :style="{ backgroundColor: color.hex }"
        />
        <span class="block text-sm text-gray-600 mt-1 text-center">
          {{ color.name }}
        </span>
      </div>

      <div
        @click="openEditModal()"
        class="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-500"
      >
        <svg
          class="w-6 h-6 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
      </div>
    </div>

    <MoleculesColorEditModal
      v-if="showModal"
      v-model="showModal"
      :color="selectedColor"
      @save="handleSave"
      @delete="handleDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import ColorEditModal from "./ColorEditModal.vue";

const props = defineProps({
  colors: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["update:colors"]);

const showModal = ref(false);
const selectedColor = ref(null);

const openEditModal = (color = null) => {
  selectedColor.value = color;
  showModal.value = true;
};

const handleSave = (colorData) => {
  const updatedColors = [...props.colors];
  if (colorData.id) {
    const index = updatedColors.findIndex((c) => c.id === colorData.id);
    updatedColors[index] = colorData;
  } else {
    colorData.id = Date.now();
    updatedColors.push(colorData);
  }
  emit("update:colors", updatedColors);
  showModal.value = false;
};

const handleDelete = (colorId) => {
  emit(
    "update:colors",
    props.colors.filter((color) => color.id !== colorId)
  );
  showModal.value = false;
};
</script>
