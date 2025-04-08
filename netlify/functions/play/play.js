const chroma = require('chroma-js');
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const axios = require('axios');

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
const PARENT_COLORS_KEY = "image-colors/data/parent_colors.json";

// Generate a random color
const generateRandomColor = () => {
  // Generate random RGB values
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  
  // Convert to hex
  return chroma(r, g, b).hex();
};

// Get parent colors from storage
const getParentColors = async () => {
  try {
    // Try to load from S3
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: PARENT_COLORS_KEY,
    });

    try {
      const response = await s3Client.send(command);
      const data = await response.Body.transformToString();
      console.log('Successfully loaded parent colors from S3');
      return JSON.parse(data);
    } catch (s3Error) {
      console.log('Parent colors not found in S3, using default colors');
      
      // Return default parent colors
      return [
        { name: "Red", hex: "#FF0000" },
        { name: "Cyan", hex: "#00FFFF" },
        { name: "Blue", hex: "#0000FF" },
        { name: "DarkBlue", hex: "#00008B" },
        { name: "LightBlue", hex: "#ADD8E6" },
        { name: "Purple", hex: "#800080" },
        { name: "Gold", hex: "#FFD700" },
        { name: "Lime", hex: "#00FF00" },
        { name: "Magenta", hex: "#FF00FF" },
        { name: "Silver", hex: "#C0C0C0" },
        { name: "Orange", hex: "#FFA500" },
        { name: "Brown", hex: "#A52A2A" },
        { name: "Maroon", hex: "#800000" },
        { name: "Green", hex: "#008000" },
        { name: "Olive", hex: "#808000" },
        { name: "Grey", hex: "#808080" },
        { name: "White", hex: "#FFFFFF" },
        { name: "Black", hex: "#000000" }
      ];
    }
  } catch (error) {
    console.error('Error loading parent colors:', error);
    throw error;
  }
};

// Main handler function
exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };
  
  // Handle OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }
  
  try {
    // Generate a random color
    const randomColor = generateRandomColor();
    console.log(`Generated random color: ${randomColor}`);
    
    // Get parent colors
    const parentColors = await getParentColors();
    console.log(`Loaded ${parentColors.length} parent colors`);
    
    // Call the match function to get matches for this color
    const matchResponse = await axios.post(
      'https://image-colors.netlify.app/.netlify/functions/match',
      {
        color: randomColor,
        parentColors
      }
    );
    
    // If running locally, use:
    // const matchResponse = await axios.post(
    //   'http://localhost:8888/.netlify/functions/match',
    //   {
    //     color: randomColor,
    //     parentColors
    //   }
    // );
    
    if (!matchResponse.data.success) {
      throw new Error(matchResponse.data.error || 'Failed to match color');
    }
    
    // Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        color: randomColor,
        match: matchResponse.data.match
      })
    };
  } catch (error) {
    console.error('Error in play handler:', error);
    
    // Return error response
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
}; 