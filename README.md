# Image Color Analysis Application

## Overview
This application analyzes images to extract dominant colors and matches them against Pantone colors and parent color categories. It uses the LAB color space and Delta E color difference algorithm for accurate, perceptually meaningful color matching.

## Key Features
- Image color extraction using k-means clustering
- Color matching against Pantone colors and parent colors
- Visualization of color distribution with interactive charts
- Analysis of problematic color matches
- Support for saving and managing presets
- Enhanced tooltips providing detailed information about color spaces and analysis methods.

## Technical Architecture

### Core Services

#### `colorUtils.js`
Centralized utility functions for color-related operations:
- Confidence score calculation
- Color grouping across images
- Chart data preparation
- UI helper functions for confidence visualization

#### `colorMatcher.js`
Core color matching functionality:
- Finding closest Pantone color
- Finding closest parent color with perceptual weighting
- Analyzing problematic matches
- Delta E color distance calculation

#### `imageAnalyzer.js`
High-level image analysis:
- Orchestrates the color extraction and matching process
- LAB color space and Delta E as primary methods
- Result generation with metadata

#### `colorAnalysis.js`
Image color extraction:
- Loading image data with alpha channel support
- Extracting representative colors using k-means clustering
- Calculating color percentages

#### `imageAnalyzerSupport.js`
Low-level support for image analysis:
- K-means clustering implementation
- Color space conversion
- Pixel sampling
- Euclidean distance calculation

### Composables

#### `useAnalysisSettings.js`
Manages analysis settings:
- Default settings with LAB and Delta E
- Settings persistence and loading
- Setting validation and updates

#### `useImageAnalysis.js`
Handles image analysis operations:
- Image processing state management
- Analysis execution
- Result management

#### `usePresets.js`
Manages preset functionality:
- Loading, saving, and deleting presets
- Managing active preset

### Components

#### `ImageAnalysisResult.vue`
Displays analysis results for a single image:
- Color distribution visualization
- Color matching details
- Problematic matches highlighting

#### `OverallAnalaysis.vue`
Shows aggregated analysis across multiple images:
- Combined color distribution
- Parent color grouping

#### `GroupedColorsDoughnut.vue`
Interactive doughnut chart for color visualization:
- Parent and child color relationships
- Detailed tooltips with color information

## Color Matching Process
1. **Image Loading**: Load image and extract pixel data
2. **Color Extraction**: Use k-means clustering in LAB space to identify dominant colors
3. **Pantone Matching**: Find closest Pantone color for each extracted color
4. **Parent Matching**: Find closest parent color category with perceptual weighting
5. **Confidence Calculation**: Calculate confidence scores based on color distances
6. **Result Compilation**: Combine results with metadata about problematic matches
7. **Analysis Settings**: The system uses LAB color space and DELTA_E distance calculation for accurate color matching.

## Simplifications Made
- Focused exclusively on LAB color space for perceptual accuracy
- Used only Delta E for color difference calculation
- Centralized color utility functions in a dedicated service
- Simplified component structure with clear responsibilities
- Improved code documentation and organization
- Prepared for future machine learning integration by making the flow more traceable

## Future Enhancements
- Machine learning integration for improved perceptual matching
- User surveys for problematic matches to improve matching algorithm
- Weighted results based on human perception data
- Additional visualization options

## Technologies Used
- Vue.js for UI components
- Chroma.js for color manipulation
- ML-kmeans for color clustering
- Highcharts for data visualization

