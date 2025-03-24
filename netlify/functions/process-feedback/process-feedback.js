const { getFeedbackEntries, saveFeedbackEntries, loadKnowledgeBase, saveKnowledgeBase } = require('../shared/feedbackStorage');
const { updateKnowledgeFromFeedback } = require('../shared/knowledgeBase');

/**
 * Serverless function to process feedback entries and update the knowledge base
 * This function should be called periodically (via a scheduled event)
 */
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
    console.log('Starting feedback processing and knowledge base update...');
    
    // Get all feedback entries
    const feedbackEntries = await getFeedbackEntries();
    
    if (!feedbackEntries || feedbackEntries.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'No feedback entries to process',
          processed: 0
        })
      };
    }
    
    console.log(`Processing ${feedbackEntries.length} feedback entries...`);
    
    // Update knowledge base with feedback entries
    const result = await updateKnowledgeFromFeedback(feedbackEntries);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: result.success,
        message: 'Knowledge base updated successfully',
        processed: feedbackEntries.length,
        patternsFound: result.patternsFound,
        neuralNetworkTrained: result.neuralNetworkTrained,
        geneticAlgorithmOptimized: result.geneticAlgorithmOptimized
      })
    };
  } catch (error) {
    console.error('Error processing feedback:', error);
    
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