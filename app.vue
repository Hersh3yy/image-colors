<template>
  <div class="flex flex-col">
    <form @submit.prevent="addImage" class="bg-black">
      <input type="url" v-model="imageUrlToAdd" />
      <button @click="analyzeImage(imageUrlToAdd)" class="btn-primary mb-5 bg-black text-white">
        Add an image to analyze
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
      const totalColors = []
      this.processedImages.forEach((image) => {
          image.colors.forEach((imageColor) => {
            totalColors.push({
              html_code: imageColor.html_code,
              percent: imageColor.percent / this.processedImages.length
            })
          })
      })
      return totalColors
              .sort((a,b) => b.percent - a.percent)
              .slice(0, 6)
    }
  },
  methods: {
    async analyzeImage(imageUrl) {
      const imaggaColorsEndpoint = `https://api.imagga.com/v2/colors?overall_count=10&extract_object_colors=0&image_url=${imageUrl}`
      await axios
        .get(imaggaColorsEndpoint, {
          auth: {
            username: this.username,
            password: this.password
          }
        })
        .then((response) => {
          console.log(response)
          this.processedImages.push({ sourceImage: imageUrl, colors: response.data.result.colors.image_colors })
          this.imageUrlToAdd = null
        })
        .catch((error) => {
          console.error(error)
        })
    }
  }
}
</script>