/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "app.vue",
    "./components/**/*.{js,vue,ts,html}",
    "./layouts/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./nuxt.config.{js,ts}",
    './pages/**/*.{html,js,vue}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

