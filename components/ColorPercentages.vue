<template>
    <div class="text-lg italic pb-4">
        Top colors
    </div>
    <div class="flex w-96 h-5 relative">
        <div v-for="color in sortedColors" 
            :style="`background-color: ${color.html_code}; width: ${color.percent}%`"
            class="h-full transition-all duration-300 hover:bg-opacity-75 relative" 
            @mouseover="hoverColor = color"
            @mouseout="hoverColor = ''"
        >
            <ColorPercentageTooltip v-if="hoverColor === color" :color="color" />
        </div>
    </div>
</template>
<script>
import { hexToHSL } from '@/services/colorService';
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
            return [...this.colors].sort((a, b) => {
                const hslA = hexToHSL(a.html_code);
                const hslB = hexToHSL(b.html_code);
                return hslA[0] - hslB[0] || hslA[1] - hslB[1] || hslA[2] - hslB[2];
            });
        }
    },
}
</script>