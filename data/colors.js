/**
 * colors.js
 * 
 * Exports parent colors for use in the application
 * This bridges between the composable and services that need direct access to the colors
 */

// Import from the composable to avoid duplication
import { useParentColors } from '@/composables/useParentColors';

// Get the default parent colors by accessing the composable's internal values
// This maintains a single source of truth for the parent colors
const { parentColors: composableColors } = useParentColors();

// Export for direct import by services
export const parentColors = composableColors; 