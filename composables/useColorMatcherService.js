/**
 * useColorMatcherService.js
 * 
 * A composable function that provides access to the HybridColorMatcherService
 * singleton throughout the application. This ensures we have only one instance
 * of the service that can be accessed from any component.
 */

import { ref } from 'vue';
import HybridColorMatcherService from '@/services/learning/HybridColorMatcherService';
import { parentColors } from '@/data/colors';

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
    
    // Get API base - ensure it's a full URL in browser
    let apiBase = '/api';
    if (typeof window !== 'undefined') {
      // Try to get from nuxt.config.ts public runtime config
      try {
        const config = window.__NUXT__?.config?.public || {};
        if (config.NETLIFY_FUNCTIONS_BASE) {
          apiBase = config.NETLIFY_FUNCTIONS_BASE;
        }
      } catch (err) {
        console.warn('Error accessing Nuxt runtime config:', err);
      }
      
      // Ensure it's a full URL
      if (!apiBase.startsWith('http') && !apiBase.startsWith('/')) {
        apiBase = '/' + apiBase;
      }
      
      if (apiBase.startsWith('/')) {
        apiBase = window.location.origin + apiBase;
      }
    }
    
    // Set API base
    serviceInstance.setApiBase(apiBase);
    
    // Initialize the service
    serviceInstance.initialize().catch(error => {
      console.error('Failed to initialize color matcher service:', error);
    });
  }
  
  return serviceInstance;
} 