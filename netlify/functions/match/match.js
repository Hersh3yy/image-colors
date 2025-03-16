const chroma = require('chroma-js');
const fs = require('fs');
const path = require('path');

// Path to files
const COLORS_FILE = path.join(__dirname, '../../../assets/processed_colors.json');
const KNOWLEDGE_FILE = path.join(__dirname, '../../../data/knowledge.json');

// Calculate confidence score based on delta-E distance
const calculateConfidence = (distance, threshold = 20) => {
  // Lower distance = higher confidence
  const score = Math.max(0, 100 - (distance / threshold) * 100);
  return Math.round(score * 100) / 100; // Round to 2 decimal places
};

// Load the knowledge base
const loadKnowledgeBase = () => {
  try {
    if (fs.existsSync(KNOWLEDGE_FILE)) {
      const data = fs.readFileSync(KNOWLEDGE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading knowledge base:', error);
  }
  
  // Return default knowledge base if not found
  return {
    patterns: [],
    parameters: {
      deltaEWeight: 0.7,
      labWeight: 0.3,
      hueWeight: 1.0,
      saturationWeight: 1.0,
      lightnessWeight: 1.0
    },
    version: 1,
    lastUpdated: new Date().toISOString()
  };
};

// Get pattern for a specific color
const getPatternForColor = (hexColor, patterns) => {
  try {
    if (!patterns || patterns.length === 0) {
      return null;
    }
    
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
    
    // Sort by confidence and return the best one
    return applicablePatterns.sort((a, b) => b.confidence - a.confidence)[0] || null;
  } catch (error) {
    console.error('Error getting pattern for color:', error);
    return null;
  }
};

// Apply pattern correction to color
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

// Calculate weighted distance between two colors
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

// Find the closest Pantone color with enhanced matching
const findEnhancedPantoneColor = (hexColor, pantoneColors, knowledgeBase) => {
  if (!pantoneColors || pantoneColors.length === 0) {
    return null;
  }
  
  // Use knowledge base parameters
  const params = knowledgeBase.parameters || {
    deltaEWeight: 0.7,
    labWeight: 0.3,
    hueWeight: 1.0,
    saturationWeight: 1.0,
    lightnessWeight: 1.0
  };
  
  // Check if there's a pattern that applies to this color
  const pattern = getPatternForColor(hexColor, knowledgeBase.patterns);
  
  // If pattern exists, apply it to the color
  let adjustedColor = hexColor;
  let enhancementMethod = null;
  
  if (pattern && pattern.confidence > 50) {
    adjustedColor = applyPatternCorrection(hexColor, pattern.correction);
    enhancementMethod = 'pattern';
  }
  
  // Convert the input color to chroma object
  const chromaColor = chroma(adjustedColor);
  
  // Find closest color using weighted distance
  let minDistance = Infinity;
  let closestColor = null;
  
  pantoneColors.forEach(pantoneColor => {
    const pantoneChroma = chroma(`#${pantoneColor.hex}`);
    const distance = getWeightedDistance(chromaColor, pantoneChroma, params);
    
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = pantoneColor;
    }
  });
  
  if (!closestColor) {
    return null;
  }
  
  // Calculate standard deltaE for confidence display
  const standardDistance = chroma.deltaE(hexColor, `#${closestColor.hex}`);
  
  return {
    name: closestColor.name,
    code: closestColor.pantone,
    hex: `#${closestColor.hex}`,
    distance: standardDistance,
    confidence: calculateConfidence(standardDistance),
    enhancementApplied: enhancementMethod !== null,
    enhancementMethod,
    originalColor: hexColor,
    adjustedColor: adjustedColor !== hexColor ? adjustedColor : undefined
  };
};

// Main handler function
exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  
  // Handle OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }
  
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }
  
  try {
    // Parse the request body
    const requestBody = JSON.parse(event.body);
    
    // Validate the input
    if (!requestBody.color) {
      throw new Error('Color is required');
    }
    
    const hexColor = requestBody.color;
    
    // Load Pantone colors
    let pantoneColors = [];
    if (fs.existsSync(COLORS_FILE)) {
      const data = fs.readFileSync(COLORS_FILE, 'utf8');
      pantoneColors = JSON.parse(data);
    } else {
      throw new Error('Pantone colors file not found');
    }
    
    // Load knowledge base
    const knowledgeBase = loadKnowledgeBase();
    
    // Find the enhanced match
    const match = findEnhancedPantoneColor(hexColor, pantoneColors, knowledgeBase);
    
    if (!match) {
      throw new Error('Failed to find a match');
    }
    
    // Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        match,
        knowledgeBaseVersion: knowledgeBase.version
      })
    };
  } catch (error) {
    console.error('Error in match handler:', error);
    
    // Return error response
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
}; 