<template>
  <div
    class="fixed bottom-4 right-4 md:w-96 w-[90vw] bg-white rounded-lg shadow-lg z-50 flex flex-col max-h-[80vh]"
    :class="{ 'md:w-[800px]': isExpanded }"
    v-if="!isHidden"
  >
    <!-- Main Controls -->
    <div class="p-4 border-b flex-shrink-0">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold">Image Controls</h2>
        <div class="flex gap-2">
          <button
            @click="isExpanded = !isExpanded"
            class="text-gray-600 hover:text-gray-900 flex items-center"
            :disabled="presetStatus.isCreating || presetStatus.isUpdating"
          >
            {{ isExpanded ? "Collapse" : "Expand" }}
            <svg
              class="w-4 h-4 ml-1 transition-transform"
              :class="{ 'rotate-180': !isExpanded }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <button
            @click="isHidden = true"
            class="text-gray-600 hover:text-gray-900"
            :disabled="presetStatus.isCreating || presetStatus.isUpdating"
          >
            Hide
          </button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2 mb-4">
        <button
          @click="analyze"
          class="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="presetStatus.isCreating || presetStatus.isUpdating || isProcessing || !selectedFiles.length || props.analysisStatus.total > 0 || 
                    props.presetStatus?.isCreating || props.presetStatus?.isUpdating"
        >
          <span v-if="props.analysisStatus.total > 0">
            Analyzing {{ props.analysisStatus.current }}/{{ props.analysisStatus.total }}...
          </span>
          <span v-else-if="isProcessing">Processing...</span>
          <span v-else>Analyze Images</span>
        </button>
        <button
          v-if="hasAccess"
          @click="showSavePresetModal = true"
          class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          :disabled="presetStatus.isCreating || presetStatus.isUpdating || !selectedFiles.length || uploadStatus.total > 0 || props.analysisStatus.total > 0 || 
                    props.presetStatus?.isCreating || props.presetStatus?.isUpdating"
        >
          <img src="/icons/save.svg" class="w-4 h-4" alt="" />
          <span v-if="uploadStatus.total > 0">
            Saving {{ uploadStatus.current }}/{{ uploadStatus.total }}...
          </span>
          <span v-else>Save as Preset</span>
        </button>
      </div>

      <!-- Upload Section -->
      <div class="space-y-4">
        <div
          class="relative border-2 border-dashed border-gray-300 rounded-lg p-4"
        >
          <input
            ref="fileInput"
            type="file"
            multiple
            accept="image/*"
            class="hidden"
            @change="handleFileSelect"
          />
          <button
            @click="$refs.fileInput.click()"
            class="w-full py-2 text-blue-500 hover:text-blue-600"
            :disabled="isProcessing"
          >
            Upload Images
          </button>
        </div>

        <!-- Parent Colors Preview (Compact) -->
        <div
          v-if="!isExpanded"
          class="flex flex-wrap gap-1 max-h-12 overflow-hidden"
        >
          <div
            v-for="color in colors.slice(0, 8)"
            :key="color.id"
            class="w-6 h-6 rounded-full border border-gray-200 flex-shrink-0"
            :style="{ backgroundColor: color.hex }"
            :title="color.name"
          />
          <div
            v-if="colors.length > 8"
            class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500"
          >
            +{{ colors.length - 8 }}
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Files List -->
    <div
      v-if="selectedFiles.length"
      class="overflow-y-auto p-4 border-b flex-shrink-0 max-h-[200px]"
    >
      <div class="space-y-2">
        <div
          v-for="file in selectedFiles"
          :key="file.name"
          class="flex justify-between items-center bg-gray-50 p-2 rounded"
        >
          <span class="text-sm truncate">{{ file.name }}</span>
          <button
            @click="removeFile(file)"
            class="text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      </div>
    </div>

    <!-- Expanded Section -->
    <div v-if="isExpanded" class="flex-1 flex md:flex-row flex-col min-h-0">
      <!-- Tabs -->
      <div
        v-if="hasAccess"
        class="md:w-48 md:border-r bg-gray-50 p-4 flex-shrink-0"
      >
        <div class="flex md:flex-col gap-4">
          <div class="space-y-2 w-full">
            <!-- Tab buttons with better styling -->
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              class="px-4 py-3 rounded-lg text-sm w-full text-left flex items-center gap-2 transition-colors"
              :class="[
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700 font-medium shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              ]"
            >
              <img :src="`/icons/${tab.icon}.svg`" class="w-4 h-4" alt="" />
              {{ tab.name }}
            </button>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 p-4 overflow-y-auto min-h-0">
        <!-- Parent Colors Component -->
        <div v-if="activeTab === 'colors'" class="space-y-4">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Parent Colors</h3>
          <ParentColors
            :colors="colors"
            @update:colors="$emit('update:colors', $event)"
          />
        </div>

        <!-- Presets Grid -->
        <div v-if="activeTab === 'presets'" class="space-y-4">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Saved Presets</h3>
          <div class="grid grid-cols-2 gap-4 auto-rows-max">
            <div
              v-for="preset in presets"
              :key="preset.id"
              @click="$emit('loadPreset', preset)"
              class="cursor-pointer group"
            >
              <div
                class="aspect-video bg-gray-100 rounded-lg overflow-hidden relative"
              >
                <img
                  :src="preset.thumbnail || preset.attributes.sourceImage"
                  class="w-full h-full object-cover"
                  @error="handleImageError($event, preset)"
                />
                <div
                  class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span class="text-white text-sm">Load Preset</span>
                </div>
              </div>
              <p class="mt-1 text-sm truncate">
                {{ preset.name || preset.attributes?.Name }}
              </p>
            </div>
          </div>
        </div>

        <!-- Settings -->
        <div v-if="activeTab === 'settings'" class="space-y-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Analysis Settings</h3>
          
          <!-- Color Space Settings -->
          <div class="space-y-4">
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">
                Analysis Color Space
              </label>
              <select
                v-model="settings.colorSpace"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option v-for="space in COLOR_SPACES" :key="space" :value="space">
                  {{ space.toUpperCase() }}
                </option>
              </select>
              <p class="text-sm text-gray-500">
                Color space used for initial image analysis
              </p>
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">
                Color Matching Method
              </label>
              <select
                v-model="settings.distanceMethod"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option v-for="method in DISTANCE_METHODS" :key="method" :value="method">
                  {{ method.toUpperCase() }}
                </option>
              </select>
              <p class="text-sm text-gray-500">
                Method used to match colors with parent colors
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Save Preset Modal -->
    <div
      v-if="showSavePresetModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">Save as Preset</h3>
        <input
          v-model="newPresetName"
          type="text"
          placeholder="Enter preset name"
          class="w-full px-3 py-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <!-- Add upload progress information -->
        <div v-if="uploadStatus.total > 0" class="mb-4">
          <div class="flex justify-between text-sm text-gray-600 mb-1">
            <span>Uploading images...</span>
            <span>{{ uploadStatus.current }} / {{ uploadStatus.total }}</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="bg-blue-500 h-2 rounded-full transition-all duration-300" 
              :style="`width: ${(uploadStatus.current / uploadStatus.total) * 100}%`"
            ></div>
          </div>
        </div>

        <div class="flex justify-end space-x-3">
          <button
            @click="showSavePresetModal = false"
            class="px-4 py-2 text-gray-600 hover:text-gray-900"
            :disabled="isCreatingPreset"
          >
            Cancel
          </button>
          <button
            @click="handleSaveAsPreset"
            :disabled="!newPresetName.trim() || isCreatingPreset"
            class="px-4 py-2 rounded flex items-center gap-2 transition-colors"
            :class="[
              isCreatingPreset 
                ? 'bg-blue-500 cursor-wait' 
                : 'bg-green-500 hover:bg-green-600'
            ]"
          >
            <template v-if="isCreatingPreset">
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="text-white">Saving...</span>
            </template>
            <template v-else>
              <span class="text-white">Save Preset</span>
            </template>
          </button>
        </div>
      </div>
    </div>

    <!-- Add to template where you handle preset saving -->
    <div v-if="uploadStatus.total > 0" class="mt-4">
      <div class="flex justify-between m-2">
        <span>Uploading images...</span>
        <span>{{ uploadStatus.current }} / {{ uploadStatus.total }}</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div class="bg-blue-600 h-2 rounded-full" 
             :style="`width: ${(uploadStatus.current / uploadStatus.total) * 100}%`">
        </div>
      </div>
      <div v-if="uploadStatus.failed.length" class="mt-2 text-red-600 text-sm">
        Failed to upload {{ uploadStatus.failed.length }} images
      </div>
    </div>
  </div>

  <!-- Minimal Show Button -->
  <div
    v-else
    class="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg z-50 p-2"
  >
    <button
      @click="isHidden = false"
      class="flex items-center gap-2 text-gray-600 hover:text-gray-900"
    >
      <span class="text-sm font-semibold">Image Controls</span>
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
          d="M15 12H5"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 5l7 7-7 7"
        />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useRoute } from "#app";
import ParentColors from './ParentColors.vue';
import { COLOR_SPACES } from '@/services/imageAnalyzerSupport';
import { DISTANCE_METHODS } from '@/services/colorMatcher';

const props = defineProps({
  isProcessing: Boolean,
  colors: {
    type: Array,
    required: true,
  },
  presets: {
    type: Array,
    default: () => [],
  },
  processedImages: {
    type: Array,
    required: true,
  },
  analysisStatus: {
    type: Object,
    default: () => ({
      total: 0,
      current: 0,
      failed: []
    })
  },
  presetStatus: {
    type: Object,
    required: true
  }
});

const emit = defineEmits([
  "analyze",
  "filesSelected",
  "update:colors",
  "loadPreset",
  "saveAsPreset",
  "updateSettings"
]);

// Tab configuration
const tabs = [
  { id: 'colors', name: 'Parent Colors', icon: 'palette' },
  { id: 'presets', name: 'Presets', icon: 'save' },
  { id: 'settings', name: 'Settings', icon: 'settings' }
];

const settings = ref({
  colorSpace: COLOR_SPACES.LAB,
  distanceMethod: DISTANCE_METHODS.DELTA_E
});

// Watch for settings changes.
watch(settings, (newSettings) => {
  emit('updateSettings', newSettings);
}, { deep: true });

const isExpanded = ref(false);
const activeTab = ref("colors");
const fileInput = ref(null);
const selectedFiles = ref([]);
const isHidden = ref(false);
const showSavePresetModal = ref(false);
const newPresetName = ref("");
const isCreatingPreset = ref(false);

const route = useRoute();
const hasAccess = computed(() => {
  const urlParams = route.query.access;
  return !!urlParams;
});

const { uploadStatus } = usePresets();

const handleFileSelect = (event) => {
  selectedFiles.value = [...event.target.files];
  emit("filesSelected", selectedFiles.value);
};

const removeFile = (fileToRemove) => {
  selectedFiles.value = selectedFiles.value.filter(
    (file) => file !== fileToRemove
  );
  emit("filesSelected", selectedFiles.value);
};

const analyze = () => {
  emit("analyze", {
    files: selectedFiles.value,
  });
};

const handleImageError = (event, preset) => {
  // Fallback to a placeholder image on error
  event.target.src = "/api/placeholder/400/300";
};

const handleSaveAsPreset = async () => {
  if (!newPresetName.value.trim() || isCreatingPreset.value) return;
  
  isCreatingPreset.value = true;
  try {
    await emit('saveAsPreset', {
      name: newPresetName.value,
      images: props.processedImages
    });
    
    showSavePresetModal.value = false;
    newPresetName.value = "";
  } catch (error) {
    console.error('Failed to save preset:', error);
  } finally {
    isCreatingPreset.value = false;
  }
};
</script>
