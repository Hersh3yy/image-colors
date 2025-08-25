/**
 * useKnowledgeBase - Composable for knowledge base management
 * 
 * This composable handles:
 * - Knowledge base data fetching
 * - Loading states
 * - Error handling
 */

import { ref } from 'vue';

export function useKnowledgeBase() {
  const showKnowledgeBase = ref(false);
  const knowledgeBase = ref(null);
  const knowledgeBaseLoading = ref(false);
  const knowledgeBaseError = ref(null);

  /**
   * Fetch and display the knowledge base
   */
  const viewKnowledgeBase = async () => {
    showKnowledgeBase.value = true;
    knowledgeBaseLoading.value = true;
    knowledgeBaseError.value = null;
    
    try {
      const response = await fetch('/.netlify/functions/match/match', {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch knowledge base: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        knowledgeBase.value = result.knowledgeBase;
      } else {
        throw new Error(result.error || 'Failed to retrieve knowledge base');
      }
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
      knowledgeBaseError.value = error.message;
    } finally {
      knowledgeBaseLoading.value = false;
    }
  };

  /**
   * Close knowledge base modal
   */
  const closeKnowledgeBase = () => {
    showKnowledgeBase.value = false;
  };

  return {
    showKnowledgeBase,
    knowledgeBase,
    knowledgeBaseLoading,
    knowledgeBaseError,
    viewKnowledgeBase,
    closeKnowledgeBase
  };
}
