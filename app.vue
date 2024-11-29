<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900">Color Analyzer</h1>
        <button class="text-gray-600 hover:text-gray-900">Sign In</button>
      </div>
    </header>

    <main class="container mx-auto px-4 py-8">
      <OverallAnalaysis v-if="activePreset || processedImages.length"
        :images="activePreset ? activePresetImages : processedImages" class="mt-8" />

      <div v-if="activePreset" class="mt-8">
        <ActivePreset :preset="activePreset" :images="activePresetImages" @save="handleSavePreset"
          @delete="handleDeletePreset" @reanalyze="handleReanalysis" @deleteImage="handleDeleteImage" />
      </div>

      <div v-else class="mt-8 space-y-4">
        <div v-for="(image, index) in processedImages" :key="index">
          <ImageAnalysisResult :image="image" @reanalyze="handleReanalysis"
            @delete="image => processedImages.splice(index, 1)" />
        </div>
      </div>

      <div v-if="isProcessing" class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p>Processing image {{ currentImageIndex + 1 }} of {{ selectedFiles?.length }}...</p>
        <p class="text-sm text-gray-600">{{ processingStatus }}</p>
      </div>

      <div v-if="error" class="mt-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p>{{ error }}</p>
      </div>
    </main>

    <ImageControls :is-processing="isProcessing" :colors="parentColors" :presets="presets" @analyze="handleAnalysis"
      @filesSelected="handleFileSelection" @update:colors="parentColors = $event" @loadPreset="handleLoadPreset" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { analyzeImage } from '@/services/imageAnalyzer'
import { useRoute } from "#app"
import OverallAnalaysis from './components/OverallAnalaysis.vue';

// Composables
const route = useRoute()
const { fetchPresets, createPreset, deletePreset } = usePresets()

// State Management
const isProcessing = ref(false)
const currentImageIndex = ref(-1)
const processingStatus = ref('')
const error = ref(null)

// Image and Preset State
const selectedFiles = ref(null)
const processedImages = ref([])
const presets = ref([])
const activePreset = ref(null)
const activePresetImages = ref([])

// UI State
const showCreatePresetDialog = ref(false)
const newPresetName = ref('')

// Lifecycle Hooks
onMounted(async () => {
  await loadPresets()
})

// Preset Management Methods
const loadPresets = async () => {
  try {
    const response = await fetchPresets();
    console.log('Presets response:', response);

    // Handle different response formats
    if (Array.isArray(response)) {
      presets.value = response;
    } else if (response.data) {
      presets.value = response.data;
    } else {
      console.error('Unexpected presets response format:', response);
      presets.value = [];
    }
  } catch (err) {
    console.error('Failed to load presets:', err);
    error.value = 'Failed to load presets';
  }
}

const handleLoadPreset = (preset) => {
  console.log('Loading preset:', preset);

  // Check if preset exists
  if (!preset) {
    console.error('No preset provided');
    return;
  }

  // Set the active preset
  activePreset.value = preset;

  // Get the processed images from the correct location
  let images = [];
  if (preset.attributes?.processed_images) {
    // Handle strapi format where data is in attributes
    images = preset.attributes.processed_images;
  } else if (preset.processed_images) {
    // Handle direct format
    images = preset.processed_images;
  } else {
    console.error('No processed images found in preset');
    return;
  }

  // Make sure images is an array
  if (!Array.isArray(images)) {
    if (typeof images === 'string') {
      try {
        // Try parsing if it's a JSON string
        images = JSON.parse(images);
      } catch (e) {
        console.error('Failed to parse processed_images string:', e);
        images = [];
      }
    } else {
      console.error('processed_images is not an array:', images);
      images = [];
    }
  }

  // Set the active preset images
  activePresetImages.value = images;
}
const handleDeletePreset = async () => {
  try {
    await deletePreset(activePreset.value.id)
    activePreset.value = null
    activePresetImages.value = []
    await loadPresets()
    toast.success('Preset deleted successfully')
  } catch (err) {
    toast.error('Failed to delete preset')
  }
}

const handleSavePreset = async (images) => {
  try {
    await createPreset({
      id: activePreset.value.id,
      name: activePreset.value.attributes.Name,
      processed_images: images
    })
    await loadPresets()
    toast.success('Preset saved successfully')
  } catch (err) {
    toast.error('Failed to save preset')
  }
}

const handleCreateNewPreset = async () => {
  if (!newPresetName.value.trim()) return

  try {
    await createPreset({
      name: newPresetName.value,
      processed_images: processedImages.value
    })
    await loadPresets()
    processedImages.value = []
    showCreatePresetDialog.value = false
    newPresetName.value = ''
    toast.success('Preset created successfully')
  } catch (err) {
    toast.error('Failed to create preset')
  }
}

// Image Analysis Methods
const handleAnalysis = async ({ files, method }) => {
  if (!files?.length) return
  isProcessing.value = true
  error.value = null

  try {
    for (let i = 0; i < files.length; i++) {
      currentImageIndex.value = i
      const file = files[i]
      const sourceImage = URL.createObjectURL(file)
      const result = await analyzeImage(file, method, parentColors.value)

      const newImage = {
        name: file.name,
        sourceImage,
        colors: { [method]: result }
      }

      if (activePreset.value) {
        activePresetImages.value.unshift(newImage)
      } else {
        processedImages.value.unshift(newImage)
      }
    }
  } catch (err) {
    error.value = err.message || 'Analysis failed'
  } finally {
    isProcessing.value = false
    currentImageIndex.value = -1
  }
}

const handleReanalysis = async (image) => {
  isProcessing.value = true
  error.value = null

  try {
    const response = await fetch(image.sourceImage)
    const blob = await response.blob()
    const file = new File([blob], image.name, { type: blob.type })
    const method = Object.keys(image.results)[0]

    const result = await analyzeImage(file, method, parentColors.value)
    const updatedImage = {
      name: image.name,
      sourceImage: image.sourceImage,
      colors: { [method]: result }
    }

    if (activePreset.value) {
      const index = activePresetImages.value.findIndex(img => img.name === image.name)
      if (index !== -1) {
        activePresetImages.value[index] = updatedImage
      }
    } else {
      const index = processedImages.value.findIndex(img => img.name === image.name)
      if (index !== -1) {
        processedImages.value[index] = updatedImage
      }
    }
  } catch (err) {
    error.value = err.message
  } finally {
    isProcessing.value = false
  }
}

// Utility Methods
const handleDeleteImage = (index) => {
  if (activePreset.value) {
    activePresetImages.value.splice(index, 1)
  }
}

const handleFileSelection = (files) => {
  selectedFiles.value = files
}

// Color Palette Data
const parentColors = ref([
  { name: "Red", hex: "#FF0000" },
  { name: "Cyan", hex: "#00FFFF" },
  { name: "Blue", hex: "#0000FF" },
  { name: "DarkBlue", hex: "#00008B" },
  { name: "LightBlue", hex: "#ADD8E6" },
  { name: "Purple", hex: "#800080" },
  { name: "Gold", hex: "#FFD700" },
  { name: "Lime", hex: "#00FF00" },
  { name: "Magenta", hex: "#FF00FF" },
  { name: "Apricot", hex: "#FFD8B1" },
  { name: "Lavender", hex: "#DCBEFF" },
  { name: "Silver", hex: "#C0C0C0" },
  { name: "Orange", hex: "#FFA500" },
  { name: "Brown", hex: "#A52A2A" },
  { name: "Maroon", hex: "#800000" },
  { name: "Green", hex: "#008000" },
  { name: "Mint", hex: "#AAFFC3" },
  { name: "Olive", hex: "#808000" },
  { name: "Aquamarine", hex: "#7FFFD4" },
  { name: "Grey", hex: "#808080" },
  { name: "Cream", hex: "#FFFDD0" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Black", hex: "#000000" },
  { name: "Burlywood", hex: "#DEB887" },
  { name: "Saddle Brown", hex: "#8B4513" },
  { name: "Orange Red", hex: "#FF4500" },
  { name: "Slate Blue", hex: "#6A5ACD" },
  { name: "Cadet Blue", hex: "#5F9EA0" },
  { name: "Pale Green", hex: "#98FB98" },
  { name: "Pale Violet Red", hex: "#DB7093" },
  { name: "Steel Blue", hex: "#4682B4" },
  { name: "Goldenrod", hex: "#DAA520" },
  { name: "Turquoise", hex: "#40E0D0" },
  { name: "Blue Violet", hex: "#8A2BE2" },
  { name: "Salmon", hex: "#FA8072" }
])
</script>