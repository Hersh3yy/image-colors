import chroma from 'chroma-js';
import { getKnowledgeBase, updateKnowledgeBase } from '../feedback/feedbackStorage';
import { applyNeuralAdjustment, trainModel } from './neuralNetwork';
import { findBestMatchWithGA, runGeneticOptimization } from './geneticAlgorithm';

// Pattern recognition functions
/**
 * Analyzes feedback data to identify color patterns
 * @param {Array} feedbackEntries - Array of feedback entries
 * @returns {Array} - Recognized patterns
 */
const recognizePatterns = (feedbackEntries) => {
  const patterns = [];
  
  // Group feedback by color characteristics
  const groupedByHue = groupByHueRange(feedbackEntries);
  const groupedBySaturation = groupBySaturationRange(feedbackEntries);
  const groupedByLightness = groupByLightnessRange(feedbackEntries);
  
  // Analyze each group for consistent corrections
  Object.entries(groupedByHue).forEach(([range, entries]) => {
    if (entries.length >= 3) { // Require at least 3 entries for a pattern
      const avgCorrection = calculateAverageCorrection(entries);
      
      if (Math.abs(avgCorrection.lab.l) > 5 || 
          Math.abs(avgCorrection.lab.a) > 5 || 
          Math.abs(avgCorrection.lab.b) > 5) {
        
        patterns.push({
          type: 'hue',
          condition: { hueRange: range.split('-').map(Number) },
          correction: avgCorrection,
          confidence: calculatePatternConfidence(entries, avgCorrection),
          sampleSize: entries.length
        });
      }
    }
  });
  
  // Similar pattern recognition for saturation groups
  Object.entries(groupedBySaturation).forEach(([range, entries]) => {
    if (entries.length >= 3) {
      const avgCorrection = calculateAverageCorrection(entries);
      
      if (Math.abs(avgCorrection.lab.l) > 5 || 
          Math.abs(avgCorrection.lab.a) > 5 || 
          Math.abs(avgCorrection.lab.b) > 5) {
        
        patterns.push({
          type: 'saturation',
          condition: { saturationRange: range.split('-').map(Number) },
          correction: avgCorrection,
          confidence: calculatePatternConfidence(entries, avgCorrection),
          sampleSize: entries.length
        });
      }
    }
  });
  
  // Similar pattern recognition for lightness groups
  Object.entries(groupedByLightness).forEach(([range, entries]) => {
    if (entries.length >= 3) {
      const avgCorrection = calculateAverageCorrection(entries);
      
      if (Math.abs(avgCorrection.lab.l) > 5 || 
          Math.abs(avgCorrection.lab.a) > 5 || 
          Math.abs(avgCorrection.lab.b) > 5) {
        
        patterns.push({
          type: 'lightness',
          condition: { lightnessRange: range.split('-').map(Number) },
          correction: avgCorrection,
          confidence: calculatePatternConfidence(entries, avgCorrection),
          sampleSize: entries.length
        });
      }
    }
  });
  
  return patterns.sort((a, b) => b.confidence - a.confidence);
};

/**
 * Groups feedback entries by hue range
 * @param {Array} entries - Feedback entries
 * @returns {Object} - Grouped entries
 */
const groupByHueRange = (entries) => {
  const groups = {
    '0-30': [], // Reds
    '30-60': [], // Oranges
    '60-90': [], // Yellows
    '90-150': [], // Greens
    '150-210': [], // Cyans
    '210-270': [], // Blues
    '270-330': [], // Purples
    '330-360': [] // Magentas
  };
  
  entries.forEach(entry => {
    try {
      if (!entry.originalColor) return;
      
      const hsl = chroma(entry.originalColor).hsl();
      const hue = isNaN(hsl[0]) ? 0 : hsl[0];
      
      // Find the appropriate range
      Object.keys(groups).forEach(range => {
        const [min, max] = range.split('-').map(Number);
        if (hue >= min && hue < max) {
          groups[range].push(entry);
        }
      });
    } catch (e) {
      console.error('Error processing entry for hue grouping:', e);
    }
  });
  
  return groups;
};

/**
 * Groups feedback entries by saturation range
 * @param {Array} entries - Feedback entries
 * @returns {Object} - Grouped entries
 */
const groupBySaturationRange = (entries) => {
  const groups = {
    '0-0.2': [], // Very low saturation
    '0.2-0.4': [], // Low saturation
    '0.4-0.6': [], // Medium saturation
    '0.6-0.8': [], // High saturation
    '0.8-1.0': [] // Very high saturation
  };
  
  entries.forEach(entry => {
    try {
      if (!entry.originalColor) return;
      
      const hsl = chroma(entry.originalColor).hsl();
      const saturation = isNaN(hsl[1]) ? 0 : hsl[1];
      
      // Find the appropriate range
      Object.keys(groups).forEach(range => {
        const [min, max] = range.split('-').map(Number);
        if (saturation >= min && saturation < max) {
          groups[range].push(entry);
        }
      });
    } catch (e) {
      console.error('Error processing entry for saturation grouping:', e);
    }
  });
  
  return groups;
};

/**
 * Groups feedback entries by lightness range
 * @param {Array} entries - Feedback entries
 * @returns {Object} - Grouped entries
 */
const groupByLightnessRange = (entries) => {
  const groups = {
    '0-0.2': [], // Very dark
    '0.2-0.4': [], // Dark
    '0.4-0.6': [], // Medium
    '0.6-0.8': [], // Light
    '0.8-1.0': [] // Very light
  };
  
  entries.forEach(entry => {
    try {
      if (!entry.originalColor) return;
      
      const hsl = chroma(entry.originalColor).hsl();
      const lightness = isNaN(hsl[2]) ? 0 : hsl[2];
      
      // Find the appropriate range
      Object.keys(groups).forEach(range => {
        const [min, max] = range.split('-').map(Number);
        if (lightness >= min && lightness < max) {
          groups[range].push(entry);
        }
      });
    } catch (e) {
      console.error('Error processing entry for lightness grouping:', e);
    }
  });
  
  return groups;
};

/**
 * Calculates average correction for a group of entries
 * @param {Array} entries - Feedback entries
 * @returns {Object} - Average correction
 */
const calculateAverageCorrection = (entries) => {
  // Initialize sums
  let sumLabL = 0;
  let sumLabA = 0;
  let sumLabB = 0;
  let count = 0;
  
  // Sum up all corrections
  entries.forEach(entry => {
    try {
      if (entry.metrics && entry.metrics.lab && entry.metrics.lab.diff) {
        sumLabL += entry.metrics.lab.diff.l;
        sumLabA += entry.metrics.lab.diff.a;
        sumLabB += entry.metrics.lab.diff.b;
        count++;
      }
    } catch (e) {
      console.error('Error calculating correction:', e);
    }
  });
  
  // Calculate averages
  return {
    lab: {
      l: count > 0 ? sumLabL / count : 0,
      a: count > 0 ? sumLabA / count : 0,
      b: count > 0 ? sumLabB / count : 0
    }
  };
};

/**
 * Calculates confidence in a pattern based on consistency
 * @param {Array} entries - Feedback entries
 * @param {Object} avgCorrection - Average correction
 * @returns {number} - Confidence score (0-100)
 */
const calculatePatternConfidence = (entries, avgCorrection) => {
  if (entries.length === 0) return 0;
  
  let totalVariance = 0;
  
  // Calculate variance of corrections
  entries.forEach(entry => {
    try {
      if (entry.metrics && entry.metrics.lab && entry.metrics.lab.diff) {
        const diff = entry.metrics.lab.diff;
        
        // Calculate squared differences from average
        const lVariance = Math.pow(diff.l - avgCorrection.lab.l, 2);
        const aVariance = Math.pow(diff.a - avgCorrection.lab.a, 2);
        const bVariance = Math.pow(diff.b - avgCorrection.lab.b, 2);
        
        // Add to total variance
        totalVariance += lVariance + aVariance + bVariance;
      }
    } catch (e) {
      console.error('Error calculating pattern confidence:', e);
    }
  });
  
  // Calculate average variance
  const avgVariance = totalVariance / entries.length;
  
  // Higher variance = lower confidence
  // Using a threshold of 100 for minimum confidence
  const confidenceScore = Math.max(0, 100 - Math.sqrt(avgVariance) * 5);
  
  return Math.min(100, Math.round(confidenceScore * 100) / 100);
};

/**
 * Updates the knowledge base with feedback data
 * @param {Array} feedbackEntries - Feedback entries
 * @returns {Object} - Update results
 */
export const updateKnowledgeFromFeedback = async (feedbackEntries) => {
  try {
    // Get current knowledge base
    const knowledgeBase = getKnowledgeBase();
    
    // Recognize patterns
    const patterns = recognizePatterns(feedbackEntries);
    
    // Train neural network
    const nnResults = await trainModel();
    
    // Run genetic algorithm optimization
    const gaResults = await runGeneticOptimization();
    
    // Update knowledge base
    const updatedKnowledge = {
      ...knowledgeBase,
      patterns,
      version: knowledgeBase.version + 1,
      lastUpdated: new Date().toISOString(),
      neuralNetwork: {
        trained: nnResults.success,
        lastTraining: new Date().toISOString()
      },
      parameters: gaResults.success ? gaResults.parameters : knowledgeBase.parameters
    };
    
    // Save updated knowledge base
    const result = updateKnowledgeBase(updatedKnowledge);
    
    return {
      success: result.success,
      patternsFound: patterns.length,
      neuralNetworkTrained: nnResults.success,
      geneticAlgorithmOptimized: gaResults.success
    };
  } catch (error) {
    console.error('Error updating knowledge base:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Applies knowledge base adjustments to a color match
 * @param {string} originalColor - Original color
 * @param {string} matchedColor - Matched color
 * @returns {Object} - Enhanced match
 */
export const enhanceColorMatch = (originalColor, matchedColor) => {
  try {
    // First, try neural network adjustment
    const nnAdjustment = applyNeuralAdjustment(originalColor);
    
    // If neural network adjustment is successful, use it
    if (nnAdjustment.success) {
      return {
        success: true,
        original: originalColor,
        matched: matchedColor,
        enhanced: nnAdjustment.adjusted,
        method: 'neuralNetwork',
        confidence: calculateEnhancementConfidence(originalColor, matchedColor, nnAdjustment.adjusted)
      };
    }
    
    // Otherwise, check for pattern-based adjustments
    const patterns = getPatternForColor(originalColor);
    
    if (patterns.length > 0) {
      // Use highest confidence pattern
      const bestPattern = patterns[0];
      
      // Apply the pattern's correction
      const enhancedColor = applyPatternCorrection(originalColor, bestPattern.correction);
      
      return {
        success: true,
        original: originalColor,
        matched: matchedColor,
        enhanced: enhancedColor,
        method: 'pattern',
        patternType: bestPattern.type,
        confidence: bestPattern.confidence
      };
    }
    
    // If no adjustments, return original match
    return {
      success: false,
      original: originalColor,
      matched: matchedColor,
      enhanced: matchedColor,
      method: 'noAdjustment',
      confidence: 0
    };
  } catch (error) {
    console.error('Error enhancing color match:', error);
    return {
      success: false,
      original: originalColor,
      matched: matchedColor,
      enhanced: matchedColor,
      error: error.message
    };
  }
};

/**
 * Finds patterns applicable to a given color
 * @param {string} hexColor - Color to check
 * @returns {Array} - Applicable patterns sorted by confidence
 */
const getPatternForColor = (hexColor) => {
  try {
    // Get knowledge base
    const knowledgeBase = getKnowledgeBase();
    const patterns = knowledgeBase.patterns || [];
    
    // Get color properties
    const color = chroma(hexColor);
    const hsl = color.hsl();
    
    // Handle NaN values in HSL
    const hue = isNaN(hsl[0]) ? 0 : hsl[0];
    const saturation = isNaN(hsl[1]) ? 0 : hsl[1];
    const lightness = isNaN(hsl[2]) ? 0 : hsl[2];
    
    // Filter patterns that apply to this color
    const applicablePatterns = patterns.filter(pattern => {
      switch (pattern.type) {
        case 'hue':
          const [minHue, maxHue] = pattern.condition.hueRange;
          return hue >= minHue && hue < maxHue;
          
        case 'saturation':
          const [minSat, maxSat] = pattern.condition.saturationRange;
          return saturation >= minSat && saturation < maxSat;
          
        case 'lightness':
          const [minLight, maxLight] = pattern.condition.lightnessRange;
          return lightness >= minLight && lightness < maxLight;
          
        default:
          return false;
      }
    });
    
    // Sort by confidence
    return applicablePatterns.sort((a, b) => b.confidence - a.confidence);
  } catch (error) {
    console.error('Error getting pattern for color:', error);
    return [];
  }
};

/**
 * Applies a pattern correction to a color
 * @param {string} hexColor - Original color
 * @param {Object} correction - Correction to apply
 * @returns {string} - Corrected color
 */
const applyPatternCorrection = (hexColor, correction) => {
  try {
    // Convert to LAB color space
    const color = chroma(hexColor);
    const lab = color.lab();
    
    // Apply correction
    const correctedLab = [
      lab[0] + correction.lab.l,
      lab[1] + correction.lab.a,
      lab[2] + correction.lab.b
    ];
    
    // Convert back to hex
    return chroma.lab(...correctedLab).hex();
  } catch (error) {
    console.error('Error applying pattern correction:', error);
    return hexColor; // Return original if error
  }
};

/**
 * Calculates confidence in an enhancement
 * @param {string} originalColor - Original color
 * @param {string} matchedColor - Matched color
 * @param {string} enhancedColor - Enhanced color
 * @returns {number} - Confidence score (0-100)
 */
const calculateEnhancementConfidence = (originalColor, matchedColor, enhancedColor) => {
  try {
    // Calculate distances
    const originalToMatched = chroma.deltaE(originalColor, matchedColor);
    const originalToEnhanced = chroma.deltaE(originalColor, enhancedColor);
    const matchedToEnhanced = chroma.deltaE(matchedColor, enhancedColor);
    
    // If enhancement is worse, confidence is 0
    if (originalToEnhanced >= originalToMatched) {
      return 0;
    }
    
    // Calculate improvement percentage
    const improvement = (originalToMatched - originalToEnhanced) / originalToMatched;
    
    // Calculate confidence based on improvement and magnitude of change
    const changeSignificance = Math.min(1, matchedToEnhanced / 20); // Normalize to 0-1
    
    // Combine factors - improvement is good, but too much change reduces confidence
    const confidence = improvement * 100 * (1 - changeSignificance * 0.5);
    
    return Math.min(100, Math.round(confidence * 100) / 100);
  } catch (error) {
    console.error('Error calculating enhancement confidence:', error);
    return 0;
  }
}; 