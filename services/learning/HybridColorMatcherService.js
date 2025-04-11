/**
 * HybridColorMatcherService.js
 * 
 * Service to manage the hybrid color matcher with persistence
 * Handles model training, saving/loading, and integration with the feedback system
 */

import HybridColorMatcher from './HybridColorMatcher';
import axios from 'axios';

// Define a constant for the API base - ensure it's always a full URL in development
const API_BASE = typeof window !== 'undefined' ? 
  window.location.origin + '/api' : 
  '/api';

class HybridColorMatcherService {
  /**
   * Initialize the service with parent colors
   * @param {Array} parentColors - Array of parent colors to match against
   */
  constructor(parentColors) {
    this.parentColors = parentColors;
    this.matcher = new HybridColorMatcher(parentColors, { 
      debug: true,      // Enable debug mode for development
      verbose: true     // Log training progress
    });
    this.isInitialized = false;
    this.lastTrainedDate = null;
    this.pendingExamples = [];
    this.minExamplesForTraining = 1; // Minimum examples before training
    
    // New properties for status tracking
    this.isTraining = false;
    this.lastError = null;
    this.trainingStats = {
      totalTrainingRuns: 0,
      lastTrainingDuration: 0,
      totalExamplesTrained: 0
    };
    
    console.log('🔄 HybridColorMatcherService initialized with', parentColors.length, 'parent colors');
    
    // Add API base URL to the service - ensure it works in all environments
    this.apiBase = API_BASE;
    
    console.log('🔄 API Base URL:', this.apiBase);
  }
  
  // Add a method to set the API base
  setApiBase(base) {
    if (base) {
      // Make sure base is a full URL if we're in browser
      if (typeof window !== 'undefined') {
        // Add leading slash if missing
        if (!base.startsWith('http') && !base.startsWith('/')) {
          base = '/' + base;
        }
        
        // If it's just a path without origin in browser, add origin
        if (base.startsWith('/')) {
          base = window.location.origin + base;
        }
      }
      
      this.apiBase = base;
      console.log('Updated API base path:', this.apiBase);
    }
  }
  
  /**
   * Initialize by loading the model from server
   * @returns {Promise} - Promise that resolves when initialized
   */
  async initialize() {
    if (this.isInitialized) return;
    
    console.log('Initializing HybridColorMatcherService...');
    this.isLoading = true;
    
    try {
      console.log('🔄 Attempting to load model from server...');
      
      // Attempt to load model from server - use this.apiBase
      const response = await axios.get(`${this.apiBase}/learning/getModel`);
      
      if (response.data.success && response.data.modelData) {
        console.log('✅ Found existing model on server, loading...');
        
        // Load the model 
        await this.matcher.loadModelFromJSON(response.data.modelData);
        
        // Load training examples
        if (response.data.trainingExamples && response.data.trainingExamples.length) {
          this.matcher.loadTrainingExamples(response.data.trainingExamples);
          console.log(`📚 Loaded ${response.data.trainingExamples.length} training examples`);
        }
        
        this.lastTrainedDate = response.data.lastTrainedDate || new Date().toISOString();
        this.isInitialized = true;
        console.log('✅ Successfully loaded color matcher model from server');
      } else {
        console.log('ℹ️ No saved model found, starting with mathematical matching only');
        this.isInitialized = true; // Still initialized, just without ML model
      }
    } catch (error) {
      console.warn('⚠️ Error loading model, defaulting to mathematical matching:', error);
      this.lastError = {
        message: 'Error loading model',
        error: error.toString(),
        time: new Date().toISOString()
      };
      this.isInitialized = true; // Still mark as initialized to avoid repeated attempts
    }
  }
  
  /**
   * Save the model to the server
   * @returns {Promise} - Promise that resolves when saved
   */
  async saveModelToServer() {
    if (!this.matcher.modelTrained) {
      console.warn('⚠️ No trained model to save');
      return;
    }
    
    try {
      console.log('🔄 Saving model to server...');
      
      // Serialize the model for storage - properly await it
      const modelData = await this.matcher.saveModelAsJSON();
      
      // Create JSON-serializable training examples
      const trainingExamples = this.matcher.getTrainingExamples();
      
      // Send to server - use this.apiBase
      const response = await axios.post(`${this.apiBase}/learning/saveModel`, {
        modelData,
        trainingExamples,
        lastTrainedDate: new Date().toISOString()
      });
      
      if (response.data.success) {
        this.lastTrainedDate = new Date().toISOString();
        console.log('✅ Model saved to server successfully');
        return true;
      } else {
        throw new Error(response.data.error || 'Unknown error saving model');
      }
    } catch (error) {
      console.error('❌ Failed to save model to server:', error);
      this.lastError = {
        message: 'Error saving model',
        error: error.toString(),
        time: new Date().toISOString()
      };
      return false;
    }
  }
  
  /**
   * Add a training example to the pending queue
   * @param {Object} example - Training example to add
   */
  addTrainingExample(example) {
    // Validate example
    if (!example.targetColor || typeof example.correctParentColorIndex !== 'number') {
      console.error('❌ Invalid training example:', example);
      return;
    }
    
    // Add to pending examples
    this.pendingExamples.push({
      ...example,
      timestamp: new Date().toISOString()
    });
    
    // Add to matcher's examples
    this.matcher.collectTrainingExample(
      example.targetColor,
      example.correctParentColorIndex
    );
    
    console.log(`Added training example, now have ${this.pendingExamples.length} pending examples`);
  }
}

export default HybridColorMatcherService;