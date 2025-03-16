const chroma = require('chroma-js');
const fs = require('fs');
const path = require('path');

// Path to processed colors file
const COLORS_FILE = path.join(__dirname, '../../../assets/processed_colors.json');

// Generate a random color
const generateRandomColor = () => {
  // Generate random RGB values
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  
  // Convert to hex
  return chroma(r, g, b).hex();
};

// Calculate confidence score based on delta-E distance
const calculateConfidence = (distance, threshold = 20) => {
  // Lower distance = higher confidence
  const score = Math.max(0, 100 - (distance / threshold) * 100);
  return Math.round(score * 100) / 100; // Round to 2 decimal places
};

// Find the closest Pantone color to the given hex color
const findClosestPantoneColor = (hexColor, pantoneColors) => {
  if (!pantoneColors || pantoneColors.length === 0) {
    return null;
  }
  
  let minDistance = Infinity;
  let closestColor = null;
  
  // Convert the input color to chroma object
  const chromaColor = chroma(hexColor);
  
  // Iterate through all Pantone colors to find closest match
  pantoneColors.forEach((pantoneColor) => {
    // Create a chroma color from the pantone hex
    const pantoneChroma = chroma(`#${pantoneColor.hex}`);
    
    // Calculate delta-E distance
    const distance = chroma.deltaE(chromaColor, pantoneChroma);
    
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = pantoneColor;
    }
  });
  
  if (!closestColor) {
    return null;
  }
  
  return {
    name: closestColor.name,
    code: closestColor.pantone,
    hex: `#${closestColor.hex}`,
    distance: minDistance,
    confidence: calculateConfidence(minDistance)
  };
};

// Main handler function
exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };
  
  // Handle OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }
  
  try {
    // Generate a random color
    const randomColor = generateRandomColor();
    
    // Load Pantone colors
    let pantoneColors = [];
    if (fs.existsSync(COLORS_FILE)) {
      const data = fs.readFileSync(COLORS_FILE, 'utf8');
      pantoneColors = JSON.parse(data);
    } else {
      console.warn('Pantone colors file not found');
    }
    
    // Find the closest Pantone color
    const match = findClosestPantoneColor(randomColor, pantoneColors);
    
    if (!match) {
      throw new Error('Failed to find a match');
    }
    
    // Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        color: randomColor,
        match
      })
    };
  } catch (error) {
    console.error('Error in play handler:', error);
    
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