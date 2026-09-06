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
**Status** · 🟢 healthy (for its stage) — Track A of the renewal is done; tests green, build green. Persistence still on Strapi (moving to VAMS).
**Repo** · GitHub `Hersh3yy/image-colors` · working on `tests-and-more-atomic-design-efforts` (merge to `main` only when sure)
**Hosting** · Netlify · files on the `bengijzel` DO Spaces bucket
**ClickUp** · not linked yet
**Last assessed** · 2026-09-06

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

- [ ] B1: one `color/` module — merge the two colorUtils; one `calculateConfidence` = score, rename the distance one <!-- id:b1 cu:123kjkdhp5u -->
- [ ] B2: a store (Pinia/useState) + one `useNotifications()`; kill the `headerRef.showNotification` bus and duplicate composable instances <!-- id:b2 cu:123kjkdhp5v -->
- [ ] Rename the HSL "color family" grouping → Hue Group <!-- id:b3 cu:123kjkdhp5w -->
- [ ] Nuxt 4 / Tailwind 4 / Vitest 5 upgrades; one chart library, imported not CDN <!-- id:b4 cu:123kjkdhp5x -->

## Roadmap — far future

- [ ] C: `presetGateway` Adapter + one-session Strapi→VAMS migration (needs VAMS write API) <!-- id:c1 cu:123kjkdhp5y -->
- [ ] Colour-managed decode (ICC) + linear-light/OKLab clustering option <!-- id:d1 cu:123kjkdhp5z -->
- [ ] Painter's parent-colour list workshop with Benjamin (versioned) <!-- id:d2 cu:123kjkdhp60 -->
- [ ] Museum workflow redesign: collections, batch upload with wall labels, review queue, exports <!-- id:e1 cu:123kjkdhp61 -->
- [ ] Knowledge Base decision: keep-or-prune the ML stack, then Feedback that persists + evaluation harness <!-- id:f1 cu:123kjkdhp62 -->
- [ ] Mood study (research, not a shipped feature) <!-- id:f2 cu:123kjkdhp63 -->

---

## Diary

### 2026-09-06 — Track A done + renewal docs
- A1–A6: tests+CI, deleted 11 dead components, dropped unused non-ML deps, fixed the LAB percentage bug + removed the lightness fudge + optional seed, wired the settings sliders (an `app.vue` destructured-ref bug), removed the `'banana'` token + made objects private + centralised storage config.
- Wrote the audit + roadmap docs under `docs/` (atlas, renewal plan, design-patterns, cms-data-model, kickoff) and `CONTEXT.md`.
- Kept the whole ML/feedback stack by request, pending a read of `docs/audit-ml-feedback.md`.
- 8 commits on `tests-and-more-atomic-design-efforts`, none pushed.
