<template>
  <div class="flex gap-2">
    <AtomsBaseButton 
      v-for="mode in modes" 
      :key="mode.value"
      @click="$emit('update:modelValue', mode.value)" 
      :variant="modelValue === mode.value ? 'primary' : 'ghost'"
      size="sm"
      :text="mode.label"
    />
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    required: true
  },
  modes: {
    type: Array,
    default: () => [
      { value: 'grid', label: 'Grid' },
      { value: 'list', label: 'List' }
    ]
  }
});

defineEmits(['update:modelValue']);
</script>
