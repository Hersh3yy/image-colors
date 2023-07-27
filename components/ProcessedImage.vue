<template>
    <div class="flex flex-row" :class="{ 'max-h-64 overflow-y-hidden': !showMore, 'overflow-auto': showMore }">
        <div v-if="name" class="flex flex-col w-72 pl-16">
            <button type="submit" class="analyze-button bg-red-200 mr-10" @click="$emit('deleteImage')">
                DELETE
            </button>
            <div class="pt-10">
                {{ name }}
            </div>
        </div>
        <div v-if="sourceImage" class="pr-9">
            <img :src="sourceImage" class="w-64 h-auto" />
        </div>
        <div class="flex flex-row">
            <div v-if="groupedColors">
                <GroupedColorsDoughnut :chartDataProp="chartData" />
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
        </div>
        <button @click.prevent="showMore = !showMore" class="mt-4 px-2 py-1 bg-blue-500 text-white rounded h-10">
            {{ showMore ? 'Show Less' : 'Show More' }}
        </button>
    </div>
</template>
<script>
export default {
    props: {
        sourceImage: String,
        colors: Object,
        name: String
    },
    data() {
        return {
            showMore: false
        }
    },
    methods: {
        sortColors(colors) {
            return colors.sort((a, b) => b.percent - a.percent)
        },
    },
    computed: {
        chartData() {
            let datasets = [
                {
                    data: [],
                    backgroundColor: [],
                },
                {
                    data: [],
                    backgroundColor: [],
                    labels: [], // add a labels array to the child colors dataset
                }
            ]
            let labels = []

            this.groupedColors.forEach(group => {
                // Add each parent color to the outer layer
                datasets[0].data.push(group.totalPercentage)
                datasets[0].backgroundColor.push(group.hexColor)
                labels.push(group.colorGroup)
                // Add each child color to the inner layer
                group.colors.forEach(color => {
                    datasets[1].data.push(color.percent)
                    datasets[1].backgroundColor.push(color.html_code)
                    datasets[1].labels.push(color.colorName) // add child color name to child dataset labels
                })
            })
            return {
                labels: labels,
                datasets: datasets
            }
        },

        // ...

        options: {
            tooltips: {
                callbacks: {
                    label: function (tooltipItem, data) {
                        let dataset = data.datasets[tooltipItem.datasetIndex]
                        if (dataset.labels && dataset.labels[tooltipItem.index]) {
                            // Use child color label if it exists
                            return dataset.labels[tooltipItem.index]
                        } else {
                            // Fall back to parent color label
                            return data.labels[tooltipItem.index]
                        }
                    }
                }
            }
            // ...
        },
        groupedColors() {
            let colorGroups = []
            for (let color of this.colors.image_colors) {
                if (color.closest_palette_color_parent) {
                    let parent = color.closest_palette_color_parent
                    if (parent === "undefined")
                        parent = "Undefined Colors"
                    // Look for existing group
                    let group = colorGroups.find(g => g.colorGroup === parent)
                    if (group) {
                        group.colors.push(color)
                        group.totalPercentage += color.percent
                    }
                    else {
                        colorGroups.push({
                            colorGroup: parent,
                            colors: [color],
                            totalPercentage: color.percent,
                            hexColor: color.closest_palette_color_parent_html_code || parent
                        })
                    }
                }
            }

            // Sort color groups by totalPercentage
            colorGroups.sort((a, b) => b.totalPercentage - a.totalPercentage)
            return colorGroups
        }
    },
}
</script>