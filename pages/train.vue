<!--
  train.vue - TensorFlow Training and Testing Page
  
  This page provides a comprehensive interface for:
  1. Training the TensorFlow model with user feedback
  2. Testing color matches and visualizing results
  3. Debugging model performance and issues
-->

<template>
  <div class="container mx-auto py-6 px-4">
    <h1 class="text-3xl font-bold mb-6">TensorFlow Color Matcher Training</h1>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column: Debug Panel -->
      <div class="lg:col-span-1">
        <DebugPanel @open-test-panel="showPlayModal = true" />
      </div>
      
      <!-- Right Column: Instructions and Stats -->
      <div class="lg:col-span-2">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 class="text-2xl font-bold mb-4">How It Works</h2>
          
          <div class="prose dark:prose-invert max-w-none">
            <p>This page allows you to train and test the TensorFlow.js color matching model. The model learns from your feedback to improve color matching over time.</p>
            
            <h3>The Training Process:</h3>
            <ol>
              <li>Collect training examples through the "Play Mode" feature</li>
              <li>The system trains the model when enough examples are collected</li>
              <li>The model learns patterns from your feedback</li>
              <li>Matching accuracy improves over time</li>
            </ol>
            
            <h3>Data Being Collected:</h3>
            <p>Each training example includes:</p>
            <ul>
              <li>Target color (RGB, HSL, LAB values)</li>
              <li>Mathematical best match</li>
              <li>User-selected correct match</li>
            </ul>
            
            <h3>Model Architecture:</h3>
            <p>The TensorFlow model uses a neural network with:</p>
            <ul>
              <li>Input: 18 features (9 from target color, 9 from mathematical match)</li>
              <li>Hidden layers: 32 and 24 neurons with ReLU activation</li>
              <li>Output: Probabilities for each parent color</li>
            </ul>
          </div>
          
          <div class="mt-6">
            <button 
              @click="showPlayModal = true"
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Open Play Mode
            </button>
          </div>
        </div>
        
        <!-- Training Progress -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 class="text-2xl font-bold mb-4">Training Visualizations</h2>
          <p class="mb-4">Coming soon: Interactive visualizations of model performance and training progress.</p>
          
          <!-- Placeholder for future visualizations -->
          <div class="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <p class="text-gray-500 dark:text-gray-400">Model performance data will be visualized here</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Play Modal -->
    <PlayModal 
      :isVisible="showPlayModal" 
      :parentColors="parentColors"
      @close="showPlayModal = false"
      @feedback-submitted="handleFeedbackSubmitted"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import DebugPanel from '@/components/feedback/DebugPanel.vue';
import PlayModal from '@/components/feedback/PlayModal.vue';
import { useColorMatcherService } from '@/composables/useColorMatcherService';
import { parentColors } from '@/data/colors'; // Assuming this is where your colors are defined

// Component state
const showPlayModal = ref(false);
const colorMatcherService = useColorMatcherService();

// Methods
async function handleFeedbackSubmitted(feedback) {
  console.log('📝 Feedback received:', feedback);
  
  // Check if we should train
  if (colorMatcherService.shouldRetrain()) {
    console.log('🧠 Training threshold reached, will train model automatically');
  }
}

// Initialize on mount
onMounted(async () => {
  console.log('🔄 Initializing TensorFlow training page...');
  
  // Make sure the service is initialized
  await colorMatcherService.initialize();
});
</script> 