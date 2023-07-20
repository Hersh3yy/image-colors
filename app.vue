<template>
  <div class="flex flex-col">
    <form @submit.prevent="analyzeImages">
      <input type="file" ref="imageFiles" multiple required accept="image/*" />
      <button type="submit" class="analyze-button" :disabled="processingPython">
        ANALYZE
      </button>
      <div v-if="processingPython">
        <div class="loading-spinner"></div> <!-- replace with your spinner element -->
        <p>Processed {{processedFiles}} out of {{totalFiles}} files...</p>
      </div>
    </form>
    <form @submit.prevent="analyzeImagesWithImagga">
      <input type="file" ref="imageFilesForImagga" multiple required accept="image/*" />
      <button type="submit" class="analyze-button" :disabled="processingImagga">
        ANALYZE WITH IMAGGA
      </button>
      <div v-if="processingImagga">
        <div class="loading-spinner"></div> <!-- replace with your spinner element -->
        <p>Processed {{processedFiles}} out of {{totalFiles}} files...</p>
      </div>
    </form>
    <div v-if="processedImages.length > 1" class="justify-end border-teal-950 border-y-pink-600">
      <div class="text-sm">Overall analysis</div>
      <ProcessedImage :colors="totalImageData" />
    </div>
    <br />
    <div class="flex flex-col">
      <div v-for="image in processedImages">
        <ProcessedImage :sourceImage="image.sourceImage" :colors="image.colors" class="my-6" />
      </div>
    </div>
  </div>
</template>
<script>
import axios from 'axios'
export default {
  data() {
    return {
      imageUrlToAdd: "",
      colors: null,
      processedImages: [],
      processingPython: false,
      processingImagga: false,
      processedFiles: 0,
      username: 'acc_0764885fd7bdbd6',
      password: '4cc177792332903bcc1292014b182cda',
    }
  },
  computed: {
    totalImageData() {
      const totalColors = {
        image_colors: [],
        foreground_colors: [],
        background_colors: []
      };
      this.processedImages.forEach((image) => {
        image.colors.image_colors.forEach((imageColor) => {
          totalColors.image_colors.push({
            html_code: imageColor.html_code,
            percent: imageColor.percent / this.processedImages.length
          });
        });
        image.colors.foreground_colors?.forEach((imageColor) => {
          totalColors.foreground_colors.push({
            html_code: imageColor.html_code,
            percent: imageColor.percent / this.processedImages.length
          });
        });
        image.colors.background_colors?.forEach((imageColor) => {
          totalColors.background_colors.push({
            html_code: imageColor.html_code,
            percent: imageColor.percent / this.processedImages.length
          });
        });
      });
      totalColors.image_colors.slice(0, 10)
      return totalColors;
    }
  },
  methods: {
    async analyzeImagesWithImagga() {
      const files = this.$refs.imageFilesForImagga.files;
      this.totalFiles = files.length
      this.processedFiles = 0
      this.processingImagga = true
      for (let i = 0; i < files.length; i++) {
        try {
          const formData = new FormData();
          formData.append('image', files[i]);

          const response = await axios.post('https://api.imagga.com/v2/colors?overall_count=10', formData, {
            auth: {
              username: this.username,
              password: this.password
            },
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          console.log(response);
          const imageUrl = URL.createObjectURL(files[i]);
          this.processedImages.push({
            sourceImage: imageUrl,
            colors: {
              image_colors: response.data.result.colors.image_colors,
              foreground_colors: response.data.result.colors.foreground_colors,
              background_colors: response.data.result.colors.background_colors,
            }
          })
        } catch (error) {
          console.error(error);
        } finally {
          this.processedFiles += 1
        }
      }

      this.$refs.imageFilesForImagga.value = null; // Reset the file input
      this.processingImagga = false
    },
    async analyzeImages() {
      const files = this.$refs.imageFiles.files;
      this.totalFiles = files.length
      this.processedFiles = 0
      this.processingPython = true
      for (let i = 0; i < files.length; i++) {
        try {
          const formData = new FormData();
          formData.append('image', files[i]);

          // Instead of Imagga API, use the local Python color analyzer running on localhost:8080
          const response = await axios.post('https://goldfish-app-v7y4c.ondigitalocean.app/analyze', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          console.log(response);
          const imageUrl = URL.createObjectURL(files[i]);
          this.processedImages.push({
            sourceImage: imageUrl,
            colors: {
              image_colors: response.data
          }
        })
        } catch (error) {
          console.info(error);
        } finally {
          this.processedFiles += 1
        }
      }

      this.$refs.imageFiles.value = null; // Reset the file input
      this.processingPython = false
    }
  }
}
</script>
<style>
.analyze-button {
  @apply px-5 py-3 shadow-sm transition ease-in-out duration-300 rounded leading-snug whitespace-nowrap text-base font-semibold
}
</style>