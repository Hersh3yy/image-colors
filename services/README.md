# Color Matching Services

This directory contains the core color matching algorithms and utilities for the Image Colors application.

## HybridColorMatcher

The `HybridColorMatcher.js` file implements a hybrid approach to color matching that combines:

1. **Traditional mathematical color matching** using LAB color distance
2. **Machine learning-based correction** using TensorFlow.js

### Key Features

- Combines mathematical precision with machine learning adaptability
- Learns from user feedback to improve matches over time
- Specifically addresses common issues like navy blues matching with grays
- Confidence scoring that better represents match quality
- Persistence of models and training data

### Usage Example

```javascript
import HybridColorMatcher from '@/services/learning/HybridColorMatcher';
import { parentColors } from '@/data/colors';

// Create a matcher instance
const matcher = new HybridColorMatcher(parentColors, {
  correctionThreshold: 0.7,
  verbose: true
});

// Define a color to match
const targetColor = {
  rgb: {r: 20, g: 40, b: 80}, // Navy blue
  hsl: {h: 220, s: 60, l: 20},
  lab: {L: 15, a: 5, b: -25}
};

// Find the best match
const match = matcher.findClosestColor(targetColor);
console.log(match);

// When a mismatch is found, provide feedback
matcher.collectTrainingExample(
  targetColor,
  3 // Index of correct parent color
);

// Train the model with collected examples
await matcher.trainCorrectionModel(matcher.getTrainingExamples());

// Save model for future use
await matcher.saveModel();
```

### No API Key Required

TensorFlow.js runs entirely client-side and doesn't require an API key. All model training and inference happens in the user's browser.

## Implementation Details

The HybridColorMatcher uses a neural network with:
- Input layer: 18 features (target color + mathematical match)
- Hidden layers: 32 and 24 neurons with ReLU activation
- Output layer: Softmax classification across parent colors

The model is designed to learn when to override the mathematical approach, rather than replacing it entirely. This gives us the best of both worlds: the predictability of mathematical matching and the adaptability of machine learning.

## Confidence Scoring

The confidence calculation has been improved to show more balanced scores:
- Uses a power curve to better distribute scores
- More generous thresholds for visual indicators (green/yellow/red)
- Normalize scores across different color spaces 