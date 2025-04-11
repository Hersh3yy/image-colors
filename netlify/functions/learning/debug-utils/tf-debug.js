/**
 * tf-debug.js - TensorFlow-specific debugging utilities
 * 
 * This module provides specialized logging and debugging for TensorFlow
 * operations in Netlify functions.
 */

const { logger, timeExecution } = require('../../shared/debug-utils');

/**
 * Logs tensor information for debugging
 * @param {string} name - Name/label for the tensor
 * @param {tf.Tensor} tensor - TensorFlow tensor to log
 * @param {boolean} printValues - Whether to print the actual values (can be verbose)
 */
function logTensor(name, tensor, printValues = false) {
  if (!tensor) {
    logger.warn(`Tensor '${name}' is null or undefined`);
    return;
  }
  
  try {
    const shape = tensor.shape ? tensor.shape.join('×') : 'unknown';
    const dtype = tensor.dtype || 'unknown';
    
    logger.tf(`Tensor: ${name}`, {
      shape,
      dtype,
      rank: tensor.rank,
      size: tensor.size
    });
    
    if (printValues && tensor.size < 100) {
      // Only print values for reasonably sized tensors
      const values = tensor.arraySync ? tensor.arraySync() : 'Cannot retrieve values';
      logger.verbose(`${name} values:`, values);
    }
  } catch (error) {
    logger.error(`Error logging tensor ${name}:`, error);
  }
}

/**
 * Creates a TensorFlow model layer summary for debugging
 * @param {tf.LayersModel} model - TensorFlow model to summarize
 * @returns {string} - Model summary
 */
function getModelSummary(model) {
  if (!model) {
    logger.warn('Cannot summarize model: null or undefined');
    return 'No model available';
  }
  
  try {
    const layers = model.layers || [];
    
    const summary = layers.map(layer => {
      const config = layer.getConfig ? layer.getConfig() : {};
      const outputShape = layer.outputShape ? 
        (Array.isArray(layer.outputShape) ? layer.outputShape.join('×') : layer.outputShape) : 
        'unknown';
      
      return {
        name: layer.name,
        type: layer.getClassName ? layer.getClassName() : 'Unknown',
        outputShape,
        params: layer.countParams ? layer.countParams() : 'unknown',
        units: config.units,
        activation: config.activation
      };
    });
    
    logger.tf('Model summary:', {
      layers: layers.length,
      totalParams: model.countParams ? model.countParams() : 'unknown'
    });
    
    return summary;
  } catch (error) {
    logger.error('Error generating model summary:', error);
    return 'Error generating model summary';
  }
}

/**
 * Times TensorFlow.js operations and logs performance
 * @param {string} operationName - Name of the operation
 * @param {Function} fn - Async function to execute
 * @returns {Promise<any>} - The result of the function
 */
async function timeTensorFlowOperation(operationName, fn) {
  return timeExecution(`TensorFlow: ${operationName}`, fn);
}

/**
 * Logs memory usage for TensorFlow operations
 */
function logTensorFlowMemory() {
  try {
    // Check if tf is available with memory functions
    if (global.tf && global.tf.memory) {
      const memoryInfo = global.tf.memory();
      logger.tf('Memory usage:', {
        numTensors: memoryInfo.numTensors,
        numDataBuffers: memoryInfo.numDataBuffers,
        unreliable: memoryInfo.unreliable,
        reasons: memoryInfo.reasons
      });
      
      if (memoryInfo.unreliable) {
        logger.warn('TensorFlow memory tracking is unreliable:', memoryInfo.reasons);
      }
    } else {
      logger.debug('TensorFlow memory tracking not available');
    }
  } catch (error) {
    logger.error('Error getting TensorFlow memory info:', error);
  }
}

/**
 * Wraps a TensorFlow training function with additional logging
 * @param {Function} trainingFunction - The async training function to wrap
 * @returns {Function} - The wrapped function with logging
 */
function withTrainingLogging(trainingFunction) {
  return async (...args) => {
    logger.info('Starting model training...');
    logTensorFlowMemory();
    
    const startTime = Date.now();
    try {
      // Handle case where training function may return a model or training history
      const result = await trainingFunction(...args);
      
      const elapsed = Date.now() - startTime;
      logger.info(`Training completed in ${elapsed}ms`);
      
      // Log memory after training
      logTensorFlowMemory();
      
      if (result && result.model) {
        logger.debug('Training produced a model:');
        getModelSummary(result.model);
      }
      
      if (result && result.history) {
        logger.debug('Training history:', result.history);
      }
      
      return result;
    } catch (error) {
      const elapsed = Date.now() - startTime;
      logger.error(`Training failed after ${elapsed}ms:`, error);
      logTensorFlowMemory();
      throw error;
    }
  };
}

module.exports = {
  logTensor,
  getModelSummary,
  timeTensorFlowOperation,
  logTensorFlowMemory,
  withTrainingLogging
}; 