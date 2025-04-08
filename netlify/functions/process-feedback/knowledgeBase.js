// Local knowledge base utilities for this function
const chroma = require('chroma-js');

/**
 * Updates the knowledge base with feedback data
 * @param {Array} feedbackEntries - Feedback entries to process
 * @param {Object} knowledgeBase - Current knowledge base
 * @returns {Object} - Updated knowledge base
 */
const updateKnowledgeFromFeedback = (feedbackEntries, knowledgeBase) => {
  if (!feedbackEntries || feedbackEntries.length === 0) {
    console.log('No feedback entries to process');
    return knowledgeBase;
  }

  console.log(`Processing ${feedbackEntries.length} feedback entries`);
  
  // Process each feedback entry
  feedbackEntries.forEach(entry => {
    try {
      // Extract data from the feedback entry
      const { 
        originalColor, 
        matchResult, 
        userFeedback 
      } = entry;
      
      console.log(`Processing feedback for color ${originalColor}`, {
        matchedParent: matchResult?.parent?.name,
        matchedPantone: matchResult?.name,
        feedback: userFeedback
      });
      
      if (!originalColor || !matchResult || !userFeedback) {
        console.warn('Invalid feedback entry, skipping', entry);
        return;
      }
      
      // Process feedback based on the type
      if (userFeedback.parent === 'bad' && userFeedback.parentCorrection) {
        // User provided a correction for parent color
        updateParentPattern(
          originalColor, 
          userFeedback.parentCorrection.name, 
          knowledgeBase
        );
      } else if (userFeedback.pantone === 'bad' && userFeedback.pantoneCorrection) {
        // User provided a correction for Pantone color
        updatePantonePattern(
          originalColor, 
          userFeedback.pantoneCorrection, 
          knowledgeBase
        );
      }
    } catch (error) {
      console.error('Error processing feedback entry:', error);
    }
  });
  
  // Update version and date
  knowledgeBase.version += 0.1;
  knowledgeBase.lastUpdated = new Date().toISOString();
  
  return knowledgeBase;
};

/**
 * Update parent pattern in the knowledge base
 * @param {string} originalColor - Original color in hex
 * @param {string} correctedParent - Corrected parent color name
 * @param {Object} knowledgeBase - Knowledge base to update
 */
const updateParentPattern = (originalColor, correctedParent, knowledgeBase) => {
  try {
    // Ensure the parentPatterns array exists
    if (!knowledgeBase.parentPatterns) {
      knowledgeBase.parentPatterns = [];
    }
    
    // Convert hex to HSL
    const color = chroma(originalColor);
    const [h, s, l] = color.hsl();
    
    // Handle NaN values in HSL
    const hue = isNaN(h) ? 0 : h;
    const saturation = isNaN(s) ? 0 : s;
    const lightness = isNaN(l) ? 0 : l;
    
    // Check if a pattern already exists for this color range
    const existingPattern = knowledgeBase.parentPatterns.find(pattern => {
      if (pattern.type !== 'color_properties') return false;
      
      const hueMatch = Math.abs(pattern.condition.hue - hue) <= pattern.condition.hueRange;
      const saturationMatch = Math.abs(pattern.condition.saturation - saturation) <= pattern.condition.saturationRange;
      const lightnessMatch = Math.abs(pattern.condition.lightness - lightness) <= pattern.condition.lightnessRange;
      
      return hueMatch && saturationMatch && lightnessMatch;
    });
    
    if (existingPattern) {
      // Update existing pattern
      existingPattern.correctParent = correctedParent;
      existingPattern.confidence = Math.min(100, existingPattern.confidence + 5);
      existingPattern.usageCount = (existingPattern.usageCount || 0) + 1;
    } else {
      // Create new pattern
      const newPattern = {
        type: 'color_properties',
        condition: {
          hue: hue,
          hueRange: 15,
          saturation: saturation,
          saturationRange: 0.15,
          lightness: lightness,
          lightnessRange: 0.15
        },
        correctParent: correctedParent,
        confidence: 70,
        usageCount: 1
      };
      
      knowledgeBase.parentPatterns.push(newPattern);
    }
  } catch (error) {
    console.error('Error updating parent pattern:', error);
  }
};

/**
 * Update Pantone pattern in the knowledge base
 * @param {string} originalColor - Original color in hex
 * @param {Object} correctedPantone - Corrected Pantone color
 * @param {Object} knowledgeBase - Knowledge base to update
 */
const updatePantonePattern = (originalColor, correctedPantone, knowledgeBase) => {
  try {
    // Convert hex to HSL
    const color = chroma(originalColor);
    const [h, s, l] = color.hsl();
    
    // Handle NaN values in HSL
    const hue = isNaN(h) ? 0 : h;
    const saturation = isNaN(s) ? 0 : s;
    const lightness = isNaN(l) ? 0 : l;
    
    // Check if a pattern already exists for this hue range
    const existingPattern = knowledgeBase.patterns.find(pattern => {
      if (pattern.type !== 'hue') return false;
      
      return hue >= pattern.condition.hueRange[0] && hue <= pattern.condition.hueRange[1];
    });
    
    if (existingPattern) {
      // Update existing pattern
      existingPattern.confidence = Math.min(100, existingPattern.confidence + 5);
      existingPattern.usageCount = (existingPattern.usageCount || 0) + 1;
      
      // Adjust lab correction if available
      if (correctedPantone.lab && existingPattern.correction.lab) {
        const targetLab = chroma(correctedPantone.hex).lab();
        const currentLab = chroma(originalColor).lab();
        
        // Calculate correction delta
        existingPattern.correction.lab.l += (targetLab[0] - currentLab[0]) * 0.1;
        existingPattern.correction.lab.a += (targetLab[1] - currentLab[1]) * 0.1;
        existingPattern.correction.lab.b += (targetLab[2] - currentLab[2]) * 0.1;
      }
    } else {
      // Create new pattern for this hue range
      const newPattern = {
        type: 'hue',
        condition: {
          hueRange: [Math.max(0, hue - 15), Math.min(360, hue + 15)]
        },
        correction: {
          lab: { l: 0, a: 0, b: 0 }
        },
        confidence: 60,
        usageCount: 1
      };
      
      knowledgeBase.patterns.push(newPattern);
    }
  } catch (error) {
    console.error('Error updating Pantone pattern:', error);
  }
};

module.exports = {
  updateKnowledgeFromFeedback
}; 