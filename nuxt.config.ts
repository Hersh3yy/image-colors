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
    compatibilityDate: '2024-08-27'
})