// services/imageService.js
import axios from 'axios';

const COLOR_ANALYZER_API_BASE = this.$config.public.apiBaseURL || process.env.COLOR_ANALYZER_API_ENDPOINT || 'https://squid-app-5flef.ondigitalocean.app';

export const analyzeImage = async (formData) => {
  const response = await axios.post(`${COLOR_ANALYZER_API_BASE}/analyze`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const img = new Image()
      img.src = reader.result
      img.onload = () => {
        const aspectRatio = img.naturalWidth / img.naturalHeight
        const thumbnailWidth = 104
        const thumbnailHeight = thumbnailWidth / aspectRatio

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        canvas.width = thumbnailWidth
        canvas.height = thumbnailHeight
        ctx.drawImage(img, 0, 0, thumbnailWidth, thumbnailHeight)

        const resizedImage = canvas.toDataURL('image/jpeg')
        resolve(resizedImage)
      }
    }
    reader.onerror = error => reject(error)
  })
}

// Additional image-related functions can be added here
