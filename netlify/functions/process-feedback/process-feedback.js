const { getFeedbackEntries, saveFeedbackEntries, loadKnowledgeBase, saveKnowledgeBase } = require('./feedbackStorage');
const { updateKnowledgeFromFeedback } = require('./knowledgeBase');

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
    
    // Load the current knowledge base
    const knowledgeBase = await loadKnowledgeBase();
    
    // Update knowledge base with feedback entries
    const updatedKnowledgeBase = updateKnowledgeFromFeedback(feedbackEntries, knowledgeBase);
    
    // Save the updated knowledge base
    const saveResult = await saveKnowledgeBase(updatedKnowledgeBase);
    
    // Clear processed feedback entries
    await saveFeedbackEntries([]);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Knowledge base updated successfully',
        processed: feedbackEntries.length,
        saveSuccess: saveResult,
        patternCount: updatedKnowledgeBase.patterns.length,
        parentPatternCount: updatedKnowledgeBase.parentPatterns?.length || 0
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