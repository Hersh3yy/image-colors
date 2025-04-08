/**
 * useColorMatcherService.js
 * 
 * A composable function that provides access to the HybridColorMatcherService
 * singleton throughout the application. This ensures we have only one instance
 * of the service that can be accessed from any component.
 */

import { ref } from 'vue';
import HybridColorMatcherService from '@/services/learning/HybridColorMatcherService';
import { parentColors } from '@/data/colors';  // Assuming this is where your colors are defined

// Singleton instance
let serviceInstance = null;

/**
 * Provides access to the color matcher service
 * 
 * @returns {HybridColorMatcherService} - The service instance
 */
export function useColorMatcherService() {
  // Create the service only once
  if (!serviceInstance) {
    // Create service with parent colors
    serviceInstance = new HybridColorMatcherService(parentColors);
    
    // Initialize the service
    serviceInstance.initialize().catch(error => {
      console.error('Failed to initialize color matcher service:', error);
    });
  }
  
  return serviceInstance;
} 