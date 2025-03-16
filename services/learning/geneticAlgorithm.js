import chroma from 'chroma-js';
import { getFeedbackEntries } from '../feedback/feedbackStorage';
import { getKnowledgeBase, updateKnowledgeBase } from '../feedback/feedbackStorage';

// Constants
const POPULATION_SIZE = 20;
const GENERATIONS = 10;
const MUTATION_RATE = 0.1;
const ELITISM_COUNT = 2;

// Parameters that can be optimized
const PARAMETERS = {
  DELTA_E_WEIGHT: { min: 0.1, max: 0.9 },
  LAB_WEIGHT: { min: 0.1, max: 0.9 },
  HUE_WEIGHT: { min: 0.1, max: 3.0 },
  SATURATION_WEIGHT: { min: 0.1, max: 3.0 },
  LIGHTNESS_WEIGHT: { min: 0.1, max: 3.0 }
};

/**
 * Creates a random individual (parameter set)
 * @returns {Object} - Random parameter set
 */
const createIndividual = () => {
  return {
    deltaEWeight: Math.random() * (PARAMETERS.DELTA_E_WEIGHT.max - PARAMETERS.DELTA_E_WEIGHT.min) + PARAMETERS.DELTA_E_WEIGHT.min,
    labWeight: Math.random() * (PARAMETERS.LAB_WEIGHT.max - PARAMETERS.LAB_WEIGHT.min) + PARAMETERS.LAB_WEIGHT.min,
    hueWeight: Math.random() * (PARAMETERS.HUE_WEIGHT.max - PARAMETERS.HUE_WEIGHT.min) + PARAMETERS.HUE_WEIGHT.min,
    saturationWeight: Math.random() * (PARAMETERS.SATURATION_WEIGHT.max - PARAMETERS.SATURATION_WEIGHT.min) + PARAMETERS.SATURATION_WEIGHT.min,
    lightnessWeight: Math.random() * (PARAMETERS.LIGHTNESS_WEIGHT.max - PARAMETERS.LIGHTNESS_WEIGHT.min) + PARAMETERS.LIGHTNESS_WEIGHT.min
  };
};

/**
 * Creates initial population
 * @param {number} size - Population size
 * @returns {Array} - Initial population
 */
const createPopulation = (size = POPULATION_SIZE) => {
  // Start with current knowledge base parameters
  const currentKnowledge = getKnowledgeBase();
  const currentParams = currentKnowledge.parameters || {};
  
  const population = [];
  
  // Add current parameters as first individual if they exist
  if (Object.keys(currentParams).length > 0) {
    population.push({
      deltaEWeight: currentParams.deltaEWeight || 0.7,
      labWeight: currentParams.labWeight || 0.3,
      hueWeight: currentParams.hueWeight || 1.0,
      saturationWeight: currentParams.saturationWeight || 1.0,
      lightnessWeight: currentParams.lightnessWeight || 1.0
    });
  }
  
  // Fill the rest of the population with random individuals
  while (population.length < size) {
    population.push(createIndividual());
  }
  
  return population;
};

/**
 * Calculates the fitness of an individual (parameter set) using feedback data
 * @param {Object} individual - Parameter set
 * @returns {number} - Fitness score (higher is better)
 */
const calculateFitness = (individual) => {
  const feedbackEntries = getFeedbackEntries();
  
  // Return 0 if no feedback data
  if (!feedbackEntries.length) return 0;
  
  let totalError = 0;
  
  feedbackEntries.forEach(entry => {
    if (!entry.originalColor || !entry.systemMatch || !entry.userCorrection) {
      return;
    }
    
    // Get colors
    const originalColor = chroma(entry.originalColor);
    const systemMatch = chroma(entry.systemMatch.hex);
    const userCorrection = chroma(entry.userCorrection.hex);
    
    // Calculate distance with weighted parameters
    const systemDistance = getWeightedDistance(originalColor, systemMatch, individual);
    const userDistance = getWeightedDistance(originalColor, userCorrection, individual);
    
    // Add error (difference between what the system predicted and what the user chose)
    totalError += Math.abs(systemDistance - userDistance);
  });
  
  // Average error per feedback entry
  const avgError = totalError / feedbackEntries.length;
  
  // Fitness is inverse of error (lower error = higher fitness)
  return 1 / (avgError + 0.001); // Add small constant to avoid division by zero
};

/**
 * Calculates weighted distance between two colors based on parameters
 * @param {Object} color1 - First color (chroma.js object)
 * @param {Object} color2 - Second color (chroma.js object)
 * @param {Object} params - Weight parameters
 * @returns {number} - Weighted distance
 */
const getWeightedDistance = (color1, color2, params) => {
  // DeltaE distance
  const deltaE = chroma.deltaE(color1, color2);
  
  // LAB distance
  const lab1 = color1.lab();
  const lab2 = color2.lab();
  const labDistance = Math.sqrt(
    Math.pow(lab1[0] - lab2[0], 2) +
    Math.pow(lab1[1] - lab2[1], 2) +
    Math.pow(lab1[2] - lab2[2], 2)
  );
  
  // HSL components
  const hsl1 = color1.hsl();
  const hsl2 = color2.hsl();
  
  // Handle NaN values in HSL (can happen with grayscale colors)
  const h1 = isNaN(hsl1[0]) ? 0 : hsl1[0];
  const h2 = isNaN(hsl2[0]) ? 0 : hsl2[0];
  const s1 = isNaN(hsl1[1]) ? 0 : hsl1[1];
  const s2 = isNaN(hsl2[1]) ? 0 : hsl2[1];
  const l1 = isNaN(hsl1[2]) ? 0 : hsl1[2];
  const l2 = isNaN(hsl2[2]) ? 0 : hsl2[2];
  
  // Calculate hue distance (considering circular nature)
  let hueDiff = Math.abs(h1 - h2);
  if (hueDiff > 180) hueDiff = 360 - hueDiff;
  const hueDistance = hueDiff / 180; // Normalize to 0-1
  
  // Calculate saturation and lightness distances
  const saturationDistance = Math.abs(s1 - s2);
  const lightnessDistance = Math.abs(l1 - l2);
  
  // Calculate weighted distance
  return (
    params.deltaEWeight * deltaE +
    params.labWeight * labDistance +
    params.hueWeight * hueDistance +
    params.saturationWeight * saturationDistance +
    params.lightnessWeight * lightnessDistance
  );
};

/**
 * Selects parent for crossover using tournament selection
 * @param {Array} population - Current population
 * @param {Array} fitnesses - Fitness values for population
 * @returns {Object} - Selected parent
 */
const selectParent = (population, fitnesses) => {
  // Tournament selection (select 3 random individuals and pick the best one)
  const tournamentSize = 3;
  const indices = [];
  
  // Select random individuals
  while (indices.length < tournamentSize) {
    const idx = Math.floor(Math.random() * population.length);
    if (!indices.includes(idx)) {
      indices.push(idx);
    }
  }
  
  // Find the best one
  let bestIdx = indices[0];
  for (let i = 1; i < indices.length; i++) {
    if (fitnesses[indices[i]] > fitnesses[bestIdx]) {
      bestIdx = indices[i];
    }
  }
  
  return population[bestIdx];
};

/**
 * Creates a child through crossover of two parents
 * @param {Object} parent1 - First parent
 * @param {Object} parent2 - Second parent
 * @returns {Object} - Child individual
 */
const crossover = (parent1, parent2) => {
  // Create child with random traits from each parent
  return {
    deltaEWeight: Math.random() < 0.5 ? parent1.deltaEWeight : parent2.deltaEWeight,
    labWeight: Math.random() < 0.5 ? parent1.labWeight : parent2.labWeight,
    hueWeight: Math.random() < 0.5 ? parent1.hueWeight : parent2.hueWeight,
    saturationWeight: Math.random() < 0.5 ? parent1.saturationWeight : parent2.saturationWeight,
    lightnessWeight: Math.random() < 0.5 ? parent1.lightnessWeight : parent2.lightnessWeight
  };
};

/**
 * Applies mutation to an individual
 * @param {Object} individual - Individual to mutate
 * @returns {Object} - Mutated individual
 */
const mutate = (individual) => {
  const mutated = { ...individual };
  
  // Potentially mutate each parameter
  if (Math.random() < MUTATION_RATE) {
    mutated.deltaEWeight = Math.random() * (PARAMETERS.DELTA_E_WEIGHT.max - PARAMETERS.DELTA_E_WEIGHT.min) + PARAMETERS.DELTA_E_WEIGHT.min;
  }
  
  if (Math.random() < MUTATION_RATE) {
    mutated.labWeight = Math.random() * (PARAMETERS.LAB_WEIGHT.max - PARAMETERS.LAB_WEIGHT.min) + PARAMETERS.LAB_WEIGHT.min;
  }
  
  if (Math.random() < MUTATION_RATE) {
    mutated.hueWeight = Math.random() * (PARAMETERS.HUE_WEIGHT.max - PARAMETERS.HUE_WEIGHT.min) + PARAMETERS.HUE_WEIGHT.min;
  }
  
  if (Math.random() < MUTATION_RATE) {
    mutated.saturationWeight = Math.random() * (PARAMETERS.SATURATION_WEIGHT.max - PARAMETERS.SATURATION_WEIGHT.min) + PARAMETERS.SATURATION_WEIGHT.min;
  }
  
  if (Math.random() < MUTATION_RATE) {
    mutated.lightnessWeight = Math.random() * (PARAMETERS.LIGHTNESS_WEIGHT.max - PARAMETERS.LIGHTNESS_WEIGHT.min) + PARAMETERS.LIGHTNESS_WEIGHT.min;
  }
  
  return mutated;
};

/**
 * Evolves a new population from the current one
 * @param {Array} population - Current population
 * @param {Array} fitnesses - Fitness values for population
 * @returns {Array} - New population
 */
const evolvePopulation = (population, fitnesses) => {
  const newPopulation = [];
  
  // Sort population by fitness (descending)
  const sortedIndices = Array.from({ length: population.length }, (_, i) => i)
    .sort((a, b) => fitnesses[b] - fitnesses[a]);
  
  // Elitism: Keep best individuals unchanged
  for (let i = 0; i < ELITISM_COUNT; i++) {
    newPopulation.push(population[sortedIndices[i]]);
  }
  
  // Create rest of new population through selection, crossover, and mutation
  while (newPopulation.length < population.length) {
    const parent1 = selectParent(population, fitnesses);
    const parent2 = selectParent(population, fitnesses);
    
    let child = crossover(parent1, parent2);
    child = mutate(child);
    
    newPopulation.push(child);
  }
  
  return newPopulation;
};

/**
 * Runs the genetic algorithm optimization
 * @returns {Promise<Object>} - Optimization results
 */
export const runGeneticOptimization = async () => {
  const feedbackEntries = getFeedbackEntries();
  
  if (feedbackEntries.length < 5) {
    console.log('Not enough feedback data for genetic optimization (need at least 5 entries)');
    return {
      success: false,
      error: 'Not enough feedback data for optimization'
    };
  }
  
  console.log(`Starting genetic optimization with ${feedbackEntries.length} feedback entries`);
  
  // Create initial population
  let population = createPopulation();
  
  // Track best individual and fitness
  let bestIndividual = null;
  let bestFitness = -Infinity;
  
  // Run for specified number of generations
  for (let generation = 0; generation < GENERATIONS; generation++) {
    console.log(`Generation ${generation + 1}/${GENERATIONS}`);
    
    // Calculate fitness for each individual
    const fitnesses = population.map(individual => calculateFitness(individual));
    
    // Find best individual in this generation
    let generationBestIndex = 0;
    for (let i = 1; i < fitnesses.length; i++) {
      if (fitnesses[i] > fitnesses[generationBestIndex]) {
        generationBestIndex = i;
      }
    }
    
    // Update overall best if needed
    if (fitnesses[generationBestIndex] > bestFitness) {
      bestFitness = fitnesses[generationBestIndex];
      bestIndividual = { ...population[generationBestIndex] };
      console.log(`  New best fitness: ${bestFitness.toFixed(4)}`);
      console.log(`  Parameters: ${JSON.stringify(bestIndividual)}`);
    }
    
    // Evolve population
    population = evolvePopulation(population, fitnesses);
  }
  
  // Update knowledge base with best parameters
  if (bestIndividual) {
    const knowledgeBase = getKnowledgeBase();
    knowledgeBase.parameters = bestIndividual;
    updateKnowledgeBase(knowledgeBase);
    
    console.log('Genetic optimization complete');
    console.log(`Best parameters: ${JSON.stringify(bestIndividual)}`);
    console.log(`Best fitness: ${bestFitness.toFixed(4)}`);
    
    return {
      success: true,
      parameters: bestIndividual,
      fitness: bestFitness
    };
  }
  
  return {
    success: false,
    error: 'Optimization failed to find improved parameters'
  };
};

/**
 * Applies genetic algorithm optimized parameters to color matching
 * @param {string} originalColor - Original color in hex format
 * @param {Array} targetColors - Array of target colors to match against
 * @returns {Object} - Best match using optimized parameters
 */
export const findBestMatchWithGA = (originalColor, targetColors) => {
  try {
    // Get knowledge base parameters
    const knowledgeBase = getKnowledgeBase();
    const params = knowledgeBase.parameters || {
      deltaEWeight: 0.7,
      labWeight: 0.3,
      hueWeight: 1.0,
      saturationWeight: 1.0,
      lightnessWeight: 1.0
    };
    
    // Convert original color to chroma object
    const chromaOriginal = chroma(originalColor);
    
    // Track best match
    let bestMatch = null;
    let minDistance = Infinity;
    
    // Find closest color using weighted distance
    targetColors.forEach(targetColor => {
      const chromaTarget = chroma(targetColor.hex);
      const distance = getWeightedDistance(chromaOriginal, chromaTarget, params);
      
      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = targetColor;
      }
    });
    
    return {
      success: true,
      match: bestMatch,
      distance: minDistance,
      confidence: calculateConfidence(minDistance)
    };
  } catch (error) {
    console.error('Error finding best match with GA:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Calculates confidence score from distance
 * @param {number} distance - Distance between colors
 * @returns {number} - Confidence score (0-100)
 */
const calculateConfidence = (distance) => {
  // Lower distance = higher confidence
  // Using a threshold of 20 for 0% confidence (same as existing system)
  const threshold = 20;
  const score = Math.max(0, 100 - (distance / threshold) * 100);
  return Math.round(score * 100) / 100; // Round to 2 decimal places
}; 