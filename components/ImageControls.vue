<template>
    <div class="fixed bottom-4 right-4 md:w-96 w-[90vw] bg-white rounded-lg shadow-lg z-50" v-if="!isHidden">
        <!-- Main Controls -->
        <div class="p-4">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-semibold">Image Controls</h2>
                <div class="flex gap-2">
                    <button @click="isExpanded = !isExpanded"
                        class="text-gray-600 hover:text-gray-900 flex items-center">
                        {{ isExpanded ? 'Collapse' : 'Expand' }}
                        <svg class="w-4 h-4 ml-1 transition-transform" :class="{ 'rotate-180': !isExpanded }"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    <button @click="isHidden = true"
                        class="text-gray-600 hover:text-gray-900">
                        Hide
                    </button>
                </div>
            </div>

            <!-- Upload Section -->
            <div class="space-y-4">
                <div class="relative border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input ref="fileInput" type="file" multiple accept="image/*" class="hidden"
                        @change="handleFileSelect" />
                    <button @click="$refs.fileInput.click()" class="w-full py-2 text-blue-500 hover:text-blue-600"
                        :disabled="isProcessing">
                        Upload Images
                    </button>
                </div>

                <!-- Parent Colors Preview (Compact) -->
                <div v-if="!isExpanded" class="flex flex-wrap gap-1 max-h-12 overflow-hidden">
                    <div v-for="color in colors.slice(0, 8)" :key="color.id"
                        class="w-6 h-6 rounded-full border border-gray-200 flex-shrink-0"
                        :style="{ backgroundColor: color.hex }" :title="color.name" />
                    <div v-if="colors.length > 8"
                        class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                        +{{ colors.length - 8 }}
                    </div>
                </div>

                <!-- Selected Files -->
                <div v-if="selectedFiles.length" class="space-y-2 max-h-48 overflow-y-auto">
                    <div v-for="file in selectedFiles" :key="file.name"
                        class="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <span class="text-sm truncate">{{ file.name }}</span>
                        <button @click="removeFile(file)" class="text-red-500 hover:text-red-700">×</button>
                    </div>
                    <button @click="analyze" class="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 sticky bottom-0"
                        :disabled="isProcessing">
                        {{ isProcessing ? 'Analyzing...' : 'Analyze Images' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Expanded Section -->
        <div v-if="isExpanded" class="border-t max-h-[60vh] overflow-y-auto">
            <!-- Tabs -->
            <div v-if="hasAccess" class="p-4 flex gap-4 border-b sticky top-0 bg-white">
                <button @click="activeTab = 'colors'" class="px-3 py-1 rounded text-sm"
                    :class="activeTab === 'colors' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'">
                    Parent Colors
                </button>
                <button @click="activeTab = 'presets'" class="px-3 py-1 rounded text-sm"
                    :class="activeTab === 'presets' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'">
                    Saved Presets
                </button>
            </div>

            <!-- Color Grid -->
            <div v-if="activeTab === 'colors'" class="p-4">
                <div class="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    <div v-for="color in colors" :key="color.id" @click="openEditModal(color)"
                        class="cursor-pointer group">
                        <div class="w-full pb-[100%] rounded relative" :style="{ backgroundColor: color.hex }">
                            <span
                                class="absolute inset-0 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 bg-black/50 text-white rounded transition-opacity">
                                {{ color.name }}
                            </span>
                        </div>
                    </div>
                    <div @click="openEditModal()"
                        class="w-full pb-[100%] relative border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-blue-500">
                        <span class="absolute inset-0 flex items-center justify-center text-gray-400">+</span>
                    </div>
                </div>
            </div>

            <!-- Presets Grid -->
            <div v-if="hasAccess && activeTab === 'presets'" class="p-4 max-h-96 overflow-y-auto">
                <div class="grid grid-cols-2 gap-4">
                    <div v-for="preset in presets" :key="preset.id" @click="$emit('loadPreset', preset)"
                        class="cursor-pointer group">
                        <div class="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
                            <img :src="preset.thumbnail || preset.attributes.sourceImage"
                                class="w-full h-full object-cover" @error="handleImageError($event, preset)" />
                            <div
                                class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span class="text-white text-sm">Load Preset</span>
                            </div>
                        </div>
                        <p class="mt-1 text-sm truncate">{{ preset.name || preset.attributes?.Name }}</p>
                    </div>
                </div>
            </div>
        </div>

        <ColorEditModal v-if="showModal" v-model="showModal" :color="selectedColor" @save="handleSave"
            @delete="handleDelete" />
    </div>

    <!-- Minimal Show Button -->
    <div v-else class="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg z-50 p-2">
        <button @click="isHidden = false" 
            class="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <span class="text-sm font-semibold">Image Controls</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12H5" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5l7 7-7 7" />
            </svg>
        </button>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from "#app"

const props = defineProps({
    isProcessing: Boolean,
    colors: {
        type: Array,
        required: true
    },
    presets: {
        type: Array,
        default: () => []
    }
})

const emit = defineEmits(['analyze', 'filesSelected', 'update:colors', 'loadPreset'])

const isExpanded = ref(false)
const activeTab = ref('colors')
const showModal = ref(false)
const selectedColor = ref(null)
const fileInput = ref(null)
const selectedFiles = ref([])
const isHidden = ref(false)

const route = useRoute()
const hasAccess = computed(() => {
  const urlParams = route.query.access
  return !!urlParams
})

const handleFileSelect = (event) => {
    selectedFiles.value = [...event.target.files]
    emit('filesSelected', selectedFiles.value)
}

const removeFile = (fileToRemove) => {
    selectedFiles.value = selectedFiles.value.filter(file => file !== fileToRemove)
    emit('filesSelected', selectedFiles.value)
}

const analyze = () => {
    emit('analyze', {
        files: selectedFiles.value,
        method: 'chroma'
    })
}

const openEditModal = (color = null) => {
    selectedColor.value = color
    showModal.value = true
}

const handleSave = (colorData) => {
    const updatedColors = [...props.colors]
    if (colorData.id) {
        const index = updatedColors.findIndex(c => c.id === colorData.id)
        updatedColors[index] = colorData
    } else {
        colorData.id = Date.now()
        updatedColors.push(colorData)
    }
    emit('update:colors', updatedColors)
    showModal.value = false
}

const handleDelete = (colorId) => {
    emit('update:colors', props.colors.filter(color => color.id !== colorId))
    showModal.value = false
}

const handleImageError = (event, preset) => {
    // Fallback to a placeholder image on error
    event.target.src = '/api/placeholder/400/300'
}
</script>