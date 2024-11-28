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
                    <button @click="handleSave" :disabled="isSaving" class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                        <img src="/icons/save.svg" class="w-4 h-4" alt="" />
                        {{ isSaving ? 'Saving...' : 'Save Changes' }}
                    </button>
                    <button @click="confirmDelete" :disabled="isDeleting" class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                        <img src="/icons/delete.svg" class="w-4 h-4" alt="" />
                        {{ isDeleting ? 'Deleting...' : 'Delete Preset' }}
                    </button>
                </div>
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
    </div>
</template>

<script setup>
import { ref } from 'vue'
import ImageAnalysisResult from './ImageAnalysisResult.vue'

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

const emit = defineEmits(['save', 'delete', 'reanalyze', 'deleteImage'])

const isSaving = ref(false)
const isDeleting = ref(false)
const showDeleteModal = ref(false)
const analyzingIndex = ref(-1)

const handleSave = async () => {
    if (isSaving.value) return

    try {
        isSaving.value = true
        await emit('save', props.images)
        toast?.success('Changes saved successfully')
    } catch (error) {
        toast?.error('Failed to save changes')
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
</script>