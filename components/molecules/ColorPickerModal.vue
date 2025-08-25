<template>
  <div v-if="visible" class="color-picker-modal">
    <form @submit.prevent="$emit('add', { name: newColorName, hex: newColorHex })">
      <input 
        type="text" 
        v-model="newColorName" 
        placeholder="Color Name" 
        required 
        class="w-full px-3 py-2 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input 
        type="color" 
        v-model="newColorHex" 
        required 
        class="w-full h-10 border border-gray-300 rounded mb-4"
      />
      <div class="flex gap-2">
        <AtomsBaseButton 
          type="submit"
          variant="primary"
          text="Add Color"
          fullWidth
        />
        <AtomsBaseButton 
          type="button"
          @click="$emit('close')"
          variant="secondary"
          text="Close"
          fullWidth
        />
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['add', 'close']);

const newColorName = ref('');
const newColorHex = ref('#000000');

// Reset form when modal opens
watch(() => props.visible, (visible) => {
  if (visible) {
    newColorName.value = '';
    newColorHex.value = '#000000';
  }
});
</script>

<style scoped>
.color-picker-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  min-width: 300px;
}
</style>
