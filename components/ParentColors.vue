<template>
  <div class="mb-4">
    <h2 class="text-xl font-semibold mb-2">Parent Colors</h2>
    <div
      v-for="color in localParentColors"
      :key="color.id"
      class="mb-2 flex items-center"
    >
      <input
        v-model="color.name"
        type="text"
        class="border rounded px-2 py-1 mr-2"
        @input="updateColors"
      />
      <input
        v-model="color.hex"
        type="color"
        class="w-8 h-8 mr-2"
        @input="updateColors"
      />
      <button
        @click="removeColor(color.id)"
        class="bg-red-500 text-white px-2 py-1 rounded"
      >
        Remove
      </button>
    </div>
    <button
      @click="addColor"
      class="bg-green-500 text-white px-4 py-2 rounded mt-2"
    >
      Add Color
    </button>
  </div>
</template>

<script>
import { ref, watch } from "vue";

export default {
  name: "ParentColors",
  props: {
    parentColors: {
      type: Array,
      required: true,
    },
  },
  emits: ["update:parentColors"],
  setup(props, { emit }) {
    const localParentColors = ref([...props.parentColors]);

    watch(
      () => props.parentColors,
      (newColors) => {
        localParentColors.value = [...newColors];
      }
    );

    const updateColors = () => {
      emit("update:parentColors", localParentColors.value);
    };

    const addColor = () => {
      const newId =
        Math.max(...localParentColors.value.map((c) => c.id), 0) + 1;
      localParentColors.value.push({
        id: newId,
        name: "New Color",
        hex: "#000000",
      });
      updateColors();
    };

    const removeColor = (id) => {
      localParentColors.value = localParentColors.value.filter(
        (c) => c.id !== id
      );
      updateColors();
    };

    return {
      localParentColors,
      updateColors,
      addColor,
      removeColor,
    };
  },
};
</script>
