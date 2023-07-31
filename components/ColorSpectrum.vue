<template>
    <div class="text-lg italic pb-4">
        Color ColorSpectrum
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
    methods: {
        hexToHSL(H) {
            // Convert hex to RGB first
            let r = 0, g = 0, b = 0;
            if (H.length === 4) {
                r = "0x" + H[1] + H[1];
                g = "0x" + H[2] + H[2];
                b = "0x" + H[3] + H[3];
            } else if (H.length === 7) {
                r = "0x" + H[1] + H[2];
                g = "0x" + H[3] + H[4];
                b = "0x" + H[5] + H[6];
            }

            // Then to HSL
            r /= 255;
            g /= 255;
            b /= 255;
            let cmin = Math.min(r,g,b),
                cmax = Math.max(r,g,b),
                delta = cmax - cmin,
                h = 0,
                s = 0,
                l = 0;

            if (delta === 0)
                h = 0;
            else if (cmax === r)
                h = ((g - b) / delta) % 6;
            else if (cmax === g)
                h = (b - r) / delta + 2;
            else
                h = (r - g) / delta + 4;

            h = Math.round(h * 60);

            if (h < 0)
                h += 360;

            l = (cmax + cmin) / 2;

            s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

            s = +(s * 100).toFixed(1);
            l = +(l * 100).toFixed(1);

            return [h, s, l];
        }
    },
    computed: {
        sortedColors() {
            return [...this.colors].sort((a, b) => {
                const hslA = this.hexToHSL(a.html_code);
                const hslB = this.hexToHSL(b.html_code);
                return hslA[0] - hslB[0] || hslA[1] - hslB[1] || hslA[2] - hslB[2];
            });
        }
    }
}
</script>