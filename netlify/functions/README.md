# Netlify Functions Documentation

This directory contains serverless functions for the image-colors application.

## Functions Structure

```
netlify/functions/
├── shared/                      # Shared utilities used across functions
│   └── debug-utils.js           # Logging and debugging utilities
├── learning/                    # ML/TensorFlow related functions
│   ├── debug-utils/             # ML-specific debugging utilities
│   │   └── tf-debug.js          # TensorFlow debugging utilities
│   ├── getModel.js              # Retrieves trained ML model
│   ├── saveModel.js             # Saves trained ML model
│   └── stats.js                 # Provides ML training statistics
├── presets/                     # Color preset management
│   └── presets.js               # CRUD operations for color presets
├── colors/                      # Color processing functions
├── feedback/                    # User feedback collection
├── match/                       # Color matching logic
└── upload/                      # Image upload processing
```

## Debugging and Monitoring

All functions have been instrumented with enhanced logging. To enable different logging levels, set the `DEBUG_LEVEL` environment variable to one of:

- `error` - Only errors
- `warn` - Errors and warnings
- `info` - General information (default)
- `debug` - Detailed information for debugging
- `verbose` - All available information including raw data

For local testing, set in your terminal:

```bash
DEBUG_LEVEL=debug netlify dev
```

Or set it in the Netlify UI under Environment variables.

## TensorFlow/ML Functions

### getModel.js

**Purpose**: Retrieves the stored TensorFlow.js model and training examples

**Usage**:
```
GET /api/learning/getModel
```

**Returns**:
- `modelData`: The serialized TensorFlow.js model
- `trainingExamples`: Array of examples used for training
- `lastTrainedDate`: When the model was last trained

### saveModel.js

**Purpose**: Saves a trained TensorFlow.js model and its training examples

**Usage**:
```
POST /api/learning/saveModel
Body: {
  "modelData": {...},           // Serialized TensorFlow.js model
  "trainingExamples": [...],    // Array of training examples 
  "lastTrainedDate": "..."      // ISO date string
}
```

**Returns**:
- Success message or error

### stats.js

**Purpose**: Provides statistics about the ML model's training state

**Usage**:
```
GET /api/learning/stats
```

**Returns**:
- `isModelTrained`: Whether a model exists
- `trainingExamplesCount`: Number of examples used for training
- `lastTrainedDate`: When the model was last trained

## Color Preset Functions

### presets.js

**Purpose**: CRUD operations for color presets stored in Strapi

**Usage**:
```
GET /api/presets?access=ACCESS_TOKEN
POST /api/presets?access=ACCESS_TOKEN
PUT /api/presets/:presetId?access=ACCESS_TOKEN
DELETE /api/presets?access=ACCESS_TOKEN&presetId=PRESET_ID
```

Each operation:
- GET: Retrieves all color presets
- POST: Creates a new color preset
- PUT: Updates an existing preset by ID
- DELETE: Removes a preset by ID

## Local Development

To run and test functions locally:

1. Install Netlify CLI: `npm install -g netlify-cli`
2. Run local dev server: `netlify dev`
3. Functions will be available at `http://localhost:8888/.netlify/functions/[function-name]`

For direct function testing:

```bash
# Test a function directly
netlify functions:invoke learning/getModel

# Test with parameters
netlify functions:invoke presets --querystring "access=banana"
```

## Environment Variables

These functions require the following environment variables:

```
# Storage (for ML models)
MY_AWS_ACCESS_KEY_ID=...
MY_AWS_SECRET_ACCESS_KEY=...

# API Access
PRESET_ACCESS_TOKEN=...
PRESET_CREATION_TOKEN=...

# Debug level
DEBUG_LEVEL=info
```

Set these in the Netlify UI under Environment variables, or in a `.env` file for local development.