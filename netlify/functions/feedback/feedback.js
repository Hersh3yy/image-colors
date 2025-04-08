const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const fetch = require('node-fetch');

// Initialize S3 client for DigitalOcean Spaces
const s3Client = new S3Client({
  endpoint: "https://ams3.digitaloceanspaces.com",
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
  },
});

// Constants for S3 storage
const BUCKET_NAME = "bengijzel";
const FEEDBACK_KEY = "image-colors/data/feedback.json";

// Load feedback data from S3
const loadFeedbackData = async () => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: FEEDBACK_KEY,
    });

    try {
      const response = await s3Client.send(command);
      const data = await response.Body.transformToString();
      return JSON.parse(data);
    } catch (error) {
      console.log('Feedback data not found in S3, creating default...');
      
      // Create default feedback structure
      const defaultData = {
        feedbackEntries: [],
        lastUpdated: new Date().toISOString()
      };
      
      // Save to S3
      await saveFeedbackData(defaultData);
      
      return defaultData;
    }
  } catch (error) {
    console.error('Error loading feedback data:', error);
    throw error;
  }
};

// Save feedback data to S3
const saveFeedbackData = async (data) => {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: FEEDBACK_KEY,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
      ACL: 'public-read'
    });
    
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error saving feedback data:', error);
    throw error;
  }
};

// Add a new feedback entry
const addFeedbackEntry = async (entry) => {
  try {
    // Load existing feedback data
    const data = await loadFeedbackData();
    
    // Generate a unique ID for the entry
    const id = `f${Date.now()}`;
    
    // Add the new entry with ID and timestamp
    data.feedbackEntries.push({
      id,
      timestamp: new Date().toISOString(),
      ...entry
    });
    
    // Update last updated timestamp
    data.lastUpdated = new Date().toISOString();
    
    // Save updated data
    await saveFeedbackData(data);
    
    return { success: true, id };
  } catch (error) {
    console.error('Error adding feedback entry:', error);
    return { success: false, error: error.message };
  }
};

// Trigger knowledge base update
const triggerKnowledgeBaseUpdate = async () => {
  try {
    // Call the match function with feedback flag to update the knowledge base
    const response = await fetch('https://image-colors.netlify.app/.netlify/functions/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        updateKnowledgeBase: true
      })
    });
    
    // If running locally, use:
    // const response = await fetch('http://localhost:8888/.netlify/functions/match', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     updateKnowledgeBase: true
    //   })
    // });
    
    const result = await response.json();
    console.log('Knowledge base update result:', result);
    
    return result;
  } catch (error) {
    console.error('Error triggering knowledge base update:', error);
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
    const result = await addFeedbackEntry(feedback);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    // Trigger knowledge base update
    const updateResult = await triggerKnowledgeBaseUpdate();
    
    // Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        id: result.id,
        message: 'Feedback submitted successfully',
        knowledgeBaseUpdate: updateResult.success ? 'triggered' : 'failed'
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