<template>
  <div class="flex-1">
    <!-- Color Distribution Section -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <h4 class="font-medium text-gray-700">Color Distribution</h4>
        <MoleculesInfoTooltip 
          content="This bar shows the proportion of each color in the image. Hover over sections to see color details."
        />
      </div>

      <!-- Color Percentages Bar -->
      <div class="mb-6">
        <MoleculesColorPercentages :colors="image.colors" />
      </div>

      <!-- Artist-friendly color breakdown -->
      <div class="mb-6">
        <MoleculesColorFamilyBreakdown 
          :colors="image.colors" 
          @feedback="$emit('feedback', $event)"
        />
      </div>

      <!-- Color Grid View (Mobile-friendly alternative to table) -->
      <MoleculesMobileColorGrid 
        :colors="image.colors"
        @feedback="$emit('feedback', $event)"
        @copy="$emit('copy', $event)"
        class="md:hidden"
      />

      <!-- Color Details Table (Desktop) -->
      <div class="hidden md:block mt-6">
        <MoleculesColorDetailsTable 
          :colors="image.colors" 
          :analysisSettings="image.analysisSettings"
          @feedback="$emit('feedback', $event)"
          @copy="$emit('copy', $event)"
        />
      </div>

      <!-- Problematic Matches Section -->
      <MoleculesProblematicMatches 
        :problematicMatches="image.metadata?.problematicMatches"
        @feedback="$emit('feedback', $event)"
        @copy="$emit('copy', $event)"
      />
    </div>
  </div>
</template>

<script setup>
// Components auto-imported by Nuxt

defineProps({
  /**
   * Image data object with color analysis results
   */
  image: {
    type: Object,
    required: true,
    validator: (obj) => obj.colors && obj.metadata
  }
});

defineEmits(['feedback', 'copy']);
</script>
