<!--
  TrainModal.vue - Training Data Management Component
  
  This component allows users to:
  - Upload color data in CSV format
  - View training statistics
  - Manually trigger model training
  - Export current training data
-->

<template>
  <div v-if="isVisible" class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black opacity-50" @click="close"></div>
    
    <!-- Modal content -->
    <div class="relative bg-gray-800 text-white rounded-lg shadow-xl w-full max-w-2xl p-6 m-4 overflow-auto max-h-[90vh]">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">Training Management</h2>
        <button 
          @click="close" 
          class="text-gray-400 hover:text-white transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <!-- Training Stats Section -->
      <div class="mb-8 bg-gray-700 p-4 rounded-lg">
        <h3 class="text-xl font-medium mb-3">Training Statistics</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-gray-800 p-3 rounded text-center">
            <p class="text-xs text-gray-400">Total Examples</p>
            <p class="text-2xl font-semibold">{{ trainingStats.totalExamples || 0 }}</p>
          </div>
          <div class="bg-gray-800 p-3 rounded text-center">
            <p class="text-xs text-gray-400">Examples This Week</p>
            <p class="text-2xl font-semibold">{{ trainingStats.examplesThisWeek || 0 }}</p>
          </div>
          <div class="bg-gray-800 p-3 rounded text-center">
            <p class="text-xs text-gray-400">Accuracy</p>
            <p class="text-2xl font-semibold">{{ (trainingStats.accuracy || 0).toFixed(1) }}%</p>
          </div>
          <div class="bg-gray-800 p-3 rounded text-center">
            <p class="text-xs text-gray-400">Last Trained</p>
            <p class="text-sm font-semibold">{{ formatDate(trainingStats.lastTrained) }}</p>
          </div>
        </div>
      </div>
      
      <!-- Upload Section -->
      <div class="mb-8">
        <h3 class="text-xl font-medium mb-3">Upload Training Data</h3>
        <p class="text-sm text-gray-300 mb-4">Upload a CSV file with color data to train the model. The CSV should include hex colors and their corresponding parent colors.</p>
        
        <div class="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
          <input 
            type="file" 
            ref="fileInput" 
            @change="handleFileSelect" 
            accept=".csv"
            class="hidden"
          />
          
          <div v-if="!uploadedFile">
            <svg class="w-12 h-12 mx-auto text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            <p class="mb-2">Drag and drop your CSV file here or</p>
            <button 
              @click="$refs.fileInput.click()" 
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Select File
            </button>
          </div>
          
          <div v-else class="text-left">
            <div class="flex items-center mb-2">
              <svg class="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span class="font-medium">{{ uploadedFile.name }}</span>
            </div>
            <p class="text-sm text-gray-400 mb-2">{{ formatFileSize(uploadedFile.size) }} | {{ fileStats.rows || 0 }} rows</p>
            
            <div v-if="fileValidationError" class="text-red-400 text-sm mb-2">
              {{ fileValidationError }}
            </div>
            
            <div class="flex space-x-3">
              <button 
                @click="uploadFile" 
                class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                :disabled="fileValidationError || isUploading"
              >
                <span v-if="isUploading">
                  <span class="animate-pulse">Uploading...</span>
                </span>
                <span v-else>Upload</span>
              </button>
              <button 
                @click="resetUpload" 
                class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Actions Section -->
      <div class="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-gray-700 p-4 rounded-lg">
          <h3 class="font-medium mb-2">Manual Training</h3>
          <p class="text-sm text-gray-300 mb-3">Force the model to retrain with current data.</p>
          <button 
            @click="trainModel" 
            class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            :disabled="isTraining"
          >
            <span v-if="isTraining">
              <span class="animate-pulse">Training...</span>
            </span>
            <span v-else>Train Model</span>
          </button>
        </div>
        
        <div class="bg-gray-700 p-4 rounded-lg">
          <h3 class="font-medium mb-2">Export Data</h3>
          <p class="text-sm text-gray-300 mb-3">Download current training data as CSV.</p>
          <button 
            @click="exportData" 
            class="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            Export Training Data
          </button>
        </div>
      </div>
      
      <!-- Status Section -->
      <div v-if="statusMessage" class="p-3 rounded-lg" :class="statusType === 'success' ? 'bg-green-800' : 'bg-red-800'">
        <p class="text-sm">{{ statusMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useColorMatcherService } from '@/composables/useColorMatcherService';

const props = defineProps({
  isVisible: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['close']);

// Services
const colorMatcherService = useColorMatcherService();

// Refs
const fileInput = ref(null);
const uploadedFile = ref(null);
const fileStats = ref({ rows: 0 });
const fileValidationError = ref('');
const isUploading = ref(false);
const isTraining = ref(false);
const statusMessage = ref('');
const statusType = ref('success');
const trainingStats = ref({
  totalExamples: 0,
  examplesThisWeek: 0,
  accuracy: 0,
  lastTrained: null
});

// Methods
const close = () => {
  emit('close');
};

const handleFileSelect = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  
  // Reset error state
  fileValidationError.value = '';
  
  // Validate file type
  if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
    fileValidationError.value = 'Please upload a CSV file';
    return;
  }
  
  // Store file
  uploadedFile.value = file;
  
  // Parse CSV to get stats
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const csvContent = e.target.result;
      const lines = csvContent.split('\n').filter(line => line.trim());
      fileStats.value.rows = lines.length - 1; // Subtract header
      
      // Validate structure (very basic)
      const header = lines[0].toLowerCase();
      if (!header.includes('color') || !header.includes('parent')) {
        fileValidationError.value = 'CSV must have color and parent columns';
      }
    } catch (error) {
      fileValidationError.value = 'Error parsing CSV file';
      console.error('CSV parsing error:', error);
    }
  };
  reader.readAsText(file);
};

const resetUpload = () => {
  uploadedFile.value = null;
  fileStats.value = { rows: 0 };
  fileValidationError.value = '';
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const uploadFile = async () => {
  if (!uploadedFile.value || fileValidationError.value) return;
  
  isUploading.value = true;
  statusMessage.value = '';
  
  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', uploadedFile.value);
    
    // Upload file
    const response = await fetch('/.netlify/functions/training/upload', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      statusMessage.value = `Successfully uploaded ${result.rowsProcessed} training examples!`;
      statusType.value = 'success';
      resetUpload();
      
      // Update stats
      await fetchTrainingStats();
    } else {
      throw new Error(result.error || 'Failed to upload file');
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    statusMessage.value = `Error: ${error.message || 'Failed to upload file'}`;
    statusType.value = 'error';
  } finally {
    isUploading.value = false;
  }
};

const trainModel = async () => {
  isTraining.value = true;
  statusMessage.value = '';
  
  try {
    // Trigger model training
    await colorMatcherService.trainModel();
    
    // Save the model
    await colorMatcherService.saveModelToServer();
    
    // Update stats
    await fetchTrainingStats();
    
    statusMessage.value = 'Model trained successfully!';
    statusType.value = 'success';
  } catch (error) {
    console.error('Error training model:', error);
    statusMessage.value = `Error: ${error.message || 'Failed to train model'}`;
    statusType.value = 'error';
  } finally {
    isTraining.value = false;
  }
};

const exportData = async () => {
  try {
    // Fetch training data
    const response = await fetch('/.netlify/functions/training/export');
    const blob = await response.blob();
    
    // Create and click download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `color-training-data-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error exporting data:', error);
    statusMessage.value = `Error: ${error.message || 'Failed to export data'}`;
    statusType.value = 'error';
  }
};

const fetchTrainingStats = async () => {
  try {
    const response = await fetch('/.netlify/functions/training/stats');
    const result = await response.json();
    
    if (result.success) {
      trainingStats.value = result.stats;
    } else {
      throw new Error(result.error || 'Failed to fetch training stats');
    }
  } catch (error) {
    console.error('Error fetching training stats:', error);
  }
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (timestamp) => {
  if (!timestamp) return 'Never';
  
  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch (e) {
    return 'Invalid date';
  }
};

// Initialize
onMounted(() => {
  if (props.isVisible) {
    fetchTrainingStats();
  }
});
</script> 