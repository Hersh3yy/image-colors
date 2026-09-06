# Color-science audit (agent output, 2026-09-06)

## Flow
useImageAnalysis.analyzeImage → imageAnalyzer.analyzeImage (forces LAB) → colorAnalysis.getImageColors
 → loadImageDataWithAlpha (createImageBitmap→canvas, alpha>25 kept)
 → samplePixels (fixed stride, imageAnalyzerSupport.js:44)
 → performKMeans (ml-kmeans, kmeans++, maxIter 30, LAB via chroma, NO seed) → centroids converted to RGB in place (:121)
 → calculateColorPercentages over ALL pixels using RGB Euclidean (colorAnalysis.js:176, imageAnalyzerSupport.js:189)
→ colorMatcher.matchColors → findClosestPantoneColor / findClosestParentColor via chroma.deltaE (CIEDE2000) + calculateConfidence
→ analyzeProblematicMatches, averageConfidence

## Key facts
- Downscale to 800px box (maxImageSize setting is DEAD, never forwarded). Non-integer canvas dims.
- sampleSize default 10000 (setting honoured). k user-set default 13, clamp 3–20; no model selection.
- k-means metric = squaredEuclidean in LAB (≈CIE76); no seed → non-deterministic re-analysis.
- Percentages computed with RGB Euclidean against LAB-fit centroids → partition mismatch.
- Matching uses CIEDE2000 (chroma-js 3.1.2). CIE76 alt path unreachable.
- Ad-hoc lightness weighting colorMatcher.js:117-128 (magic 80/20/0.5/100) double-counts S_L; distance can ×2.
- HybridColorMatcherService short-circuit returns distance:0 for ml_correction (colorMatcher.js:89) → poisons confidence.
- Pantone dataset: assets/processed_colors.json 422KB, 2310 entries (FHI TCX/TPG numbering), no license/provenance; precomputed lab/hsl unused; linear scan per color.
- Confidence: 100 − (ΔE^0.85/20)·100; threshold never passed by callers; same curve for Pantone (dense) and 32 parents (sparse); averageConfidence unweighted.
- Dead settings: maxImageSize, maxIterations, colorSpace, distanceMethod. confidenceThreshold only flags problematic.
- No gamma linearization, no ICC/white-point handling, no spatial/saliency info, percentage≠area (resampling artifacts, alpha excluded from denominator).
- 32 parent colors = CSS/X11 primaries (data/colors.js) duplicated verbatim in composables/useParentColors.js:14-47.
- Broken: services/imageService.js:79 calls analyzeImage(formData) — not imported.

## Duplication services/colorUtils.js vs composables/useColorUtils.js
- getConfidenceClass: bg-* @85/65/50/30 vs text-* @95/85/70/50 (+ overloaded distance mode 2/5/10/20).
- calculateConfidence: 0-100 score vs RAW CIE76 distance (same name!).
- useColorUtils hand-rolls CIE76; getParentColorDistance ranks against hard-coded list ignoring user-edited parents.
- getConfidenceDescription buckets on distance while services buckets on confidence → contradictory UI labels.
