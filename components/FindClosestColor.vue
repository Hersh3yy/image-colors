<template>
    <input v-model="colorHex" />
    <button v-on:click="findClosestPantoneColor" />
    <div>
        {{ pantoneColor }}
    </div>
</template>
<script>
import axios from 'axios'
export default {
    data() {
        return {
            colorHex: null,
            pantoneColor: null
        }
    },
    methods: {
        async getClosestColorInfo(hex) {
            url = `${this.$config.public.apiBaseURL}/closest_color_${this.colorSpace}?hex=${hex}`
            await axios.get(url)
                .then((response) => {
                    if (response.data.pantone) color.closest_palette_color_pantone = response.data.pantone
                })
        }
    },
}
</script>