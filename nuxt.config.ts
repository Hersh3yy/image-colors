// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  css: ['~/assets/main.css'],
  postcss: {
      plugins: {
        tailwindcss: {},
        autoprefixer: {},
      },
  },
  app: {
        head: {
            title: 'Color Analyzer',
            htmlAttrs: {
                lang: 'en'
            },
            meta: [
                {
                    name: 'description',
                    content: 'Analyzer of images to find the division of present colors'
                },
                {
                    name: 'keywords',
                    content: 'amsterdam, art'
                }
            ]
        }
    },
    runtimeConfig: {
        public: {
            apiBaseURL: process.env.COLOR_ANALYZER_API_ENDPOINT,
            strapiURL: 'https://hiren-devs-strapi-j5h2f.ondigitalocean.app',
            colorPresetToken: process.env.COLOR_PRESET_TOKEN,
        }
    }
})
