<!-- ActivePreset.vue -->
<template>
    <div class="space-y-6" v-if="preset">
        <!-- Preset Controls -->
        <div class="bg-gray-50 p-4 rounded-lg">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="flex items-center space-x-4">
                    <h2 class="text-lg font-semibold">{{ preset.attributes.Name }}</h2>
                    <span class="text-sm text-gray-500">
                        {{ images.length }} image{{ images.length !== 1 ? 's' : '' }}
                    </span>
                </div>
                <div class="flex space-x-3">
                    <button
                        @click="handleSave"
                        :disabled="isSaving"
                        class="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                        :class="[
                            isSaving 
                                ? 'bg-blue-500 text-white cursor-wait' 
                                : 'bg-green-500 hover:bg-green-600 text-white'
                        ]"
                    >
                        <template v-if="isSaving">
                            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Saving... {{ uploadProgress }}</span>
                        </template>
                        <template v-else>
                            <img src="/icons/save.svg" class="w-4 h-4" alt="" />
                            <span>Save Changes</span>
                        </template>
                    </button>
                    <button @click="handleSaveAsNew" 
                        class="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600
                        flex items-center gap-2">
                        <img src="/icons/save.svg" class="w-4 h-4" alt="" />
                        Save as New
                    </button>
                    <button @click="confirmDelete" :disabled="isDeleting"
                        class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600
                        disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                        <img src="/icons/delete.svg" class="w-4 h-4" alt="" />
                        {{ isDeleting ? 'Deleting...' : 'Delete Preset' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Add upload progress bar when saving -->
        <div v-if="isSaving && uploadStatus.total > 0" class="mb-4">
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
            <div v-if="uploadStatus.failed.length" class="mt-2">
                <p class="text-amber-600">
                    Failed uploads: {{ uploadStatus.failed.length }}
                    <button @click="showFailedUploads = true" class="text-blue-500 hover:underline ml-2">
                        View details
                    </button>
                </p>
            </div>
        </div>

        <!-- Image Results -->
        <div class="space-y-4">
            <div v-for="(image, index) in images" :key="index" class="relative">
                <ImageAnalysisResult :image="image" :is-analyzing="analyzingIndex === index"
                    @reanalyze="handleReanalyze(image, index)" @delete="confirmImageDelete(index)" />
            </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 
                  flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 class="text-lg font-semibold mb-4">Delete Preset</h3>
                <p class="text-gray-600 mb-6">
                    Are you sure you want to delete this preset? This action cannot be undone.
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

        <!-- Add this modal for "Save as New" -->
        <div v-if="showSaveAsNewModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 class="text-lg font-semibold mb-4">Save as New Preset</h3>
                <input v-model="newPresetName" type="text" placeholder="Enter preset name"
                    class="w-full px-3 py-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div class="flex justify-end space-x-3">
                    <button @click="showSaveAsNewModal = false" class="px-4 py-2 text-gray-600 hover:text-gray-900">
                        Cancel
                    </button>
                    <button @click="handleSaveAsNewConfirm" :disabled="!newPresetName.trim()"
                        class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50">
                        Save Preset
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import ImageAnalysisResult from './ImageAnalysisResult.vue'
import { usePresets } from '~/composables/usePresets'

const props = defineProps({
    preset: {
        type: Object,
        required: true
    },
    images: {
        type: Array,
        required: true
    }
})

const emit = defineEmits(['save', 'delete', 'reanalyze', 'deleteImage', 'saveAsNew'])

const { uploadStatus } = usePresets()
const isSaving = ref(false)
const isDeleting = ref(false)
const showDeleteModal = ref(false)
const analyzingIndex = ref(-1)
const showSaveAsNewModal = ref(false)
const newPresetName = ref('')

const uploadProgress = computed(() => {
    if (!uploadStatus.value.total) return ''
    const percentage = Math.round((uploadStatus.value.current / uploadStatus.value.total) * 100)
    return `${percentage}%`
})

const handleSave = async () => {
    isSaving.value = true
    try {
        await emit('save', props.images)
    } finally {
        isSaving.value = false
    }
}

const confirmDelete = () => {
    showDeleteModal.value = true
}

const handleDelete = async () => {
    if (isDeleting.value) return

    try {
        isDeleting.value = true
        await emit('delete')
        showDeleteModal.value = false
    } catch (error) {
        toast?.error('Failed to delete preset')
    } finally {
        isDeleting.value = false
    }
}

const handleReanalyze = async (image, index) => {
    if (analyzingIndex.value !== -1) return

    try {
        analyzingIndex.value = index
        await emit('reanalyze', image)
        toast?.success('Image reanalyzed successfully')
    } catch (error) {
        toast?.error('Failed to reanalyze image')
    } finally {
        analyzingIndex.value = -1
    }
}

const confirmImageDelete = (index) => {
    if (confirm('Are you sure you want to delete this image?')) {
        emit('deleteImage', index)
    }
}

const handleSaveAsNew = () => {
    showSaveAsNewModal.value = true
}

const handleSaveAsNewConfirm = async () => {
    if (!newPresetName.value.trim()) return

    try {
        await emit('saveAsNew', {
            name: newPresetName.value,
            images: props.images
        })
        showSaveAsNewModal.value = false
        newPresetName.value = ''
        toast?.success('New preset created successfully')
    } catch (error) {
        toast?.error('Failed to create new preset')
    }
}
</script>