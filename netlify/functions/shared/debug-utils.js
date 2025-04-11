/**
 * debug-utils.js - Shared debugging utilities for Netlify functions
 * 
 * This module provides enhanced logging and debugging capabilities
 * that can be imported into any Netlify function.
 */

// Get debug level from environment or use default 'info'
const DEBUG_LEVEL = process.env.DEBUG_LEVEL || 'info';

// Debug levels in order of verbosity
const LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  verbose: 4
};

// Should we log for the current level?
const shouldLog = (level) => {
  return LEVELS[level] <= LEVELS[DEBUG_LEVEL];
};

/**
 * Enhanced console logger with timestamps and level-based filtering
 */
const logger = {
  error: (message, ...args) => {
    if (shouldLog('error')) {
      console.error(`[ERROR ${new Date().toISOString()}]`, message, ...args);
    }
  },
  
  warn: (message, ...args) => {
    if (shouldLog('warn')) {
      console.warn(`[WARN ${new Date().toISOString()}]`, message, ...args);
    }
  },
  
  info: (message, ...args) => {
    if (shouldLog('info')) {
      console.log(`[INFO ${new Date().toISOString()}]`, message, ...args);
    }
  },
  
  debug: (message, ...args) => {
    if (shouldLog('debug')) {
      console.log(`[DEBUG ${new Date().toISOString()}]`, message, ...args);
    }
  },
  
  verbose: (message, ...args) => {
    if (shouldLog('verbose')) {
      console.log(`[VERBOSE ${new Date().toISOString()}]`, message, ...args);
    }
  },
  
  // Special method for logging TensorFlow operations
  tf: (operation, ...args) => {
    if (shouldLog('debug')) {
      console.log(`[TF ${new Date().toISOString()}] ${operation}`, ...args);
    }
  }
};

/**
 * Measures execution time of an async function
 * @param {string} label - Label for the timing
 * @param {Function} fn - Async function to execute
 * @returns {Promise<any>} - The result of the function
 */
async function timeExecution(label, fn) {
  const start = Date.now();
  try {
    logger.debug(`Starting: ${label}`);
    const result = await fn();
    const elapsed = Date.now() - start;
    logger.debug(`Completed: ${label} (${elapsed}ms)`);
    return result;
  } catch (error) {
    const elapsed = Date.now() - start;
    logger.error(`Failed: ${label} (${elapsed}ms)`, error);
    throw error;
  }
}

/**
 * Creates a middleware that adds debug headers to the response
 * @param {Function} handler - The original handler function
 * @returns {Function} - The wrapped handler function
 */
function withDebugHeaders(handler) {
  return async (event, context) => {
    const startTime = Date.now();
    
    try {
      const result = await handler(event, context);
      
      // Add debug headers if we're in a debug level
      if (shouldLog('debug')) {
        const headers = result.headers || {};
        headers['X-Execution-Time'] = `${Date.now() - startTime}ms`;
        headers['X-Debug-Level'] = DEBUG_LEVEL;
        
        return {
          ...result,
          headers
        };
      }
      
      return result;
    } catch (error) {
      logger.error('Function execution failed', error);
      
      // Add debug headers even on error
      const headers = {};
      headers['X-Execution-Time'] = `${Date.now() - startTime}ms`;
      headers['X-Debug-Level'] = DEBUG_LEVEL;
      headers['X-Error'] = 'true';
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: DEBUG_LEVEL === 'verbose' ? error.stack : error.message
        })
      };
    }
  };
}

module.exports = {
  logger,
  timeExecution,
  withDebugHeaders
}; 