// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    css: ['~/assets/main.css'],

    postcss: {
        plugins: {
            tailwindcss: {},
            autoprefixer: {},
        },
    },
    runtimeConfig: {
        MY_AWS_ACCESS_KEY_ID: process.env.MY_AWS_ACCESS_KEY_ID,
        MY_AWS_SECRET_ACCESS_KEY: process.env.MY_AWS_SECRET_ACCESS_KEY,
        public: {
            NETLIFY_FUNCTIONS_BASE: '/api'
        }
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
    // Set nitro options for Netlify but disable prerendering
    nitro: {
        preset: 'netlify',
        prerender: {
            failOnError: false,
            ignore: ['/**']  // Ignore all routes to effectively disable prerendering
        }
    },
    compatibilityDate: '2024-08-27',
    vite: {
        server: {
            hmr: {
                protocol: 'ws',
                host: 'localhost'
            }
        }
    }
})