<template>
  <div class="flex flex-col">
    <form @submit.prevent="analyzeImages" class="bg-black">
      <input type="file" ref="imageFiles" multiple required />
      <button type="submit" class="btn-primary mb-5 bg-black text-white">
        Add images to analyze
      </button>
    </form>
    <div class="justify-end">
      <div class="text-sm">Overall analysis</div>
      <ProcessedImage :colors="totalImageData" />
    </div>
    <div class="flex flex-col">
      <div v-for="image in processedImages">
        <ProcessedImage :sourceImage="image.sourceImage" :colors="image.colors" />
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
        image.colors.foreground_colors.forEach((imageColor) => {
          totalColors.foreground_colors.push({
            html_code: imageColor.html_code,
            percent: imageColor.percent / this.processedImages.length
          });
        });
        image.colors.background_colors.forEach((imageColor) => {
          totalColors.background_colors.push({
            html_code: imageColor.html_code,
            percent: imageColor.percent / this.processedImages.length
          });
        });
      });
      return totalColors;
    }
  },
  methods: {
    async analyzeImages() {
      const files = this.$refs.imageFiles.files;
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
        }
      }

      this.$refs.imageFiles.value = null; // Reset the file input
    }
  }
}
</script>