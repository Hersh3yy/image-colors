<template>
    <div class="flex flex-row">
        <div v-if="sourceImage" class="pr-9">
            <img :src="sourceImage" class="w-36 h-auto" />
        </div>
        <div class="flex flex-row">
            <div v-if="colors.image_colors.length">
                <div class="text-lg italic pb-4">
                    Top colors
                </div>
                <div class="flex flex-col">
                    <div class="flex flex-row">
                        <div class="pr-4">Closest color</div>
                        <div>Percentage</div>
                    </div>
                    <div v-for="color in sortColors(colors.image_colors)" class="flex flex-row">
                        <div :style="`background-color: ${color.html_code}`" class="mr-5 pr-3 pb-5">{{
                            color.closest_palette_color }}</div>
                        <div>{{ color.percent }}</div>
                    </div>
                </div>
            </div>
            <div v-if="colors.foreground_colors?.length">
                <div class="text-lg italic pb-4">
                    Foreground colors
                </div>
                <div v-for="color in sortColors(colors.background_colors)" class="flex flex-row">
                    <div :style="`background-color: ${color.html_code}`" class="pr-5 pb-5">{{ color.html_code }}</div>
                    <div>{{ color.percent }}</div>
                </div>
            </div>
            <div v-if="colors.background_colors?.length">
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
            return colors.sort((a, b) => b.percent - a.percent)
        }
    },
    computed: {
        groupedColors() {
            let grouped = {};
            for (let color of this.colors.image_colors) {
                let parent = color.closest_palette_color_parent;
                if (parent === 'undefined') parent = 'Undefined Colors';

                if (parent in grouped) {
                    grouped[parent].colors.push(color);
                    grouped[parent].totalPercentage += color.percent;
                } else {
                    grouped[parent] = {
                        colors: [color],
                        totalPercentage: color.percent
                    };
                }
            }
            return grouped;
        }
    }
}
</script>