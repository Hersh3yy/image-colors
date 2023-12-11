<template>
    <div>
        <button @click="showColorPicker = !showColorPicker" class="toggle-color-picker-button">
            <img src="../assets/palette.png" alt="Color Palette" />
            {{ showColorPicker ? 'Hide Parewnt Colors' : 'Show Parent Colors' }}
        </button>

        <div v-if="showColorPicker">
            <div>

                <!-- Color Swatches View -->
                <div v-if="!isJsonEditMode" class="grid grid-cols-4 gap-4 mt-4">
                    <div v-for="(color, index) in parentColors" :key="index"
                        :style="{ backgroundColor: color?.hex || '#000000' }"
                        class="w-16 h-16 border border-gray-300 rounded shadow-sm"></div>
                    <div class="w-16 h-16 bg-gray-200 rounded shadow-sm flex justify-center items-center cursor-pointer hover:bg-gray-300"
                        @click="showColorModal">
                        <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                    </div>
                </div>

                <!-- JSON Text Area View -->
                <textarea v-if="isJsonEditMode" v-model="jsonText"
                    class="mt-4 shadow-sm border border-gray-300 rounded p-2 w-full h-64"></textarea>
                <button v-if="isJsonEditMode" @click="updateColorsFromJson"
                    class="mt-2 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                    Save Changes
                </button>
            </div>
        </div>

        <!-- Color Picker Modal -->
        <div v-if="showColorModal" class="color-picker-modal">
            <form @submit.prevent="addColor">
                <input type="text" v-model="newColorName" placeholder="Color Name" required />
                <input type="color" v-model="newColorHex" required />
                <button type="submit">Add Color</button>
            </form>
            <button @click="showColorModal = false">Close</button>
        </div>
    </div>
</template>
  
<script>
export default {
    props: ['parentColors'],
    data() {
        return {
            isJsonEditMode: false,
            jsonText: '',
            showColorPicker: false,
            showColorModal: false,
            newColorName: '',
            newColorHex: '#000000',
        };
    },
    methods: {
        toggleEditMode() {
            this.isJsonEditMode = !this.isJsonEditMode
            const simplifiedColors = this.parentColors.map(color => ({
                name: color.name,
                hex: color.hex
            }))

            this.jsonText = JSON.stringify(simplifiedColors, null, 2);
        },
        openColorPicker() {
            // Open color picker logic
        },
        addColor() {
            const newColor = {
                name: this.newColorName,
                hex: this.newColorHex,
                // Optionally add LAB conversion here
            };
            this.$emit('addColor', newColor);
            this.newColorName = '';
            this.newColorHex = '#000000';
            this.showColorModal = false;
        },
        updateColorsFromJson() {
            try {
                const updatedColors = JSON.parse(this.jsonText);
                // Validate the updatedColors structure
                console.log('updateing coplors: ', [updatedColors, this.jsonText])

                for (const color of updatedColors) {
                    if (typeof color.name !== 'string' || !color.name.trim()) {
                        throw new Error('Each color must have a valid name.');
                    }
                    if (!/^#[0-9A-Fa-f]{6}$/.test(color.hex)) {
                        throw new Error('Each color must have a valid hex value.');
                    }
                }

                this.$emit('updateColors', updatedColors);
                this.isJsonEditMode = false
                // this.showColorPicker = false
            } catch (e) {
                alert(`Invalid input: ${e.message}`)
            }
        },
    },
};
</script>
  
<style>
.color-swatch-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
    gap: 10px;
}

.color-swatch {
    width: 50px;
    height: 50px;
    border: 1px solid #ccc;
}

.add-color {
    background: repeating-conic-gradient(white 0% 25%, lightgray 0% 50%) 50% / 20px 20px;
}

.json-textarea {
    width: 100%;
    height: 200px;
    border-radius: 4px;
    border: 1px solid #ced4da;
    padding: 0.375rem 0.75rem;
    font-size: 1rem;
    line-height: 1.5;
    color: #495057;
    background-color: #fff;
    background-clip: padding-box;
    box-shadow: inset 0 0 0.25rem rgba(0, 0, 0, 0.075);
    margin-top: 1rem;
}
</style>
  