const fs = require('fs');
const path = require('path');

// Constants
const FEEDBACK_FILE = path.join(__dirname, '../../../data/feedback.json');
const KNOWLEDGE_FILE = path.join(__dirname, '../../../data/knowledge.json');

// Create data directory if it doesn't exist
const ensureDataDirectory = () => {
  const dataDir = path.join(__dirname, '../../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Initialize feedback file if it doesn't exist
const initFeedbackFile = () => {
  ensureDataDirectory();
  
  if (!fs.existsSync(FEEDBACK_FILE)) {
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify({
      feedbackEntries: [],
      lastUpdated: new Date().toISOString()
    }));
  }
};

// Initialize knowledge file if it doesn't exist
const initKnowledgeFile = () => {
  ensureDataDirectory();
  
  if (!fs.existsSync(KNOWLEDGE_FILE)) {
    fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify({
      patterns: [],
      parameters: {
        deltaEWeight: 0.7,
        labWeight: 0.3
      },
      version: 1,
      lastUpdated: new Date().toISOString()
    }));
  }
};

// Add a new feedback entry
const addFeedbackEntry = (entry) => {
  initFeedbackFile();
  
  try {
    const data = fs.readFileSync(FEEDBACK_FILE, 'utf8');
    const json = JSON.parse(data);
    
    // Generate a unique ID for the entry
    const id = `f${Date.now()}`;
    
    // Add the new entry with ID and timestamp
    json.feedbackEntries.push({
      id,
      timestamp: new Date().toISOString(),
      ...entry
    });
    
    // Update last updated timestamp
    json.lastUpdated = new Date().toISOString();
    
    // Write back to file
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(json, null, 2));
    
    return { success: true, id };
  } catch (error) {
    console.error('Error adding feedback entry:', error);
    return { success: false, error: error.message };
  }
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
    
    // Validate the feedback data
    if (!requestBody.originalColor) {
      throw new Error('Original color is required');
    }
    
    if (!requestBody.systemMatch || !requestBody.systemMatch.hex) {
      throw new Error('System match is required');
    }
    
    if (!requestBody.userCorrection || !requestBody.userCorrection.hex) {
      throw new Error('User correction is required');
    }
    
    // Add metrics for the feedback (calculations can be done here)
    const feedback = {
      ...requestBody,
      clientInfo: {
        userAgent: event.headers['user-agent'],
        timestamp: new Date().toISOString(),
      }
    };
    
    // Store the feedback
    const result = addFeedbackEntry(feedback);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    // Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        id: result.id,
        message: 'Feedback submitted successfully'
      })
    };
  } catch (error) {
    console.error('Error in feedback handler:', error);
    
    // Return error response
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
}; 