/**
 * saveModel.js - Netlify function to save a trained ML model
 * 
 * This function saves the TensorFlow.js model and training examples
 * to DigitalOcean Spaces storage. It's called after collecting 
 * enough feedback and retraining the model.
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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
  try {
    // Convert to JSON string
    const jsonData = JSON.stringify(data);
    
    // Create command
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: jsonData,
      ContentType: "application/json"
    });
    
    // Send command
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
    return false;
  }
}

/**
 * Netlify function handler
 */
export async function handler(event) {
  try {
    // Parse request body
    const data = JSON.parse(event.body);
    
    // Validate required data
    if (!data.modelData) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: "No model data provided"
        })
      };
    }
    
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
    
    // Check if all saves were successful
    if (!modelSaved || !examplesSaved || !metadataSaved) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: "Failed to save all model components"
        })
      };
    }
    
    // Return success
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Model saved successfully"
      })
    };
  } catch (error) {
    console.error("Error saving model:", error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: "Error saving model: " + error.message
      })
    };
  }
} 