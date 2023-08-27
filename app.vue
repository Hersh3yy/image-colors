<template>
  <div class="flex flex-col">
    <div class="flex flex-row justify-center items-center">
      <form @submit.prevent="analyzeImages" class="flex flex-col">
        <input type="file" ref="imageFiles" multiple required accept="image/*" class="pb-6" />
        <div class="flex flex-row items-center pb-2">
            <label class="pr-4">Color Space: </label>
            <input type="radio" id="lab" value="lab" v-model="colorSpace">
            <label for="lab" class="pr-4">LAB</label>

            <input type="radio" id="rgb" value="rgb" v-model="colorSpace">
            <label for="rgb">RGB</label>
        </div>
        <button type="submit" class="analyze-button bg-slate-200" :disabled="processingPython">
          ANALYZE IMAGE
        </button>
      </form>

      <!-- Info tooltip -->
      <div id="info-tooltip" class="ml-7" @click.prevent="showInfo = !showInfo">
          <img v-if="!showInfo" class="w-9 cursor-pointer"
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Minimalist_info_Icon.png/2048px-Minimalist_info_Icon.png" />
            <img v-if="showInfo" class="w-9 cursor-pointer"
            src="https://www.svgrepo.com/show/24584/info-icon.svg" />
        </div>
        <InfoComponent v-if="showInfo" />
    </div>

    <div v-if="processingPython">
      <svg aria-hidden="true" class="w-8 h-8 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
    </svg>
    <span class="sr-only">Loading...</span>
      <p>Processed {{ processedFiles }} out of {{ totalFiles }} files...</p>
    </div>

    <br />
    <div v-if="processedImages.length > 1" class="py-4 border-y-4 border-teal-950 border-y-pink-600">
      <div class="pl-12 text-lg font-bold">Overall analysis of {{ processedImages.length }} images</div>
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
      showInfo: false,
      colorSpace: 'lab',
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
        image.colors.image_colors.forEach((imageColor) => {
          const tempImageColor = {...imageColor}
          tempImageColor.percent /= this.processedImages.length
          totalColors.image_colors.push(tempImageColor)
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
      console.log('getting closest color', color)
      try {
        let url = `${this.$config.public.apiBaseURL}/closest_color_${this.colorSpace}?r=${color.r}&g=${color.g}&b=${color.b}`
        if (!color.r) {
          url = `${this.$config.public.apiBaseURL}/closest_color_${this.colorSpace}?hex=${color.html_code.substring(1)}`
        }
        await axios.get(url)
          .then((response) => {
            console.log('response from ' + url, response)
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
          const response = await axios.post(`${this.$config.public.apiBaseURL}/analyze`, formData, {
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