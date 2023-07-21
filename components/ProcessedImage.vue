<template>
    <div class="flex flex-row">
        <div v-if="sourceImage" class="pr-9">
            <img :src="sourceImage" class="w-36 h-auto" />
        </div>
        <div class="flex flex-row">
            <div v-if="groupedColors" v-for="group in groupedColors"
                :style="`background-color: #${group.hexColor}`">
                PARENT: {{ group.colorGroup }} | {{ group.totalPercentage }}
                <br />
                <hr />
                <div v-for="color, i in group.colors">
                    ACTUAL HEX: {{ color.html_code }} <br />
                    CLOSEST COLOR: {{ color.closest_palette_color }} | {{ color.closest_palette_color_html_code }} <br />
                    DISTANCE: {{ color.closest_palette_distance }}<br />
                    PERCENT {{ color.percent }}
                    <br />
                    <br />
                </div>
            </div>
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
import axios from 'axios'
export default {
    props: {
        sourceImage: String,
        colors: Object
    },
    methods: {
        sortColors(colors) {
            return colors.sort((a, b) => b.percent - a.percent)
        },
        async getClosestColorInfo(color) {
            try {
                let url = `https://goldfish-app-v7y4c.ondigitalocean.app/closest_color?r=${color.r}&g=${color.g}&b=${color.b}`
                if (!color.r) {
                    console.log('breh')
                    url = `https://goldfish-app-v7y4c.ondigitalocean.app/closest_color?hex=${color.html_code}`
                }
                await axios.get(url)
                    .then((response) => {
                        color.closest_palette_color = response.data.color_name
                        color.closest_palette_color_html_code = "#" + response.data.hex
                        color.closest_palette_color_parent = response.data.parent_color_name
                        color.closest_palette_color_parent_html_code = response.data.parent_color_hex
                        color.closest_palette_distance = response.data.distance
                    })
            } catch (e) {
                console.log('ERROR', color)
                console.log(e)
            }
        }
    },
    computed: {
        groupedColors() {
            let colorGroups = [];

            for (let color of this.colors.image_colors) {
                if (color.closest_palette_color_parent) {
                    let parent = color.closest_palette_color_parent;
                    if (parent === 'undefined') parent = 'Undefined Colors';

                    // Look for existing group
                    let group = colorGroups.find(g => g.colorGroup === parent);

                    if (group) {
                        group.colors.push(color);
                        group.totalPercentage += color.percent;
                    } else {
                        colorGroups.push({
                            colorGroup: parent,
                            colors: [color],
                            totalPercentage: color.percent,
                            hexColor: color.closest_palette_color_parent_html_code
                        });
                    }
                }
            }

            // Sort color groups by totalPercentage
            colorGroups.sort((a, b) => b.totalPercentage - a.totalPercentage);

            return colorGroups;
        }
    },
    async mounted() {
        await this.colors.image_colors.forEach((color) => {
            if (!color.closest_palette_color) {
                this.getClosestColorInfo(color)
            }
        })
    }
}
</script>