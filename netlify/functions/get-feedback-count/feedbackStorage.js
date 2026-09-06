// Local feedback storage utilities for this function
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { BUCKET, createS3Client } = require("../shared/storage-config");

// Initialize S3 client for DigitalOcean Spaces
const s3Client = createS3Client();

// Constants
const BUCKET_NAME = BUCKET;
const FEEDBACK_KEY = "image-colors/data/feedback.json";

// Get feedback entries
const getFeedbackEntries = async () => {
  try {
    // Try to load from S3
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: FEEDBACK_KEY,
    });

    try {
      const response = await s3Client.send(command);
      const data = await response.Body.transformToString();
      console.log('Successfully loaded feedback from S3');
      return JSON.parse(data);
    } catch (s3Error) {
      console.log('Feedback data not found in S3, creating empty array...');
      return [];
    }
  } catch (error) {
    console.error('Error getting feedback entries:', error);
    return [];
  }
};

module.exports = {
  getFeedbackEntries
}; 