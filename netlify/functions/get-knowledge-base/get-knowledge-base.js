const { loadKnowledgeBase } = require('../shared/feedbackStorage');

/**
 * Serverless function to get the current knowledge base
 */
exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };
  
  // Handle OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }
  
  // Only accept GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }
  
  try {
    console.log('Fetching knowledge base data');
    
    // Get knowledge base
    const knowledgeBase = await loadKnowledgeBase();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        knowledgeBase
      })
    };
  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    
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