/**
 * saveModel.js - Netlify function to save a trained ML model
 * 
 * This function saves the TensorFlow.js model and training examples
 * to DigitalOcean Spaces storage. It's called after collecting 
 * enough feedback and retraining the model.
 */

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
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
 * Saves an object to S3/DO Spaces
 * @param {string} key - The key to save under
 * @param {any} data - The data to save
 * @returns {Promise<boolean>} - Success status
 */
async function saveObjectToStorage(key, data) {
  return timeExecution(`S3:Put:${key}`, async () => {
    try {
      // Convert to JSON string
      const jsonData = JSON.stringify(data);
      logger.debug(`Saving object to storage: ${key}, size: ${jsonData.length} bytes`);
      
      // Create command
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: jsonData,
        ContentType: "application/json"
      });
      
      // Send command
      await s3Client.send(command);
      logger.debug(`Successfully saved object to storage: ${key}`);
      return true;
    } catch (error) {
      logger.error(`Error saving ${key}:`, error);
      return false;
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  
  // Handle OPTIONS (CORS preflight) request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }
  
  try {
    // Parse request body
    const data = JSON.parse(event.body);
    logger.info('Received model save request', {
      hasModelData: !!data.modelData,
      trainingExamplesCount: (data.trainingExamples || []).length,
      lastTrainedDate: data.lastTrainedDate
    });
    
    // Validate required data
    if (!data.modelData) {
      logger.error('Save model request missing model data');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: "No model data provided"
        })
      };
    }
    
    logger.info('Saving model components to storage');
    
    // Save model data
    const modelSaved = await saveObjectToStorage(MODEL_KEY, data.modelData);
    
    // Save training examples
    const examplesSaved = await saveObjectToStorage(
      EXAMPLES_KEY, 
      data.trainingExamples || []
    );
    
    // Save metadata
    const metadataSaved = await saveObjectToStorage(
      METADATA_KEY,
      {
        lastTrainedDate: data.lastTrainedDate || new Date().toISOString(),
        examplesCount: (data.trainingExamples || []).length,
        savedAt: new Date().toISOString()
      }
    );
    
    // Log save status
    logger.info('Model save operation completed', {
      modelSaved,
      examplesSaved,
      metadataSaved
    });
    
    // Check if all saves were successful
    if (!modelSaved || !examplesSaved || !metadataSaved) {
      logger.error('Failed to save all model components');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: "Failed to save all model components"
        })
      };
    }
    
    // Return success
    logger.info('Model saved successfully');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Model saved successfully"
      })
    };
  } catch (error) {
    logger.error("Error saving model:", error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Error saving model: " + error.message
      })
    };
  }
}); 