<template>
    <div>
        <button @click="showColorPicker = !showColorPicker" class="toggle-color-picker-button">
            <img src="../assets/palette.png" alt="Color Palette" />
            {{ showColorPicker ? 'Hide Parent Colors' : 'Show Parent Colors' }}
        </button>

        <div v-if="showColorPicker">
            <div>
                <AtomsBaseButton 
                  @click="toggleEditMode"
                  variant="primary"
                  :text="isJsonEditMode ? 'Show Swatches' : 'Edit JSON'"
                />

                <!-- Color Swatches View -->
                <AtomsColorSwatchGrid 
                    v-if="!isJsonEditMode" 
                    :colors="parentColors"
                    @delete="deleteColor"
                    @add="showColorModal = true"
                />

                <!-- JSON Text Area View -->
                <textarea v-if="isJsonEditMode" v-model="jsonText"
                    class="mt-4 shadow-sm border border-gray-300 rounded p-2 w-full h-64"></textarea>
                <AtomsBaseButton 
                  v-if="isJsonEditMode" 
                  @click="updateColorsFromJson"
                  variant="success"
                  text="Save Changes"
                  class="mt-2"
                />
            </div>
        </div>

        <!-- Color Picker Modal -->
        <MoleculesColorPickerModal 
            :visible="showColorModal"
            @add="addColor"
            @close="showColorModal = false"
        />
    </div>
</template>
  
<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
    parentColors: {
        type: Array,
        required: true
    }
});

const emit = defineEmits(['deleteColor', 'addColor', 'updateColors']);

// State
const isJsonEditMode = ref(false);
const jsonText = ref('');
const showColorPicker = ref(false);
const showColorModal = ref(false);

// Methods
const toggleEditMode = () => {
    isJsonEditMode.value = !isJsonEditMode.value;
    const simplifiedColors = props.parentColors.map(color => ({
        name: color.name,
        hex: color.hex
    }));
    jsonText.value = JSON.stringify(simplifiedColors, null, 2);
};

const deleteColor = (index) => {
    emit('deleteColor', index);
};

const addColor = (newColor) => {
    emit('addColor', newColor);
    showColorModal.value = false;
};

const updateColorsFromJson = () => {
    try {
        const updatedColors = JSON.parse(jsonText.value);
        console.log('updating colors: ', [updatedColors, jsonText.value]);

        for (const color of updatedColors) {
            if (typeof color.name !== 'string' || !color.name.trim()) {
                throw new Error('Each color must have a valid name.');
            }
            if (!/^#[0-9A-Fa-f]{6}$/.test(color.hex)) {
                throw new Error('Each color must have a valid hex value.');
            }
        }

        emit('updateColors', updatedColors);
        isJsonEditMode.value = false;
    } catch (e) {
        alert(`Invalid input: ${e.message}`);
    }
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
  