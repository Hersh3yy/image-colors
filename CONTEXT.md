# Image Colors

Image Colors extracts the dominant colours of paintings, assigns each to a parent colour using a perceptual colour-difference model, and saves sets of analysed images as presets — the groundwork for studying which colours evoke which moods in viewers.

Principle: **keep the words the code and the UI already use**; standardise only where two words mean one thing or one word means two things.

## Language

### Images and presets

**Preset**:
A named, saved set of processed images (a room, an exhibition, an artist) with the settings they were analysed under.
_Avoid_: collection, set, project

**Processed Image**:
One uploaded painting together with the result of analysing it: its colours, percentages, matches and the analysis settings used.
_Avoid_: image (alone, when the result is meant), artwork, result

**Analysis Settings**:
The knobs a run is made with — number of colours (k), sample size, max image size, iterations, confidence threshold, and whether the run is seeded.
_Avoid_: config, options, profile

**Re-analysis**:
Running a Processed Image again with the current Analysis Settings. Unseeded runs may differ slightly — that is expected and visible.
_Avoid_: refresh, recompute

**Overall Analysis**:
Parent-colour percentages aggregated across every Processed Image in a Preset.
_Avoid_: summary, totals, grouped colours

### Colours and matching

**Color** (extracted):
One dominant colour found in a Processed Image, with its Percentage. (Spelled `color` in code, "colour" in prose for Benjamin.)
_Avoid_: swatch, centroid, cluster

**Percentage**:
The share of a Processed Image's visible pixels a Color accounts for. Percentages of one image sum to 100.
_Avoid_: weight, coverage, share

**Parent Color**:
One of a small, fixed list of named anchor colours every Color is assigned to. The list is editable and, from now on, versioned.
_Avoid_: color family, category, colour group, anchor

**Pantone Match**:
The nearest named colour from the reference list shipped with the app. For naming only, never for grouping. (The list needs a recorded source and licence before it goes near a museum.)
_Avoid_: reference colour, swatch name

**Distance**:
How different two colours look, on the CIEDE2000 (ΔE₀₀) scale. About 1 is the smallest difference most people notice; above 10 they read as different colours.
_Avoid_: delta, error, similarity

**Confidence**:
A 0–100 display value derived from Distance for one Match. It is presentation, not a probability — a Distance should always be shown next to it.
_Avoid_: score, accuracy, certainty

**Problematic Match**:
A Match whose Distance exceeds the Analysis Settings' confidence threshold and should get a human look.
_Avoid_: weak match, low-confidence match, bad match

### Learning from people

**Feedback**:
A person's statement that a Color belongs to a different Parent Color (or Pantone Match) than the app chose. The only raw material any learning can use.
_Avoid_: correction, training example, vote

**Play Mode**:
A quick sequence of random colours shown to a person to gather Feedback.
_Avoid_: calibration, game, training mode

**Knowledge Base**:
Everything learned from Feedback, versioned, applied on top of the mathematical Match to re-rank near ties. It never replaces the Distance.
_Avoid_: hybrid matcher, ML model, neural network, enhanced matcher (implementation names)

### One word, two meanings — to resolve in code

- **"Color family"** is used for two things: the HSL hue bands in `ColorFamilyBreakdown.vue` / `ColorFamilyCompact.vue`, and (in the READMEs) the matcher's parent colours. Reserve **Parent Color** for the matcher; rename the HSL grouping **Hue Group** or drop it.
- **`calculateConfidence`** exists in `services/colorUtils.js` (0–100 score) and `composables/useColorUtils.js` (raw CIE76 distance). One name, one meaning: the services version is Confidence; the composable's is Distance.

### Planned (research goal — not yet in the product)

**Mood**: an emotional quality (calm, tense, joyful, …) from a fixed vocabulary agreed with Benjamin.
**Mood Rating**: one person's judgement of how strongly a Processed Image evokes a Mood.
