<template>
  <div class="sticky top-16 z-30">
    <!-- Analysis Status -->
    <div v-if="analysisStatus && analysisStatus.total > 0" class="bg-white border-b">
      <div class="container mx-auto px-4 py-4">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex justify-between text-sm text-gray-600 mb-2">
            <span>Analyzing images...</span>
            <span>{{ analysisStatus.current }} / {{ analysisStatus.total }}</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-blue-500 h-2 rounded-full transition-all duration-300"
              :style="`width: ${(analysisStatus.current / analysisStatus.total) * 100}%`"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Preset Operations Status -->
    <div v-if="presetStatus.isCreating || presetStatus.isUpdating" class="bg-white border-b">
      <div class="container mx-auto px-4 py-4">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex justify-between text-sm text-gray-600 mb-2">
            <span>{{ presetStatus.isCreating ? 'Creating preset...' : 'Updating preset...' }}</span>
            <span>{{ presetStatus.current }} / {{ presetStatus.total }}</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-blue-500 h-2 rounded-full transition-all duration-300"
              :style="`width: ${(presetStatus.current / presetStatus.total) * 100}%`"></div>
          </div>
          <div v-if="presetStatus.failed.length" class="mt-2 text-amber-600 text-sm">
            Failed uploads: {{ presetStatus.failed.length }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
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
    default: () => ({
      isCreating: false,
      isUpdating: false,
      total: 0,
      current: 0,
      failed: []
    })
  }
});
</script> 