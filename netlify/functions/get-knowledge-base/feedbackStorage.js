// Local feedback storage utilities for this function
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { BUCKET, createS3Client } = require("../shared/storage-config");

// Initialize S3 client for DigitalOcean Spaces
const s3Client = createS3Client();

// Constants
const BUCKET_NAME = BUCKET;
const KNOWLEDGE_BASE_KEY = "image-colors/data/knowledge.json";

// Get the default knowledge base structure
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
      Key: KNOWLEDGE_BASE_KEY,
    });

    try {
      const response = await s3Client.send(command);
      const data = await response.Body.transformToString();
      console.log('Successfully loaded knowledge base from S3');
      return JSON.parse(data);
    } catch (s3Error) {
      console.log('Knowledge base not found in S3, creating default...');
      return getDefaultKnowledgeBase();
    }
  } catch (error) {
    console.error('Error with knowledge base:', error);
    return getDefaultKnowledgeBase();
  }
};

module.exports = {
  loadKnowledgeBase
}; 