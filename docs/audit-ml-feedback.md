# ML / feedback audit (agent output, 2026-09-06) + my verifications

## Reachability
- HybridColorMatcher(Service): reachable from colorMatcher.js:73 but INERT — gate `matcher.modelTrained` never true; trainCorrectionModel has no caller. Service lacks 6 methods callers use (trainModel, getModelStats, getDebugInfo, findClosestColor, forceTrainModel, prepareColorFromHex) → TypeErrors caught → always "mathematical".
- enhancedMatcher, services/learning/knowledgeBase, geneticAlgorithm, neuralNetwork: DEAD (~1,470 lines). feedbackProcessor.js, play.js, learning/stats.js dead.
- match.js POST never called by UI; only GET summary via useKnowledgeBase. process-feedback only from dead KnowledgeBaseManager.vue.
- TrainModal calls /.netlify/functions/training/{upload,export,stats} — directory does not exist → 404.

## Persistence
- Real: DO Spaces (S3 SDK) bucket "bengijzel", endpoint ams3, hardcoded in 7+ files. feedback.json / knowledge.json / models written with ACL public-read (world-readable).
- services/feedback/feedbackStorage.js uses fs + process.cwd() → EROFS on Lambda; dead anyway. cmsInterface stub returns "not implemented".
- Presets: Strapi via presets.js. SERVER accepts `'banana'` as valid token (presets.js:5) → presets CRUD incl. DELETE effectively unauthenticated (verified). upload.js only accepts PRESET_ACCESS_TOKEN, client default sends 'banana' → uploads fail without ?access=.
- nuxt.config runtimeConfig AWS keys are server-only (not public) — verified, no leak.
- feedback.js:102 hardcodes https://image-colors.netlify.app/... prod URL.

## Duplication
- 4 feedbackStorage.js copies, all diverged (ESM/fs vs CJS/S3 vs read-only subsets).
- 2 knowledgeBase.js = different implementations sharing one export name w/ different signatures.
- processed_colors.json duplicated (assets + functions/match). knowledge.json in match/ unused & stale.

## Data shapes (4 incompatible feedback schemas)
- feedback.js writes {id,timestamp,...body,clientInfo} in {feedbackEntries[],lastUpdated}; validates originalColor, systemMatch.hex, userCorrection.hex.
- PlayModal sends {originalColor, match, feedback, colorInfo} / {originalColor, originalMatch, correction, quickFeedback, colorInfo} → always 400, swallowed.
- process-feedback expects {originalColor, matchResult, userFeedback:{parent,parentCorrection,pantone,pantoneCorrection}}; treats stored key as ARRAY (writer stores OBJECT).
- FeedbackModal emits only; never persisted (in-memory mutation app.vue:361).
- KB: {patterns[], parentPatterns[], parameters{deltaEWeight .7, labWeight .3, hue/sat/light weights}, version(float drift +=0.1), lastUpdated}.
- Training example: {targetColor{rgb,hsl,lab}, correctParentColorIndex (positional! breaks on palette edit), timestamp}.
- Saved model: model.json {modelJSON, weightData[][], modelConfig} + training_examples.json + metadata.json.
- process-feedback clears feedback (saveFeedbackEntries([])) without checking KB save success → data loss.

## Deps
- @tensorflow/tfjs (141MB) statically imported into CLIENT bundle via colorMatcher→useColorMatcherService→HybridColorMatcher for a model that never trains. @tensorflow/tfjs-node (351MB) unused. Also unused: openai, aws-sdk v2, formidable (busboy used), chart.js, vue-chartjs, ag-charts-*, highcharts npm (CDN used), @nuxtjs/toast, color-diff?, prettier in deps.

## READMEs describe aspirational system (/train page, 5-example threshold, majority voting — none exist).
