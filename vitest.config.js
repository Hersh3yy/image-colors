import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      // Nuxt's #app (useState, useRoute, ...) has no runtime under Vitest;
      // composables import it, so point it at a small mock.
      '#app': resolve(__dirname, './tests/mocks/nuxt-app.js'),
    },
  },
})
