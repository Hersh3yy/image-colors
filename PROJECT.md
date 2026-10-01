<!--
  PROJECT.md — the cockpit for this repo. One file to open and know where things stand.
  Maintained by the `project-cockpit` skill. The assessment (status/issues/roadmap) is
  refreshed each session; the Diary at the bottom only grows. App-code changes need a
  green light; main is merged to only when sure.
-->
<!-- clickup_list:901507464634 -->

# Image Colors — cockpit

**What it is** · A Nuxt app that reads a painting, extracts its dominant colours, matches each to a parent colour and a Pantone reference, and saves sets of analysed images as presets. Client: the artist Benjamin Gijzel. Long-term goal: which colours evoke which moods in museum paintings.
**Stack** · Nuxt 3 · Vue 3 · Tailwind · Netlify Functions · DO Spaces · chroma-js + ml-kmeans
**Status** · 🟢 v2 arc started — Track A done; **VAMS read+write wired** (`CMS_SOURCE=vams`), 22 presets migrated. Next: cleanup + atomic design, then packages, then functions/patterns, then colour-analysis research.
**Repo** · GitHub `Hersh3yy/image-colors` · **working on `image-colors-v2`** (off `v2-analysis-renewal`; will one day become `main` — merge only when sure). VAMS side: `koala/VAMS` branch `image-colors-v2`.
**Hosting** · Netlify · files on the `bengijzel` DO Spaces bucket · content on VAMS (prod DB; VAMS write routes await deploy)
**ClickUp** · list `901507464634`
**Last assessed** · 2026-10-01

---

## Run it

```bash
npm install
npx vitest run     # tests (green)
npx nuxt build     # build (green)
npm run dev        # local dev
```
Gotcha before deploy: set `PRESET_ACCESS_TOKEN` + `NUXT_PUBLIC_PRESET_ACCESS_TOKEN` in Netlify (the `'banana'` fallback is gone), and confirm the Netlify build command isn't `yarn` (yarn.lock was removed).

## Status

Track A is complete: the test suite runs (it never did — `jest` under Vitest), the percentages are now counted in one colour space, every settings slider reaches the pipeline, and the public preset token + world-readable objects are locked down. The ML/feedback stack is untouched by request, pending a read of the audit. Persistence still writes to Strapi; the move to VAMS is the next big arc.

## Issues

Full detail in `docs/image-colors-atlas.html` and `docs/audit-*.md`.

| Sev | Issue | Where |
|---|---|---|
| open | Two `colorUtils` define `calculateConfidence` with opposite meanings (score vs distance) | `services/colorUtils.js` · `composables/useColorUtils.js` |
| open | "Color family" means two things (HSL hue bands vs matcher parent colours) | `components/molecules/ColorFamily*.vue` |
| deferred | ML/feedback stack is non-functional (3 dead attempts) — keep-or-prune decision pending | `services/learning/**` · `docs/audit-ml-feedback.md` |
| future | Pantone list has no recorded source/licence — needed before museum use | `assets/processed_colors.json` |

## Guide

- **Pipeline**: `useImageAnalysis` → `imageAnalyzer.analyzeImage` (the Facade) → `colorAnalysis.getImageColors` (k-means in LAB, now counting pixels in LAB) → `colorMatcher.matchColors` (CIEDE2000). Settings map through `settingsToAnalysisOptions`.
- **Vocabulary** (`CONTEXT.md`): keep the code's words — Preset, Processed Image, Analysis Settings, Parent Color, Pantone Match, Feedback, Knowledge Base. `reproducibleRuns` seed is opt-in (Hiren likes the RNG variation).
- **Persistence** today: presets → Strapi via `netlify/functions/presets`; images/model → DO Spaces (`netlify/functions/shared/storage-config.js` centralises bucket/endpoint/URL). Moving to **VAMS** (see that project's cockpit).
- **Design patterns** (`docs/design-patterns.md`): Knowledge Base = Decorator; persistence = Adapter/gateway; keep the Facade; avoid Strategy/Singleton/Builder/State.

## Hard parts

### Counting colour shares in LAB, not RGB

🔭 **What it does** — k-means groups pixels in CIELAB. The old code converted the centroids back to RGB and then assigned every pixel by RGB distance — a different geometry, so the percentages described a *different* partition than the swatches shown. Now each pixel is converted with `rgbToLab` (sRGB gamma-decode → XYZ under D65 → Lab, the same constants chroma-js uses) and assigned to the nearest LAB centroid.

⚖️ **Why this way** — `chroma(r,g,b).lab()` per pixel builds an object for half a million pixels; a bare function is the same math at a fraction of the cost. Counting from the k-means labels was the other option, but it turns "share of the painting" into an estimate of the downscaled sample.

🗣️ **Say it to a senior** — "We cluster and count in the same space now, LAB both ways, so the percentages belong to the swatches they're shown with."

---

### A Vue ref mistaken for the composable

🔭 **What it does** — `useAnalysisSettings()` returns `{ settings, updateSettings, ... }`. `app.vue` did `const { settings: analysisSettings }`, so `analysisSettings` *was* the ref. Every later `analysisSettings.settings.value` was `undefined`, swallowed by `?.`, so reanalysis silently ran with `{}` — all defaults. Two sliders were also dropped when the options object was rebuilt by hand.

⚖️ **Why this way** — Rather than patch the call sites, the pipeline now takes the whole settings object through one tested `settingsToAnalysisOptions`, so a dropped setting fails a test instead of a user.

🗣️ **Say it to a senior** — "Destructuring renamed the ref to look like the composable, so reads were undefined and swallowed by optional chaining — I moved the settings→options mapping into one tested function."

## Roadmap — near future

v2 sequence, in Hiren's order (2026-10-01). Each a sitting or two; research before any model work.

- [ ] V1: clean up + implement atomic design across `components/` (atoms/molecules/organisms honest, dead code out) <!-- id:v1 -->
  - [x] V1a (mechanical, done 2026-10-01): typo `OverallAnalaysis`→`OverallAnalysis`; stray root `AlternativeMatches`→`molecules/`; oversized molecules promoted to organisms: `ColorDetailsTable` (390), `ColorFamilyBreakdown` (183), `ParentColors` (198) — tags + test paths updated, 32 tests green
  - [ ] V1b: real page layer — `layouts/default.vue` (header/status/toolbar/controls shell) + `pages/index.vue`; `app.vue` becomes `<NuxtLayout><NuxtPage/>` instead of a 396-line god component
  - [ ] V1c: `atoms/BaseModal` — 6 modals each hand-roll `fixed inset-0 … z-50` (one is `z-60`), mixed `isVisible`/`v-if`, no shared Escape/backdrop close; migrate `ColorEditModal`, `ScreenshotModal`, then the ML ones when V4 clears them
  - [ ] V1d: dedupe colour display — `ColorFamilyCompact` (155) vs `ColorFamilyBreakdown` (183) both take `colors: Array`; `ColorPercentages` / `ColorPercentageTooltip` / `ColorListItem` / `ColorCard` / `MobileColorGrid` overlap on one colour object; keep `atoms/ColorSwatch` as the atom they all compose
  - [ ] V1e: split `organisms/ImageControls` (675) into upload / settings-sliders / parent-colours pieces (needs `atoms/BaseSlider`, `atoms/BaseCard`)
  - [ ] V1f: app.vue owns 4 composables + 8 refs + modal flags → that's B2 (store + `useNotifications`); do B2 right after V1b
  - ML stack untouched by design until V4: `feedback/`, `admin/`, `TrainModal`, `KnowledgeBaseModal`, `FeedbackManager`, `PlayModal` (1033). `DebugPanel` + `KnowledgeBaseManager` have **0 references** (dead) — delete only after V4 confirms
- [ ] B1: one `color/` module — merge the two colorUtils; one `calculateConfidence` = score, rename the distance one <!-- id:b1 cu:123kjkdhp5u -->
- [ ] B2: a store (Pinia/useState) + one `useNotifications()`; kill the `headerRef.showNotification` bus and duplicate composable instances <!-- id:b2 cu:123kjkdhp5v -->
- [ ] Rename the HSL "color family" grouping → Hue Group <!-- id:b3 cu:123kjkdhp5w -->
- [ ] V2: package-currency pass — `npm outdated`, patch/minor now, Nuxt 4 / Tailwind 4 / Vitest 5 behind the build+test check; one chart library, imported not CDN; confirm it still runs <!-- id:b4 cu:123kjkdhp5x -->
- [ ] V3: audit `netlify/functions/*` — what each does, which are dead; pick the design patterns to apply (refactoring.guru; `docs/design-patterns.md`) <!-- id:v3 -->
- [ ] V4: understand what was being attempted — the learning/feedback/knowledge-base stack and play mode; write it down before judging it <!-- id:v4 -->
- [ ] V5: correct the colour analysis using research (colour analysis only — not the model): decode, clustering space, CIEDE2000 matching, percentages <!-- id:v5 -->
- [ ] V6: persist "matching to other colours" — parent-colour + Pantone matches saved with each processed image in the preset (VAMS `processed-image.colors` already carries `parent`/`pantone`; make sure the app round-trips it) <!-- id:v6 -->
- [ ] V7: research only — updating the colour-matching model, play mode, feedback loop; decide after reading, no build <!-- id:v7 -->

## Roadmap — far future

- [x] C: Strapi→VAMS: VAMS api-key write API built + tested; 22 presets/173 images migrated; v2 reads+writes VAMS via `CMS_SOURCE=vams` (`netlify/functions/shared/vams.js`). Left: deploy VAMS branch to prod, flip env, retire Strapi <!-- id:c1 cu:123kjkdhp5y -->
- [ ] Colour-managed decode (ICC) + linear-light/OKLab clustering option <!-- id:d1 cu:123kjkdhp5z -->
- [ ] Painter's parent-colour list workshop with Benjamin (versioned) <!-- id:d2 cu:123kjkdhp60 -->
- [ ] Museum workflow redesign: collections, batch upload with wall labels, review queue, exports <!-- id:e1 cu:123kjkdhp61 -->
- [ ] Knowledge Base decision: keep-or-prune the ML stack, then Feedback that persists + evaluation harness <!-- id:f1 cu:123kjkdhp62 -->
- [ ] Mood study (research, not a shipped feature) <!-- id:f2 cu:123kjkdhp63 -->

---

## Diary

### 2026-10-01 — v2 arc: VAMS persistence wired (branch `image-colors-v2`)
- Prio from Hiren: **make new presets in VAMS** (migration secondary). VAMS api-key routes were read-only by design, so built `storeWithApiKey`/`updateWithApiKey`/`destroyWithApiKey` on VAMS (reuses `EntryService` + field_config validation + per-user entry-type grant; writes scoped to the key owner; deliberately no plan/rate gate). 5 feature tests green. VAMS commit `73174f4`.
- Migrated the 22 Strapi presets → 22 `preset` + 173 `processed-image` entries on prod VAMS (`strapi:import-image-colors`, idempotent by `strapi_id`). VAMS commit `9b7ceb7`.
- img-clrs: `netlify/functions/shared/vams.js` gateway + `CMS_SOURCE=vams` toggle in the presets function — read, create, update (replace-images), delete, all re-stitched into the Strapi shape so `usePresets`/components are untouched. Preset `id` = VAMS entry uuid. Commits `77197f3`, `e9799d6`.
- Gotchas found: VAMS local docker `api` is php 8.3 but composer needs 8.4 → ran artisan on **host** (php 8.5); VAMS `.env` points at the **prod DO DB** (port 25060), so host artisan = prod. netlify-cli 27 dropped `--targetPort`. Itamar's VAMS api_key goes in `VAMS_API_KEY` (gitignored `.env`, never committed).
- Not done: VAMS branch not deployed to prod (write routes live only on host-served `:8787`); nothing pushed. Roadmap rewritten to Hiren's v2 sequence V1–V7.

### 2026-09-06 — Track A done + renewal docs
- A1–A6: tests+CI, deleted 11 dead components, dropped unused non-ML deps, fixed the LAB percentage bug + removed the lightness fudge + optional seed, wired the settings sliders (an `app.vue` destructured-ref bug), removed the `'banana'` token + made objects private + centralised storage config.
- Wrote the audit + roadmap docs under `docs/` (atlas, renewal plan, design-patterns, cms-data-model, kickoff) and `CONTEXT.md`.
- Kept the whole ML/feedback stack by request, pending a read of `docs/audit-ml-feedback.md`.
- 8 commits on `tests-and-more-atomic-design-efforts`, none pushed.
