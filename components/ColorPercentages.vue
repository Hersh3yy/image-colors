<template>
    <div class="text-lg italic pb-4">
        Top colors
    </div>
    <div class="flex w-full h-5 relative">
        <div 
            v-for="color in sortedColors"
            :style="`background-color: ${color.html_code}; width: ${color.percent}%`" 
            class="h-full transition-all duration-300 hover:bg-opacity-75 relative"
            @mouseover="hoverColor = `${color.closest_palette_color} - ${color.percent}%`"
            @mouseout="hoverColor = ''"
        >
            <div v-if="hoverColor === `${color.closest_palette_color} - ${color.percent}%`" class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded">
                {{ hoverColor }}
            </div>
        </div>
    </div>
</template>
<script>
export default {
    props: {
        colors: Object
    },
    data() {
        return {
            hoverColor: ''
        }
    },
    computed: {
        sortedColors() {
            return this.colors.sort((a, b) => b.percent - a.percent);
        }
    }
}
</script>