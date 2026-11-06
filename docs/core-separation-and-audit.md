# Separating the colour core, and what was attempted

Research + audit, 2026-11-06, branch `image-colors-v2`. No code changed. Two questions from Hiren:

1. Can v2 be the place where the colour-matching algorithm is developed, while v1 (the live app on `main`) eventually uses the same algorithm? That is: separate the application/interface/tool from the colour matching.
2. What was being attempted over the years, and what is useless, redundant, badly named or badly patterned.

Part A answers 1. Part B answers 2. Both are grounded in the current code, with a Node probe for A and grep-verified reference counts for B.

---

## Part A — Can the algorithm be split from the app? Yes, and most of it already is.

### A1. What the probe showed (not a code-read guess)

Ran the maths directly in plain Node 24, no browser, no Nuxt, on a synthetic "painting" (60% navy, 30% ochre, 10% white, with noise):

```
NODE-NATIVE OK  lab(20,30,90)= 14.5,19.2,-37.3
#141E5A 60.0% | #C89628 30.0% | #F5F5F0 10.0%
```

`services/imageAnalyzerSupport.js` (sampling, sRGB→LAB, k-means via `ml-kmeans` with `seed`, LAB-space counting) runs unchanged outside the app and recovers the palette exactly. Seeded runs are deterministic (`ml-kmeans` documents `options.seed`).

Two modules fail outside the app, and both fail on packaging, not on maths:

- `services/colorMatcher.js`: `Cannot find package '@/assets'` — the Pantone list is imported through Nuxt's `@/` alias, and the file also imports a Nuxt composable (`@/composables/useColorMatcherService`) which drags `@tensorflow/tfjs` (141 MB) into the matcher for a model that never trains.
- `services/colorAnalysis.js`: `Cannot find module './imageAnalyzerSupport'` — extension-less relative import (bundler-only resolution). Behind that it uses `createImageBitmap` + `document.createElement('canvas')`, which is the one genuinely browser-only step: turning a Blob into pixels.

### A2. The seam, file by file

| Layer | What | Framework-free today? | What couples it |
|---|---|---|---|
| **maths** | `imageAnalyzerSupport.js`: `samplePixels`, `rgbToLab`, `performKMeans`, `closestCentroidIndexLab`, `calculateColorPercentages`, `calculateAspectRatioFit` | **yes** (probe) | `console.*` noise; `setTimeout` chunking (fine in Node) |
| **matching** | `colorMatcher.js`: `getColorDistance` (ΔE00 via chroma), `findClosestPantoneColor`, `findClosestParentColor`, `matchColors`; `colorUtils.calculateConfidence` | **almost** | `@/assets/processed_colors.json` (422 KB, baked in); `useColorMatcherService` → tfjs |
| **facade** | `imageAnalyzer.js`: `settingsToAnalysisOptions`, `analyzeImage(blob, parentColors, settings)` | **almost** | takes a `Blob`; otherwise pure glue |
| **decode** | `colorAnalysis.loadImageDataWithAlpha` (+ dead duplicate `imageAnalyzerSupport.loadImageData`) | **no** | canvas / `createImageBitmap` — the only real browser dependency |
| **app** | composables, components, Netlify functions, VAMS gateway | n/a | stays in the app |

Reading of this table: the algorithm is ~600 lines of pure functions already. Three edits make it a package: pass the Pantone list in instead of importing it, remove the tfjs hook, and split "Blob → pixels" out of the facade.

### A3. Proposed shape: `image-colors-core`

One package, three entry points, no framework in any of them:

```
packages/core/
  package.json          "type": "module", exports: { ".", "./browser" }
  src/
    index.js            maths + matching + facade on PIXELS (pure)
    browser.js          blobToPixels(blob, {maxImageSize}) via canvas; analyzeBlob = blobToPixels → analyzePixels
    contract.d.ts       the frozen result shape (below)
  test/
    golden.test.js      fixed pixel fixture + seed → exact expected result
    bench/              reference paintings + expected palettes (for V5 research)
```

Core API (names kept from the code):

```js
analyzePixels({ pixels, width, height }, { parentColors, pantoneColors }, settings) → ProcessedImageResult
matchColors(analyzedColors, { parentColors, pantoneColors }, { confidenceThreshold })
settingsToAnalysisOptions(settings)
rgbToLab, getColorDistance, calculateConfidence, performKMeans, calculateColorPercentages
```

Both colour lists are **parameters**, not imports. That is what V6b (versioned parent colours in VAMS) needs anyway, and it keeps the 422 KB Pantone file — whose licence/provenance is unknown — out of the package.

**The contract to freeze** (what the UI reads today, verified by grep across v1 and v2):

```
ProcessedImageResult = {
  colors: [{ color (hex), percentage,
             parent:  { name, hex, distance, confidence },
             pantone: { name, code, hex, distance, confidence } }],
  analysisSettings: { colorSpace:'lab', distanceMethod:'deltaE', sampleSize, k, maxImageSize,
                      maxIterations, confidenceThreshold, reproducibleRuns, seed },
  metadata: { problematicMatches, averageConfidence, timestamp }
}
```

v1 (`main`) still reads `analysisSettings.colorSpace` / `distanceMethod` in `AnalysisSettingsCard.vue`; the v2 facade already emits them "so older UI keeps working". The contract is backwards-compatible with v1 as it stands. A golden test on this shape is what lets the internals (V5: decode, clustering space, matching) change without either UI noticing.

### A4. Where the package lives — three options

| Option | How v1 gets it | Pros | Cons |
|---|---|---|---|
| **1. npm workspace in this repo** (`packages/core`, app at root) | it doesn't — v1 is another *branch* of the same repo; a workspace on `image-colors-v2` is invisible to `main` until it is also published | best dev loop for v2 (one `npm i`, hot reload) | alone, it does not answer the v1 question |
| **2. Publish to npm (public)** `image-colors-core` | `npm i image-colors-core@^1` on `main`, swap 4 imports | zero auth on Netlify builds; semver gives v1 a stable line while v2 moves | public code (the maths is not secret; keep Pantone data out, see A3) |
| **3. Publish to GitHub Packages (private)** | same, plus an `.npmrc` token on Netlify and every machine | private | token friction on every consumer, including Netlify's build |

**Recommendation: 1 + 2.** Develop in `packages/core` on `image-colors-v2` (workspace), publish tagged versions to public npm. v1 pins a version; v2 uses the workspace. If "public" is uncomfortable, 3 works identically with one extra secret.

### A5. How v1 adopts it (when you choose to)

On `main`: `npm i image-colors-core@^1`, then in `composables/useImageAnalysis.js` replace `import { analyzeImage } from '@/services/imageAnalyzer'` with `import { analyzeBlob as analyzeImage } from 'image-colors-core/browser'` and pass the Pantone list it already ships. The call `analyzeImage(file, parentColors, settings)` has the same arity on both branches. Delete `services/{colorAnalysis,colorMatcher,imageAnalyzer,imageAnalyzerSupport}.js` on main. v1's UI keeps its Strapi persistence; only the maths is shared. This is a one-sitting change, gated by the golden test.

### A6. What this unlocks

- **V5 (colour research) becomes package work**: change `rgbToLab` to an ICC-aware decode or OKLab clustering, run the bench, compare palettes, ship a minor version. No UI in the loop.
- **Netlify `match.js` (808 lines) stops re-implementing the matcher** with a *different* confidence formula (linear, vs the power-curve in the app — see B2). It imports the package instead, or dies.
- **Tests run without jsdom** for the whole maths path (today's `tests/services/*` need the jsdom environment only because of import paths).
- **Both parent-colour list and Pantone list are injected**, which is the hook V6b needs for versioned parent colours.

### A7. Risks and honest limits

- The split is clean only if the **Blob→pixels** step stays outside the core; Node consumers would use `sharp`/`pngjs` for that (not needed now).
- `calculateColorPercentages` chunks with `setTimeout` to keep the UI responsive; in a worker or in Node that is just overhead — make chunking optional.
- Pantone data: 2,310 entries, no recorded source or licence. Do not publish it; inject it.
- Publishing adds a release step (version bump, `npm publish`). Keep it boring: `npm version patch && npm publish` from `packages/core`, CI optional.
- Nothing about this requires Nuxt 4 / Vue changes; it is orthogonal to V1 (atomic design) and V2 (packages), but should land **before V3** so the functions audit can delete the duplicate maths, and **before V5** so research has a home.

### A8. Proposed roadmap slot

New item **V2b: extract `image-colors-core`** — one sitting: `packages/core` workspace, move the four files, inject colour lists, remove the tfjs hook, add `"type":"module"` + explicit extensions, golden test, `browser.js` adapter, app imports switched. Publish only when v1 wants it.

---

## Part B — What was attempted, and what to prune

Two read-only audits (one on the learning stack's intent, one on dead code / duplication / naming / patterns), cross-checked by hand at the cited lines. The September 2026 audits (`docs/audit-*.md`, `docs/design-patterns.md`) were the baseline; where they are now stale it is said.

### B1. The learning stack: six attempts, one wish

**Timeline (git):** everything landed in one drop on **2025-03-16** (branch `simplify-and-add-machine-learning`: knowledge base, genetic algorithm, neural net, enhanced matcher, file storage, play mode, the `match`/`feedback`/`play` functions, `README-color-enhancement.md`), merged 03-17. Knowledge-base viewer + batch processor 03-24/30. TensorFlow attempt **2025-04-07/08** ("ML initial", "bout to start this tensorflow thing", "try tensorflow online"): hybrid matcher, `learning/*` functions, TrainModal, `README-tensorflow.md`. Play/feedback fixes to **04-11** ("hopefully persisting feedback"). One UX commit 06-04. Then nothing until the 2026-09 renewal. The whole stack is ~6,450 lines across 18 files plus 7 Netlify functions.

| | Attempt | Goal | Mechanism | Storage | Reachable from UI | Why it could not work (verified) | Status |
|---|---|---|---|---|---|---|---|
| **A** | "Color Matching Enhancement System" library — `services/learning/{enhancedMatcher,knowledgeBase,geneticAlgorithm,neuralNetwork}.js`, `services/feedback/*`, `services/config.js` | post-process every match with three learners fed by stored corrections | KB buckets corrections by hue/sat/light and averages a LAB shift; GA evolves five distance weights; NN regresses `[L,a,b]→[ΔL,Δa,Δb]`; `enhancedMatcher` swaps in the "enhanced" hex | `data/feedback.json` + `data/knowledge.json` through `fs`; "cms" mode is a stub returning "not implemented" | **no** — nothing imports any of it except each other; live path is `imageAnalyzer.js:3 → colorMatcher.matchColors` | `feedbackStorage` exports are `async` (`:60`, `:96`) but `geneticAlgorithm.js:41,71` and `knowledgeBase.js` call them synchronously → reads off a Promise, fitness always 0, `version` → NaN; `enhancedMatcher` returns `{match}` where `{color}` is expected; `neuralNetwork.js:20` `require`s inside ESM; `fs` runs in neither the browser nor a read-only lambda | dead on arrival |
| **B** | Serverless pattern knowledge base — `netlify/functions/match/match.js` (808 lines) | a shared, server-side rule set in Spaces that nudges Pantone and parent matches | POST feedback → hue patterns + `parentPatterns` HSL boxes in `image-colors/data/knowledge.json`; GET returns a summary; `findEnhancedPantoneColor` applies a pattern when confidence > 50 and overrides the parent by name | Spaces `knowledge.json` (prod) — the local `match/knowledge.json` (2024-03-20) is unused | **GET only** (toolbar "Knowledge Base" → `useKnowledgeBase.js:27` → `KnowledgeBaseModal`); no UI ever POSTs; `feedback.js` posts `{updateKnowledgeBase:true}` which `match.js:615` rejects ("Color is required") | pattern LAB correction is created as zeros (`:254-260`) and only ever lowered (`:279`) → the Pantone "enhancement" is a no-op; it matches against **its own 18-colour palette** (`:436-455`) not the app's 32; its `calculateConfidence` is linear (`:19`) while the app's is a power curve — same name, different numbers | a working read endpoint for a store nothing writes to |
| **C** | Batch processor + admin page — `process-feedback`, `get-knowledge-base`, `get-feedback-count`, `components/admin/KnowledgeBaseManager.vue` | "nightly" digest of feedback into the KB (no schedule exists) | reads `feedback.json` as an **array**; `feedback.js` writes an **object** `{feedbackEntries, lastUpdated}` → `forEach` TypeError; would wipe `feedback.json` unconditionally (`process-feedback.js:54`) | Spaces | **no** — `KnowledgeBaseManager` has 0 references | shape mismatch + unconditional clear | dead |
| **D** | TensorFlow.js hybrid matcher — `HybridColorMatcher(.js/Service.js)`, `useColorMatcherService.js`, `netlify/functions/learning/{getModel,saveModel,stats}.js`, `DebugPanel.vue`, `TrainModal.vue` | learn when to override ΔE with a softmax over parent colours | 30 features (target + mathematical match) → dense 32/24/softmax; override if p > 0.7; examples `{targetColor:{rgb,hsl,lab}, correctParentColorIndex}` | `localstorage://color-matcher-model` or Spaces `image-colors/models/tensorflow/*` | **yes, on every page load**: `colorMatcher.js:51` and four modals call `useColorMatcherService()` → `initialize()` → GET `/api/learning/getModel` → **404** | the 404 is structural: Netlify registers `learning/learning.js` or `index.js`, never files inside the folder, so `learning/*` has never been reachable as deployed; `trainCorrectionModel` has no caller; the Service lacks the six methods callers use (`trainModel`, `getModelStats`, `getDebugInfo`, `findClosestColor`, `forceTrainModel`, `prepareColorFromHex` → TypeErrors, caught); parent colours are `{name, hex}` (`data/colors.js`) but the matcher reads `parentColor.lab` (`HybridColorMatcher.js:103`) → every distance 100 → "closest" is index 0; PlayModal passes HSL 0-1 where `prepareFeatures` divides by 100; the example index is positional into a user-editable palette; `loadModelFromJSON` expects a `weightsManifest` that `toJSON()` never writes; so the gate `matcher.modelTrained` (`colorMatcher.js:54`) is never true → always mathematical | inert; cost today = tfjs in the client bundle, one 404 per load, `@tensorflow/tfjs-node` (0 importers) in deps; `TrainModal` calls three `/.netlify/functions/training/*` URLs that do not exist |
| **E** | Play mode — `components/feedback/PlayModal.vue` (1,033 lines) | gamified corrections across the spectrum (score, streak) | random hex → consensus of ΔE/LAB/RGB/HSL nearest parents (`:668-749`) → accept/reject → POST `/.netlify/functions/feedback` | nowhere | **yes** (toolbar) | sends `{originalColor, match, feedback, colorInfo}` (`:799-811`); `feedback.js:156-166` requires `systemMatch.hex` + `userCorrection.hex` → **400 on every submission**, swallowed (`.catch` only sees network errors); on close calls the non-existent `trainModel` | a working game that stores nothing |
| **F** | In-app feedback loop — `FeedbackModal.vue` (774), `FeedbackManager.vue`, `useFeedback.js`, `useColorFeedback.js`, `AlternativeMatches.vue` | correct the parent match of a real analysed colour and keep it | row "feedback" → `FeedbackManager.showFeedbackForColor` → modal with multi-metric suggestions → emits a correction → `updateCurrentColorMatch` rewrites `color.parent` in memory, drops it from `problematicMatches`, toasts "Save Changes to update this preset" | **only inside the preset** when the user saves it (VAMS now); no network call of its own; `save-match-preference` ends in `console.log` | **yes** | works as a manual per-colour override; the "learner" was abandoned here | **the only path with a durable outcome** |

**Four incompatible feedback contracts** exist at once: (1) what `feedback.js` stores `{originalColor, systemMatch:{hex}, userCorrection:{hex}, clientInfo}` in `{feedbackEntries[], lastUpdated}`; (2) PlayModal's two POST bodies; (3) FeedbackModal's emit (compatible only with `useColorFeedback`); (4) `match.js` POST `{color, feedback, parentFeedback, parentCorrection:{name}}` with no sender; plus (5) `process-feedback` reading an array. None of the UI writers match the server reader. Three knowledge-base writers disagree on `version` (kept / +0.1 / +1) and on `usageCount` vs `sampleSize`.

**What was clearly wanted** (the through-line): the *parent-colour judgement* — which family a swatch belongs to, the thing the museum mood research needs — should improve from human corrections instead of staying pure ΔE. Every attempt is the same loop: capture a correction (modal or game), store it (file → Spaces → model), distil a reusable rule (HSL-bucket pattern, weight set, softmax override), apply it at match time, and show that the system "learned". Each try swapped the storage and the learner without ever closing the loop end to end. The April-2025 "hopefully" commits show the settle: an immediate in-memory override saved into the preset. That is attempt F, and it is the honest kernel of the whole idea.

**Salvageable (idea or code):** F in full (`FeedbackModal`, `FeedbackManager`, `useColorFeedback`, `AlternativeMatches`) — reachable, decent UX, durable; generalising the per-colour override into a palette-level override table (hex or HSL box → parent name, i.e. the `parentPatterns` shape) gives the "knowledge base" **without any learner**. PlayModal's four-metric consensus as a "second opinion", and the game itself once its POST body matches contract (1). `feedback.js` + the Spaces append-only log as an evaluation dataset for V5/V7 once senders match it. `match.js` GET + `KnowledgeBaseModal` only if a KB is kept. `shared/storage-config.js`.

**Dead weight:** all of A (+ `services/config.js`, 137 lines, 0 importers, + the `data/` file-storage idea); C (three functions + `KnowledgeBaseManager`); D in full (HybridColorMatcher pair, `useColorMatcherService`, `learning/*`, `DebugPanel`, `TrainModal`, the gate `colorMatcher.js:49-76`, `@tensorflow/tfjs`, `@tensorflow/tfjs-node`); `play.js` (no caller); `match/knowledge.json` + `match.js`'s `fs`/`path`; the play-modal half of `useFeedback.js`; `README-tensorflow.md` and `README-color-enhancement.md` (both describe a system the code never had: a `/train` page, a 5-example threshold, majority voting, `matchColorsEnhanced`).

**September audit cross-check:** reachability map, PlayModal 400s, array-vs-object, positional index, saved-model shape, data loss on clear, aspirational READMEs — all still right. Stale since the 2026-09-06 cleanup: the hardcoded prod URL (now `SITE_URL`), bucket "hardcoded in 7+ files" (centralised in `storage-config.js`), public-read JSON (only `upload.js` sets an ACL now), the `banana` token (gone), the dependency list (openai / aws-sdk v2 / chart libs gone; tfjs + tfjs-node remain). Newly found: A is internally broken (sync use of async storage), the parent palette lacks `lab`/`hsl` so even D's mathematical fallback is wrong, `feedback.js`'s KB trigger always errors, `match.js`'s pattern correction is always zero, and `match.js` uses its own 18-colour palette.

### B2. Dead code (grep-verified, worst first)

| # | What | Evidence | Action |
|---|---|---|---|
| 1 | `services/learning/**` (2,295 lines), `services/feedback/**` (464), `services/config.js` (137) | reachable only through `composables/useColorMatcherService.js:10`; the Service defines none of the 6 methods callers invoke (0 definitions, 7 call sites) → every ML branch is a caught TypeError; `colorMatcher.js:54` gate never true | delete all three + `useColorMatcherService`; drop `@tensorflow/tfjs` |
| 2 | deps | `@tensorflow/tfjs-node` 0 refs (351 MB); `@testing-library/vue` 0; `prettier` 0 (no config, no script); `node-fetch` required at `netlify/functions/feedback/feedback.js:3` but **not declared** (transitive; Node ≥18 has `fetch`) | remove three deps; drop the `require` |
| 3 | `components/admin/KnowledgeBaseManager.vue` (241), `components/feedback/DebugPanel.vue` (351) | 0 tag refs in either auto-import form; transitively dead: `get-feedback-count` (92), `get-knowledge-base` (108), `process-feedback` (414) — their only caller is `KnowledgeBaseManager.vue:164,190,214` | delete |
| 4 | `netlify/functions/play/play.js` (141), `learning/stats.js` (106), `learning/debug-utils/tf-debug.js` (166), `match/knowledge.json`, `match/processed_colors.json` (byte-identical to `assets/`), `match.js:4-5` `fs`/`path` | 0 callers / 0 readers / identical md5 | delete |
| 5 | `TrainModal.vue` (357), `PlayModal.vue` POSTs | all three `/.netlify/functions/training/*` 404 (dir absent); PlayModal `:807,:924` always 400 | delete with the V4 decision |
| 6 | `composables/useFeedback.js` | 9 of 13 exports have 0 readers; `:47` dynamic-imports the 422 KB Pantone JSON into a ref nobody reads, on every modal open | inline the 4 live members into `FeedbackManager` |
| 7 | `composables/useColorUtils.js` | `getParentColorDistance`, `groupColorsByFamily`, its `calculateConfidence`, `normalizeColor`: 0 live refs; `ref, computed` imported, unused; `KnowledgeBaseModal.vue:281` imports it and never calls it | prune to `getColorDescription` / `getConfidenceClass` / `calculateColorInfo` |
| 8 | `composables/useColorFeedback.js:159-191` `updateDOMColorMatch` | queries `.image-analysis-result` / `.image-name` — in no template; `handleSelectImage` listened for (`app.vue:53,68`) but `emit('selectImage')` occurs 0 times; `handleSaveMatchPreference` only logs | delete |
| 9 | `ColorDetailsTable.vue:312-390` `refreshTable` (`defineExpose`, 0 external callers); `:154-156,184-205` debug "Last refresh hh:mm" rendered in production; prop `analysisSettings` never read | delete |
| 10 | dead props/emits/helpers | `ImageAnalysisResult.vue:62,66,70` `isPreset`/`presetName`/`parentColors` unused, `:76` `error` never emitted; `ActivePreset.vue:79` `:is-analyzing` undeclared by child; `ImageControls` emits `filesSelected` (0 listeners now); `FeedbackManager.vue:35` declares `notification`, 0 emits; `usePresets.validatePresetData` 0 callers; `useImageAnalysis.js:63 index`, `:127 lastReanalyzed` 0 readers; `imageService.reanalyzeImages` 0 callers and calls an undefined `analyzeImage`; `imageAnalyzerSupport.loadImageData` 0, `convertPixelsToColorSpace`/`convertCentroidToRGB`/`CHUNK_SIZE`/`COLOR_SPACES` 0 external; `colorAnalysis.utils` 0; `colorUtils.js:1` chroma unused; `MainToolbar` About button no handler; `BaseButton` `loading` never rendered | delete each |
| 11 | **broken, not dead** | `BaseButton` has no `<slot>` and `text` is **required** → `ActionButtonGroup.vue:14` labels and `ScreenshotModal.vue:16` "Download" never render; `ImageDisplaySection.vue:138` icon `refresh` is not in `BaseIcon` → Reanalyze is a blank button; `ImageControls.vue:549` `/icons/palette.svg` absent; `:595` `/api/placeholder/…` no such function; React-cased `strokeLinecap`/`strokeWidth` SVG attrs (16 sites) ignored by the HTML parser | fix in V1c/V1d |
| 12 | 0-inbound files | `assets/rainbow-to-pixels.png` (3 MB), `assets/palette.png`, `public/icons/{load,no-image,plus}.svg`, `server/` (one tsconfig), `README-tensorflow.md`, `README-color-enhancement.md`, `services/README.md`, `netlify/functions/README.md` (lists `colors/`, `access=banana`, Strapi), `atomic_design.md` (names 11 non-existent components), `README.md:78` typo `OverallAnalaysis` | delete / rewrite; root ends as `README.md` + `PROJECT.md` |

### B3. Redundancy (both sides → survivor)

1. **`calculateConfidence` ×6 formulas**: `services/colorUtils.js:9` (100−(d^0.85/20)·100), `composables/useColorUtils.js:165` (returns a raw CIE76 *distance*), `useColorFeedback.js:146` (100−2d), `match.js:19` (100−d/20·100), `HybridColorMatcher.js:405`, `geneticAlgorithm.js:395` → one, in the core package.
2. **Hue-band grouping ×4**: `ColorFamilyBreakdown.vue:50-125` ≡ `ColorFamilyCompact.vue:43-117` (identical), `useColorUtils:254` (other bands, dead), `FeedbackModal.vue:515-583` (third band set, 0 uses) → one pure `hueGroups(colors)` + one component with a `compact` prop (= V1d).
3. `getColorDescription` ×3, distance-CSS class ×6 (`getDistanceClass` verbatim in `ColorDetailsTable:271`, `ColorCard:74`, `ColorListItem:55` ≡ `useColorUtils:34-39`) → one each.
4. **`FeedbackModal` ≡ `PlayModal`**: `colorInfo`, `alternativeMatches`/`findMatches`, `getMethodName` (×3, + `AlternativeMatches.vue:71`), quick-feedback grid, 3-space colour object (`lab.L` vs `lab.l`) → one `useMatchComparison`.
5. `averageDistance`/`problematicMatchesCount` verbatim in `ImageDisplaySection.vue:101-116` ≡ `ScreenshotModal.vue:106-121`, while `metadata.averageConfidence` from the facade is shown nowhere → compute once on the Processed Image.
6. **Notification paths ×4**: `AppHeader` via template ref, `ImageControls` toast `:637-650`, `ImageAnalysisResult`+`ToastNotification`, `ActivePreset` `toast?.x()` ×5 (`:184-226`) where **`toast` is undeclared → ReferenceError** on delete-failure / reanalyze / save-as-new (optional chaining does not guard an undeclared binding) → one `useNotifications()` (= B2 step 2).
7. **12 hand-rolled `fixed inset-0` overlays** in 11 files, 4 open-state conventions (`isVisible` / local `v-if` / `v-model` / `visible`) → `atoms/BaseModal` (= V1c).
8. Netlify functions: S3 client + `BUCKET_NAME = BUCKET` re-done in 8 files after `storage-config.js` centralised it; `getDefaultKnowledgeBase` ×3, `loadKnowledgeBase` ×3 (different miss behaviour), `getFeedbackEntries` ×2 both reading the **object** `feedback.js` writes as an **array** (count always 0; process-feedback always throws), CORS block ×8, `feedbackStorage.js` ×4 all diverged → `storage-config` gains `getJson`/`putJson`; most of it dies with V4.
9. **Parent-colour list ×4**: `data/colors.js` ≡ `useParentColors.js` (32, verbatim); `play.js` ≡ `match.js` a *different* 18-entry list (`DarkBlue`, `Maroon`, `Grey`) so server Play matches colours the app does not have; `FeedbackModal.vue:341` imports the static list beside its `parentColors` prop → `useParentColors` only, then VAMS (V6b).
10. Defaults scattered: `k=13` ×4, `maxIterations=30` ×4, `confidenceThreshold=20` ×6, `SAMPLE_SIZE=80000` (unreachable; real default 10,000) → `defaultSettings` only, in the core.
11. `{total, current, failed}` at 9 sites; `uploadStatus` is a per-call ref (`usePresets.js:28`) so `ImageControls.vue:571` and `ActivePreset.vue:149` own private copies → **the upload progress bars never show** → one shared `useState` (= B2 step 2).
12. Two `<h1>Color Analyzer` headers (`AppHeader.vue:20`, `MainToolbar.vue:15`); axios + fetch mixed in one flow (`vams.js:14` builds a new axios instance per request); Strapi `attributes.Name`/`processed_images` shape at 21 sites with `presets.js` keeping Strapi beside VAMS → adapter owns the shape at cutover.

### B4. Naming (against `CONTEXT.md`)

- `calculateConfidence` that returns a Distance (`useColorUtils.js:165`) → delete or `cie76Distance`.
- "threshold" means two things: the distance scale where confidence hits 0 (`colorUtils.js:9`, `match.js:19`) **and** the flag cutoff on the 0–100 score (`colorMatcher.js:109-113`, slider in % at `ImageControls:351`); `CONTEXT.md` defines Problematic Match by Distance > threshold, code uses Confidence < threshold → `confidenceDistanceScale` vs `problematicBelowConfidence`; align doc or code.
- "color family" = HSL bands in `ColorFamily*.vue` / `useColorUtils:254` / `FeedbackModal:107` / `PlayModal:346` but = Parent Color in `OverallAnalysis.vue:20` and the READMEs → **Hue Group** (= b3).
- `colors` prop = Parent Colors in `ImageControls.vue:512`, `ParentColors.vue:126` but = extracted Colors in `ColorDetailsTable:168`, `ColorPercentages:24`, `ColorFamily*`, `MobileColorGrid:36` → `parentColors`.
- `color.color` for a Color's hex vs `parent.hex` / `pantone.hex` → `hex` (contract change: do it in the core package with the golden test); `match` = Color+matches (`FeedbackModal:348`) vs parent+distance (`PlayModal:419`) → `colorMatch` / `candidate`; `sourceImage` is a URL → `sourceImageUrl`; `lab.L` (5 sites) vs `lab.l` (9) → one.
- Files that lie: `useColorUtils` (no state, not a composable), `useColorMatcherService` (module singleton), `imageService` (only `uploadImage`), `imageAnalyzerSupport` (it *is* the k-means/LAB core → `colorClustering`), `feedbackStorage.js` ×4 with different exports, `knowledgeBase.js` ×2 with two `updateKnowledgeFromFeedback` signatures, `processFeedback` ×3 meanings.
- Two words, one thing: `updateKnowledgeBase`/`saveKnowledgeBase`; `app.vue:160-174` renames `handleSaveAsPreset→handlePresetSave` then redefines the originals `:285-301`; `showNotification`/`showToast`/`showToastMessage`/`toast`; `k` = "Number of Colors" (`ImageControls:273`) = "Color Clusters" (`AnalysisSettingsCard:24`); `maxImageSize` labelled "Image Compression" (`ImageControls:252`); `DELTA_E` / `'deltaE'` / "DeltaE (Standard)" / Distance.
- Booleans that lie: `isSaving`/`isDeleting`/`isCreatingPreset` wrap `await emit(...)` (`ActivePreset.vue:166,181,195,218`; `ImageControls.vue:603`) — `emit` returns `undefined`, so they flip back the same tick; `imageExistsInStorage` (`usePresets:190`) only checks the URL scheme; `sortedGroupedColors` (`OverallAnalysis.vue:90`) does not sort; `isInitialized` true on failure (`HybridColorMatcherService:112`); `updateUI` written, never read; `AnalysisStatsCard.vue:23` says "distance > 20" for a confidence cutoff; **`FeedbackModal:53-55` feeds a 0–100 confidence into the distance-bucketed `getConfidenceClass`/`getConfidenceDescription` (default `isConfidence=false`), so a confidence of 85 reads "Poor match" in red**.
- Spelling/casing: `OverallAnalaysis` still in `README.md:78` and `atomic_design.md:134`; `Grey`/`DarkBlue` (server) vs `Gray`/`Dark Blue` (app); `MY_AWS_*` for DigitalOcean Spaces keys.

### B5. Design-pattern smells (refactoring.guru vocabulary)

1. **Recursive update (Observer misuse) — found by this audit, caused by me, fixed the same day.** After B2 step 1 shared `settings` through `useState`, `ImageControls.vue:654` deep-watched the shared ref and emitted; `app.vue` → `useAnalysisSettings.updateSettings` replaced `settings.value` with a new object → the watcher fired again, without end (any slider move; Vue dev stops at 100 with a warning, a production build has no cap). Fix: the watcher is gone — shared state needs no emit; the Apply path still emits explicitly. Commit noted in the diary.
2. **God objects**: `app.vue` (mediator for 6 composables + 2 template-ref buses), `ImageControls.vue` (670), `PlayModal` (1,033), `FeedbackModal` (774), `match.js` (808: storage + weighted distance + learning + 2 handlers + Play; 33 `console.log`s), `usePresets.js` (333: HTTP, retry, chunking, validation, progress) → Extract Class per concern (V1e, B2, V3).
3. **Shotgun surgery / divergent change**: a new Processed Image field touches `vams.js:33,58-63`, `usePresets.js:207`, `useImageAnalysis.js:56-64,119-128`, `AnalysisSettingsCard`; the Strapi shape at 21 sites.
4. **Feature envy + DOM intimacy**: `useColorFeedback.js:159-191` and `ColorDetailsTable.vue:321-385` patch each other's DOM (`.parent-name`, `.parent-color`) instead of trusting reactivity; `services/colorMatcher.js:5` (a service) imports a composable → layering inversion that forces `vi.mock` in two tests.
5. **Primitive obsession / clumps**: hex strings as the colour type; `color.color`; 9 progress clumps; Feedback as 4 incompatible shapes; positional `correctParentColorIndex` breaks on palette edits.
6. **Long parameter lists**: `handleReanalysis(5)`, `updateCurrentColorMatch(5)`, `(presetData, onSuccess, onError)` callback style ×3, `findEnhancedPantoneColor(4)` → Preserve Whole Object.
7. **Speculative generality**: 4-metric selectors in both modals after the pipeline went ΔE00-only; `services/config.js` flags (0 importers); `savedMatchPreferences` always `{}` so `PlayModal:671-682` is unreachable; `BaseButton` 10 props; `originalParent` snapshot with no restore.
8. **Patterns present and how well**: Facade `imageAnalyzer.analyzeImage` good (`settingsToAnalysisOptions` pure + tested; flaw: emits a third settings shape at `:73-83`). Adapter/anti-corruption layer `netlify/functions/shared/vams.js` is the right seam; its update is delete-then-create (data-loss window), `typeId` fetches every entry of a type just to read the type id, and `presets.js` picks the backend by `if`. Functional Decorator `withDebugHeaders` (`debug-utils.js:93`) is real but used by 2 of 10 handlers. Template-Method-by-callback in `calculateColorPercentages` is fine. Singleton `useColorMatcherService` with a hardcoded palette, untestable. Two localStorage persist watchers per `useAnalysisSettings()` call (`:124-135`, called in `app.vue` and `ImageControls`).

### B6. What to do with all this — the split

**Fix now, small and safe (one sitting, after a go):** B5.1 regression (done); undeclared `toast` in `ActivePreset` (route through the one notification path); `BaseButton` slot / `refresh` icon / missing `palette.svg` / `/api/placeholder`; `node-fetch` require; confidence-into-distance-bucket in `FeedbackModal:53-55`; delete the 0-ref files in B2 #12 and the three unused deps; fix the `README.md` typo.

**Decide (V4 is answered; this is the call):** prune A, C, D, `play.js`, both ML READMEs — **5,807 lines + tfjs 141 MB / tfjs-node 351 MB** — keep F (the in-app override) and, only if a palette-level override table replaces the learners, the KB viewer. Everything in B2 #1–#5 goes with that decision.

**Real work, already on the roadmap:** V2b (core package: B3 #1, #10, B4 `color.color`, B5.4 layering inversion); B2 step 2 (`useNotifications`, shared `uploadStatus`: B3 #6, #11); V1c `BaseModal` (B3 #7); V1d hue groups + colour-row dedupe (B3 #2, #3, #4); V1e split `ImageControls`; V3 functions audit (B3 #8, `match.js`); b3 Hue Group rename (B4).

**Doc consolidation (project-map rule):** root ends as `README.md` + `PROJECT.md`; `atomic_design.md` folds into `PROJECT.md` Guide; `services/README.md`, `netlify/functions/README.md`, both ML READMEs are deleted or rewritten to describe what exists.

