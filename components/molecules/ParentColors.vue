<template>
  <div class="parent-colors h-full flex flex-col min-h-0">
    <!-- Color Grid -->
    <div class="grid grid-cols-4 sm:grid-cols-6 gap-2 overflow-y-auto">
      <div
        v-for="color in colors"
        :key="color.id"
        @click="openEditModal(color)"
        class="cursor-pointer group"
      >
        <div
          class="w-full pb-[100%] rounded relative"
          :style="{ backgroundColor: color.hex }"
        >
          <span
            class="absolute inset-0 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 bg-black/50 text-white rounded transition-opacity"
          >
            {{ color.name }}
          </span>
        </div>
      </div>
      <div
        @click="openEditModal()"
        class="w-full pb-[100%] relative border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-blue-500"
      >
        <span
          class="absolute inset-0 flex items-center justify-center text-gray-400"
          >+</span
        >
      </div>
    </div>

    <!-- Edit as JSON button -->
    <div class="mt-4 flex justify-end flex-shrink-0">
      <button
        @click="openJsonEditor"
        class="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md flex items-center gap-2"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
        Edit as JSON
      </button>
    </div>

    <!-- JSON Editor Modal -->
    <div
      v-if="showJsonEditor"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Edit Colors as JSON</h3>
          <button
            @click="closeJsonEditor"
            class="text-gray-500 hover:text-gray-700"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div class="mb-4">
          <textarea
            v-model="jsonEditorContent"
            class="w-full h-64 font-mono text-sm p-3 border rounded-md"
            :class="{ 'border-red-500': jsonError }"
          ></textarea>
          <p v-if="jsonError" class="mt-1 text-sm text-red-500">
            {{ jsonError }}
          </p>
        </div>
        <div class="flex justify-end gap-3">
          <button
            @click="closeJsonEditor"
            class="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            @click="saveJsonChanges"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>

    <!-- Color Edit Modal -->
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
import { ref, onMounted } from "vue";
// Components auto-imported by Nuxt

const props = defineProps({
  colors: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["update:colors"]);

const showModal = ref(false);
const selectedColor = ref(null);
const showJsonEditor = ref(false);
const jsonEditorContent = ref("");
const jsonError = ref("");

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

const openJsonEditor = () => {
  jsonEditorContent.value = JSON.stringify(props.colors, null, 2);
  showJsonEditor.value = true;
  jsonError.value = "";
};

const closeJsonEditor = () => {
  showJsonEditor.value = false;
  jsonError.value = "";
};

const saveJsonChanges = () => {
  try {
    const parsedColors = JSON.parse(jsonEditorContent.value);
    if (!Array.isArray(parsedColors)) {
      throw new Error("Colors must be an array");
    }

    // Validate each color object
    parsedColors.forEach((color) => {
      if (!color.hex || !color.name) {
        throw new Error("Each color must have hex, and name properties");
      }
    });

    emit("update:colors", parsedColors);
    showJsonEditor.value = false;
    jsonError.value = "";
  } catch (error) {
    jsonError.value = error.message;
  }
};
</script>
