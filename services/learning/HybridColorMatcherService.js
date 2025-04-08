/**
 * HybridColorMatcherService.js
 * 
 * Service to manage the hybrid color matcher with persistence
 * Handles model training, saving/loading, and integration with the feedback system
 */

import HybridColorMatcher from './HybridColorMatcher';
import axios from 'axios';

class HybridColorMatcherService {
  /**
   * Initialize the service with parent colors
   * @param {Array} parentColors - Array of parent colors to match against
   */
  constructor(parentColors) {
    this.parentColors = parentColors;
    this.matcher = new HybridColorMatcher(parentColors);
    this.isInitialized = false;
    this.lastTrainedDate = null;
    this.pendingExamples = [];
    this.minExamplesForTraining = 5; // Minimum examples before training
  }
  
  /**
   * Initialize by loading the model from server
   * @returns {Promise} - Promise that resolves when initialized
   */
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Attempt to load model from server
      const response = await axios.get('/.netlify/functions/learning/getModel');
      
      if (response.data.success && response.data.modelData) {
        // Load the model 
        await this.matcher.loadModelFromJSON(response.data.modelData);
        
        // Load training examples
        if (response.data.trainingExamples && response.data.trainingExamples.length) {
          this.matcher.loadTrainingExamples(response.data.trainingExamples);
        }
        
        this.lastTrainedDate = response.data.lastTrainedDate || new Date().toISOString();
        this.isInitialized = true;
        console.log('Loaded color matcher model from server');
      } else {
        console.log('No saved model found, starting with mathematical matching only');
        this.isInitialized = true; // Still initialized, just without ML model
      }
    } catch (error) {
      console.warn('Error loading model, defaulting to mathematical matching:', error);
      this.isInitialized = true; // Still mark as initialized to avoid repeated attempts
    }
  }
  
  /**
   * Save the model to the server
   * @returns {Promise} - Promise that resolves when saved
   */
  async saveModelToServer() {
    if (!this.matcher.modelTrained) {
      console.warn('No trained model to save');
      return;
    }
    
    try {
      // Get model as JSON
      const modelData = await this.matcher.saveModelAsJSON();
      
      // Get all training examples
      const trainingExamples = this.matcher.getTrainingExamples();
      
      // Current date for tracking when last trained
      const now = new Date().toISOString();
      
      // Send to server
      await axios.post('/.netlify/functions/learning/saveModel', {
        modelData,
        trainingExamples,
        lastTrainedDate: now
      });
      
      this.lastTrainedDate = now;
      console.log('Model saved to server successfully');
      
      return true;
    } catch (error) {
      console.error('Failed to save model to server:', error);
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
      console.error('Invalid training example:', example);
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
  
  /**
   * Check if we should retrain based on pending examples
   * @returns {boolean} - Whether we should retrain
   */
  shouldRetrain() {
    return this.pendingExamples.length >= this.minExamplesForTraining;
  }
  
  /**
   * Train the model with all examples
   * @returns {Promise} - Promise that resolves when training completes
   */
  async trainModel() {
    if (this.pendingExamples.length === 0) {
      console.log('No pending examples to train with');
      return false;
    }
    
    try {
      console.log(`Training model with ${this.pendingExamples.length} examples...`);
      
      // Train with all examples (not just pending ones)
      const trainingExamples = this.matcher.getTrainingExamples();
      const trainingResult = await this.matcher.trainCorrectionModel(trainingExamples);
      
      // Clear pending examples since they're now incorporated
      this.pendingExamples = [];
      this.lastTrainedDate = new Date().toISOString();
      
      console.log('Model training complete');
      return trainingResult;
    } catch (error) {
      console.error('Error training model:', error);
      return false;
    }
  }
  
  /**
   * Find closest color using the hybrid matcher
   * @param {string} hexColor - Hex color to match
   * @returns {Object} - Match result
   */
  findClosestColor(hexColor) {
    if (!this.isInitialized) {
      throw new Error('Service not initialized yet');
    }
    
    // Prepare the color object with all required properties
    const color = this.prepareColorFromHex(hexColor);
    
    // Use the matcher
    return this.matcher.findClosestColor(color);
  }
  
  /**
   * Get model statistics
   * @returns {Object} - Stats about the model
   */
  getModelStats() {
    return {
      isModelTrained: this.matcher.modelTrained,
      trainingExamplesCount: this.matcher.getTrainingExamples().length,
      pendingExamplesCount: this.pendingExamples.length,
      lastTrainedDate: this.lastTrainedDate
    };
  }
  
  /**
   * Prepare a complete color object from hex
   * @param {string} hexColor - Hex color to prepare
   * @returns {Object} - Color with rgb, hsl, lab properties
   */
  prepareColorFromHex(hexColor) {
    try {
      // Create a chroma color
      const chromaColor = chroma(hexColor);
      
      // Get values in different color spaces
      const [r, g, b] = chromaColor.rgb();
      const [h, s, l] = chromaColor.hsl();
      const [L, a, labB] = chromaColor.lab();
      
      // Return structured color object
      return {
        rgb: { r, g, b },
        hsl: { h: isNaN(h) ? 0 : h, s: isNaN(s) ? 0 : s, l: isNaN(l) ? 0 : l },
        lab: { L, a, b: labB }
      };
    } catch (error) {
      console.error('Error preparing color from hex:', error);
      // Return a default gray if parsing fails
      return {
        rgb: { r: 128, g: 128, b: 128 },
        hsl: { h: 0, s: 0, l: 0.5 },
        lab: { L: 50, a: 0, b: 0 }
      };
    }
  }
}

export default HybridColorMatcherService; 