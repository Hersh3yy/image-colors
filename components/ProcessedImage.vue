<template>
    <div class="flex flex-row">
        <div v-if="name" class="flex flex-col w-72 pl-16">
            <button type="submit" class="analyze-button bg-red-200 mr-10" @click="$emit('deleteImage')">
                DELETE
            </button>
            <div class="pt-10">
                {{ name }}
            </div>
            <div v-if="sourceImage" class="pr-9">
                <img :src="sourceImage" class="sm:w-64 min-w-32 h-auto" />
            </div>
        </div>
        <div class="flex flex-col md:flex-row">
            <div v-if="groupedColors">
                <GroupedColorsDoughnut :chartDataProp="chartData" />
            </div>
            <div class="flex flex-col">
                <div v-if="colors.image_colors.length">
                    <ColorPercentages :colors="colors.image_colors" />
                </div>
            </div>
        </div>
    </div>
</template>
<script>
export default {
    props: {
        sourceImage: String,
        colors: Object,
        name: String
    },
    methods: {
        sortColors(colors) {
            return colors.sort((a, b) => b.percent - a.percent);
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
            ];
            let labels = [];
            this.groupedColors.forEach(group => {
                // Add each parent color to the outer layer
                datasets[0].data.push(group.totalPercentage);
                datasets[0].backgroundColor.push(group.hexColor);
                labels.push(group.colorGroup + " " + group.totalPercentage.toFixed(1) + "%")
                // Add each child color to the inner layer
                group.colors.forEach(color => {
                    datasets[1].data.push(color.percent);
                    datasets[1].backgroundColor.push(color.html_code);
                });
            });
            return {
                labels: labels,
                datasets: datasets
            };
        },
        // ...
        options: {
            tooltips: {
                callbacks: {
                    label: function (tooltipItem, data) {
                        let dataset = data.datasets[tooltipItem.datasetIndex];
                        if (dataset.labels && dataset.labels[tooltipItem.index]) {
                            // Use child color label if it exists
                            return dataset.labels[tooltipItem.index];
                        }
                        else {
                            // Fall back to parent color label
                            return data.labels[tooltipItem.index];
                        }
                    }
                }
            }
            // ...
        },
        groupedColors() {
            let colorGroups = [];
            for (let color of this.colors.image_colors) {
                if (color.closest_palette_color_parent) {
                    let parent = color.closest_palette_color_parent;
                    if (parent === "undefined")
                        parent = "Undefined Colors";
                    // Look for existing group
                    let group = colorGroups.find(g => g.colorGroup === parent);
                    if (group) {
                        group.colors.push(color);
                        group.totalPercentage += color.percent;
                    }
                    else {
                        colorGroups.push({
                            colorGroup: parent,
                            colors: [color],
                            totalPercentage: color.percent,
                            hexColor: color.closest_palette_color_parent_html_code || parent
                        });
                    }
                }
            }
            // Sort color groups by totalPercentage
            colorGroups.sort((a, b) => b.totalPercentage - a.totalPercentage);
            return colorGroups;
        }
    },
}
</script>