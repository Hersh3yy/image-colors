<template>
    <div class="
                    absolute 
                    -top-48
                    left-1/2 
                    transform 
                    -translate-x-1/2 
                    bg-black 
                    text-white 
                    text-xs 
                    px-2
                    py-1 
                    rounded 
                    w-64
                    flex 
                    flex-col">
        <div class="flex items-center space-x-2 font-bold">
            <span>Actual color:</span>
            <div class="w-3 h-3 border-2 border-white" :style="{ backgroundColor: color.html_code }"></div>
            <div>| Percent: {{ parseFloat(color.percent).toFixed(2) }}%</div>
        </div>
        <hr />
        <div class="flex items-center space-x-2 font-bold">
            <span>Closest Color:</span>
            <div class="w-3 h-3 border-2 border-white" :style="{ backgroundColor: color.closest_palette_color_html_code }">
            </div>
        </div>
        <div>Distance: {{ parseFloat(color.closest_palette_color_distance).toFixed(2) }}</div>
        <div v-if="color.closest_palette_color_pantone">Pantone: {{ color.closest_palette_color_pantone }}</div>
        <div>Name: {{ color.closest_palette_color }}
            <hr />
            <div class="font-bold">
                <div class="flex items-center space-x-2 font-bold">
                    <span>Closest Parent Color:</span>
                    <div class="w-3 h-3 border-2 border-white"
                        :style="{ backgroundColor: color.closest_palette_color_parent_html_code }" />
                </div>
            </div>
            <div>Distance to closest color: {{ parseFloat(color.closest_palette_color_parent_distance).toFixed(2) }}</div>
            <div>Name: {{ color.closest_palette_color_parent }}</div>
        </div>
    </div>
</template>
<script>
export default {
    props: {
        color: Object
    }
}
</script>