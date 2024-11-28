<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-lg p-6 max-w-md w-full">
      <h3 class="text-lg font-semibold mb-4">
        {{ color ? "Edit Color" : "Add New Color" }}
      </h3>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Name</label>
          <input
            v-model="formData.name"
            type="text"
            class="mt-1 block w-full rounded-md border-gray-300"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Color</label>
          <input
            v-model="formData.hex"
            type="color"
            class="mt-1 block w-full h-10"
          />
        </div>
      </div>

      <div class="mt-6 flex justify-between">
        <div>
          <button
            v-if="color"
            @click="$emit('delete', color.id)"
            class="text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        </div>
        <div class="space-x-2">
          <button
            @click="$emit('update:modelValue', false)"
            class="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            @click="handleSave"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  modelValue: Boolean,
  color: Object,
});

const emit = defineEmits(["update:modelValue", "save", "delete"]);

const formData = ref({
  id: props.color?.id,
  name: props.color?.name || "",
  hex: props.color?.hex || "#000000",
});

const handleSave = () => {
  emit("save", { ...formData.value });
};
</script>
