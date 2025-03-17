const chroma = require('chroma-js');
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require('fs');
const path = require('path');

// Load processed colors directly - it's in the same directory
const processedColors = require('./processed_colors.json');
console.log(`Loaded ${processedColors.length} Pantone colors`);

// Initialize S3 client for DigitalOcean Spaces
const s3Client = new S3Client({
  endpoint: "https://ams3.digitaloceanspaces.com",
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
  },
});

// Constants for knowledge base
const BUCKET_NAME = "bengijzel";
const KNOWLEDGE_KEY = "image-colors/data/knowledge.json";

// Calculate confidence score based on delta-E distance
const calculateConfidence = (distance, threshold = 20) => {
  // Lower distance = higher confidence
  const score = Math.max(0, 100 - (distance / threshold) * 100);
  return Math.round(score * 100) / 100; // Round to 2 decimal places
};

// Default knowledge base
const getDefaultKnowledgeBase = () => ({
  patterns: [],
  parentPatterns: [],
  parameters: {
    deltaEWeight: 0.7,
    labWeight: 0.3,
    hueWeight: 1.0,
    saturationWeight: 1.0,
    lightnessWeight: 1.0
  },
  version: 1,
  lastUpdated: new Date().toISOString()
});

// Load the knowledge base from S3
const loadKnowledgeBase = async () => {
  try {
    // Try to load from S3
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: KNOWLEDGE_KEY,
    });

    try {
      const response = await s3Client.send(command);
      const data = await response.Body.transformToString();
      console.log('Successfully loaded knowledge base from S3');
      return JSON.parse(data);
    } catch (s3Error) {
      console.log('Knowledge base not found in S3, creating default...');
      
      // Create default knowledge base in S3
      const defaultBase = getDefaultKnowledgeBase();
      const putCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: KNOWLEDGE_KEY,
        Body: JSON.stringify(defaultBase, null, 2),
        ContentType: 'application/json',
        ACL: 'public-read'
      });
      
      await s3Client.send(putCommand);
      console.log('Created default knowledge base in S3');
      return defaultBase;
    }
  } catch (error) {
    console.error('Error with knowledge base:', error);
    return getDefaultKnowledgeBase();
  }
};

// Update knowledge base in S3
const updateKnowledgeBase = async (knowledgeBase) => {
  try {
    console.log('Attempting to update knowledge base in S3...', {
      bucket: BUCKET_NAME,
      key: KNOWLEDGE_KEY,
      content: JSON.stringify(knowledgeBase).slice(0, 100) + '...' // Log first 100 chars
    });

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: KNOWLEDGE_KEY,
      Body: JSON.stringify(knowledgeBase, null, 2),
      ContentType: 'application/json',
      ACL: 'public-read'
    });
    
    const result = await s3Client.send(command);
    console.log('S3 update result:', result);
    console.log('Successfully updated knowledge base in S3');
    return true;
  } catch (error) {
    console.error('Failed to update knowledge base:', {
      error: error.message,
      stack: error.stack,
      bucket: BUCKET_NAME,
      key: KNOWLEDGE_KEY
    });
    return false;
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

// Get matching pattern for a color
const getPatternForColor = (hexColor, patterns) => {
  if (!patterns || patterns.length === 0) return null;
  
  const color = chroma(hexColor);
  const [h, s, l] = color.hsl();
  
  // Handle NaN values in HSL (can happen with grayscale colors)
  const hue = isNaN(h) ? 0 : h;
  const saturation = isNaN(s) ? 0 : s;
  const lightness = isNaN(l) ? 0 : l;
  
  // Find matching pattern with highest confidence
  return patterns
    .filter(pattern => {
      switch (pattern.type) {
        case 'hue':
          const hueInRange = pattern.condition.hueRange[0] <= hue && hue <= pattern.condition.hueRange[1];
          return hueInRange;
        case 'saturation':
          const satInRange = pattern.condition.saturationRange[0] <= saturation && saturation <= pattern.condition.saturationRange[1];
          return satInRange;
        case 'lightness':
          const lightInRange = pattern.condition.lightnessRange[0] <= lightness && lightness <= pattern.condition.lightnessRange[1];
          return lightInRange;
        default:
          return false;
      }
    })
    .sort((a, b) => b.confidence - a.confidence)[0] || null;
};

// Apply pattern correction to a color
const applyPatternCorrection = (hexColor, correction) => {
  if (!correction) return hexColor;
  
  const color = chroma(hexColor);
  const [l, a, b] = color.lab();
  
  // Apply LAB corrections if they exist
  if (correction.lab) {
    const newL = l + (correction.lab.l || 0);
    const newA = a + (correction.lab.a || 0);
    const newB = b + (correction.lab.b || 0);
    return chroma.lab(newL, newA, newB).hex();
  }
  
  return hexColor;
};

// Process feedback and update knowledge base
const processFeedback = (originalColor, matchedColor, feedback, knowledgeBase) => {
  console.log('Processing feedback:', {
    originalColor,
    matchResult: matchedColor,
    feedback,
    currentPatterns: knowledgeBase.patterns.length,
    currentParentPatterns: knowledgeBase.parentPatterns?.length || 0
  });

  // Initialize parentPatterns if it doesn't exist (for backward compatibility)
  if (!knowledgeBase.parentPatterns) {
    knowledgeBase.parentPatterns = [];
  }

  const color = chroma(originalColor);
  const [h, s, l] = color.hsl();
  
  // Handle NaN values in HSL
  const hue = isNaN(h) ? 0 : h;
  const saturation = isNaN(s) ? 0 : s;
  const lightness = isNaN(l) ? 0 : l;
  
  // Process Pantone feedback
  if (feedback.pantone === 'good') {
    console.log('Processing good Pantone match feedback');
    // If it's a good match, strengthen existing patterns or create new ones
    const existingPattern = getPatternForColor(originalColor, knowledgeBase.patterns);
    
    if (existingPattern) {
      console.log('Updating existing Pantone pattern:', {
        oldConfidence: existingPattern.confidence,
        oldUsageCount: existingPattern.usageCount
      });
      // Update existing pattern confidence
      existingPattern.confidence = Math.min(100, existingPattern.confidence + 5);
      existingPattern.usageCount = (existingPattern.usageCount || 0) + 1;
      console.log('Pattern updated:', {
        newConfidence: existingPattern.confidence,
        newUsageCount: existingPattern.usageCount
      });
    } else {
      console.log('Creating new Pantone pattern for color properties:', {
        hue,
        saturation,
        lightness
      });
      // Create new pattern based on the color properties
      const newPattern = {
        type: 'hue',
        condition: {
          hueRange: [Math.max(0, hue - 15), Math.min(360, hue + 15)]
        },
        correction: {
          lab: {
            l: 0,
            a: 0,
            b: 0
          }
        },
        confidence: 60,
        usageCount: 1
      };
      knowledgeBase.patterns.push(newPattern);
      console.log('New Pantone pattern created:', newPattern);
    }
  } else if (feedback.pantone === 'bad') {
    console.log('Processing bad Pantone match feedback');
    // If it's a bad match, reduce confidence in relevant patterns
    const relevantPattern = getPatternForColor(originalColor, knowledgeBase.patterns);
    if (relevantPattern) {
      console.log('Reducing confidence of Pantone pattern:', {
        oldConfidence: relevantPattern.confidence
      });
      relevantPattern.confidence = Math.max(0, relevantPattern.confidence - 10);
      console.log('Pattern confidence reduced:', {
        newConfidence: relevantPattern.confidence
      });
    }
  }
  
  // Process Parent Color feedback
  if (feedback.parent) {
    console.log('Processing parent color feedback:', feedback.parent);
    
    if (feedback.parent === 'good') {
      console.log('Good parent match, strengthening parent patterns');
      // Strengthen or create patterns that favor the current parent match
      const existingParentPattern = findExistingParentPattern(originalColor, knowledgeBase.parentPatterns);
      
      if (existingParentPattern) {
        console.log('Updating existing parent pattern');
        existingParentPattern.confidence = Math.min(100, existingParentPattern.confidence + 5);
        existingParentPattern.usageCount = (existingParentPattern.usageCount || 0) + 1;
      } else {
        console.log('Creating new parent color pattern');
        // Create new pattern based on color properties
        const newParentPattern = {
          type: 'color_properties',
          condition: {
            hue: hue,
            hueRange: 30,
            saturation: saturation,
            saturationRange: 0.2,
            lightness: lightness,
            lightnessRange: 0.2
          },
          correctParent: matchedColor.parent.name,
          confidence: 60,
          usageCount: 1
        };
        knowledgeBase.parentPatterns.push(newParentPattern);
      }
    } else if (feedback.parent === 'bad' && feedback.parentCorrection) {
      console.log('Bad parent match with correction:', feedback.parentCorrection);
      // Create or update pattern for this specific color
      // The pattern will indicate that this color should map to the corrected parent
      const existingPattern = findExistingParentPattern(originalColor, knowledgeBase.parentPatterns);
      
      if (existingPattern) {
        console.log('Updating existing parent pattern with correction');
        existingPattern.correctParent = feedback.parentCorrection.name;
        existingPattern.confidence = Math.min(100, existingPattern.confidence + 10);
        existingPattern.usageCount = (existingPattern.usageCount || 0) + 1;
      } else {
        console.log('Creating new parent pattern with correction');
        const newParentPattern = {
          type: 'color_properties',
          condition: {
            hue: hue,
            hueRange: 20,
            saturation: saturation,
            saturationRange: 0.15,
            lightness: lightness,
            lightnessRange: 0.15
          },
          correctParent: feedback.parentCorrection.name,
          confidence: 70,
          usageCount: 1
        };
        knowledgeBase.parentPatterns.push(newParentPattern);
      }
    }
  }
  
  console.log('Feedback processing complete. Knowledge base now has', 
    knowledgeBase.patterns.length, 'Pantone patterns and',
    knowledgeBase.parentPatterns?.length || 0, 'parent patterns');
  return knowledgeBase;
};

// Find existing parent pattern that matches the color
const findExistingParentPattern = (hexColor, parentPatterns) => {
  if (!parentPatterns || !parentPatterns.length) return null;
  
  const color = chroma(hexColor);
  const [h, s, l] = color.hsl();
  
  // Handle NaN values in HSL
  const hue = isNaN(h) ? 0 : h;
  const saturation = isNaN(s) ? 0 : s;
  const lightness = isNaN(l) ? 0 : l;
  
  // Find a matching pattern
  return parentPatterns.find(pattern => {
    if (pattern.type !== 'color_properties') return false;
    
    const hueMatch = Math.abs(pattern.condition.hue - hue) <= pattern.condition.hueRange || 
                     (pattern.condition.hue > 340 && hue < 20) || 
                     (hue > 340 && pattern.condition.hue < 20);
    const saturationMatch = Math.abs(pattern.condition.saturation - saturation) <= pattern.condition.saturationRange;
    const lightnessMatch = Math.abs(pattern.condition.lightness - lightness) <= pattern.condition.lightnessRange;
    
    return hueMatch && saturationMatch && lightnessMatch;
  });
};

// Find the closest Pantone color with enhanced matching
const findEnhancedPantoneColor = (hexColor, pantoneColors, knowledgeBase, parentColorOverride) => {
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
  
  // Find closest parent color or use override from knowledge base
  let closestParent = null;
  let parentDistance = Infinity;
  let parentEnhancementApplied = false;
  
  // Default parent colors if not provided
  const defaultParentColors = [
    { name: "Red", hex: "#FF0000" },
    { name: "Cyan", hex: "#00FFFF" },
    { name: "Blue", hex: "#0000FF" },
    { name: "DarkBlue", hex: "#00008B" },
    { name: "LightBlue", hex: "#ADD8E6" },
    { name: "Purple", hex: "#800080" },
    { name: "Gold", hex: "#FFD700" },
    { name: "Lime", hex: "#00FF00" },
    { name: "Magenta", hex: "#FF00FF" },
    { name: "Silver", hex: "#C0C0C0" },
    { name: "Orange", hex: "#FFA500" },
    { name: "Brown", hex: "#A52A2A" },
    { name: "Maroon", hex: "#800000" },
    { name: "Green", hex: "#008000" },
    { name: "Olive", hex: "#808000" },
    { name: "Grey", hex: "#808080" },
    { name: "White", hex: "#FFFFFF" },
    { name: "Black", hex: "#000000" }
  ];
  
  // If we have a parent color override from the knowledge base, use it
  if (parentColorOverride) {
    console.log(`Using parent color override: ${parentColorOverride}`);
    // Find the parent color by name
    const overrideParent = defaultParentColors.find(p => p.name === parentColorOverride);
    if (overrideParent) {
      const parentChroma = chroma(overrideParent.hex);
      const distance = chroma.deltaE(chromaColor, parentChroma);
      
      closestParent = {
        ...overrideParent,
        distance: distance,
        confidence: calculateConfidence(distance),
        overridden: true
      };
      parentEnhancementApplied = true;
    }
  } 
  
  // If no override or override not found, use closest parent by distance
  if (!closestParent) {
    defaultParentColors.forEach(parent => {
      const parentChroma = chroma(parent.hex);
      const distance = chroma.deltaE(chromaColor, parentChroma);
      
      if (distance < parentDistance) {
        parentDistance = distance;
        closestParent = {
          ...parent,
          distance: distance,
          confidence: calculateConfidence(distance),
          overridden: false
        };
      }
    });
  }
  
  return {
    name: closestColor.name,
    code: closestColor.pantone,
    hex: `#${closestColor.hex}`,
    distance: standardDistance,
    confidence: calculateConfidence(standardDistance),
    enhancementApplied: enhancementMethod !== null,
    enhancementMethod,
    originalColor: hexColor,
    adjustedColor: adjustedColor !== hexColor ? adjustedColor : undefined,
    parent: closestParent,
    parentEnhancementApplied
  };
};

// Main handler function
exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET'
  };
  
  // Handle OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }
  
  // Handle GET request for knowledge base
  if (event.httpMethod === 'GET') {
    try {
      console.log('Handling GET request for knowledge base');
      const knowledgeBase = await loadKnowledgeBase();
      
      // Create a simplified summary of the knowledge base
      const summary = {
        version: knowledgeBase.version,
        lastUpdated: knowledgeBase.lastUpdated,
        patternCount: knowledgeBase.patterns.length,
        parentPatternCount: knowledgeBase.parentPatterns?.length || 0,
        parameters: knowledgeBase.parameters,
        patterns: knowledgeBase.patterns.map(pattern => ({
          type: pattern.type,
          condition: pattern.condition,
          confidence: pattern.confidence,
          usageCount: pattern.usageCount || 0
        })),
        parentPatterns: (knowledgeBase.parentPatterns || []).map(pattern => ({
          type: pattern.type,
          condition: {
            hue: pattern.condition.hue,
            saturation: pattern.condition.saturation,
            lightness: pattern.condition.lightness
          },
          correctParent: pattern.correctParent,
          confidence: pattern.confidence,
          usageCount: pattern.usageCount || 0
        }))
      };
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          knowledgeBase: summary
        })
      };
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: error.message
        })
      };
    }
  }
  
  // Only accept POST requests for matching
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }
  
  try {
    const requestBody = JSON.parse(event.body);
    console.log('Received request:', {
      type: event.httpMethod,
      hasFeedback: !!requestBody.feedback,
      color: requestBody.color
    });
    
    if (!requestBody.color) {
      throw new Error('Color is required');
    }
    
    const hexColor = requestBody.color;
    
    // Load knowledge base from S3
    const knowledgeBase = await loadKnowledgeBase();
    console.log('Loaded knowledge base:', {
      version: knowledgeBase.version,
      patternCount: knowledgeBase.patterns.length,
      parentPatternCount: knowledgeBase.parentPatterns?.length || 0,
      lastUpdated: knowledgeBase.lastUpdated
    });
    
    // Get parent color based on patterns if applicable
    const parentColorOverride = findParentColorFromPatterns(hexColor, knowledgeBase.parentPatterns);
    
    // Find the enhanced match
    const match = findEnhancedPantoneColor(hexColor, processedColors, knowledgeBase, parentColorOverride);
    
    if (!match) {
      throw new Error('Failed to find a match');
    }

    // If this was a successful match and feedback was provided
    if (requestBody.feedback) {
      console.log('Processing feedback from request:', {
        feedback: requestBody.feedback,
        originalColor: hexColor,
        match: {
          name: match.name,
          code: match.code,
          distance: match.distance
        },
        parentFeedback: requestBody.parentFeedback,
        parentCorrection: requestBody.parentCorrection
      });

      // Prepare feedback object for processing
      const feedbackObj = {
        pantone: requestBody.feedback,
        parent: requestBody.parentFeedback || 'bad', // Default to bad if not specified
        parentCorrection: requestBody.parentCorrection
      };

      const updatedKnowledgeBase = processFeedback(
        hexColor,
        match,
        feedbackObj,
        knowledgeBase
      );
      
      console.log('Knowledge base updated, preparing to save:', {
        oldPatternCount: knowledgeBase.patterns.length,
        newPatternCount: updatedKnowledgeBase.patterns.length,
        newParentPatternCount: updatedKnowledgeBase.parentPatterns?.length || 0,
        lastUpdated: new Date().toISOString()
      });

      updatedKnowledgeBase.lastUpdated = new Date().toISOString();
      const updateSuccess = await updateKnowledgeBase(updatedKnowledgeBase);
      
      console.log('Knowledge base save result:', {
        success: updateSuccess,
        timestamp: new Date().toISOString()
      });
    }
    
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
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        details: {
          knowledgeKey: KNOWLEDGE_KEY
        }
      })
    };
  }
};

// Find a parent color from the patterns
const findParentColorFromPatterns = (hexColor, parentPatterns) => {
  if (!parentPatterns || !parentPatterns.length) return null;
  
  const matchingPattern = findExistingParentPattern(hexColor, parentPatterns);
  if (matchingPattern && matchingPattern.correctParent && matchingPattern.confidence > 50) {
    return matchingPattern.correctParent;
  }
  
  return null;
};