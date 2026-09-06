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

These functions require the following environment variables (see `.env.example` at the repo root):

```
# Storage - read by shared/storage-config.js (every function imports it)
MY_AWS_ACCESS_KEY_ID=...
MY_AWS_SECRET_ACCESS_KEY=...
# optional overrides, defaults: bengijzel / https://ams3.digitaloceanspaces.com / us-east-1
SPACES_BUCKET=...
SPACES_ENDPOINT=...
SPACES_PUBLIC_URL=...

# API Access - the presets/upload functions accept ONLY this token (no fallback)
PRESET_ACCESS_TOKEN=...
NUXT_PUBLIC_PRESET_ACCESS_TOKEN=...   # same value, exposed to the browser so the app can call them
PRESET_CREATION_TOKEN=...             # Strapi API token, server-side only

# Debug level
DEBUG_LEVEL=info
```

`URL` / `DEPLOY_PRIME_URL` are provided by Netlify and used to call sibling functions
(no more hardcoded production URL).

Object visibility on Spaces: uploaded **images are `public-read`** (the app displays them by URL);
**feedback, knowledge-base and model JSON are private** and are only read through the SDK with
credentials.

Set these in the Netlify UI under Environment variables, or in a `.env` file for local development.