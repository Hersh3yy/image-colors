/**
 * Neural Network for Color Matching Enhancement
 * 
 * This module is OPTIONAL and only activates if TensorFlow.js is installed and enabled.
 * 
 * To enable the neural network:
 * 1. Install TensorFlow.js: npm install @tensorflow/tfjs
 * 2. Set ENABLE_NEURAL_NETWORK=true in your environment or .env file
 * 
 * The neural network learns patterns from user feedback to improve color matching.
 */

// Check if TensorFlow is installed and if neural network is enabled
const ENABLE_NEURAL_NETWORK = process.env.ENABLE_NEURAL_NETWORK === 'true';
let tf;

try {
  // Only import TensorFlow if it's installed and enabled
  if (ENABLE_NEURAL_NETWORK) {
    tf = require('@tensorflow/tfjs');
    console.log('TensorFlow.js loaded successfully for neural network');
  } else {
    console.log('Neural network is disabled. Set ENABLE_NEURAL_NETWORK=true to enable.');
  }
} catch (error) {
  console.warn('TensorFlow.js not available:', error.message);
  console.warn('To use the neural network, install TensorFlow.js with: npm install @tensorflow/tfjs');
}

import { getFeedbackEntries } from '../feedback/feedbackStorage';
import chroma from 'chroma-js';

// Constants
const MODEL_VERSION = 1;
const TRAINING_EPOCHS = 50;
const LEARNING_RATE = 0.01;

// Initialize model
let model = null;

/**
 * Check if neural network is available
 * @returns {boolean} - Whether neural network is available
 */
const isNeuralNetworkAvailable = () => {
  return ENABLE_NEURAL_NETWORK && tf != null;
};

/**
 * Creates a neural network model for color matching
 * @returns {tf.Sequential|null} - TensorFlow.js sequential model or null if not available
 */
const createModel = () => {
  if (!isNeuralNetworkAvailable()) {
    return null;
  }
  
  const model = tf.sequential();
  
  // Input shape: [L, a, b] from LAB color space
  model.add(tf.layers.dense({
    inputShape: [3],
    units: 10,
    activation: 'relu'
  }));
  
  model.add(tf.layers.dense({
    units: 16,
    activation: 'relu'
  }));
  
  model.add(tf.layers.dense({
    units: 8,
    activation: 'relu'
  }));
  
  // Output shape: [deltaL, deltaA, deltaB] - adjustments to LAB values
  model.add(tf.layers.dense({
    units: 3
  }));
  
  // Compile the model
  model.compile({
    optimizer: tf.train.adam(LEARNING_RATE),
    loss: 'meanSquaredError',
    metrics: ['mse']
  });
  
  return model;
};

/**
 * Prepares feedback data for training
 * @returns {Object|null} - Training data tensors or null if not available
 */
const prepareTrainingData = async () => {
  if (!isNeuralNetworkAvailable()) {
    return null;
  }
  
  // Get feedback entries
  const entries = await getFeedbackEntries();
  
  // Filter valid entries that have metrics
  const validEntries = entries.filter(entry => 
    entry.metrics && 
    entry.metrics.lab && 
    entry.metrics.lab.original && 
    entry.metrics.lab.diff
  );
  
  if (validEntries.length === 0) {
    console.log('No valid feedback entries for training');
    return null;
  }
  
  // Extract features (original LAB values) and labels (LAB adjustments)
  const features = validEntries.map(entry => entry.metrics.lab.original);
  const labels = validEntries.map(entry => [
    entry.metrics.lab.diff.l,
    entry.metrics.lab.diff.a,
    entry.metrics.lab.diff.b
  ]);
  
  // Convert to tensors
  const xs = tf.tensor2d(features);
  const ys = tf.tensor2d(labels);
  
  return { xs, ys, count: validEntries.length };
};

/**
 * Trains the neural network with feedback data
 * @returns {Promise<Object>} - Training history or error status
 */
export const trainModel = async () => {
  if (!isNeuralNetworkAvailable()) {
    return { 
      success: false, 
      error: 'Neural network is not enabled or TensorFlow.js is not installed',
      enableInstructions: 'To enable, install TensorFlow.js (npm install @tensorflow/tfjs) and set ENABLE_NEURAL_NETWORK=true'
    };
  }
  
  // Prepare training data
  const trainingData = await prepareTrainingData();
  
  if (!trainingData) {
    return { success: false, error: 'No training data available' };
  }
  
  const { xs, ys, count } = trainingData;
  
  // Initialize model if not already created
  if (!model) {
    model = createModel();
  }
  
  console.log(`Training neural network with ${count} feedback entries`);
  
  try {
    // Train the model
    const history = await model.fit(xs, ys, {
      epochs: TRAINING_EPOCHS,
      batchSize: Math.max(1, Math.floor(count / 4)),
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}/${TRAINING_EPOCHS} - Loss: ${logs.loss.toFixed(4)}`);
        }
      }
    });
    
    // Clean up tensors
    xs.dispose();
    ys.dispose();
    
    return {
      success: true,
      history: history.history,
      epochs: TRAINING_EPOCHS,
      modelVersion: MODEL_VERSION
    };
  } catch (error) {
    console.error('Error training model:', error);
    
    // Clean up tensors
    if (xs) xs.dispose();
    if (ys) ys.dispose();
    
    return { success: false, error: error.message };
  }
};

/**
 * Predicts color adjustments using the neural network
 * @param {Array} labColor - LAB color values [L, a, b]
 * @returns {Object} - Predicted LAB adjustments or error status
 */
export const predictAdjustment = (labColor) => {
  if (!isNeuralNetworkAvailable()) {
    return { 
      success: false, 
      error: 'Neural network is not enabled or TensorFlow.js is not installed' 
    };
  }
  
  // Initialize model if not already created
  if (!model) {
    model = createModel();
    console.warn('Model was not trained, using untrained model');
  }
  
  try {
    // Convert input to tensor
    const inputTensor = tf.tensor2d([labColor]);
    
    // Make prediction
    const predictionTensor = model.predict(inputTensor);
    
    // Convert prediction to JS array
    const prediction = predictionTensor.arraySync()[0];
    
    // Clean up tensors
    inputTensor.dispose();
    predictionTensor.dispose();
    
    return {
      success: true,
      adjustment: {
        l: prediction[0],
        a: prediction[1],
        b: prediction[2]
      }
    };
  } catch (error) {
    console.error('Error predicting adjustment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Applies neural network adjustments to a color
 * @param {string} hexColor - Original hex color
 * @returns {Object} - Adjusted color information or error status
 */
export const applyNeuralAdjustment = (hexColor) => {
  if (!isNeuralNetworkAvailable()) {
    return { 
      success: false, 
      adjusted: hexColor,
      message: 'Neural network is not enabled or TensorFlow.js is not installed' 
    };
  }
  
  try {
    // Skip if no model is trained
    if (!model) {
      return { 
        success: false, 
        adjusted: hexColor,
        message: 'No trained model available'
      };
    }
    
    // Convert hex to LAB
    const chromaColor = chroma(hexColor);
    const labColor = chromaColor.lab();
    
    // Get prediction
    const prediction = predictAdjustment(labColor);
    
    if (!prediction.success) {
      return { 
        success: false, 
        adjusted: hexColor,
        message: prediction.error
      };
    }
    
    // Apply adjustment
    const adjustedLab = [
      labColor[0] + prediction.adjustment.l,
      labColor[1] + prediction.adjustment.a,
      labColor[2] + prediction.adjustment.b
    ];
    
    // Convert back to hex
    const adjustedColor = chroma.lab(...adjustedLab).hex();
    
    return {
      success: true,
      original: hexColor,
      adjusted: adjustedColor,
      adjustment: prediction.adjustment
    };
  } catch (error) {
    console.error('Error applying neural adjustment:', error);
    return { 
      success: false, 
      adjusted: hexColor,
      message: error.message
    };
  }
}; 