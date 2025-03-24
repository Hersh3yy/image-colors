// Local feedback storage utilities for this function
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

// Constants
const BUCKET_NAME = "bengijzel";
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