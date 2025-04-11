# TensorFlow Color Matching System

This document explains the TensorFlow.js integration for enhanced color matching in the Image Colors application.

## Overview

The application uses TensorFlow.js to enhance color matching by learning from user feedback. The traditional mathematical color matching (using color distance metrics like Delta-E) is supplemented with a neural network trained on user feedback, allowing the system to improve over time.

## How It Works

### Architecture

1. **Hybrid Matcher**: 
   - `HybridColorMatcher` combines mathematical color matching with machine learning.
   - When a color is matched, it first uses mathematical distance calculations.
   - Once enough training data is collected, the ML model can override mathematical matches.

2. **Neural Network Design**:
   - Input: 18 features (9 from target color, 9 from mathematical match)
   - Hidden layers: 32 and 24 neurons with ReLU activation
   - Output: Probabilities for each parent color (softmax)

3. **Feature Engineering**:
   - Color features are extracted from multiple color spaces (RGB, HSL, LAB)
   - Both target color and mathematical match are used as features

### Data Collection & Training

1. **User Feedback Channels**:
   - **Direct Feedback**: Users can provide corrections on specific color matches
   - **Play Mode**: Users play a game-like interface to provide more training data
   
2. **Training Workflow**:
   - User feedback is collected and stored
   - When enough examples are collected, training is triggered
   - Model is trained on all collected examples
   - Updated model is saved to cloud storage
   
3. **Persistence**:
   - Models are stored in DigitalOcean Spaces/AWS S3
   - This allows the model to improve over time with more user feedback

## Setup and Configuration

### 1. Create a DigitalOcean Spaces Bucket

The system needs cloud storage to save and load the trained models:

1. Create a [DigitalOcean Spaces bucket](https://cloud.digitalocean.com/spaces)
2. Generate access keys from the "API" section 
3. Copy the keys to your `.env` file:

```
MY_AWS_ACCESS_KEY_ID=your_access_key_here
MY_AWS_SECRET_ACCESS_KEY=your_secret_key_here
```

### 2. Configure Bucket Settings (Optional)

If you want to use a different bucket than the default:

1. Open `netlify/functions/learning/saveModel.js` and `getModel.js`
2. Update the `BUCKET_NAME` constant to your bucket name
3. Update the key paths if needed

### 3. Deploying to Netlify

The TensorFlow integration works in both development and production:

1. For development testing:
   ```
   yarn dev
   ```

2. For production deployment:
   - Push to your Netlify-connected repository
   - Ensure environment variables are set in Netlify dashboard

## Debugging and Monitoring

### Training Monitor

Visit the training page at `/train` to access:
- Model status and statistics
- Training data visualization
- Test interface for color matching
- Debug information

### Console Logs

The system logs detailed information to the console about:
- Model initialization
- Training processes
- Predictions and confidence scores
- Errors and troubleshooting information

## Technical Details

### Color Feature Extraction

For each color, the following features are extracted:

- **RGB**: Normalized RGB values (0-1)
- **HSL**: Normalized hue (0-1), saturation (0-1), lightness (0-1)
- **LAB**: Normalized L (0-1), a and b components (0-1)

### Model Training

- **Batch Size**: 16
- **Epochs**: 100 (configurable)
- **Loss Function**: Categorical Cross-Entropy
- **Optimizer**: Adam with 0.001 learning rate

### Decision Process

The system uses a hybrid approach to determine color matches:

1. Always compute mathematical match as baseline
2. If ML model confidence > threshold (default 0.7), use ML prediction
3. Otherwise, use the mathematical match

This ensures reliable results even with limited training data.

## Frequently Asked Questions

### How many training examples are needed?

The system begins training when at least 5 examples are collected, but accuracy improves with more data. For production use, at least 50-100 examples are recommended.

### Can I export the trained model?

Currently, the model is only stored in cloud storage. Future versions may support local download of the model.

### What if users provide contradictory feedback?

The system handles contradictions through confidence scores and majority voting. More recent and more frequent feedback has higher influence.

### Does this use a pre-trained model?

No, the model is trained completely from user feedback collected in your application. There is no pre-trained model. 