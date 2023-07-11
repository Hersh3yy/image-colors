<template>
    <div class="flex flex-row">
        <div v-if="sourceImage" class="pr-9">
            <img :src="sourceImage" class="w-16 h-16" />
        </div>
        <div class="flex flex-row">
            <div>
                <div class="text-lg italic pb-4">
                    Top colors
                </div>
                <div v-for="color in colors.image_colors" class="flex flex-row">
                    <div :style="`background-color: ${color.html_code}`" class="pr-5 pb-5">{{ color.html_code }}</div>
                    <div>{{ color.percent }}</div>
                </div>
            </div>
            <div>
                <div class="text-lg italic pb-4">
                    Foreground colors
                </div>
                <div v-for="color in colors.foreground_colors" class="flex flex-row">
                    <div :style="`background-color: ${color.html_code}`" class="pr-5 pb-5">{{ color.html_code }}</div>
                    <div>{{ color.percent }}</div>
                </div>
            </div>
            <div>
                <div class="text-lg italic pb-4">
                    Background colors
                </div>
                <div v-for="color in colors.background_colors" class="flex flex-row">
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
    }
}
</script>