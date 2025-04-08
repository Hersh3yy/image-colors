/**
 * HybridColorMatcher.js
 * 
 * A hybrid approach that combines traditional color matching algorithms with
 * machine learning to improve color matching accuracy. This class uses TensorFlow.js
 * to enhance matching results based on user feedback.
 * 
 * @author Image Colors Team
 * @version 1.0.0
 */

import * as tf from '@tensorflow/tfjs';
import chroma from 'chroma-js';

/**
 * Hybrid Color Matcher Class
 * Combines mathematical color distance calculations with machine learning to improve matches.
 */
class HybridColorMatcher {
  /**
   * [1] Constructor - Initialize the matcher with parent colors
   * @param {Array} parentColors - Array of parent colors to match against
   * @param {Object} options - Optional configuration
   */
  constructor(parentColors, options = {}) {
    // Store parent colors for matching
    this.parentColors = parentColors;
    
    // Initialize model-related properties
    this.model = null;
    this.modelTrained = false;
    
    // Configuration settings with defaults
    this.config = {
      // Threshold to decide when to use ML vs mathematical matching
      correctionThreshold: options.correctionThreshold || 0.7,
      
      // Color space to use for distance calculations
      colorSpace: options.colorSpace || 'lab',
      
      // Method to calculate color distance
      distanceMethod: options.distanceMethod || 'deltaE',
      
      // Training settings
      batchSize: options.batchSize || 16,
      validationSplit: options.validationSplit || 0.2,
      
      // Whether to log training progress
      verbose: options.verbose || false,
      
      // Debug mode - added for development
      debug: options.debug || true
    };
    
    // Initialize training data storage
    this.trainingExamples = [];
    
    // DEBUG: Log initialization
    if (this.config.debug) {
      console.log('🔍 DEBUG: HybridColorMatcher initialized with', this.parentColors.length, 'parent colors');
      console.log('🔍 DEBUG: Configuration:', JSON.stringify(this.config, null, 2));
    }
  }

  /**
   * [2] Calculate color distance between two colors in LAB space
   * This is the traditional mathematical approach to color difference.
   * 
   * @param {Object} color1 - First color with lab properties {L,a,b}
   * @param {Object} color2 - Second color with lab properties {L,a,b}
   * @returns {number} - The calculated distance
   */
  calculateLabDistance(color1, color2) {
    // Standard deltaE calculation in LAB space
    const deltaL = color1.L - color2.L;
    const deltaA = color1.a - color2.a;
    const deltaB = color1.b - color2.b;
    
    // Return Euclidean distance
    return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
  }

  /**
   * [3] Find closest color using traditional mathematical approach
   * This method uses standard color distance calculation without ML.
   * 
   * @param {Object} targetColor - The color to find matches for
   * @returns {Object} - Result with closest color, distance and index
   */
  findClosestColorMathematical(targetColor) {
    let closestColor = null;
    let minDistance = Infinity;
    let closestIndex = -1;

    // Check each parent color
    this.parentColors.forEach((parentColor, index) => {
      const distance = this.calculateLabDistance(targetColor.lab, parentColor.lab);
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = parentColor;
        closestIndex = index;
      }
    });

    // Return match details
    return {
      color: closestColor,
      distance: minDistance,
      index: closestIndex
    };
  }

  /**
   * [4] Create the neural network model for correction
   * This builds a TensorFlow.js model designed to improve color matches.
   * 
   * @returns {tf.Sequential} - The created TensorFlow model
   */
  createCorrectionModel() {
    // DEBUG: Log model creation
    if (this.config.debug) {
      console.log('🔍 DEBUG: Creating TensorFlow model');
    }
    
    // Sequential model allows us to add layers one after another
    const model = tf.sequential();
    
    // First layer - Input is combined features of target and mathematical match
    // We combine both to let the model understand when to override mathematical matches
    model.add(tf.layers.dense({
      inputShape: [18], // target (9 features) + mathematical match (9 features)
      units: 32,        // 32 neurons in the first hidden layer
      activation: 'relu' // ReLU activation for non-linearity
    }));
    
    // Second hidden layer - Further processing of features
    model.add(tf.layers.dense({
      units: 24,
      activation: 'relu'
    }));
    
    // Output layer - Probability for each parent color
    // Softmax ensures outputs sum to 1 (probability distribution)
    model.add(tf.layers.dense({
      units: this.parentColors.length,
      activation: 'softmax'
    }));
    
    // Compile the model with optimizer and loss function
    model.compile({
      optimizer: tf.train.adam(0.001), // Adam optimizer with learning rate 0.001
      loss: 'categoricalCrossentropy', // Appropriate for classification tasks
      metrics: ['accuracy'] // Track accuracy during training
    });
    
    // DEBUG: Model summary
    if (this.config.debug) {
      console.log('🔍 DEBUG: Model architecture:');
      model.summary();
    }
    
    // Store and return the model
    this.model = model;
    return model;
  }

  /**
   * [5] Prepare color features for the model
   * Converts color object to normalized array of features.
   * 
   * @param {Object} color - Color object with rgb, hsl, lab properties
   * @returns {Array} - Normalized features array
   */
  prepareFeatures(color) {
    const { r, g, b } = color.rgb;
    const { h, s, l } = color.hsl;
    const { L, a, b: labB } = color.lab;
    
    // Normalize all values to 0-1 range for better model performance
    return [
      r / 255, g / 255, b / 255,                 // RGB values
      h / 360, s / 100, l / 100,                 // HSL values 
      L / 100, (a + 128) / 255, (labB + 128) / 255  // LAB values
    ];
  }

  /**
   * [6] Train the correction model with examples
   * Uses collected training examples to train the neural network.
   * 
   * @param {Array} trainingData - Array of training examples
   * @param {number} epochs - Number of training epochs
   * @returns {Promise} - Promise resolving to training history
   */
  async trainCorrectionModel(trainingData, epochs = 100) {
    // DEBUG: Log training start
    if (this.config.debug) {
      console.log(`🔍 DEBUG: Starting model training with ${trainingData.length} examples for ${epochs} epochs`);
    }
    
    // Create model if it doesn't exist yet
    if (!this.model) {
      this.createCorrectionModel();
    }
    
    // If no training data, return early
    if (trainingData.length === 0) {
      console.warn('No training data provided, skipping training');
      return null;
    }
    
    // Prepare inputs and outputs for training
    const inputs = [];
    const outputs = [];
    
    // Process each training example
    trainingData.forEach(data => {
      // Get the target color features
      const targetFeatures = this.prepareFeatures(data.targetColor);
      
      // Find what the mathematical approach would predict
      const mathMatch = this.findClosestColorMathematical(data.targetColor);
      const mathMatchFeatures = this.prepareFeatures(this.parentColors[mathMatch.index]);
      
      // Combine features - this lets the model see both the color AND what math would predict
      const combinedFeatures = [...targetFeatures, ...mathMatchFeatures];
      inputs.push(combinedFeatures);
      
      // Create one-hot encoding for correct parent color
      const output = Array(this.parentColors.length).fill(0);
      output[data.correctParentColorIndex] = 1;
      outputs.push(output);
    });
    
    // DEBUG: Log data preparation
    if (this.config.debug) {
      console.log(`🔍 DEBUG: Prepared ${inputs.length} training inputs and ${outputs.length} outputs`);
      console.log('🔍 DEBUG: Sample input features:', inputs[0]);
      console.log('🔍 DEBUG: Sample output (one-hot):', outputs[0]);
    }
    
    // Convert to tensors for training
    const xs = tf.tensor2d(inputs);
    const ys = tf.tensor2d(outputs);
    
    // Settings for training
    const trainingConfig = {
      epochs: epochs,
      batchSize: this.config.batchSize,
      validationSplit: this.config.validationSplit,
      callbacks: {}
    };
    
    // Add logging if verbose mode is enabled
    if (this.config.verbose || this.config.debug) {
      trainingConfig.callbacks.onEpochEnd = (epoch, logs) => {
        console.log(`🧠 Training Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
      };
    }
    
    // Train the model
    try {
      const history = await this.model.fit(xs, ys, trainingConfig);
      
      // DEBUG: Log training completion
      if (this.config.debug) {
        console.log('🔍 DEBUG: Training completed successfully');
        console.log('🔍 DEBUG: Final metrics:', {
          loss: history.history.loss[history.history.loss.length - 1].toFixed(4),
          accuracy: history.history.acc[history.history.acc.length - 1].toFixed(4)
        });
      }
      
      // Clean up tensors to prevent memory leaks
      xs.dispose();
      ys.dispose();
      
      // Update model state
      this.modelTrained = true;
      
      return history;
    } catch (error) {
      console.error('📛 ERROR: Training failed:', error);
      
      // Clean up tensors even if training fails
      xs.dispose();
      ys.dispose();
      
      throw error;
    }
  }

  /**
   * [7] The main method that combines both approaches
   * This is the primary API method for finding the closest color match.
   * 
   * @param {Object} targetColor - The color to find matches for
   * @returns {Object} - Best color match with confidence score
   */
  findClosestColor(targetColor) {
    // 1. First get the mathematical match
    const mathMatch = this.findClosestColorMathematical(targetColor);
    
    // DEBUG: Log mathematical match
    if (this.config.debug) {
      console.log('🔍 DEBUG: Mathematical match:', {
        color: mathMatch.color.name,
        distance: mathMatch.distance,
        confidence: this.calculateConfidence(mathMatch.distance)
      });
    }
    
    // If model isn't trained yet, just return the mathematical result
    if (!this.modelTrained) {
      if (this.config.debug) {
        console.log('🔍 DEBUG: No trained model available, using mathematical match only');
      }
      
      return {
        color: mathMatch.color,
        index: mathMatch.index,
        confidence: this.calculateConfidence(mathMatch.distance),
        method: "mathematical"
      };
    }
    
    // 2. Run the ML correction model
    const targetFeatures = this.prepareFeatures(targetColor);
    const mathMatchFeatures = this.prepareFeatures(this.parentColors[mathMatch.index]);
    const combinedFeatures = [...targetFeatures, ...mathMatchFeatures];
    
    // Create tensor for prediction
    const input = tf.tensor2d([combinedFeatures]);
    const prediction = this.model.predict(input);
    const probabilities = prediction.dataSync();
    
    // Find the most confident ML prediction
    let maxProb = -1;
    let mlMatchIndex = -1;
    
    probabilities.forEach((prob, index) => {
      if (prob > maxProb) {
        maxProb = prob;
        mlMatchIndex = index;
      }
    });
    
    // DEBUG: Log ML match
    if (this.config.debug) {
      console.log('🔍 DEBUG: ML prediction:', {
        color: this.parentColors[mlMatchIndex].name,
        confidence: maxProb * 100,
        probabilities: Array.from(probabilities).map(p => (p * 100).toFixed(1)).slice(0, 5) + '...'
      });
    }
    
    // Clean up tensors
    input.dispose();
    prediction.dispose();
    
    // 3. Decide which result to use
    // If ML is confident enough AND suggests a different match than mathematical approach
    if (maxProb > this.config.correctionThreshold && mlMatchIndex !== mathMatch.index) {
      if (this.config.debug) {
        console.log('🔍 DEBUG: Using ML correction (confidence:', maxProb * 100, '%)');
      }
      
      return {
        color: this.parentColors[mlMatchIndex],
        index: mlMatchIndex,
        confidence: maxProb * 100, // Convert to percentage
        method: "ml_correction"
      };
    } else {
      if (this.config.debug && mlMatchIndex !== mathMatch.index) {
        console.log('🔍 DEBUG: ML suggestion ignored, confidence below threshold:', 
          maxProb * 100, '<', this.config.correctionThreshold * 100);
      }
      
      // Otherwise stick with the mathematical match
      return {
        color: mathMatch.color,
        index: mathMatch.index,
        confidence: this.calculateConfidence(mathMatch.distance),
        method: "mathematical"
      };
    }
  }

  /**
   * [8] Calculate confidence score from distance
   * Converts color distance to a confidence percentage.
   * 
   * @param {number} distance - The color distance
   * @returns {number} - Confidence percentage (0-100)
   */
  calculateConfidence(distance) {
    // Use a curve to provide better distribution of confidence values
    // We use a power curve to make small distances have higher confidence
    const adjustedDistance = Math.pow(distance, 0.85);
    
    // Convert to confidence - lower distance means higher confidence
    const threshold = 20; // Maximum distance for confidence calculation
    const score = Math.max(0, 100 - (adjustedDistance / threshold) * 100);
    
    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }

  /**
   * [9] Store a training example for later use
   * This method collects feedback when a mismatch is found.
   * 
   * @param {Object} targetColor - Original color that was mismatched
   * @param {number} correctParentColorIndex - Index of the correct parent color
   * @returns {Object} - The created training example
   */
  collectTrainingExample(targetColor, correctParentColorIndex) {
    const example = {
      targetColor: targetColor,
      correctParentColorIndex: correctParentColorIndex,
      timestamp: new Date().toISOString()
    };
    
    // DEBUG: Log collected example
    if (this.config.debug) {
      console.log('🔍 DEBUG: Collecting training example:', {
        color: JSON.stringify(targetColor.rgb),
        correctParentColor: this.parentColors[correctParentColorIndex].name,
        totalExamples: this.trainingExamples.length + 1
      });
    }
    
    // Add to training examples array
    this.trainingExamples.push(example);
    
    return example;
  }
  
  /**
   * [10] Get all collected training examples
   * Useful for saving training data for later use.
   * 
   * @returns {Array} - All collected training examples
   */
  getTrainingExamples() {
    return this.trainingExamples;
  }
  
  /**
   * [11] Load training examples from external source
   * Useful for resuming training with previously saved data.
   * 
   * @param {Array} examples - Training examples to load
   */
  loadTrainingExamples(examples) {
    this.trainingExamples = examples;
  }
  
  /**
   * [12] Save the trained model
   * Saves the model for later use without retraining.
   * 
   * @returns {Promise} - Promise that resolves when model is saved
   */
  async saveModel(path = 'localstorage://color-matcher-model') {
    if (!this.model || !this.modelTrained) {
      throw new Error('No trained model to save');
    }
    
    return await this.model.save(path);
  }
  
  /**
   * [13] Load a previously saved model
   * Loads a pre-trained model to avoid retraining.
   * 
   * @param {string} path - Path to the saved model
   * @returns {Promise} - Promise that resolves when model is loaded
   */
  async loadModel(path = 'localstorage://color-matcher-model') {
    try {
      this.model = await tf.loadLayersModel(path);
      this.modelTrained = true;
      return true;
    } catch (error) {
      console.error('Error loading model:', error);
      return false;
    }
  }
  
  /**
   * [14] Save model as JSON for server storage
   * Converts the model to a format that can be stored on the server
   * 
   * @returns {Promise<Object>} - Model data as JSON
   */
  async saveModelAsJSON() {
    if (!this.model || !this.modelTrained) {
      throw new Error('No trained model to save as JSON');
    }
    
    // Get model topology and weights
    const modelJSON = await this.model.toJSON();
    const weightsManifest = await this.model.getWeights();
    
    // Convert weights to arrays that can be serialized
    const weightData = await Promise.all(
      weightsManifest.map(async (weight) => {
        const data = await weight.data();
        return Array.from(data);
      })
    );
    
    // Return combined model data
    return {
      modelJSON,
      weightData,
      modelConfig: this.config
    };
  }
  
  /**
   * [15] Load model from JSON data from server
   * Recreates a model from stored JSON data
   * 
   * @param {Object} modelData - Model data from saveModelAsJSON
   * @returns {Promise<boolean>} - Success status
   */
  async loadModelFromJSON(modelData) {
    try {
      if (!modelData || !modelData.modelJSON || !modelData.weightData) {
        throw new Error('Invalid model data format');
      }
      
      // Recreate the model from JSON
      this.model = await tf.models.modelFromJSON(modelData.modelJSON);
      
      // Load weights
      const weightTensors = modelData.weightData.map(
        (data, i) => tf.tensor(data, modelData.modelJSON.weightsManifest[i].shape)
      );
      this.model.setWeights(weightTensors);
      
      // Update configuration if available
      if (modelData.modelConfig) {
        this.config = {
          ...this.config,
          ...modelData.modelConfig
        };
      }
      
      this.modelTrained = true;
      return true;
    } catch (error) {
      console.error('Error loading model from JSON:', error);
      return false;
    }
  }
}

// Example usage with explanations
async function demoHybridMatcher() {
  // [EXAMPLE-1] Initialize with parent colors
  // Each parent color should have rgb, hsl, and lab color space values
  const parentColors = [
    {
      name: 'Navy Blue',
      hex: '#000080',
      rgb: {r: 0, g: 0, b: 128},
      hsl: {h: 240, s: 100, l: 25.1},
      lab: {L: 12.97, a: 47.51, b: -64.7}
    },
    {
      name: 'Dark Gray',
      hex: '#444444',
      rgb: {r: 68, g: 68, b: 68},
      hsl: {h: 0, s: 0, l: 26.7},
      lab: {L: 29.14, a: 0.01, b: -0.01}
    },
    // Add more parent colors here...
  ];
  
  // [EXAMPLE-2] Create matcher with custom options
  const matcher = new HybridColorMatcher(parentColors, {
    correctionThreshold: 0.65,
    verbose: true
  });
  
  // [EXAMPLE-3] Test with initial mathematical matching
  const targetColor = {
    rgb: {r: 20, g: 40, b: 80}, // Dark navy blue
    hsl: {h: 220, s: 60, l: 20},
    lab: {L: 15, a: 5, b: -25}
  };
  
  // Find closest color using only mathematical approach
  const initialMatch = matcher.findClosestColor(targetColor);
  console.log("Initial match (mathematical only):", initialMatch);
  
  // [EXAMPLE-4] Create training examples from user feedback
  // These examples teach the system which matches are correct/incorrect
  const trainingExamples = [
    // Example 1: Navy being matched with gray (corrected to navy)
    matcher.collectTrainingExample(
      {
        rgb: {r: 20, g: 40, b: 80}, // Navy blue
        hsl: {h: 220, s: 60, l: 20},
        lab: {L: 15, a: 5, b: -25}
      },
      0  // Index of Navy Blue in our parent colors
    ),
    
    // Add more examples, especially for problematic cases
    // Tip: Focus on collecting examples where mathematical approach fails
  ];
  
  // [EXAMPLE-5] Train the model with collected examples
  // This is where the machine learning happens
  await matcher.trainCorrectionModel(matcher.getTrainingExamples(), 50);
  
  // [EXAMPLE-6] Test the hybrid approach after training
  // Now the system can override mathematical matches when necessary
  const improvedMatch = matcher.findClosestColor(targetColor);
  console.log("Improved match (hybrid approach):", improvedMatch);
  
  // [EXAMPLE-7] Save model for future use
  // This avoids having to retrain each time
  await matcher.saveModel();
}

export default HybridColorMatcher; 