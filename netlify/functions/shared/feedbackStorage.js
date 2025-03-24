// Shared feedback storage utilities for Netlify Functions
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");

// Initialize S3 client for DigitalOcean Spaces (or any S3-compatible storage)
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
      
      // Create default knowledge base in S3
      const defaultBase = getDefaultKnowledgeBase();
      const putCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: KNOWLEDGE_BASE_KEY,
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
      
      // Create empty feedback array in S3
      const emptyFeedback = [];
      const putCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: FEEDBACK_KEY,
        Body: JSON.stringify(emptyFeedback, null, 2),
        ContentType: 'application/json',
        ACL: 'public-read'
      });
      
      await s3Client.send(putCommand);
      console.log('Created empty feedback in S3');
      return emptyFeedback;
    }
  } catch (error) {
    console.error('Error getting feedback entries:', error);
    return [];
  }
};

// Save feedback entries
const saveFeedbackEntries = async (entries) => {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: FEEDBACK_KEY,
      Body: JSON.stringify(entries, null, 2),
      ContentType: 'application/json',
      ACL: 'public-read'
    });
    
    await s3Client.send(command);
    console.log('Successfully saved feedback entries to S3');
    return true;
  } catch (error) {
    console.error('Error saving feedback entries:', error);
    return false;
  }
};

// Update knowledge base in S3
const saveKnowledgeBase = async (knowledgeBase) => {
  try {
    console.log('Attempting to update knowledge base in S3...');

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: KNOWLEDGE_BASE_KEY,
      Body: JSON.stringify(knowledgeBase, null, 2),
      ContentType: 'application/json',
      ACL: 'public-read'
    });
    
    await s3Client.send(command);
    console.log('Successfully updated knowledge base in S3');
    return true;
  } catch (error) {
    console.error('Failed to update knowledge base:', error.message);
    return false;
  }
};

module.exports = {
  getDefaultKnowledgeBase,
  loadKnowledgeBase,
  saveKnowledgeBase,
  getFeedbackEntries,
  saveFeedbackEntries
}; 