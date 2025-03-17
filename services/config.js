/**
 * Configuration for Color Matching Enhancement System
 * 
 * This file centralizes all configuration options for the system.
 * Edit these values to customize the behavior of the system.
 */

// Feature flags
export const FEATURES = {
  // Neural Network requires TensorFlow.js to be installed
  // npm install @tensorflow/tfjs
  enableNeuralNetwork: process.env.ENABLE_NEURAL_NETWORK === 'true' || false,
  
  // Genetic Algorithm for optimizing matching parameters
  enableGeneticAlgorithm: true,
  
  // Pattern Recognition for learning from similar colors
  enablePatternRecognition: true,
  
  // Enhanced UI with detailed color information
  enableEnhancedUI: true
};

// Storage configuration
export const STORAGE = {
  // Storage mode: 'file' or 'cms'
  mode: process.env.FEEDBACK_STORAGE_MODE || 'file',
  
  // File paths (only used in 'file' mode)
  filePaths: {
    feedback: 'data/feedback.json',
    knowledge: 'data/knowledge.json'
  },
  
  // CMS configuration (only used in 'cms' mode)
  cms: {
    apiKey: process.env.CMS_API_KEY,
    endpoint: process.env.CMS_ENDPOINT,
    feedbackEntityType: process.env.CMS_FEEDBACK_ENTITY || 'colorFeedback',
    knowledgeEntityType: process.env.CMS_KNOWLEDGE_ENTITY || 'colorKnowledgeBase'
  }
};

// Neural Network configuration
export const NEURAL_NETWORK = {
  // Training parameters
  trainingEpochs: 50,
  learningRate: 0.01,
  
  // Model architecture
  hiddenLayers: [10, 16, 8],
  
  // Version
  modelVersion: 1
};

// Genetic Algorithm configuration
export const GENETIC_ALGORITHM = {
  // Population parameters
  populationSize: 20,
  generations: 10,
  
  // Genetic operators
  mutationRate: 0.1,
  elitismCount: 2,
  
  // Parameter ranges
  parameterRanges: {
    deltaEWeight: { min: 0.1, max: 0.9 },
    labWeight: { min: 0.1, max: 0.9 },
    hueWeight: { min: 0.1, max: 3.0 },
    saturationWeight: { min: 0.1, max: 3.0 },
    lightnessWeight: { min: 0.1, max: 3.0 }
  },
  
  // Default parameters
  defaultParameters: {
    deltaEWeight: 0.7,
    labWeight: 0.3,
    hueWeight: 1.0,
    saturationWeight: 1.0,
    lightnessWeight: 1.0
  }
};

// Pattern Recognition configuration
export const PATTERN_RECOGNITION = {
  // Minimum entries to form a pattern
  minEntriesForPattern: 3,
  
  // Confidence threshold for applying patterns
  confidenceThreshold: 50,
  
  // Pattern types to generate
  patternTypes: ['hue', 'saturation', 'lightness'],
  
  // Range definitions
  ranges: {
    hue: 30, // 30 degrees per range
    saturation: 0.2, // 0.2 per range (0-1)
    lightness: 0.2 // 0.2 per range (0-1)
  }
};

// General matching configuration
export const MATCHING = {
  // Default distance method
  defaultDistanceMethod: 'deltaE',
  
  // Distance methods available
  distanceMethods: ['deltaE', 'euclidean', 'manhattan'],
  
  // Confidence threshold for "good" matches
  confidenceThreshold: 20,
  
  // Default color space for matching
  defaultColorSpace: 'lab',
  
  // Color spaces available
  colorSpaces: ['lab', 'rgb', 'hsl']
};

/**
 * Get the full configuration
 * @returns {Object} - Complete configuration object
 */
export const getConfig = () => {
  return {
    features: FEATURES,
    storage: STORAGE,
    neuralNetwork: NEURAL_NETWORK,
    geneticAlgorithm: GENETIC_ALGORITHM,
    patternRecognition: PATTERN_RECOGNITION,
    matching: MATCHING
  };
};

export default getConfig(); 