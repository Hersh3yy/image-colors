# Persistence on VAMS — data model and required CMS changes

Status: proposal, 2026-09-06. Vocabulary follows [`CONTEXT.md`](../CONTEXT.md).

## Why move

Today three incompatible stores hold the app's data:

| Data | Where | Problem |
|---|---|---|
| Presets (name + full analysis blobs) | Strapi on DigitalOcean via `netlify/functions/presets/presets.js` | Strapi is unwanted; the server accepts the literal token `banana` (`presets.js:5`), so read/write/delete is effectively public |
| Source images, TF model, feedback JSON, knowledge base | DO Spaces bucket `bengijzel`, `ACL: public-read` | World-readable; bucket, endpoint and prod URL hardcoded in 7+ files |
| Feedback (in-app corrections) | In-memory only (`app.vue:361`) | Lost on reload; the POST path 400s on every request (schema mismatch) |

VAMS already runs against the same `bengijzel` bucket, has user-defined Entry Types with a JSON `content` column, and supports `entry_relation` fields. It is the right home; it needs a write API first.

## Rename map (code → glossary)

| Code today | Glossary term |
|---|---|
| `preset`, `color-presets` | **Collection** |
| `processed_images[]` (one element) | **Analysis** (of an **Artwork**) |
| `sourceImage` | Artwork `source` |
| `colors[]` | **Palette** of **Swatches** |
| `percentage` | **Share** |
| `parentColors`, `parent color` | **Family Set** / **Colour Family** |
| `pantone`, `processed_colors.json` | **Reference Colour** / **Reference Library** |
| `distance` + `confidence` | **Distance** (ΔE₀₀) — confidence is derived for display only |
| `problematicMatches` | **Weak Matches** |
| `analysisSettings` | **Analysis Profile** |
| `feedback`, `trainingExample` | **Correction** |
| play mode (`PlayModal`) | **Calibration Session** |
| knowledge base, hybrid matcher, model | **Perception Model** |
| overall analysis | **Collection Summary** |
| screenshot | **Export** |

## Entry Types

All entries are UUID-keyed and `user_id`-scoped by VAMS. Field types in brackets are VAMS field types; **`json`** is a new type (see § VAMS changes).

### `family-set`
| field | type | notes |
|---|---|---|
| `name` | text | e.g. "Museum anchors v2" |
| `version` | number | integer, bump on any edit; edits create a new entry |
| `families` | repeatable → { `name` text, `hex` text, `lab_l` number, `lab_a` number, `lab_b` number } | LAB stored so matching does not depend on a browser's sRGB conversion |
| `notes` | textarea | rationale for the anchor choice |

### `reference-library`
| field | type | notes |
|---|---|---|
| `name`, `version` | text, number | |
| `source_url`, `licence` | text, text | required — today the Pantone-like list has no provenance |
| `file` | image/file (Spaces) | the JSON dataset itself; `content` stays small |
| `sha256` | text | integrity check when the client caches it |

### `analysis-profile`
| field | type | notes |
|---|---|---|
| `name` | text | |
| `swatch_count` | number | today `k`, default 13, range 3–20 |
| `sample_size` | number | default 10 000 |
| `max_image_size` | number | default 800 px (wire it up — currently dead) |
| `weak_match_threshold` | number | ΔE₀₀, default 20 |
| `seed` | number | fixed RNG seed → reproducible clustering |
| `family_set` | entry_relation → `family-set` | |
| `reference_library` | entry_relation → `reference-library` | |
| `analyser_version` | text | semver of the extraction code that produced results under this profile |

### `collection`
| field | type | notes |
|---|---|---|
| `title`, `description` | text, textarea | |
| `institution` | text | museum / gallery |
| `tags` | repeatable → { `tag` text } | |
| `cover` | image | |
| `default_profile` | entry_relation → `analysis-profile` | |

Artworks point at their Collection (one-to-many) so no multi-relation field is needed.

### `artwork`
| field | type | notes |
|---|---|---|
| `title`, `artist`, `year`, `inventory_number` | text | museum label fields |
| `collection` | entry_relation → `collection` | |
| `source` | image (Spaces) | original upload; VAMS converts ≥2 MB to WebP — keep the original for analysis, see § changes |
| `width_px`, `height_px` | number | |
| `notes` | textarea | |

### `analysis`
| field | type | notes |
|---|---|---|
| `artwork` | entry_relation → `artwork` | |
| `profile` | entry_relation → `analysis-profile` | |
| `palette` | **json** | `[{ hex, lab:[L,a,b], share, family_id, family_de, reference_id, reference_de, weak }]` |
| `summary` | **json** | `{ family_id: share }` for fast Collection Summaries |
| `analyser_version` | text | copied from the profile at run time |
| `duration_ms` | number | |

Immutable once created; a re-run is a new `analysis` entry.

### `correction`
| field | type | notes |
|---|---|---|
| `swatch_hex` | text | |
| `swatch_lab` | **json** | `[L,a,b]` |
| `from_family`, `to_family` | text (family id within the set) | what the Match said vs. what the person said |
| `to_reference` | text | optional |
| `family_set` | entry_relation → `family-set` | so a Correction stays meaningful when families change |
| `analysis` | entry_relation → `analysis` | optional — null for calibration corrections |
| `session` | entry_relation → `calibration-session` | optional |
| `reason` | select: `too_light`, `too_dark`, `wrong_hue`, `too_grey`, `other` | |

### `calibration-session`
| field | type | notes |
|---|---|---|
| `started_at`, `ended_at` | text (ISO) | |
| `family_set` | entry_relation | |
| `participant` | text | pseudonymous id |

### `perception-model`
| field | type | notes |
|---|---|---|
| `version` | text | |
| `family_set` | entry_relation | |
| `correction_count` | number | |
| `trained_at` | text | |
| `metrics` | **json** | held-out agreement, per-family confusion |
| `artifact` | file (Spaces) | serialised model |
| `status` | select: `draft`, `active`, `retired` | exactly one `active` per family set |

### Planned: `mood`, `mood-rating`, `study`
Add when the research protocol is agreed. `mood-rating` = { `artwork` relation, `mood` relation, `strength` number 1–7, `participant` text }.

## VAMS changes required (in order)

1. **Write API** — `POST/PATCH/DELETE /api/v1/entries` (+ `/entries/{id}`), token auth via Sanctum personal access tokens (already installed, routes commented out). Keep the read routes.
2. **`json` field type** — passthrough in `EntryValidationService`, optional max bytes (e.g. 512 KB). Needed for `palette`, `summary`, `metrics`, `swatch_lab`.
3. **API file upload** — enable the commented Sanctum media routes; add a `preserve_original` flag so WebP conversion does not touch analysis sources.
4. **Owner reads of drafts** — `GET /api/v1/entries` currently filters to `published` only; an authenticated owner must see their own unpublished entries.
5. **Bulk create** — `POST /api/v1/entries/batch` (≤ 50) for saving a whole Collection's Analyses in one request; raise the 60 req/min throttle for token clients.
6. **CORS** — remove `'*'` while `supports_credentials` is true; list the Netlify origins explicitly.
7. **Programmatic Entry Type provisioning** — a seeder or `POST /admin/entry-types` behind the admin key, so the nine types above can be installed by script.

## Migration from Strapi (one session)

Key fact that makes this cheap: **every `sourceImage` URL already points at the `bengijzel` Spaces bucket that VAMS itself uses** (`https://bengijzel.ams3.digitaloceanspaces.com/image-colors/…`). Nothing is re-uploaded; the migration is JSON → JSON.

1. **Export** — a Node script (`scripts/migrate-strapi.mjs`, run locally, never deployed):
   `GET https://hiren-devs-strapi-j5h2f.ondigitalocean.app/api/color-presets?pagination[pageSize]=100` with `PRESET_CREATION_TOKEN`; write `migration/strapi-presets.json`. Strapi wraps records as `{ id, attributes: { Name, processed_images, sourceImage, createdAt } }`; `processed_images` is sometimes a JSON *string* — `usePresets.js:73-78` already handles both, copy that logic.
2. **Transform** to VAMS entries, keeping the vocabulary the app already uses (`CONTEXT.md`):
   - one Strapi preset → one `preset` entry `{ name, strapi_id, created_at }`
   - each `processed_images[i]` → one `processed-image` entry `{ preset → relation, name, source_image_url, colors: json, analysis_settings: json, average_confidence, problematic_count }`
   - the 32 hardcoded parent colours → one `parent-colors` entry, version 0, tagged `legacy-css-32`, referenced by every migrated `processed-image` so old results keep their meaning
3. **Load** — `POST /api/v1/entries/batch` (≤ 50 per call) with a Sanctum token; idempotent on `strapi_id` so the script can be re-run.
4. **Verify** — counts per preset match; spot-check 3 presets in the new UI; then flip `NUXT_PUBLIC_PERSISTENCE=vams`.
5. **Strapi stays read-only for a while, then is deleted.** No dual-write period: while demoing, persistence is not a concern (Hiren, 2026-09-06).

Entry Type naming above uses the app's existing words (`preset`, `processed-image`, `parent-colors`) rather than the earlier proposal's renames; the field tables in this document map 1:1 — `collection`→`preset`, `artwork`+`analysis`→`processed-image` (kept as one entity for now; split only when re-analysis history is actually wanted), `family-set`→`parent-colors`.
