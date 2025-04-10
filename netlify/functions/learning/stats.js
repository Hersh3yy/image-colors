/**
 * stats.js - Netlify function to retrieve ML training stats
 * 
 * This function returns statistics about model training,
 * including number of examples, last trained date, etc.
 */

const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

// Initialize S3 client for DigitalOcean Spaces
const s3Client = new S3Client({
  endpoint: "https://ams3.digitaloceanspaces.com",
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
  },
});

// Constants for storage
const BUCKET_NAME = "bengijzel";
const METADATA_KEY = "image-colors/models/tensorflow/metadata.json";
const EXAMPLES_KEY = "image-colors/models/tensorflow/training_examples.json";

/**
 * Retrieves an object from S3/DO Spaces
 * @param {string} key - The key of the object to retrieve
 * @returns {Promise<any>} - The retrieved object
 */
async function getObjectFromStorage(key) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });
    
    const response = await s3Client.send(command);
    
    // Read the object stream
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    
    // Combine chunks and parse as JSON
    const responseBody = Buffer.concat(chunks).toString('utf-8');
    return JSON.parse(responseBody);
  } catch (error) {
    console.log(`Error retrieving ${key}:`, error);
    return null;
  }
}

/**
 * Netlify function handler
 */
exports.handler = async (event) => {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };
  
  // Handle OPTIONS (CORS preflight) request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }
  
  try {
    // Get metadata
    const metadata = await getObjectFromStorage(METADATA_KEY) || {};
    
    // Get examples count
    let examplesCount = 0;
    try {
      const examples = await getObjectFromStorage(EXAMPLES_KEY) || [];
      examplesCount = examples.length;
    } catch (e) {
      console.warn("Could not get examples count:", e);
    }
    
    // Return stats
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        stats: {
          isModelTrained: !!metadata.lastTrainedDate,
          trainingExamplesCount: examplesCount,
          pendingExamplesCount: 0,
          lastTrainedDate: metadata.lastTrainedDate || null,
          totalTrainingRuns: metadata.totalTrainingRuns || 0
        }
      })
    };
  } catch (error) {
    console.error("Error getting training stats:", error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Error getting training stats: " + error.message
      })
    };
  }
}; 