<template>
  <div class="flex flex-col">
    <div class="flex flex-row justify-center items-center">
      <form @submit.prevent="analyzeImages" class="flex flex-col">
        <input type="file" ref="imageFiles" multiple required accept="image/*" class="pb-6" />
        <button type="submit" class="analyze-button bg-slate-200" :disabled="processingPython">
          ANALYZE LIKE YOU MEAN IT
        </button>
      </form>
      <div id="info-tooltip" class="ml-7" @click.prevent="showInfo = !showInfo">
          <img v-if="!showInfo" class="w-9 cursor-pointer"
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Minimalist_info_Icon.png/2048px-Minimalist_info_Icon.png" />
            <img v-if="showInfo" class="w-9 cursor-pointer"
            src="https://www.svgrepo.com/show/24584/info-icon.svg" />
        </div>
        <div v-if="showInfo"
          class="bg-white border border-gray-300 p-2 rounded-md shadow-md text-left mt-2 absolute top-20 left-1/2 transform -translate-x-1/2 z-20">
          <!-- Your tooltip content here -->
          <p class="mb-2 font-semibold">Version 1.0</p>
          <p class="mb-2">How to use the Image Color Analyzer:</p>
          <ol class="mb-2 list-disc list-inside">
            <li>Choose one or more image files using the file input above.</li>
            <li>Click the "Analyze" button to start the analysis.</li>
          </ol>
          <p class="mb-2 text-xl">What's coming in version 1.5:</p>
          <ul class="mb-2 list-disc list-inside">
            <li>Improved closest color and parent accuracy. <i>Use different color spaces such as CMYK, Lab, HSV to get the closest color.</i></li>
            <li>Support for object analysis; when an image with a transparent background is provided.</li>
          </ul>
          <p class="mb-2 text-xl">What's coming in version 2:</p>
          <ul class="list-disc list-inside">
            <li>Save your current analysis to access later</li>
            <li>Machine learning color analysis that will ideally get more accurate over time</li>
            <li>Better visualizations: </li>
            <li>User options: user can add analysis settings such as color filters, image compression,  </li>
          </ul>
        </div>
    </div>

    <div v-if="processingPython">
      <span class="loader"></span> <!-- replace with your spinner element -->
      <p>Processed {{ processedFiles }} out of {{ totalFiles }} files...</p>
    </div>

    <br />
    <div v-if="processedImages.length > 1" class="border-teal-950 border-y-pink-600">
      <div class="ml-12 text-lg font-bold">Overall analysis of {{ processedImages.length }} images</div>
      <OverallAnalaysis :colors="totalImageData" />
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
      showInfo: false
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
    toggleInfo() {
      this.showInfo = !this.showInfo
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

.loader {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: inline-block;
  position: relative;
  border: 10px solid;
  box-sizing: border-box;
  animation: animloader 1s linear infinite alternate;
}

@keyframes animloader {
  0% {
    border-color: white rgba(255, 255, 255, 0) rgba(255, 255, 255, 0) rgba(255, 255, 255, 0);
  }

  33% {
    border-color: white white rgba(255, 255, 255, 0) rgba(255, 255, 255, 0);
  }

  66% {
    border-color: white white white rgba(255, 255, 255, 0);
  }

  100% {
    border-color: white white white white;
  }
}

.info-tooltip:hover .tooltip-content {
  display: block;
}
</style>