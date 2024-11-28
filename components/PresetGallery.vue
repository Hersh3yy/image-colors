<!-- PresetGallery.vue -->
<template>
  <div class="space-y-6">
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <!-- Existing Presets -->
      <div v-for="preset in presets" :key="preset.id" class="relative group">
        <div class="aspect-square rounded-lg overflow-hidden shadow-sm hover:shadow-md 
                 transition-all duration-200 border-2"
          :class="{ 'border-blue-500': isActive(preset), 'border-transparent': !isActive(preset) }">
          <!-- Preset Image -->
          <div class="relative w-full h-full">
            <img v-if="preset.attributes.sourceImage" :src="preset.attributes.sourceImage" :alt="preset.attributes.Name"
              class="w-full h-full object-cover cursor-pointer" @click="handlePresetClick(preset)" />
            <div v-else class="w-full h-full bg-gray-100 flex items-center justify-center">
              <img src="/icons/no-image.svg" class="w-8 h-8 text-gray-400" alt="No image" />
            </div>

            <!-- Action Buttons Overlay -->
            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 
                      transition-all duration-200 flex items-center justify-center opacity-0 
                      group-hover:opacity-100">
              <div class="flex space-x-2">
                <!-- Load Button -->
                <button @click.stop="handlePresetClick(preset)" class="p-2 bg-white rounded-full hover:bg-blue-50 
                         transition-colors duration-200" title="Load Preset">
                  <img src="/icons/load.svg" class="w-5 h-5" alt="Load" />
                </button>

                <!-- Delete Button -->
                <button @click.stop="confirmDelete(preset)" class="p-2 bg-white rounded-full hover:bg-red-50 
                         transition-colors duration-200" :disabled="isDeleting" title="Delete Preset">
                  <img src="/icons/delete.svg" class="w-5 h-5" alt="Delete" :class="{ 'opacity-50': isDeleting }" />
                </button>
              </div>
            </div>
          </div>

          <!-- Preset Name -->
          <div class="absolute bottom-0 inset-x-0 px-2 py-1.5 bg-gradient-to-t 
                    from-black/60 to-transparent">
            <p class="text-white text-sm font-medium truncate">
              {{ preset.attributes.Name }}
            </p>
          </div>
        </div>
      </div>

      <!-- Add New Preset Button -->
      <button v-if="canAddPreset" @click="$emit('addNewPreset')" class="aspect-square rounded-lg border-2 border-dashed border-gray-300 
               hover:border-gray-400 transition-colors duration-200
               flex items-center justify-center bg-gray-50 hover:bg-gray-100">
        <img src="/icons/plus.svg" class="w-8 h-8 text-gray-400" alt="Add new preset" />
      </button>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 
                flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">Delete Preset</h3>
        <p class="text-gray-600 mb-6">
          Are you sure you want to delete "{{ presetToDelete?.attributes.Name }}"?
          This action cannot be undone.
        </p>
        <div class="flex justify-end space-x-3">
          <button @click="showDeleteModal = false" class="px-4 py-2 text-gray-600 hover:text-gray-900">
            Cancel
          </button>
          <button @click="handleDelete" :disabled="isDeleting" class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 
                   disabled:opacity-50 disabled:cursor-not-allowed">
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Props
const props = defineProps({
  presets: {
    type: Array,
    default: () => [],
  },
  activePresetId: {
    type: [String, Number],
    default: null
  },
  canAddPreset: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['loadPreset', 'addNewPreset', 'reloadPresets'])

// Composables
const { deletePreset } = usePresets()

// State
const isDeleting = ref(false)
const showDeleteModal = ref(false)
const presetToDelete = ref(null)

// Methods
const isActive = (preset) => preset.id === props.activePresetId

const handlePresetClick = (preset) => {
  emit('loadPreset', preset)
}

const confirmDelete = (preset) => {
  presetToDelete.value = preset
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!presetToDelete.value || isDeleting.value) return

  try {
    isDeleting.value = true
    await deletePreset(presetToDelete.value.id)
    emit('reloadPresets')
    showDeleteModal.value = false
  } catch (error) {
    console.error('Failed to delete preset:', error)
  } finally {
    isDeleting.value = false
    presetToDelete.value = null
  }
}
</script>