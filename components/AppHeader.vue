<template>
  <div>
    <!-- Notification Banner -->
    <div v-if="notification.message" :class="[
      'transition-all duration-300 px-4 py-3 shadow-sm',
      notification.type === 'error'
        ? 'bg-red-50 text-red-700'
        : 'bg-green-50 text-green-700',
    ]">
      <div class="container mx-auto flex justify-between items-center">
        <p>{{ notification.message }}</p>
        <button @click="clearNotification" class="ml-4">×</button>
      </div>
    </div>

    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-40">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center gap-2">
          <h1 class="text-2xl font-bold text-gray-900">Color Analyzer</h1>
          <InfoTooltip />
        </div>
      </div>
    </header>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const notification = ref({ message: "", type: "success" });

const showNotification = (message, type = "success") => {
  notification.value = { message, type };
  setTimeout(clearNotification, 5000);
};

const clearNotification = () => {
  notification.value = { message: "", type: "success" };
};

// Expose methods for parent component
defineExpose({
  showNotification
});
</script> 