<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-xl font-bold mb-4">Knowledge Base Management</h2>
    
    <div class="mb-6">
      <p class="text-gray-700 mb-2">
        The knowledge base automatically learns from user feedback to improve color matching accuracy.
        It processes feedback data to identify patterns and train neural networks.
      </p>
      
      <!-- Knowledge Base Stats -->
      <div class="bg-gray-50 rounded-lg p-4 mb-4">
        <h3 class="font-medium text-gray-800 mb-2">Current Status</h3>
        <div v-if="isLoading" class="flex items-center justify-center py-4">
          <div class="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span class="ml-2 text-gray-600">Loading knowledge base data...</span>
        </div>
        <div v-else-if="error" class="bg-red-50 text-red-700 p-3 rounded">
          {{ error }}
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white p-3 rounded shadow-sm">
            <p class="text-sm text-gray-500">Last Updated</p>
            <p class="font-medium">{{ formatDate(knowledgeBase.lastUpdated) || 'Never' }}</p>
          </div>
          <div class="bg-white p-3 rounded shadow-sm">
            <p class="text-sm text-gray-500">Total Patterns</p>
            <p class="font-medium">{{ knowledgeBase.patterns?.length || 0 }}</p>
          </div>
          <div class="bg-white p-3 rounded shadow-sm">
            <p class="text-sm text-gray-500">Version</p>
            <p class="font-medium">{{ knowledgeBase.version || 1 }}</p>
          </div>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="font-medium text-gray-800 mb-3">Actions</h3>
        <div class="space-y-4">
          <!-- Process Feedback -->
          <div>
            <button 
              @click="processFeedback" 
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center"
              :disabled="isProcessing"
            >
              <span v-if="isProcessing" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
              {{ isProcessing ? 'Processing...' : 'Process Feedback & Update Knowledge Base' }}
            </button>
            <p class="text-sm text-gray-500 mt-1">
              Manually trigger the processing of feedback data to update the knowledge base.
              This happens automatically on a daily schedule.
            </p>
          </div>
          
          <!-- Result Message -->
          <div v-if="resultMessage" :class="resultClass" class="p-3 rounded">
            {{ resultMessage }}
          </div>
          
          <!-- Processed Feedback Count -->
          <div v-if="feedbackCount !== null" class="bg-blue-50 p-3 rounded text-blue-800">
            <p>Feedback entries available for processing: <span class="font-medium">{{ feedbackCount }}</span></p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Pattern Visualization (if patterns exist) -->
    <div v-if="knowledgeBase.patterns && knowledgeBase.patterns.length > 0" class="mt-6">
      <h3 class="font-medium text-gray-800 mb-3">Recognized Color Patterns</h3>
      <div class="bg-gray-50 p-4 rounded-lg overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Correction</th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sample Size</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(pattern, index) in knowledgeBase.patterns" :key="index" class="hover:bg-gray-50">
              <td class="px-3 py-2 text-sm">{{ pattern.type }}</td>
              <td class="px-3 py-2 text-sm">
                <div v-if="pattern.type === 'hue'">
                  Hue range: {{ pattern.condition.hueRange.join(' - ') }}°
                </div>
                <div v-else-if="pattern.type === 'saturation'">
                  Saturation range: {{ pattern.condition.saturationRange.join(' - ') }}
                </div>
                <div v-else-if="pattern.type === 'lightness'">
                  Lightness range: {{ pattern.condition.lightnessRange.join(' - ') }}
                </div>
                <div v-else>{{ JSON.stringify(pattern.condition) }}</div>
              </td>
              <td class="px-3 py-2 text-sm">
                <div>L: {{ pattern.correction.lab.l.toFixed(2) }}</div>
                <div>a: {{ pattern.correction.lab.a.toFixed(2) }}</div>
                <div>b: {{ pattern.correction.lab.b.toFixed(2) }}</div>
              </td>
              <td class="px-3 py-2">
                <div class="flex items-center gap-2">
                  <div class="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full bg-blue-500"
                      :style="{ width: `${pattern.confidence}%` }"
                    ></div>
                  </div>
                  <span class="text-xs">{{ pattern.confidence.toFixed(1) }}%</span>
                </div>
              </td>
              <td class="px-3 py-2 text-sm">{{ pattern.sampleSize }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// State
const knowledgeBase = ref({});
const isLoading = ref(true);
const isProcessing = ref(false);
const error = ref(null);
const resultMessage = ref('');
const resultClass = ref('');
const feedbackCount = ref(null);

// Fetch knowledge base data on component mount
onMounted(async () => {
  await fetchKnowledgeBase();
  await getFeedbackCount();
});

/**
 * Format date for display
 */
const formatDate = (dateString) => {
  if (!dateString) return 'Never';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch (e) {
    return dateString;
  }
};

/**
 * Fetch knowledge base data
 */
const fetchKnowledgeBase = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    const response = await fetch('/.netlify/functions/get-knowledge-base');
    
    if (!response.ok) {
      throw new Error('Failed to fetch knowledge base data');
    }
    
    const data = await response.json();
    
    if (data.success) {
      knowledgeBase.value = data.knowledgeBase || {};
    } else {
      throw new Error(data.error || 'Unknown error');
    }
  } catch (e) {
    error.value = `Error loading knowledge base: ${e.message}`;
    console.error('Error fetching knowledge base:', e);
  } finally {
    isLoading.value = false;
  }
};

/**
 * Get count of available feedback entries
 */
const getFeedbackCount = async () => {
  try {
    const response = await fetch('/.netlify/functions/get-feedback-count');
    
    if (!response.ok) {
      return;
    }
    
    const data = await response.json();
    
    if (data.success) {
      feedbackCount.value = data.count;
    }
  } catch (e) {
    console.error('Error fetching feedback count:', e);
  }
};

/**
 * Process feedback and update knowledge base
 */
const processFeedback = async () => {
  try {
    isProcessing.value = true;
    resultMessage.value = '';
    
    const response = await fetch('/.netlify/functions/process-feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ trigger: 'manual' })
    });
    
    const data = await response.json();
    
    if (data.success) {
      resultMessage.value = `Success! Processed ${data.processed} feedback entries and found ${data.patternsFound} patterns.`;
      resultClass.value = 'bg-green-100 text-green-800';
      
      // Refresh knowledge base data
      await fetchKnowledgeBase();
      await getFeedbackCount();
    } else {
      throw new Error(data.error || 'Failed to process feedback');
    }
  } catch (e) {
    resultMessage.value = `Error: ${e.message}`;
    resultClass.value = 'bg-red-100 text-red-800';
    console.error('Error processing feedback:', e);
  } finally {
    isProcessing.value = false;
  }
};
</script> 