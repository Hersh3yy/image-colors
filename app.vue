<template>
  <div class="flex flex-col">
    <div>
      <form @submit.prevent="analyzeImages">
        <input type="file" ref="imageFiles" multiple required accept="image/*" />
        <button type="submit" class="analyze-button bg-slate-200" :disabled="processingPython">
          ANALYZE LIKE YOU MEAN IT
        </button>
        <div v-if="processingPython">
          <div class="loading-spinner"></div> <!-- replace with your spinner element -->
          <p>Processed {{ processedFiles }} out of {{ totalFiles }} files...</p>
        </div>
      </form>
    </div>
    <br />
    <div v-if="processedImages.length > 1" class="border-teal-950 border-y-pink-600">
      <div class="ml-12 text-lg font-bold">Overall analysis of {{ processedImages.length }} images</div>
      <ProcessedImage :colors="totalImageData" />
    </div>
    <br />
    <div class="flex flex-col">
      <div v-for="image in processedImages">
        <ProcessedImage :name="image.name" :sourceImage="image.sourceImage" :colors="image.colors" class="my-6"
          @deleteImage="deleteImage(image)" />
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
      }
      this.processedImages.forEach((image) => {
        console.log('image from total images', image)
        image.colors.image_colors.forEach((imageColor) => {
          totalColors.image_colors.push(imageColor)
        })
      })
      totalColors.image_colors.slice(0, 10)
      return totalColors
    }
  },
  methods: {
    deleteImage(imageData) {
      this.processedImages = this.processedImages.filter(image => image.sourceImage !== imageData.sourceImage)
    },
    async getClosestColorInfo(color) {
      try {
        let url = `https://goldfish-app-v7y4c.ondigitalocean.app/closest_color?r=${color.r}&g=${color.g}&b=${color.b}`
        if (!color.r) {
          url = `https://goldfish-app-v7y4c.ondigitalocean.app/closest_color?hex=${color.html_code.substring(1)}`
        }
        await axios.get(url)
          .then((response) => {
            color.closest_palette_color = response.data.color_name
            color.closest_palette_color_html_code = "#" + response.data.hex
            color.closest_palette_color_parent = response.data.parent_color_name
            color.closest_palette_color_parent_html_code = '#' + response.data.parent_color_hex
            color.closest_palette_distance = response.data.distance
          })
      }
      catch (e) {
        console.log("ERROR", color)
        console.log(e)
      }
    },
    async analyzeImages() {
      const files = this.$refs.imageFiles.files
      this.totalFiles = files.length
      this.processedFiles = 0
      this.processingPython = true
      for (let i = 0; i < files.length; i++) {
        try {
          const formData = new FormData()
          formData.append('image', files[i])

          const response = await axios.post('https://goldfish-app-v7y4c.ondigitalocean.app/analyze', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })
          const imageUrl = URL.createObjectURL(files[i])
          const imageColors = response.data
          await Promise.all(imageColors.map(color => {
            if (!color.closest_palette_color) {
              return this.getClosestColorInfo(color)
            }
          })).then(() => {
            this.processedImages.push({
              name: files[i].name,
              sourceImage: imageUrl,
              colors: {
                image_colors: imageColors
              }
            })
          })
          console.log(imageColors)


        } catch (error) {
          console.info(error)
        } finally {
          this.processedFiles += 1
        }
      }

      this.$refs.imageFiles.value = null // Reset the file input
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