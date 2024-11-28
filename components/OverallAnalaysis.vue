<template>
    <div class="bg-white rounded-lg shadow p-6">
        <!-- Collapsible Header -->
        <div @click="isCollapsed = !isCollapsed" class="flex justify-between items-center cursor-pointer">
            <div class="flex items-center gap-3">
                <h2 class="text-lg font-semibold">Color Analysis</h2>
                <span class="text-sm text-gray-500">
                    ({{ images.length }} {{ images.length === 1 ? 'image' : 'images' }})
                </span>
            </div>
            <div class="transform transition-transform duration-200" :class="{ 'rotate-180': isCollapsed }">
                <Icon name="heroicons:chevron-down" />
            </div>
        </div>

        <!-- Collapsible Content -->
        <div v-show="!isCollapsed" class="transition-all duration-300 overflow-hidden">
            <div class="mt-6">
                <!-- Color distribution chart -->
                <div class="h-[300px] mb-6">
                    <GroupedColorsDoughnut v-if="chartData" :chartDataProp="chartData" />
                </div>

                <!-- Color bars section -->
                <div class="space-y-4">
                    <div class="text-lg italic">Top colors by group</div>
                    <div v-for="(group, index) in groupedColors" :key="index">
                        <div class="flex justify-between text-sm mb-1">
                            <span class="font-medium">{{ group.colorGroup }}</span>
                            <span>{{ group.totalPercentage.toFixed(1) }}%</span>
                        </div>
                        <div class="flex w-full h-5 relative">
                            <div v-for="color in group.colors" :key="color.html_code || color.color"
                                :style="`background-color: ${color.html_code || color.color}; width: ${color.percent || color.percentage}%`"
                                class="h-full transition-all duration-300 hover:bg-opacity-75 relative"
                                @mouseover="hoverColor = color" @mouseout="hoverColor = null">
                                <ColorPercentageTooltip v-if="hoverColor === color"
                                    :color="normalizeColorData(color)" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
    images: {
        type: Array,
        required: true
    }
})

const isCollapsed = ref(false)
const hoverColor = ref(null)

// Helper to normalize color data between old and new formats
const normalizeColorData = (color) => {
    if (color.html_code) {
        // Old format
        return {
            html_code: color.html_code,
            percent: color.percent,
            closest_palette_color: color.closest_palette_color,
            closest_palette_color_html_code: color.closest_palette_color_html_code,
            closest_palette_color_parent: color.closest_palette_color_parent,
            closest_palette_color_parent_html_code: color.closest_palette_color_parent_html_code,
            closest_palette_color_parent_distance: color.closest_palette_color_parent_distance,
            closest_palette_color_distance: color.closest_palette_color_distance
        }
    }
    // New format
    return {
        html_code: color.color,
        percent: color.percentage,
        closest_palette_color: color.closestParentColor,
        closest_palette_color_html_code: color.color,
        closest_palette_color_parent: color.closestParentColor,
        closest_palette_color_parent_html_code: color.color,
        closest_palette_color_parent_distance: 0,
        closest_palette_color_distance: 0
    }
}

// Get colors from an image (handles both formats)
const getColorsFromImage = (image) => {
    // Remove _custom wrapper if it exists
    const cleanImage = image._custom?.value || image

    if (cleanImage.results) {
        // New format with 'results'
        return Object.values(cleanImage.results)[0]
    }
    if (cleanImage.colors?.chroma) {
        // New format with 'chroma'
        return cleanImage.colors.chroma
    }
    if (cleanImage.colors?.image_colors) {
        // Legacy format
        return cleanImage.colors.image_colors
    }
    return []
}

const groupedColors = computed(() => {
    const groups = new Map()

    props.images.forEach(image => {
        const colors = getColorsFromImage(image)
        colors.forEach(color => {
            const parentColor = color.closest_palette_color_parent || color.closestParentColor
            if (!parentColor) return

            if (!groups.has(parentColor)) {
                groups.set(parentColor, {
                    colorGroup: parentColor,
                    colors: [],
                    totalPercentage: 0,
                    hexColor: color.closest_palette_color_parent_html_code || color.color
                })
            }

            const group = groups.get(parentColor)
            const normalizedColor = normalizeColorData(color)
            group.colors.push(normalizedColor)
            group.totalPercentage += (normalizedColor.percent || 0) / props.images.length
        })
    })

    return Array.from(groups.values())
        .sort((a, b) => b.totalPercentage - a.totalPercentage)
})

const chartData = computed(() => {
    const data = groupedColors.value
    if (!data.length) return null

    return {
        labels: data.map(g => `${g.colorGroup} (${g.totalPercentage.toFixed(1)}%)`),
        datasets: [
            {
                data: data.map(g => g.totalPercentage),
                backgroundColor: data.map(g => g.hexColor)
            },
            {
                data: data.flatMap(g => g.colors.map(c => c.percent)),
                backgroundColor: data.flatMap(g => g.html_code)
            }
        ]
    }
})
</script>