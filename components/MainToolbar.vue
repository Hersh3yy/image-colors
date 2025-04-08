<!-- 
  MainToolbar.vue - The main application toolbar
  
  This component displays the main application toolbar with:
  - Application title
  - About button
  - Knowledge Base button
  - Play Mode button
  - TensorFlow Train button
-->

<template>
  <div class="fixed top-0 left-0 right-0 bg-gray-800 shadow-md p-2 text-white z-10 flex justify-between items-center">
    <div class="flex items-center">
      <h1 class="text-lg font-semibold">Color Analyzer</h1>
      <button 
        class="ml-2 text-gray-400 hover:text-white"
        title="About this tool"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
    <div class="flex items-center space-x-3">
      <button 
        @click="$emit('viewKnowledgeBase')" 
        class="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span>Knowledge Base</span>
      </button>
      <button 
        @click="$emit('showPlayModal')" 
        class="flex items-center space-x-1 px-3 py-1 bg-blue-700 text-white text-sm rounded hover:bg-blue-800"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Play Mode</span>
      </button>
      <button 
        @click="$emit('showTrainModal')" 
        class="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span>TensorFlow Train</span>
      </button>
    </div>
  </div>
</template>

<script setup>
defineEmits(['viewKnowledgeBase', 'showPlayModal', 'showTrainModal']);
</script> 