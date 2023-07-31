<template>
    <div class="text-lg italic pb-4">
        Top colors
    </div>
    <div class="flex flex-col">
        <div class="flex flex-row">
            <div class="pr-4">Closest color</div>
            <div>Percentage</div>
        </div>
        <div v-for="color in sortedColors" class="flex flex-row">
            <div :style="`background-color: ${color.html_code}`" class="mr-5 pr-3 pb-5">{{
                color.closest_palette_color }}</div>
            <div>{{ color.percent }}</div>
        </div>
    </div>
</template>
<script>
export default {
    props: {
        colors: Object
    },
    computed: {
        sortedColors() {
            return this.colors.sort((a, b) => b.percent - a.percent);
        }
    }
}
</script>