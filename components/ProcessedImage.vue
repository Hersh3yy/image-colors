<template>
    <div class="flex flex-row">
        <div v-if="sourceImage" class="pr-9">
            <img :src="sourceImage" class="w-16 h-16" />
        </div>
        <div class="flex flex-row">
            <div v-if="colors.image_colors.length">
                <div class="text-lg italic pb-4">
                    Top colors
                </div>
                <div class="flex flex-col">
                    <div class="flex flex-row">
                        <div class="pr-4">Color code</div>
                        <div>Percentage</div>
                    </div>
                    <div v-for="color in sortColors(colors.image_colors)" class="flex flex-row">
                        <div :style="`background-color: ${color.html_code}`" class="mr-5 pr-3 pb-5">{{ color.html_code }}</div>
                        <div>{{ color.percent }}</div>
                    </div>
                </div>
            </div>
            <div v-if="colors.foreground_colors.length">
                <div class="text-lg italic pb-4">
                    Foreground colors
                </div>
                <div v-for="color in sortColors(colors.foreground_colors)" class="flex flex-row">
                    <div :style="`background-color: ${color.html_code}`" class="pr-5 pb-5">{{ color.html_code }}</div>
                    <div>{{ color.percent }}</div>
                </div>
            </div>
            <div v-if="colors.background_colors.length">
                <div class="text-lg italic pb-4">
                    Background colors
                </div>
                <div v-for="color in sortColors(colors.background_colors)" class="flex flex-row">
                    <div :style="`background-color: ${color.html_code}`" class="pr-5 pb-5">{{ color.html_code }}</div>
                    <div>{{ color.percent }}</div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
export default {
    props: {
        sourceImage: String,
        colors: Object
    },
    methods: {
        sortColors(colors) {
            return colors.sort((a,b) => b.percent - a.percent)
        }
    }
}
</script>