<template>
  <div class="flex flex-wrap">
    <div v-if="presets.length" v-for="preset in presets" :key="preset.id" class="relative m-2 w-24 h-24">
      <img :src="preset.attributes.sourceImage" alt="Preset Thumbnail" class="w-full h-full object-cover rounded"
        @click="confirmAndLoadPreset(preset)" />
      <div class="absolute top-0 right-0">
        <button @click.stop="deletePreset(preset.id)"
          class="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">X</button>
      </div>
      <div class="absolute bottom-0 w-full text-center text-sm bg-white bg-opacity-75">{{ preset.attributes.Name }}</div>
    </div>
    <!-- Add New Preset Placeholder -->
    <div class="m-2 w-24 h-24 flex items-center justify-center bg-gray-200 text-green-500 cursor-pointer"
      @click="$emit('addNewPreset')">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
    </div>
  </div>
</template>
  
<script>
import axios from 'axios';

export default {
  data() {
    return {
      presets: [],
      showCreatePresetModal: false,
      newPresetName: '',
    };
  },
  mounted() {
    this.loadPresets();
    console.log('presets', this.presets)
  },
  methods: {
    async loadPresets() {
      try {
        const response = await axios.get(`https://hiren-devs-strapi-j5h2f.ondigitalocean.app/api/color-presets`);
        console.log(response)
        this.presets = response.data.data;
        console.log('ths presets', this.presets)
      } catch (error) {
        console.error('Error loading presets:', error);
      }
    },
    confirmAndLoadPreset(preset) {
      console.log('comfirmed preset: ', preset)
      if (confirm(`Do you want to load preset "${preset.attributes.Name}"?`)) {
        console.log('aemiting preset', preset)
        this.$emit('loadPreset', preset.attributes.processed_images);
      }
    },
    async deletePreset(presetId) {
      console.log('je moeder', presetId)
      if (confirm('Are you sure you want to delete this preset?')) {
        try {
          // Implement the API call to delete the preset
          // Example: await axios.delete(`API_URL/presets/${presetId}`);
          await axios.delete()
          this.loadPresets(); // Reload presets after deletion
        } catch (error) {
          console.error('Error deleting preset:', error);
        }
      }
    }
  },
};
</script>
  
<style scoped>
.preset-item {
  margin: 10px;
  cursor: pointer;
}

.preset-thumbnail {
  width: 100px;
  /* Adjust as needed */
  height: 100px;
  /* Adjust as needed */
  object-fit: cover;
}

.preset-name {
  text-align: center;
}
</style>
  