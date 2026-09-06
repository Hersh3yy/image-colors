# Image Colors — session kickoff prompt

Paste the block below into a fresh Claude Code session (opened in `koala/img-clrs`) to resume the Image Colors renewal with full context.

---

You are resuming work on **Image Colors** (`/Users/hirenbudhrani/Documents/koala/img-clrs`), a Nuxt 3 + Vue 3 + Tailwind app that analyses paintings: it extracts a palette with k-means in CIELAB, matches each colour to a parent colour and a Pantone reference with CIEDE2000, and saves sets of analysed images as **presets**. Client is the artist **Benjamin Gijzel**. Long-term goal: study which colours evoke which moods in museum paintings.

**Repo facts**
- Active repo is `img-clrs` (GitHub `Hersh3yy/image-colors`), branch **`tests-and-more-atomic-design-efforts`**. The sibling `koala/image-colors` is the stale GitLab original — treat as history.
- Persistence is moving **off Strapi onto VAMS** (`koala/VAMS`, Hiren's own Laravel CMS). Files stay on the `bengijzel` DigitalOcean Spaces bucket (same bucket VAMS uses, which makes the Strapi→VAMS migration JSON-only).
- Node 24, npm (yarn.lock removed). Tests: Vitest. `npx vitest run` and `npx nuxt build` both green.

**Vocabulary decision (important)**: keep the code's existing words — Preset, Processed Image, Analysis Settings, Parent Color, Pantone Match, Feedback, Play Mode, Knowledge Base. See `CONTEXT.md`. Only two ambiguities were standardised (the HSL "color family" grouping vs matcher parent colours; and `calculateConfidence` meaning a score in one file, a distance in another).

**Read these first**: `docs/image-colors-renewal-plan.html` (roadmap, tracks A–F, session-sized, no dates), `docs/image-colors-atlas.html` (technical audit with file:line), `docs/design-patterns.md` (refactoring.guru per-seam), `docs/cms-data-model.md` (VAMS entity types + Strapi migration), `docs/audit-*.md`.

**Progress so far — Track A is DONE** (8 commits on the branch, not pushed):
- A1 tests run + CI (`tests/setup.js` used `jest` under Vitest; fixed; `.github/workflows/ci.yml` added).
- A2 deleted 11 unreachable components (kept ML/feedback code per Hiren's request).
- A3 (partial) dropped unused non-ML deps; **TensorFlow + `services/learning/**` intentionally KEPT** until Hiren reads `docs/audit-ml-feedback.md`.
- A4 fixed the percentage bug (count pixels in LAB against the LAB centroids, not RGB); removed the ad-hoc lightness fudge; added an optional `reproducibleRuns` seed (Hiren *likes* run-to-run variation, so seeding is opt-in).
- A5 wired every settings slider to the pipeline (root cause: `app.vue:179` destructured the settings ref wrong, so reanalysis ran with `{}`); removed the two dead disabled selects.
- A6 removed the public `'banana'` preset token, made the Spaces JSON objects private, centralised bucket/endpoint/URL in `netlify/functions/shared/storage-config.js`, fixed a `match.js` load-time crash.

**Deploy prerequisites** (before shipping Track A): set `PRESET_ACCESS_TOKEN` + `NUXT_PUBLIC_PRESET_ACCESS_TOKEN` in Netlify (the `'banana'` fallback is gone); confirm the Netlify build command isn't `yarn …` (yarn.lock removed); enable branch protection requiring the CI check.

**Do next (roadmap order)**:
- **B1** — one `color/` module (merge `services/colorUtils.js` + `composables/useColorUtils.js`; one `calculateConfidence` = score, rename the distance-returning one).
- **B2** — a store (Pinia/`useState`) + one `useNotifications()`; kill the `headerRef.showNotification` template-ref bus and duplicate composable instantiations.
- **C** — the VAMS side: once VAMS has a write API (see VAMS roadmap), build the `presetGateway` (Adapter) and the one-session Strapi→VAMS migration script.

**Design-pattern guidance** (from `docs/design-patterns.md`, checked against refactoring.guru): Knowledge Base = Decorator (re-rank near ties, don't replace ΔE); persistence = Adapter behind a plain gateway; keep `analyzeImage` as the Facade; avoid Strategy/Singleton/Builder/State (the codebase already has inert versions of each).

**House rules**: keep the code's vocabulary; seeding/determinism is opt-in (Hiren likes the RNG variation); do NOT delete the ML/feedback stack yet; the mood study is research, not a shipped feature — don't promise it. Verify by running tests, not assertion.

---
