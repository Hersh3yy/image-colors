/**
 * getModel.js - Netlify function to retrieve a saved ML model
 * 
 * This function retrieves the stored TensorFlow.js model and training
 * examples from DigitalOcean Spaces storage. Used by the client to
 * initialize the color matcher with previously learned patterns.
 */

const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { logger, timeExecution, withDebugHeaders } = require("../shared/debug-utils");

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
const MODEL_KEY = "image-colors/models/tensorflow/model.json";
const EXAMPLES_KEY = "image-colors/models/tensorflow/training_examples.json";
const METADATA_KEY = "image-colors/models/tensorflow/metadata.json";

/**
 * Retrieves an object from S3/DO Spaces
 * @param {string} key - The key of the object to retrieve
 * @returns {Promise<any>} - The retrieved object
 */
async function getObjectFromStorage(key) {
  return timeExecution(`S3:Get:${key}`, async () => {
    try {
      logger.debug(`Retrieving object from storage: ${key}`);
      
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      });
      
      const response = await s3Client.send(command);
      logger.debug(`Retrieved object from storage: ${key}`);
      
      // Read the object stream
      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      
      // Combine chunks and parse as JSON
      const responseBody = Buffer.concat(chunks).toString('utf-8');
      logger.verbose(`Raw response for ${key}:`, responseBody.substring(0, 200) + '...');
      
      const result = JSON.parse(responseBody);
      logger.debug(`Successfully parsed JSON for ${key}, data size: ${responseBody.length} bytes`);
      return result;
    } catch (error) {
      logger.error(`Error retrieving ${key}:`, error);
      return null;
    }
  });
}

/**
 * Netlify function handler wrapped with debug headers middleware
 */
exports.handler = withDebugHeaders(async (event) => {
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
    logger.info('Retrieving ML model data from storage');
    
    // Get model data
    const modelData = await getObjectFromStorage(MODEL_KEY);
    
    // Get training examples
    const trainingExamples = await getObjectFromStorage(EXAMPLES_KEY);
    
    // Get metadata
    const metadata = await getObjectFromStorage(METADATA_KEY);
    
    logger.info('Retrieved model components', {
      hasModel: !!modelData,
      examplesCount: trainingExamples ? trainingExamples.length : 0,
      lastTrainedDate: metadata?.lastTrainedDate
    });
    
    // If no model exists yet, return a helpful message
    if (!modelData) {
      logger.warn('No trained model exists');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          message: "No trained model exists yet. The system will use mathematical matching until feedback is provided."
        })
      };
    }
    
    // Return all the data
    logger.info('Successfully retrieved model data');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        modelData,
        trainingExamples: trainingExamples || [],
        lastTrainedDate: metadata?.lastTrainedDate || new Date().toISOString(),
        message: "Model loaded successfully"
      })
    };
  } catch (error) {
    logger.error("Error retrieving model:", error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Error retrieving model: " + error.message
      })
    };
  }
}); 