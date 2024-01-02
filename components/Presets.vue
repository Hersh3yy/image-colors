<template>
  <div class="flex flex-wrap">
    <div v-if="presets.length" v-for="preset in presets" :key="preset.id" class="relative m-2 w-24 h-24 group">
      <img :src="preset.attributes.sourceImage" alt="Preset Thumbnail"
        class="w-full h-full object-cover rounded cursor-pointer" @click="confirmAndLoadPreset(preset)" />
      <div class="absolute top-0 right-0 hidden group-hover:flex">
        <button @click.stop="deletePreset(preset.id)"
          class="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">X</button>
      </div>
      <div class="absolute bottom-0 w-full text-center text-sm bg-white bg-opacity-75 cursor-pointer"
        @click="confirmAndLoadPreset(preset)">{{ preset.attributes.Name }}</div>
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

    this.$parent.$on('preset-created', () => {
      this.loadPresets();
    })
  },
  methods: {
    async loadPresets() {
      try {
        const response = await axios.get(`https://hiren-devs-strapi-j5h2f.ondigitalocean.app/api/color-presets`);
        this.presets = response.data.data;
      } catch (error) {
        console.error('Error loading presets:', error);
      }
    },
    confirmAndLoadPreset(preset) {
      if (confirm(`Do you want to load preset "${preset.attributes.Name}"?`)) {
        this.$emit('loadPreset', preset.attributes.processed_images);
      }
    },
    async deletePreset(presetId) {
      if (confirm('Are you sure you want to delete this preset?')) {
        const password = prompt('Please enter the password to delete this preset:');
        if (!password) {
          alert('Password is required to delete a preset.');
          return;
        }

        const payload = {
          password: password,
          presetId: presetId
        };

        try {
          await axios.delete('/.netlify/functions/presets', {
            headers: { 'Content-Type': 'application/json' },
            data: payload
          });
          this.loadPresets();
        } catch (error) {
          console.error('Error deleting preset:', error);
          alert('Failed to delete the preset. Please try again.');
        }
      }
    }
  },
};
</script>