import fs from 'fs';
import path from 'path';

// Constants
const FEEDBACK_FILE = path.resolve(process.cwd(), 'data/feedback.json');
const KNOWLEDGE_FILE = path.resolve(process.cwd(), 'data/knowledge.json');
const STORAGE_MODE = process.env.FEEDBACK_STORAGE_MODE || 'file'; // 'file' or 'cms'

// Configuration for CMS integration (for future use)
const CMS_CONFIG = {
  apiKey: process.env.CMS_API_KEY,
  endpoint: process.env.CMS_ENDPOINT,
  feedbackEntityType: process.env.CMS_FEEDBACK_ENTITY || 'colorFeedback',
  knowledgeEntityType: process.env.CMS_KNOWLEDGE_ENTITY || 'colorKnowledgeBase'
};

// Create data directory if it doesn't exist
const ensureDataDirectory = () => {
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Initialize feedback file if it doesn't exist
const initFeedbackFile = () => {
  ensureDataDirectory();
  
  if (!fs.existsSync(FEEDBACK_FILE)) {
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify({
      feedbackEntries: [],
      lastUpdated: new Date().toISOString()
    }));
  }
};

// Initialize knowledge file if it doesn't exist
const initKnowledgeFile = () => {
  ensureDataDirectory();
  
  if (!fs.existsSync(KNOWLEDGE_FILE)) {
    fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify({
      patterns: [],
      parameters: {
        deltaEWeight: 0.7,
        labWeight: 0.3
      },
      version: 1,
      lastUpdated: new Date().toISOString()
    }));
  }
};

// CMS Interface (placeholder for future implementation)
const cmsInterface = {
  /**
   * Get feedback entries from CMS
   * @returns {Promise<Array>} - Array of feedback entries
   */
  getFeedbackEntries: async () => {
    try {
      // This would be implemented to fetch data from the CMS
      console.log('CMS getFeedbackEntries not yet implemented');
      return [];
    } catch (error) {
      console.error('Error fetching feedback from CMS:', error);
      return [];
    }
  },
  
  /**
   * Add a new feedback entry to CMS
   * @param {Object} entry - Feedback entry to add
   * @returns {Promise<Object>} - Result of operation
   */
  addFeedbackEntry: async (entry) => {
    try {
      // This would be implemented to add data to the CMS
      console.log('CMS addFeedbackEntry not yet implemented');
      console.log('Would add entry:', entry);
      return { 
        success: false, 
        error: 'CMS integration not implemented',
        id: `placeholder-${Date.now()}`
      };
    } catch (error) {
      console.error('Error adding feedback to CMS:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Get knowledge base from CMS
   * @returns {Promise<Object>} - Knowledge base
   */
  getKnowledgeBase: async () => {
    try {
      // This would be implemented to fetch knowledge base from the CMS
      console.log('CMS getKnowledgeBase not yet implemented');
      return {
        patterns: [],
        parameters: {
          deltaEWeight: 0.7,
          labWeight: 0.3
        },
        version: 1,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching knowledge base from CMS:', error);
      return {
        patterns: [],
        parameters: {
          deltaEWeight: 0.7,
          labWeight: 0.3
        },
        version: 1,
        lastUpdated: new Date().toISOString()
      };
    }
  },
  
  /**
   * Update knowledge base in CMS
   * @param {Object} knowledge - Knowledge base to update
   * @returns {Promise<Object>} - Result of operation
   */
  updateKnowledgeBase: async (knowledge) => {
    try {
      // This would be implemented to update knowledge base in the CMS
      console.log('CMS updateKnowledgeBase not yet implemented');
      console.log('Would update knowledge:', knowledge);
      return { success: false, error: 'CMS integration not implemented' };
    } catch (error) {
      console.error('Error updating knowledge base in CMS:', error);
      return { success: false, error: error.message };
    }
  }
};

// File-based storage implementation
const fileStorage = {
  /**
   * Get feedback entries from file
   * @returns {Array} - Array of feedback entries
   */
  getFeedbackEntries: () => {
    initFeedbackFile();
    
    try {
      const data = fs.readFileSync(FEEDBACK_FILE, 'utf8');
      return JSON.parse(data).feedbackEntries || [];
    } catch (error) {
      console.error('Error reading feedback file:', error);
      return [];
    }
  },
  
  /**
   * Add a new feedback entry to file
   * @param {Object} entry - Feedback entry to add
   * @returns {Object} - Result of operation
   */
  addFeedbackEntry: (entry) => {
    initFeedbackFile();
    
    try {
      const data = fs.readFileSync(FEEDBACK_FILE, 'utf8');
      const json = JSON.parse(data);
      
      // Generate a unique ID for the entry
      const id = `f${Date.now()}`;
      
      // Add the new entry with ID and timestamp
      json.feedbackEntries.push({
        id,
        timestamp: new Date().toISOString(),
        ...entry
      });
      
      // Update last updated timestamp
      json.lastUpdated = new Date().toISOString();
      
      // Write back to file
      fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(json, null, 2));
      
      return { success: true, id };
    } catch (error) {
      console.error('Error adding feedback entry:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Get knowledge base from file
   * @returns {Object} - Knowledge base
   */
  getKnowledgeBase: () => {
    initKnowledgeFile();
    
    try {
      const data = fs.readFileSync(KNOWLEDGE_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading knowledge file:', error);
      return {
        patterns: [],
        parameters: {
          deltaEWeight: 0.7,
          labWeight: 0.3
        },
        version: 1,
        lastUpdated: new Date().toISOString()
      };
    }
  },
  
  /**
   * Update knowledge base in file
   * @param {Object} knowledge - Knowledge base to update
   * @returns {Object} - Result of operation
   */
  updateKnowledgeBase: (knowledge) => {
    initKnowledgeFile();
    
    try {
      // Update last updated timestamp
      const updatedKnowledge = {
        ...knowledge,
        lastUpdated: new Date().toISOString()
      };
      
      // Write to file
      fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify(updatedKnowledge, null, 2));
      
      return { success: true };
    } catch (error) {
      console.error('Error updating knowledge base:', error);
      return { success: false, error: error.message };
    }
  }
};

// Select storage method based on configuration
const storage = STORAGE_MODE === 'cms' ? cmsInterface : fileStorage;

// Public API
// Get all feedback entries
export const getFeedbackEntries = async () => {
  return await Promise.resolve(storage.getFeedbackEntries());
};

// Add a new feedback entry
export const addFeedbackEntry = async (entry) => {
  return await Promise.resolve(storage.addFeedbackEntry(entry));
};

// Get knowledge base
export const getKnowledgeBase = async () => {
  return await Promise.resolve(storage.getKnowledgeBase());
};

// Update knowledge base
export const updateKnowledgeBase = async (knowledge) => {
  return await Promise.resolve(storage.updateKnowledgeBase(knowledge));
};

// Export initialization functions for use in Netlify functions
export const init = {
  ensureDataDirectory,
  initFeedbackFile,
  initKnowledgeFile
}; 