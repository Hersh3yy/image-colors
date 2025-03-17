import chroma from 'chroma-js';
import { findClosestPantoneColor, findClosestParentColor } from '../colorMatcher';
import { enhanceColorMatch } from './knowledgeBase';
import { findBestMatchWithGA } from './geneticAlgorithm';
import { calculateConfidence } from '../colorUtils';

// Configuration
const CONFIG = {
  useNeuralNetwork: process.env.ENABLE_NEURAL_NETWORK === 'true',
  useGeneticAlgorithm: true,
  usePatternRecognition: true,
  confidenceThreshold: 20
};

/**
 * Finds the closest parent color using enhanced matching
 * @param {string} hexColor - Source color in hex format
 * @param {Array} parentColors - Array of parent colors to match against
 * @param {Object} options - Matching options
 * @returns {Object} - Matching result with enhanced confidence
 */
export const findEnhancedParentColor = (hexColor, parentColors, options = {}) => {
  // Standard match
  const standardMatch = findClosestParentColor(hexColor, parentColors, options.distanceMethod);
  
  if (!standardMatch || !standardMatch.color) {
    return standardMatch;
  }
  
  // Try genetic algorithm match if available and enabled
  let gaMatch = null;
  if (CONFIG.useGeneticAlgorithm) {
    try {
      gaMatch = findBestMatchWithGA(hexColor, parentColors);
    } catch (e) {
      console.error('Error in GA matching:', e);
    }
    
    // Use GA match if it's successful and has higher confidence
    if (gaMatch && gaMatch.success && gaMatch.confidence > standardMatch.confidence) {
      return gaMatch;
    }
  }
  
  // Enhance the standard match if pattern recognition is enabled
  if (CONFIG.usePatternRecognition) {
    try {
      const enhancement = enhanceColorMatch(hexColor, standardMatch.color.hex);
      
      // If enhancement is successful and has sufficient confidence
      if (enhancement.success && enhancement.confidence > CONFIG.confidenceThreshold) {
        // Calculate new distance
        const enhancedDistance = chroma.deltaE(hexColor, enhancement.enhanced);
        
        // Return enhanced match if it's better
        if (enhancedDistance < standardMatch.distance) {
          return {
            color: {
              ...standardMatch.color,
              hex: enhancement.enhanced, // Replace hex with enhanced version
              enhancementApplied: true,
              enhancementMethod: enhancement.method
            },
            distance: enhancedDistance,
            confidence: calculateConfidence(enhancedDistance),
            originalMatch: standardMatch
          };
        }
      }
    } catch (e) {
      console.error('Error enhancing match:', e);
    }
  }
  
  // Return standard match if enhancement didn't work
  return standardMatch;
};

/**
 * Finds the closest Pantone color using enhanced matching
 * @param {string} hexColor - Source color in hex format
 * @param {Object} options - Matching options
 * @returns {Object} - Matching result with enhanced confidence
 */
export const findEnhancedPantoneColor = (hexColor, options = {}) => {
  // Standard match
  const standardMatch = findClosestPantoneColor(hexColor, options.distanceMethod);
  
  if (!standardMatch || !standardMatch.color) {
    return standardMatch;
  }
  
  // Enhance the standard match if pattern recognition is enabled
  if (CONFIG.usePatternRecognition) {
    try {
      const enhancement = enhanceColorMatch(hexColor, `#${standardMatch.color.hex}`);
      
      // If enhancement is successful and has sufficient confidence
      if (enhancement.success && enhancement.confidence > CONFIG.confidenceThreshold) {
        // Extract hex without # for consistency
        const enhancedHex = enhancement.enhanced.replace('#', '');
        
        // Calculate new distance
        const enhancedDistance = chroma.deltaE(hexColor, enhancement.enhanced);
        
        // Return enhanced match if it's better
        if (enhancedDistance < standardMatch.distance) {
          return {
            color: {
              ...standardMatch.color,
              hex: enhancedHex, // Replace hex with enhanced version (without #)
              enhancementApplied: true,
              enhancementMethod: enhancement.method
            },
            distance: enhancedDistance,
            confidence: calculateConfidence(enhancedDistance),
            originalMatch: standardMatch
          };
        }
      }
    } catch (e) {
      console.error('Error enhancing Pantone match:', e);
    }
  }
  
  // Return standard match if enhancement didn't work
  return standardMatch;
};

/**
 * Main enhanced color matching function
 * @param {Array} analyzedColors - Array of analyzed colors from image
 * @param {Array} parentColors - Array of parent colors to match against
 * @param {Object} options - Matching options
 * @returns {Object} - Matching results with enhanced matches
 */
export const matchColorsEnhanced = (
  analyzedColors,
  parentColors = [],
  options = {
    distanceMethod: 'deltaE',
    confidenceThreshold: 20,
    useEnhancement: true
  }
) => {
  // Skip enhancement if option is disabled
  if (!options.useEnhancement) {
    // Use standard matching
    return import('../colorMatcher').then(({ matchColors }) => {
      return matchColors(analyzedColors, parentColors, options);
    });
  }
  
  // Process each color to find enhanced matches
  const matches = analyzedColors.map((color) => {
    const pantoneMatch = findEnhancedPantoneColor(color.color, options);
    const parentMatch = findEnhancedParentColor(color.color, parentColors, options);
    
    return {
      color: color.color,
      percentage: color.percentage,
      pantone: {
        name: pantoneMatch.color?.name || null,
        code: pantoneMatch.color?.pantone || null,
        hex: pantoneMatch.color ? `#${pantoneMatch.color.hex}` : color.color,
        distance: pantoneMatch.distance,
        confidence: pantoneMatch.confidence,
        enhancementApplied: pantoneMatch.color?.enhancementApplied || false,
        enhancementMethod: pantoneMatch.color?.enhancementMethod || null
      },
      parent: {
        name: parentMatch?.color?.name || null,
        hex: parentMatch?.color?.hex || color.color,
        distance: parentMatch?.distance || null,
        confidence: parentMatch?.confidence || 0,
        enhancementApplied: parentMatch?.color?.enhancementApplied || false,
        enhancementMethod: parentMatch?.color?.enhancementMethod || null
      }
    };
  });
  
  // Analyze matches and calculate statistics
  const problematicMatches = analyzeProblematicMatches(matches, options.confidenceThreshold);
  const averageConfidence = calculateAverageConfidence(matches);
  const enhancementStats = calculateEnhancementStats(matches);
  
  return {
    colors: matches,
    problematicMatches,
    averageConfidence,
    enhancementStats
  };
};

/**
 * Analyze results to find problematic color matches
 * @param {Array} matches - Array of color matches
 * @param {number} threshold - Confidence threshold for problematic matches
 * @returns {Array} - Array of problematic matches
 */
const analyzeProblematicMatches = (matches, threshold = 20) => {
  return matches.filter(color => {
    const pantoneConfidence = color.pantone.confidence || 0;
    const parentConfidence = color.parent.confidence || 0;
    return pantoneConfidence < threshold || parentConfidence < threshold;
  });
};

/**
 * Calculate average confidence across all matches
 * @param {Array} matches - Array of color matches
 * @returns {number} - Average confidence
 */
const calculateAverageConfidence = (matches) => {
  const totalConfidence = matches.reduce((acc, match) => {
    return acc + (match.pantone.confidence + match.parent.confidence) / 2;
  }, 0);
  
  return matches.length > 0 
    ? Math.round((totalConfidence / matches.length) * 100) / 100 
    : 0;
};

/**
 * Calculate enhancement statistics
 * @param {Array} matches - Array of color matches
 * @returns {Object} - Enhancement statistics
 */
const calculateEnhancementStats = (matches) => {
  let pantoneEnhanced = 0;
  let parentEnhanced = 0;
  let neuralNetworkCount = 0;
  let patternCount = 0;
  let gaCount = 0;
  
  matches.forEach(match => {
    if (match.pantone.enhancementApplied) {
      pantoneEnhanced++;
      
      if (match.pantone.enhancementMethod === 'neuralNetwork') {
        neuralNetworkCount++;
      } else if (match.pantone.enhancementMethod === 'pattern') {
        patternCount++;
      }
    }
    
    if (match.parent.enhancementApplied) {
      parentEnhanced++;
      
      if (match.parent.enhancementMethod === 'neuralNetwork') {
        neuralNetworkCount++;
      } else if (match.parent.enhancementMethod === 'pattern') {
        patternCount++;
      } else if (match.parent.enhancementMethod === 'geneticAlgorithm') {
        gaCount++;
      }
    }
  });
  
  const totalMatches = matches.length * 2; // Both pantone and parent matches
  const totalEnhanced = pantoneEnhanced + parentEnhanced;
  
  return {
    totalEnhanced,
    pantoneEnhanced,
    parentEnhanced,
    enhancementPercentage: totalMatches > 0 
      ? Math.round((totalEnhanced / totalMatches) * 100) 
      : 0,
    methodBreakdown: {
      neuralNetwork: neuralNetworkCount,
      pattern: patternCount,
      geneticAlgorithm: gaCount
    }
  };
}; 